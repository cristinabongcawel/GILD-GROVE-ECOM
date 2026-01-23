// otp.js
import express from "express";
import nodemailer from "nodemailer";
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
// ===== Send OTP =====
router.post("/send-otp", async (req, res) => {
  try {
    const { email, phone, captchaToken } = req.body;
    if (!email && !phone)
      return res
        .status(400)
        .json({ success: false, message: "Email or phone required" });

       if (!captchaToken) {
          return res.status(400).json({ success: false, message: "Captcha is required" });
        }

        // Verify with hCaptcha
        const secret = process.env.HCAPTCHA_SECRET; // store secret in .env
        const verifyUrl = `https://hcaptcha.com/siteverify`;

        const response = await axios.post(
          verifyUrl,
          new URLSearchParams({
            secret,
            response: captchaToken,
          }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        if (!response.data.success) {
          return res.status(400).json({ success: false, message: "Captcha verification failed" });
        } 
    const otp = generateOTP();
    const expiresAt = Date.now() + 300000; // 5 min
    const formattedPhone = formatPhone(phone);
    console.log("Generated OTP:", otp, "for", email || formattedPhone);

    // Priority: Email > Phone
    if (email) {
      otpStore.set(email, { otp, expiresAt });

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

      otpStore.set(formattedPhone, { otp, expiresAt });
      return res.json({ success: true, message: "OTP sent via SMS" });
    }
  } catch (error) {
    console.error("OTP send error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to send OTP", details: error.message });
  }
});

// ===== Verify OTP =====
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, phone, otp } = req.body;
        debugger; // <-- pause here, inspect req.body in Node inspector

    if (!otp || (!email && !phone))
      return res.status(400).json({
        success: false,
        message: "OTP and either phone or email are required",
      });

    const key = email || formatPhone(phone);
    const stored = otpStore.get(key);
    debugger; // <-- pause here, inspect 'key', 'stored', and 'otp'
    console.log("Verifying OTP:", { key, stored, receivedOtp: otp });

    if (!stored)
      return res.status(400).json({ success: false, message: "No OTP request found" });
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key);
      return res.status(400).json({ success: false, message: "OTP expired" });
    }
    if (stored.otp !== otp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    otpStore.delete(key);
    return res.json({ success: true, message: "OTP verified successfully" });
  } catch (error){
    console.error("OTP verification error:", error);
    res
      .status(500)
      .json({ success: false, message: "OTP verification failed", details: error.message });
  }
});

process.on("SIGTERM", () => clearInterval(cleanupInterval));

export default router; // ✅ ES module export
