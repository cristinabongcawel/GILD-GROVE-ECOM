// otp_reset.js
import express from "express";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import axios from "axios";
import { setTimeout } from "timers/promises";
import { config } from "./sms_email.js"; // adjust path

const router = express.Router();

// ===== OTP Store with Expiration =====
const otpStore = new Map();
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, data] of otpStore.entries()) {
    if (data.expiresAt < now) otpStore.delete(key);
  }
}, 3600000);

// ===== Nodemailer Transporter =====
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: parseInt(config.smtp.port),
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.auth.user,
    pass: config.smtp.auth.pass,
  },
  tls: { rejectUnauthorized: false },
});

// ===== Helper Functions =====
function generateOTP(length = 4) {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

function formatPhone(phone) {
  if (!phone) return null;
  if (phone.startsWith("09")) return "+63" + phone.slice(1);
  if (phone.startsWith("+63")) return phone;
  return phone;
}

const withRetry = async (fn, operation, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      console.warn(`Retrying ${operation} (attempt ${i + 1}):`, err.message);
      await setTimeout(delay * (i + 1));
    }
  }
};

// ===== FIND USER =====
router.post("/find-user", async (req, res) => {
  try {
    const { emailOrPhone, role } = req.body; // role: 'Admin' or 'Customer'

    if (!emailOrPhone || !role)
      return res.status(400).json({ message: "Email/phone and role are required" });

    const db = req.app.get("db");
    const [results] = await db.query(
      "SELECT userID, first_name, last_name, email, phone, role FROM users WHERE (email = ? OR phone = ?) AND role = ? LIMIT 1",
      [emailOrPhone, emailOrPhone, role]
    );

    if (results.length === 0) return res.status(404).json({ message: "User not found" });

    res.json({ user: results[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== SEND OTP =====
router.post("/send-otp", async (req, res) => {
  try {
    const { email, phone, role } = req.body;

    if (!email && !phone)
      return res.status(400).json({ message: "Email or phone required" });

    const otp = generateOTP();
    const expiresAt = Date.now() + 300000; // 5 minutes
    const formattedPhone = formatPhone(phone);

    // Priority: Email > Phone
    if (email) {
      otpStore.set(email, { otp, expiresAt, role });

      await withRetry(
        () =>
          transporter.sendMail({
            from: `"GLID + GROVE" <${config.smtp.auth.user}>`,
            to: email,
            subject: "Your OTP Code",
            html: `<h3>Your OTP Code:</h3><p style="font-size:20px;"><b>${otp}</b></p>`,
          }),
        "Email OTP send"
      );

      return res.json({ success: true, message: "OTP sent via email" });
    } else if (formattedPhone) {
      // SMS send via iProgSMS
      const response = await withRetry(async () => {
        const r = await axios.post(
          "https://www.iprogsms.com/api/v1/otp/send_otp",
          {
            api_token: config.iprogSms.apiToken,
            phone_number: formattedPhone,
            message: `Your OTP code is ${otp}. It is valid for 5 minutes. Do not share this code with anyone.`,
          },
          { headers: { "Content-Type": "application/json" } }
        );
        if (r.data.status !== "success") throw new Error(r.data.message);
        return r.data;
      }, "iProgSMS OTP send");

      otpStore.set(formattedPhone, { otp, expiresAt, role });
      return res.json({ success: true, message: "OTP sent via SMS" });
    }
  } catch (error) {
    console.error("OTP send error:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP", details: error.message });
  }
});

// ===== VERIFY OTP =====
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, phone, otp } = req.body;

    if (!otp || (!email && !phone))
      return res.status(400).json({ message: "OTP and email/phone required" });

    const key = email || formatPhone(phone);
    const stored = otpStore.get(key);

    if (!stored) return res.status(400).json({ message: "No OTP request found" });
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key);
      return res.status(400).json({ message: "OTP expired" });
    }
    if (stored.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    otpStore.delete(key);
    return res.json({ success: true, message: "OTP verified", role: stored.role });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ success: false, message: "OTP verification failed", details: error.message });
  }
});

// ===== UPDATE PASSWORD =====
router.post("/update-password", async (req, res) => {
  try {
    const { email, phone, newPassword, role } = req.body;
    if (!newPassword || (!email && !phone) || !role)
      return res.status(400).json({ message: "Email/phone, role and new password required" });

    const db = req.app.get("db");
    const key = email || formatPhone(phone);

    // Make sure OTP was verified before allowing password update
    const verified = !otpStore.has(key);
    if (!verified)
      return res.status(400).json({ message: "OTP not verified or expired" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const [result] = await db.query(
      "UPDATE users SET password = ? WHERE (email = ? OR phone = ?) AND role = ?",
      [hashedPassword, email || "", phone || "", role]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ success: false, message: "Failed to update password", details: error.message });
  }
});

process.on("SIGTERM", () => clearInterval(cleanupInterval));

export default router;
