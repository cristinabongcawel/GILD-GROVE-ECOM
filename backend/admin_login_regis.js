import bcrypt from "bcryptjs";
import axios from "axios";
// Helper to generate unique Admin ID
const generateAdminID = async (db) => {
  const prefix = "AM";
  const randomNumber = () => Math.floor(100000 + Math.random() * 900000);
  const adminID = `${prefix}${randomNumber()}`;

  const [results] = await db.execute("SELECT userID FROM users WHERE userID = ?", [adminID]);
  if (results.length > 0) return generateAdminID(db); // retry if collision
  return adminID;
};

// =========================
// REGISTER ADMIN
// =========================
export const registerAdmin = (db) => async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, country, region, city, zipcode, address } = req.body;

    // Required personal fields
    if (!firstName || !lastName || !address || !country || !region || !city) {
      return res.status(400).json({ message: "Please fill in all required personal fields" });
    }

    // At least email or phone
    if (!email && !phone) {
      return res.status(400).json({ message: "Please provide at least an email or a phone number" });
    }

    // Check if email/phone already exists
    const [existingUsers] = await db.execute("SELECT email, phone FROM users WHERE email = ? OR phone = ?", [email || "", phone || ""]);
    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      if (email && user.email === email) return res.status(400).json({ message: "Email already exists" });
      if (phone && user.phone === phone) return res.status(400).json({ message: "Phone number already exists" });
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
      if (!passwordRegex.test(password)) return res.status(400).json({ message: "Password does not meet requirements." });
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Generate unique Admin ID
    const userID = await generateAdminID(db);

    // Insert admin user
    const sql = `
      INSERT INTO users
      (userID, first_name, last_name, email, phone, password, country, region, city, zip_code, address, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [userID, firstName, lastName, email || null, phone || null, hashedPassword, country, region, city, zipcode, address, "Admin"];

    await db.execute(sql, values);

    return res.status(201).json({ message: "Admin registration successful", userID });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// =========================
// LOGIN ADMIN
// =========================
export const loginAdmin = (db) => async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }
    if (!captchaToken) return res.status(400).json({ message: "Captcha token required" });
    
    // Verify captcha
    const secret = process.env.HCAPTCHA_SECRET;
    const verifyUrl = "https://hcaptcha.com/siteverify";
    const response = await axios.post(
      verifyUrl,
      new URLSearchParams({ secret, response: captchaToken }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    if (!response.data.success) {
      return res.status(400).json({ message: "Captcha verification failed" });
    }

    const [results] = await db.execute("SELECT * FROM users WHERE email = ? AND role = 'Admin'", [email]);

    if (results.length === 0) return res.status(401).json({ message: "Invalid email or password" });

    const user = results[0];

    if (!user.password) return res.status(401).json({ message: "No password set for this account" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid email or password" });

    // ✅ Save admin info in session
    req.session.admin = {
      id: user.userID,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`
    };

    const { password: _, ...userWithoutPassword } = user;
    console.log(`Admin logged in. Session ID: ${req.sessionID}`);
    return res.json({
      message: "Login successful",
      user: userWithoutPassword
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
