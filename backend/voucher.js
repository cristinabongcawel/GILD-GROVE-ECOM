// voucher.js
import express from "express";

export default function voucherRoutes(db) {
  const router = express.Router();
// voucher.js - Update the retrieve-vouchers endpoint
router.get("/retrieve-vouchers", async (req, res) => {
  try {
    const [vouchers] = await db.execute(`
      SELECT 
        voucherID as id,
        code,
        type as discount_type,
        value as discount_value,
        min_order_amount as min_purchase,
        max_discount,
        usage_limit,
        used_count,
        created_at as start_date,
        expires_at as end_date,
        is_active,
        CASE 
          WHEN is_active = 1 THEN 'Active'
          ELSE 'Inactive'
        END as status
      FROM vouchers
      WHERE is_active = 1 AND expires_at >= NOW()
      ORDER BY created_at DESC
    `);
    res.json({ vouchers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch vouchers" });
  }
});

// voucher.js - retrieve all vouchers (no active/expiry filter)
router.get("/retrieve-all-vouchers", async (req, res) => {
  try {
    const [vouchers] = await db.execute(`
      SELECT 
        voucherID as id,
        code,
        type as discount_type,
        value as discount_value,
        min_order_amount as min_purchase,
        max_discount,
        usage_limit,
        used_count,
        created_at as start_date,
        expires_at as end_date,
        is_active,
        CASE 
          WHEN is_active = 1 THEN 'Active'
          ELSE 'Inactive'
        END as status
      FROM vouchers
      ORDER BY created_at DESC
    `);

    res.json({ vouchers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch vouchers" });
  }
});


// =========================
// INSERT NEW VOUCHER (ADMIN)
// =========================
router.post("/insert-voucher", async (req, res) => {
  try {
    const {
      code,
      discountType,   // maps to 'type'
      discountValue,  // maps to 'value'
      minPurchase,
      maxDiscount,
      usageLimit,
      unlimited,
      endDate,        // maps to 'expires_at'
      status
    } = req.body;

    if (!code || !discountValue || !endDate) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const [result] = await db.execute(
      `INSERT INTO vouchers 
      (code, type, value, min_order_amount, max_discount, usage_limit, is_active, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        discountType,
        discountValue,
        minPurchase || 0,
        maxDiscount || null,
        unlimited ? null : usageLimit || null,
        status === "Active" ? 1 : 0,
        endDate
      ]
    );

    res.json({ message: "Voucher created successfully", voucherID: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to insert voucher" });
  }
});


  // =========================
  // GET USER VOUCHERS (ONLY UNUSED)
  // =========================
  router.get("/my/:userID", async (req, res) => {
  try {
    const { userID } = req.params;

    const [vouchers] = await db.execute(
      `SELECT uv.userVoucherID,
              CASE 
                WHEN uv.status = 'claimed' THEN 'active'
                WHEN uv.status = 'used' THEN 'redeemed'
                ELSE uv.status
              END AS status,
              uv.claimed_at,
              uv.used_at,
              v.*
       FROM user_vouchers uv
       JOIN vouchers v ON uv.voucherID = v.voucherID
       WHERE uv.userID = ?
         AND v.is_active = 1
         AND v.expires_at >= NOW()
       ORDER BY uv.claimed_at DESC`,
      [userID]
    );

    res.json(vouchers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch vouchers" });
  }
});

  // =========================
  // APPLY VOUCHER (CALCULATE DISCOUNT)
  // =========================
  router.post("/apply", async (req, res) => {
    try {
      const { userID, code, orderTotal } = req.body;
      if (!userID || !code || orderTotal == null) return res.status(400).json({ message: "Missing parameters" });

      const [rows] = await db.execute(
        `SELECT v.*, uv.userVoucherID 
         FROM vouchers v
         JOIN user_vouchers uv ON uv.voucherID = v.voucherID
         WHERE v.code = ? AND uv.userID = ? AND uv.status = 'claimed' AND v.is_active = 1 AND v.expires_at >= NOW()`,
        [code, userID]
      );

      if (!rows.length) return res.status(400).json({ message: "Voucher invalid or already used" });
      const voucher = rows[0];

      if (orderTotal < voucher.min_order_amount) {
        return res.status(400).json({ message: `Order must be at least ${voucher.min_order_amount}` });
      }

      let discount = 0;
      if (voucher.type === "percentage") {
        discount = (orderTotal * voucher.value) / 100;
        if (voucher.max_discount && discount > voucher.max_discount) discount = voucher.max_discount;
      } else if (voucher.type === "fixed") {
        discount = voucher.value;
      }

      res.json({ voucherID: voucher.voucherID, discount });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to apply voucher" });
    }
  });

  // =========================
  // MARK VOUCHER AS USED (AFTER ORDER SUCCESS)
  // =========================
  router.post("/use", async (req, res) => {
    try {
      const { userID, voucherID, orderID, discount } = req.body;
      if (!userID || !voucherID || !orderID || discount == null) return res.status(400).json({ message: "Missing parameters" });

      const [rows] = await db.execute(
        "SELECT * FROM user_vouchers WHERE userID = ? AND voucherID = ? AND status = 'claimed'",
        [userID, voucherID]
      );

      if (!rows.length) return res.status(400).json({ message: "Voucher already used or invalid" });

      await db.execute(
        "UPDATE user_vouchers SET status = 'used', used_at = NOW() WHERE userVoucherID = ?",
        [rows[0].userVoucherID]
      );

      await db.execute(
        "UPDATE vouchers SET used_count = used_count + 1 WHERE voucherID = ?",
        [voucherID]
      );

      await db.execute(
        "UPDATE orders SET voucherID = ?, voucher_discount = ? WHERE orderID = ?",
        [voucherID, discount, orderID]
      );

      res.json({ message: "Voucher applied successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to mark voucher as used" });
    }
  });

  // =========================
// UPDATE VOUCHER (ADMIN)
// =========================
router.put("/update-voucher/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      discountType,   // maps to 'type'
      discountValue,  // maps to 'value'
      minPurchase,
      maxDiscount,
      usageLimit,
      unlimited,
      endDate,        // maps to 'expires_at'
      status
    } = req.body;

    // Validate required fields
    if (!code || !discountValue || !endDate) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Update voucher in DB
    const [result] = await db.execute(
      `UPDATE vouchers SET 
        code = ?, 
        type = ?, 
        value = ?, 
        min_order_amount = ?, 
        max_discount = ?, 
        usage_limit = ?, 
        is_active = ?, 
        expires_at = ?
      WHERE voucherID = ?`,
      [
        code,
        discountType,
        discountValue,
        minPurchase || 0,
        maxDiscount || null,
        unlimited ? null : usageLimit || null,
        status === "Active" ? 1 : 0,
        endDate,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    res.json({ message: "Voucher updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update voucher" });
  }
});

// DELETE VOUCHER
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      "DELETE FROM vouchers WHERE voucherID = ?",
      [id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: "Voucher not found" });

    res.json({ message: "Voucher deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete voucher" });
  }
});

// =========================
// CLAIM VOUCHER
// =========================
router.post("/claim", async (req, res) => {
  try {
    const { userID, code } = req.body;
    if (!userID || !code) 
      return res.status(400).json({ message: "userID and code are required" });

    // Fetch the voucher
    const [vouchers] = await db.execute(
      "SELECT * FROM vouchers WHERE code = ? AND is_active = 1 AND expires_at >= NOW()",
      [code]
    );

    if (!vouchers.length) 
      return res.status(400).json({ message: "Voucher invalid or expired" });

    const voucher = vouchers[0];

    // Check if user already claimed this voucher
    const [claimed] = await db.execute(
      "SELECT * FROM user_vouchers WHERE userID = ? AND voucherID = ?",
      [userID, voucher.voucherID]
    );

    if (claimed.length) 
      return res.status(400).json({ message: "Voucher already claimed" });

    // Optional: check usage limit before claiming
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      return res.status(400).json({ message: "Voucher usage limit reached" });
    }

    // Insert into user_vouchers
    const [result] = await db.execute(
      "INSERT INTO user_vouchers (userID, voucherID, status, claimed_at) VALUES (?, ?, 'claimed', NOW())",
      [userID, voucher.voucherID]
    );

    // Increment used_count in vouchers table
    await db.execute(
      "UPDATE vouchers SET used_count = used_count + 1 WHERE voucherID = ?",
      [voucher.voucherID]
    );

    // Return the claimed voucher details
    res.json({
      message: "Voucher claimed successfully",
      userVoucherID: result.insertId,
      voucher: {
        id: voucher.voucherID,
        code: voucher.code,
        discount_type: voucher.type,
        discount_value: Number(voucher.value),
        min_purchase: Number(voucher.min_order_amount),
        max_discount: voucher.max_discount ? Number(voucher.max_discount) : null,
        used_count: voucher.used_count + 1, // reflect increment
        usage_limit: voucher.usage_limit
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to claim voucher" });
  }
});


  return router;
}
