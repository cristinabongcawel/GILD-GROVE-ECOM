import express from "express";

export default function dashboardRoutes(db) {
  const router = express.Router();

  // 1️⃣ GET STATS
  router.get("/stats", async (req, res) => {
    try {
      console.log("[DEBUG] /stats endpoint called");

      const [stats] = await db.query(`
        SELECT
          (SELECT SUM(total_amount) FROM orders) AS totalRevenue,
          (SELECT COUNT(*) FROM orders) AS totalOrders,
          (SELECT COUNT(*) FROM users WHERE role='Customer') AS customers,
          (SELECT AVG(total_amount) FROM orders) AS avgOrderValue
      `);

      console.log("[DEBUG] /stats query result:", stats[0]);
      res.json(stats[0]);
    } catch (err) {
      console.error("Stats Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 2️⃣ WEEKLY REVENUE
router.get("/revenue-weekly", async (req, res) => {
  try {
    console.log("[DEBUG] /revenue-weekly endpoint called");

    const [rows] = await db.query(`
     SELECT
        day_name,
        SUM(CASE WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN total_amount ELSE 0 END) AS thisWeek,
        SUM(CASE WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE() - INTERVAL 1 WEEK, 1) THEN total_amount ELSE 0 END) AS lastWeek
      FROM (
        SELECT DAYNAME(created_at) AS day_name, created_at, total_amount
        FROM orders
      ) AS sub
      GROUP BY day_name
      ORDER BY FIELD(day_name,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday');

    `);

    console.log("[DEBUG] /revenue-weekly query result:", rows);
    res.json(rows);
  } catch (err) {
    console.error("Weekly Revenue Error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/products", async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT 
          p.id,
          p.name,
          pv.sku,
          pv.price,
          pv.stock,
          c.name AS category,
          COALESCE(SUM(oi.quantity), 0) AS sold
      FROM product p
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      LEFT JOIN order_items oi 
          ON (oi.variantID = pv.id OR (oi.variantID IS NULL AND oi.productID = p.id))
      LEFT JOIN orders o ON o.orderID = oi.orderID AND o.status='completed'
      LEFT JOIN categories c ON p.category_id = c.category_id
      GROUP BY p.id, pv.id
      ORDER BY sold DESC
    `);

    res.json(products);
  } catch (err) {
    console.error("Error fetching products with sold:", err);
    res.status(500).json({ error: err.message });
  }
});


  // 4️⃣ RECENT ORDERS
  router.get("/recent-orders", async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT 
          o.orderID AS id,
          CONCAT(u.first_name, ' ', u.last_name) AS customer,
          oi.product_name AS item,
          o.status,
          o.total_amount AS total,
          o.created_at AS date
        FROM orders o
        LEFT JOIN order_items oi ON o.orderID = oi.orderID
        LEFT JOIN users u ON o.userID = u.userID
        ORDER BY o.created_at DESC
        LIMIT 5
      `);

      console.log("[DEBUG] /recent-orders query result:", rows);
      res.json(rows);
    } catch (err) {
      console.error("Recent Orders Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

router.get("/top-categories", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.name AS category,
        COALESCE(SUM(oi.price * oi.quantity), 0) AS revenue
      FROM order_items oi
      LEFT JOIN product p ON p.id = oi.productID
      LEFT JOIN categories c ON c.category_id = p.category_id
      LEFT JOIN orders o ON o.orderID = oi.orderID AND o.status='completed'
      GROUP BY c.name
      ORDER BY revenue DESC
      LIMIT 5
    `);

    // Map results
    const labels = rows.map(r => r.category || "Uncategorized");
    const revenue = rows.map(r => Number(r.revenue));

    console.log("[DEBUG] /top-categories result:", { labels, revenue });
    res.json({ labels, revenue });

  } catch (err) {
    console.error("Top Categories Error:", err);
    res.status(500).json({ error: err.message });
  }
});



  return router;
}
