import bcrypt from "bcryptjs";

// Generate unique Customer ID (promise-based)
const generateCustomerID = async (db) => {
  const prefix = "CM";
  const randomNumber = () => Math.floor(100000 + Math.random() * 900000);
  const customerID = `${prefix}${randomNumber()}`;

  const [rows] = await db.query(
    "SELECT userID FROM users WHERE userID = ?",
    [customerID]
  );

  if (rows.length > 0) return generateCustomerID(db);
  return customerID;
};

// =========================
// REGISTER USER (promise-based)
// =========================
export const registerUser = (db) => async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      country,
      region,
      city,
      zipcode,
      address,
    } = req.body;

    // Require either email or phone
    if (!firstName || !lastName || !password || (!email && !phone)) {
      return res.status(400).json({ message: "Please fill in required fields: First Name, Last Name, Password, and either Email or Phone" });
    }

    // Password validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: "Password does not meet requirements." });
    }

    // Check for existing email/phone if provided
    const conditions = [];
    const values = [];
    if (email) {
      conditions.push("email = ?");
      values.push(email);
    }
    if (phone) {
      conditions.push("phone = ?");
      values.push(phone);
    }

    if (conditions.length > 0) {
      const [existingUsers] = await db.query(
        `SELECT email, phone FROM users WHERE ${conditions.join(" OR ")}`,
        values
      );

      if (existingUsers.length > 0) {
        const user = existingUsers[0];
        if (email && user.email === email)
          return res.status(400).json({ message: "Email already exists" });
        if (phone && user.phone === phone)
          return res.status(400).json({ message: "Phone number already exists" });
      }
    }

    // Generate unique ID
    const customerID = await generateCustomerID(db);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const sql = `
      INSERT INTO users
      (userID, first_name, last_name, email, phone, password, country, region, city, zip_code, address, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const insertValues = [
      customerID,
      firstName,
      lastName,
      email || null,
      phone || null,
      hashedPassword,
      country || null,
      region || null,
      city || null,
      zipcode || null,
      address || null,
      "Customer",
    ];

    await db.query(sql, insertValues);

    return res.json({
      message: "Registration successful",
      userID: customerID,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
