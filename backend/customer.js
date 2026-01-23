import express from "express";

const createCustomerRouter = (db) => {
  const router = express.Router();

router.get("/fetch-all", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.*,
        IFNULL(SUM(o.total_amount), 0) AS total_spent,
        IFNULL(COUNT(o.orderID), 0) AS total_orders,
        IFNULL(AVG(o.total_amount), 0) AS avg_order_value,
        IFNULL((
          SELECT SUM(oi.price * oi.quantity)
          FROM refunds r
          JOIN order_items oi ON r.orderItemID = oi.orderItemID
          WHERE r.userID = u.userID
        ), 0) AS total_refunds,
        COALESCE(cart_data.cart_items, JSON_ARRAY()) AS cart_items
      FROM users u
      LEFT JOIN orders o ON o.userID = u.userID
      LEFT JOIN (
        SELECT c.user_id,
               JSON_ARRAYAGG(JSON_OBJECT(
                 'product_id', c.product_id,
                 'variant_id', c.variant_id,
                 'quantity', c.quantity,
                 'price', COALESCE(pv.price, 0)
               )) AS cart_items
        FROM cart c
        LEFT JOIN product_variants pv ON pv.id = c.variant_id
        GROUP BY c.user_id
      ) AS cart_data ON cart_data.user_id = u.userID
      WHERE u.role = 'Customer'
      GROUP BY u.userID
    `);
    const result = rows.map(r => {
      let profile_image = null;

      
      if (r.profile_image) {
        if (Buffer.isBuffer(r.profile_image)) {
          try {
            const bufferString = r.profile_image.toString('utf8');
            
            if (bufferString.startsWith('data:image')) {
              profile_image = bufferString;
            } else {
              const base64Data = r.profile_image.toString('base64');
              
              try {
                const decoded = Buffer.from(base64Data, 'base64').toString('utf8');
                if (decoded.startsWith('data:image')) {
                  // It was double-encoded! Use the inner base64
                  profile_image = decoded;
                } else {
                  profile_image = `data:image/jpeg;base64,${base64Data}`;
                }
              } catch (decodeErr) {
                profile_image = `data:image/jpeg;base64,${base64Data}`;
              }
            }
          } catch (err) {
            profile_image = null;
          }
        } else if (typeof r.profile_image === 'string') {
          if (r.profile_image.startsWith('data:image')) {
            profile_image = r.profile_image;
          } else {
            try {
              const decoded = Buffer.from(r.profile_image, 'base64').toString('utf8');
              if (decoded.startsWith('data:image')) {
                profile_image = decoded;
              } else {
                profile_image = `data:image/jpeg;base64,${r.profile_image}`;              }
            } catch (err) {
              console.error(`Error decoding string for user ${r.userID}:`, err.message);
              profile_image = null;
            }
          }
        }
      } else {
        console.log(`User ${r.userID}: No profile_image`);
      }

      return {
        ...r,
        profile_image,
        cart_items: Array.isArray(r.cart_items) ? r.cart_items : [],
        total_spent: parseFloat(r.total_spent) || 0,
        avg_order_value: parseFloat(r.avg_order_value) || 0,
        total_refunds: parseFloat(r.total_refunds) || 0,
      };
    });
    res.json(result);
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});




  // GET single customer (role = 'Customer')
  router.get("/fetch/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const [rows] = await db.query("SELECT * FROM users WHERE userID = ? AND role = 'Customer'", [id]);
      if (rows.length === 0) return res.status(404).json({ message: "Customer not found" });

      const customer = rows[0];
      if (customer.profile_image && Buffer.isBuffer(customer.profile_image)) {
        customer.profile_image = `data:image/jpeg;base64,${customer.profile_image.toString("base64")}`;
      } else {
        customer.profile_image = null;
      }

      res.json(customer);
    } catch (err) {
      console.error("Error fetching customer:", err);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  // PATCH: Update customer status (role = 'Customer')
  router.patch("/update-status/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ message: "Missing status field" });

    try {
      // Only update if the user is a Customer
      await db.query("UPDATE users SET status = ? WHERE userID = ? AND role = 'Customer'", [status, id]);
      res.json({ message: "Status updated successfully" });
    } catch (err) {
      console.error("Error updating status:", err);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // GET all refunds for a customer
  router.get("/fetch-refunds/:userID", async (req, res) => {
    const { userID } = req.params;
    try {
      const [rows] = await db.query(
        "SELECT * FROM refunds WHERE userID = ? ORDER BY created_at DESC",
        [userID]
      );
      res.json(rows);
    } catch (err) {
      console.error("Error fetching refunds:", err);
      res.status(500).json({ message: "Failed to fetch refunds" });
    }
  });

  return router;
};

export default createCustomerRouter;
