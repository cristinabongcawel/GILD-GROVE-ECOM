import express from "express";
import axios from "axios";
import { setTimeout } from "timers/promises";
import { config } from "./sms_email.js";

export default function orderCustomerRoutes(db) {
  const router = express.Router();

  // -----------------------------
  // OTP Store with Expiration
  // -----------------------------
  const otpStore = new Map();
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of otpStore.entries()) {
      if (data.expiresAt < now) otpStore.delete(key);
    }
  }, 3600000); // clean every hour

  process.on("SIGTERM", () => clearInterval(cleanupInterval));

  // -----------------------------
  // Helpers
  // -----------------------------
  function generateOTP(length = 4) {
    let otp = "";
    for (let i = 0; i < length; i++) otp += Math.floor(Math.random() * 10);
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

// -----------------------------
// GET customer orders with review info
// -----------------------------
router.get("/customer-orders/:userID", async (req, res) => {
  const { userID } = req.params;
  try {
    // 1. Fetch orders for the user
    const [orders] = await db.query(
      `SELECT o.orderID, o.order_number, o.userID, o.delivery_address, o.created_at, o.status, o.payment_method
       FROM orders o
       LEFT JOIN refunds r ON r.orderID = o.orderID AND r.userID = ?
       WHERE o.userID = ?
       ORDER BY o.created_at DESC`,
      [userID, userID]
    );

    if (!orders.length) return res.json([]);

    const orderIDs = orders.map((o) => o.orderID);

    // 2. Fetch order items along with variant info
    const [items] = await db.query(
      `SELECT 
          oi.orderItemID,
          oi.orderID,
          oi.productID,
          oi.variantID,
          oi.quantity,
          oi.price,
          p.name AS name,
          pv.volume AS size,
          (SELECT image_url 
            FROM product_images 
            WHERE product_id = p.id AND is_main = 1 
            LIMIT 1) AS image_url,
          r.status AS refundStatus
      FROM order_items oi
      JOIN product p ON oi.productID = p.id
      LEFT JOIN product_variants pv ON oi.variantID = pv.id
      LEFT JOIN refunds r 
        ON r.userID = ?
        AND (
              r.orderItemID = oi.orderItemID
              OR (r.orderItemID IS NULL AND r.orderID = oi.orderID)
            )
      WHERE oi.orderID IN (?)`,
      [userID, orderIDs]
    );

    // 3. Fetch reviews for these orders
    const [reviews] = await db.query(
      `SELECT orderID, productID, variantID
       FROM reviews
       WHERE orderID IN (?)`,
      [orderIDs]
    );

    // 4. Map reviews for easy lookup
    const reviewedMap = new Set(
      reviews.map((r) => `${r.orderID}_${r.productID}_${r.variantID ?? 0}`)
    );

    // 5. Merge products into orders, and mark reviewed items
      const merged = orders.map(order => ({
        ...order,
        products: items
          .filter(i => i.orderID === order.orderID)
          .map(i => ({
            ...i,
            reviewed: reviewedMap.has(`${i.orderID}_${i.productID}_${i.variantID ?? 0}`),
            isRefunded: i.refundStatus === "approved" // mark refunded
          }))
      }));

      
    res.json(merged);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

  // -----------------------------
  // SEND OTP
  // -----------------------------
  router.post("/send-otp/:orderID", async (req, res) => {
    try {
      const { orderID } = req.params;
      const { phone } = req.body;

      if (!phone)
        return res.status(400).json({ success: false, message: "Phone required" });

      const otp = generateOTP();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      const formattedPhone = formatPhone(phone);

      await withRetry(async () => {
        const r = await axios.post(
          "https://www.iprogsms.com/api/v1/otp/send_otp",
          {
            api_token: config.iprogSms.apiToken,
            phone_number: formattedPhone,
            message: `Your OTP code for confirming payment is ${otp}. Valid for 5 minutes.`,
          },
          { headers: { "Content-Type": "application/json" } }
        );
        if (r.data.status !== "success") throw new Error(r.data.message);
        return r.data;
      }, "iProgSMS OTP send");

      otpStore.set(formattedPhone, { otp, orderID, expiresAt });

      res.json({ success: true, message: "OTP sent via SMS" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Failed to send OTP", details: err.message });
    }
  });

  // -----------------------------
  // CONFIRM / VERIFY OTP
  // -----------------------------
  router.post("/confirm-otp/:orderID", async (req, res) => {
    try {
      const { orderID } = req.params;
      const { phone, otp } = req.body;

      if (!phone || !otp)
        return res.status(400).json({ success: false, message: "Phone and OTP required" });

      const formattedPhone = formatPhone(phone);
      const record = otpStore.get(formattedPhone);

      if (!record || record.orderID !== orderID)
        return res.status(400).json({ success: false, message: "No OTP request found" });

      if (Date.now() > record.expiresAt) {
        otpStore.delete(formattedPhone);
        return res.status(400).json({ success: false, message: "OTP expired" });
      }

      if (record.otp !== otp)
        return res.status(400).json({ success: false, message: "Invalid OTP" });

      await db.query("UPDATE orders SET status='paid' WHERE orderID=?", [orderID]);
      otpStore.delete(formattedPhone);

      res.json({ success: true, message: "OTP verified and payment confirmed" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "OTP verification failed", details: err.message });
    }
  });

  // -----------------------------
  // DIRECT CARD PAYMENT
  // -----------------------------
  router.post("/card-pay/:orderID", async (req, res) => {
    try {
      const { orderID } = req.params;

      const [result] = await db.query(
        "UPDATE orders SET status='paid' WHERE orderID=?",
        [orderID]
      );

      if (result.affectedRows === 0)
        return res.status(404).json({ success: false, message: "Order not found" });

      res.json({ success: true, message: "Card payment successful" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Card payment failed", details: err.message });
    }
  });

  // -----------------------------
  // MARK ORDER AS COMPLETED
  // -----------------------------
  router.post("/complete-order/:orderID", async (req, res) => {
    try {
      const { orderID } = req.params;

      const [result] = await db.query(
        "UPDATE orders SET status='completed' WHERE orderID=? AND status='shipping'",
        [orderID]
      );

      if (result.affectedRows === 0)
        return res.status(404).json({ success: false, message: "Order not found or cannot complete" });

      res.json({ success: true, message: "Order marked as completed" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Failed to complete order", details: err.message });
    }
  });

  return router;
}
