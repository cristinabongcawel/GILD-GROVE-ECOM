import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";

// =========================
// LOGIN CUSTOMER (using mysql2 promise) with hCaptcha
// =========================
export const loginUser = (db) => async (req, res) => {
  try {
    const { email, phone, password, captchaToken } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({ message: "Email or phone and password are required" });
    }

    // ✅ Verify hCaptcha
    if (!captchaToken) {
      return res.status(400).json({ message: "Captcha token is required" });
    }

    const secret = process.env.HCAPTCHA_SECRET;
    const captchaVerify = await axios.post(
      "https://hcaptcha.com/siteverify",
      new URLSearchParams({ secret, response: captchaToken })
    );

    if (!captchaVerify.data.success) {
      return res.status(400).json({ message: "Captcha verification failed" });
    }

    // Build query dynamically
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

    const query = `
      SELECT * FROM users
      WHERE (${conditions.join(" OR ")})
      AND role = 'Customer'
      LIMIT 1
    `;

    const [results] = await db.query(query, values);

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Save user info in session
    req.session.user = {
      id: user.userID,
      email: user.email,
      phone: user.phone,
      name: user.first_name + " " + user.last_name
    };

    // Generate JWT for localStorage usage
    const token = jwt.sign(
      { id: user.userID, email: user.email, phone: user.phone },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "7d" }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      message: "Login successful",
      user: userWithoutPassword,
      token
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
