// test-email.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // 16-char app password
  },
});

const testSend = async () => {
  try {
    const info = await transporter.sendMail({
      from: `"GLID + GROVE" <${process.env.SMTP_USER}>`,
      to: "your-email@gmail.com", // replace with your email to test
      subject: "Test Email from Node",
      html: "<h3>This is a test email</h3><p>If you see this, it works!</p>",
    });
    console.log("Email sent successfully:", info);
  } catch (err) {
    console.error("Error sending email:", err);
  }
};

testSend();
