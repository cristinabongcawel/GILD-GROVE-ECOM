// tracking.js
import express from "express";
import bodyParser from "body-parser";

export default function trackingRoutes(db, io) {
  const router = express.Router();
  router.use(bodyParser.json());

  // In-memory current location storage for live tracking
  const currentLocations = {};

  // -----------------------------
  // GET order by ID with customer info and items
  // -----------------------------
  router.get("/orders/:id", async (req, res) => {
    const orderId = req.params.id;
    const query = `
      SELECT o.orderID, o.status, o.delivery_name, o.delivery_email, o.delivery_phone, o.delivery_address,
             u.userID AS customerId, u.first_name, u.last_name, u.email AS customerEmail, u.phone AS customerPhone,
             oi.orderItemID, oi.product_name, oi.quantity, oi.price,
             pi.image_url
      FROM orders o
      JOIN users u ON o.userID = u.userID AND u.role='Customer'
      JOIN order_items oi ON oi.orderID = o.orderID
      LEFT JOIN product_images pi ON pi.product_id = oi.productID AND pi.is_main = 1
      WHERE o.orderID = ?
    `;

    try {
      const [results] = await db.query(query, [orderId]);
      if (!results.length) return res.status(404).json({ error: "Order not found" });

      const order = {
        id: results[0].orderID,
        status: results[0].status,
        currentLocation: currentLocations[orderId]?.current || null,
        delivery: {
          name: results[0].delivery_name,
          phone: results[0].delivery_phone,
          email: results[0].delivery_email,
          address: results[0].delivery_address
        },
        customer: {
          id: results[0].customerId,
          name: `${results[0].first_name} ${results[0].last_name}`,
          email: results[0].customerEmail,
          phone: results[0].customerPhone
        },
        items: results.map(r => ({
          id: r.orderItemID,
          name: r.product_name,
          quantity: r.quantity,
          price: r.price,
          image_url: r.image_url
        })),
        trackingLog: currentLocations[orderId]?.history || []
      };

      res.json(order);
    } catch (err) {
      console.error("Order fetch error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // -----------------------------
  // LIVE LOCATION UPDATE WITH TRAIL HISTORY
  // -----------------------------
  router.post("/orders/:id/location", (req, res) => {
    const { lat, lng, speed, heading } = req.body;
    const orderId = req.params.id;

    if (!currentLocations[orderId]) {
      currentLocations[orderId] = { current: null, history: [] };
    }

    currentLocations[orderId].current = [lat, lng];
    currentLocations[orderId].history.push([lat, lng]);

    io.to(`order:${orderId}`).emit("location:update", {
      id: orderId,
      current: [lat, lng],
      trail: currentLocations[orderId].history,
      speed,
      heading,
      timestamp: Date.now()
    });

    res.json({ success: true });
  });

  // -----------------------------
  // CANCEL ORDER
  // -----------------------------
  router.post("/orders/:id/cancel", async (req, res) => {
    const orderId = req.params.id;
    const { reason } = req.body;

    if (!reason) return res.status(400).json({ error: "Cancel reason is required" });

    const sql = "UPDATE orders SET status = 'cancelled', cancel_reason = ? WHERE orderID = ?";

    try {
      const [result] = await db.query(sql, [reason, orderId]);
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Order not found" });

      io.to(`order:${orderId}`).emit("order:cancelled", { id: orderId, reason });

      res.json({ success: true, message: "Order cancelled" });
    } catch (err) {
      console.error("Cancel order error:", err);
      res.status(500).json({ error: "Failed to cancel order" });
    }
  });

  // -----------------------------
  // SOCKET.IO CONNECTION
  // -----------------------------
  io.on("connection", socket => {
    console.log("socket connected:", socket.id);

    socket.on("join:order", orderId => {
      socket.join(`order:${orderId}`);

      if (currentLocations[orderId]?.current) {
        socket.emit("order:initial", {
          id: orderId,
          location: currentLocations[orderId].current
        });
      }
    });
  });

  return router;
}
