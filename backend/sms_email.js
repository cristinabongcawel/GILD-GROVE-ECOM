// sms_email.js
import dotenv from "dotenv";
dotenv.config();

export const config = {
  iprogSms: {
    apiToken: process.env.IPROG_API_TOKEN
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
  },
  port: process.env.PORT || 3000,
  smtpFrom: process.env.SMTP_FROM
};
