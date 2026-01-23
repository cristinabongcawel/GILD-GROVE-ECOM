import express from "express";

export default function RefundRoutes(db) {
  const router = express.Router();
// -----------------------------
  // REFUND ROUTES
  // -----------------------------
  // Create refund request
router.post("/refund/:orderID", async (req, res) => {
  const { orderID } = req.params;
  const { reason, userID, orderItemID } = req.body;

  if (!reason || !orderID || !userID || !orderItemID)
    return res.status(400).json({ success: false, message: "Missing data" });

  try {
    const [existing] = await db.query(
      "SELECT * FROM refunds WHERE orderID = ? AND userID = ? AND orderItemID = ?",
      [orderID, userID, orderItemID]
    );

    if (existing.length > 0)
      return res.status(400).json({ success: false, message: "Refund already requested" });

    await db.query(
      "INSERT INTO refunds (orderID, userID, orderItemID, reason) VALUES (?, ?, ?, ?)",
      [orderID, userID, orderItemID, reason]
    );

    res.json({ success: true, message: "Refund requested successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to request refund" });
  }
});

router.post("/update-status/:refundID", async (req, res) => {
  const { refundID } = req.params;
  const { status, admin_note } = req.body;

  if (!["approved", "rejected"].includes(status))
    return res.status(400).json({ success: false, message: "Invalid status" });

  try {
    // Update refund record
    await db.query(
      "UPDATE refunds SET status=?, admin_note=?, updated_at=NOW() WHERE refundID=?",
      [status, admin_note || null, refundID]
    );

    if (status === "approved") {
      // 1. Get refund info
      const [refundInfo] = await db.query(
        "SELECT orderItemID, orderID FROM refunds WHERE refundID=?",
        [refundID]
      );

      if (refundInfo.length === 0)
        return res.status(400).json({ success: false, message: "Refund data not found" });

      const { orderItemID, orderID } = refundInfo[0];

      // 2. Get the actual order item (this includes the variantID)
      const [orderItem] = await db.query(
        "SELECT productID, variantID, quantity FROM order_items WHERE orderItemID=?",
        [orderItemID]
      );

      if (orderItem.length === 0)
        return res.status(400).json({ success: false, message: "Order item not found" });

      const { productID, variantID, quantity } = orderItem[0];

      // 3. Restore stock using variantID from order_items
      if (variantID) {
        await db.query(
          "UPDATE product_variants SET stock = stock + ? WHERE id = ?",
          [quantity, variantID]
        );
      } else {
        // Optional: If your products table has stock, you can increase stock here
        console.log("No variant for this product, stock restore skipped.");
      }

      // 4. Update order status to refunded
      await db.query("UPDATE orders SET status='refunded' WHERE orderID=?", [orderID]);
    }

    res.json({ success: true, message: "Refund status updated, stock restored." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update refund status" });
  }
});

    return router;
}
