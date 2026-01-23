import express from "express";

const router = express.Router();

export default (db) => {

// PLACE ORDER
router.post("/place-order", async (req, res) => {
  try {
    const {
      userID,
      items,
      payment_method,
      delivery_name,
      delivery_phone,
      delivery_email,
      delivery_address,
      voucherID = null,       // optional
      voucher_discount = 0    // optional
    } = req.body;

    if (!userID || !items || !payment_method || !delivery_name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Calculate total
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const total_amount = subtotal - (voucher_discount || 0);

    const order_number = `ORD-${Math.floor(Math.random() * 900000) + 100000}`;

    // Insert order
    const [orderResult] = await db.query(
      `INSERT INTO orders 
        (userID, order_number, payment_method, total_amount, voucherID, voucher_discount, delivery_name, delivery_phone, delivery_email, delivery_address, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [userID, order_number, payment_method, total_amount, voucherID, voucher_discount, delivery_name, delivery_phone, delivery_email, delivery_address]
    );

    const orderID = orderResult.insertId;

    // Insert order items and update stock
    for (const item of items) {
      const variantID = item.variantID || null;

      await db.query(
        `INSERT INTO order_items 
         (orderID, productID, variantID, product_name, quantity, price) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderID, item.productID, variantID, item.name, item.quantity, item.price]
      );

      const stockID = item.variantID || item.productID;

      const [updateResult] = await db.query(
        `UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?`,
        [item.quantity, stockID, item.quantity]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error(`Insufficient stock for product_variants ID ${stockID}`);
      }
    }

    // If voucher applied, mark it as used and increment used_count
    if (voucherID) {
      await db.query(
        `UPDATE user_vouchers 
         SET status = 'used', used_at = NOW() 
         WHERE userID = ? AND voucherID = ? AND status = 'claimed'`,
        [userID, voucherID]
      );

      await db.query(
        `UPDATE vouchers 
         SET used_count = used_count + 1 
         WHERE voucherID = ?`,
        [voucherID]
      );
    }

    res.json({ success: true, orderID });

  } catch (err) {
    console.error("Order placement error:", err);
    res.status(500).json({ error: "Failed to place order", details: err.message });
  }
});


  // REMOVE PURCHASED ITEMS FROM CART
  router.post("/remove-purchased", async (req, res) => {
    try {
      const { userID, items, checkoutSource } = req.body;

      if (checkoutSource !== "cart") {
        return res.json({ message: "Checkout not from cart — no deletion performed" });
      }

      for (const item of items) {
        await db.query(
          "DELETE FROM cart WHERE user_id = ? AND product_id = ? AND variant_id = ?",
          [userID, item.productID, item.variantID]
        );
      }

      res.json({ message: "Cart items deleted after checkout" });

    } catch (err) {
      console.error("Failed to delete cart items:", err);
      res.status(500).json({ error: "Failed to delete some items", details: err.message });
    }
  });

  return router;
};
