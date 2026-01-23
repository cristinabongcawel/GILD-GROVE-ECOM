import express from "express";

// =========================
// GET product + all images + variants
// =========================
export const getProductPage = (db) => async (req, res) => {
  try {
    const productId = req.params.id;

    // 1️⃣ Fetch product info + images + variants (no aggregation)
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.product_ref,
        p.status,
        c.name AS category,
        pi.id AS image_id,
        pi.image_url AS image_url,
        pv.id AS variant_id,
        pv.price,
        pv.stock,
        pv.volume AS variant,
        pv.status AS variant_status
      FROM product p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.id = ?
      ORDER BY pi.order_index ASC
    `;
    const [rows] = await db.query(sql, [productId]);

    if (!rows.length) return res.status(404).json({ message: "Product not found" });

    const product = {
      id: rows[0].id,
      name: rows[0].name,
      description: rows[0].description,
      product_ref: rows[0].product_ref,
      status: rows[0].status,
      category: rows[0].category,
      main_image: rows.find(r => r.image_id)?.image_url || null,
      images: [],
      variants: [],
    };

    const imageMap = new Map();
    const variantMap = new Map();

    rows.forEach(r => {
      if (r.image_id && !imageMap.has(r.image_id)) {
        imageMap.set(r.image_id, { image_url: r.image_url });
      }
      if (r.variant_id && !variantMap.has(r.variant_id)) {
        variantMap.set(r.variant_id, {
          id: r.variant_id,
          price: r.price,
          stock: r.stock,
          variant: r.variant,
          status: r.variant_status
        });
      }
    });

    product.images = Array.from(imageMap.values());
    product.variants = Array.from(variantMap.values());

    // 2️⃣ Fetch ratings like homepage
    const [ratingRows] = await db.query(
      `
        SELECT 
          COALESCE(AVG(r.rating), 0) AS avg_rating,
          COUNT(r.reviewID) AS rating_count
        FROM reviews r
        WHERE r.productID = ? AND r.isVisible = 1
      `,
      [productId]
    );
    product.avg_rating = parseFloat(ratingRows[0].avg_rating); // keep as number
    product.rating_count = ratingRows[0].rating_count;

    const [purchaseRows] = await db.query(
      `
        SELECT COALESCE(SUM(oi.quantity), 0) AS purchased_count
        FROM orders o
        JOIN order_items oi ON o.orderID = oi.orderID
        JOIN product_variants pv ON oi.variantID = pv.id
        WHERE pv.product_id = ?
          AND LOWER(o.status) IN ('completed', 'paid', 'delivered')
      `,
      [productId]
    );

    product.purchased_count = purchaseRows[0].purchased_count;

    return res.json(product);
  } catch (err) {
    console.error("Product page fetch error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// =========================
// GET homepage products (main image only)
// =========================
export const getProductHomepage = (db) => async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.product_ref,
        p.status,
        c.name AS category,
        MIN(pi.image_url) AS main_image,
        MIN(pv.price) AS price,
        MIN(pv.volume) AS variant,
        COALESCE(AVG(r.rating), 0) AS avg_rating,
        COUNT(r.reviewID) AS rating_count
      FROM product p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN product_images pi 
        ON p.id = pi.product_id AND pi.is_main = 1
      LEFT JOIN product_variants pv
        ON p.id = pv.product_id
      LEFT JOIN reviews r ON p.id = r.productID AND r.isVisible = 1
      WHERE p.status = 'Active'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;

    const [results] = await db.query(sql);
    const formatted = results.map(r => ({
      ...r,
      avg_rating: Number(parseFloat(r.avg_rating || 0).toFixed(1))
    }));

    return res.json(formatted);
  } catch (err) {
    console.error("Homepage fetch error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// =========================
// Router export
// =========================
export default (db) => {
  const router = express.Router();
  router.get("/retrieve-productpage/:id", getProductPage(db));
  router.get("/retrieve-producthomepage", getProductHomepage(db));
  return router;
};
