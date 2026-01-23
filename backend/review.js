import express from "express";

const createReviewRouter = (db) => {
  const router = express.Router();

  router.get("/fetch-user-reviews/:userID", async (req, res) => {
  const { userID } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT r.reviewID, r.userID, r.orderID, r.productID, r.variantID, r.rating, r.comment, 
      r.image_url AS review_image, r.created_at, r.updated_at,  r.adminReply,
          u.first_name, u.last_name, u.profile_image,
          p.name AS product_name, p.id AS product_id,
          v.volume AS variant,
          pi.image_url AS product_image
       FROM reviews r
       JOIN users u ON r.userID = u.userID
       LEFT JOIN product p ON r.productID = p.id
       LEFT JOIN product_variants v ON r.variantID = v.id
       LEFT JOIN product_images pi ON pi.product_id = p.id 
       AND pi.is_main = 1 WHERE r.userID = ?`,
      [userID]
    );

    const result = rows.map((r) => {
      // Convert profile image (LONGBLOB)
      if (r.profile_image && Buffer.isBuffer(r.profile_image)) {
        const base64 = r.profile_image.toString("base64");
        r.profile_image = `data:image/jpeg;base64,${base64}`;
      } else {
        r.profile_image = null;
      }
      if (!r.product_image) {
        r.product_image = null;
      }

      return r;
    });

    res.json(result);
  } catch (err) {
    console.error("Error fetching user reviews:", err);
    res.status(500).json({ message: "Failed to fetch user reviews" });
  }
});

 router.get("/fetch-review/:productID", async (req, res) => {
  const { productID } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT 
          r.*, 
          u.first_name, 
          u.last_name, 
          u.profile_image, 
          v.volume AS variant
       FROM reviews r
       JOIN users u ON r.userID = u.userID
       LEFT JOIN product_variants v ON r.variantID = v.id
       WHERE r.productID = ?`,
      [productID]
    );

    const result = rows.map((r) => {
      if (r.profile_image && Buffer.isBuffer(r.profile_image)) {
        // Convert buffer (already base64) to string
        const base64Str = r.profile_image.toString();

        // Prepend data URL prefix if not already present
        r.profile_image = base64Str.startsWith("data:") 
          ? base64Str 
          : `data:image/jpeg;base64,${base64Str}`;
      } else {
        r.profile_image = null;
      }

      return r;
    });

    res.json(result);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ message: "Failed to fetch review" });
  }
});


 router.post("/insert-review", async (req, res) => {
  const { productID, variantID, userID, orderID, rating, comment, image_url } = req.body;

  if (!productID || !userID || !orderID || !rating) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO reviews (userID, orderID, productID, variantID, rating, comment, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userID, orderID, productID, variantID || null, rating, comment || null, image_url || null]
    );

    res.json({ message: "Review added successfully", reviewID: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to insert review" });
  }
});


  // ----------------- PUT update review -----------------
router.put("/update-review/:reviewId", async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment, image_url } = req.body;

  if (!rating) {  // only rating is required now
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    let sql = `UPDATE reviews SET rating = ?, comment = ?`;
    const params = [rating, comment || null];

    if (image_url) {
      sql += `, image_url = ?`;
      params.push(image_url);
    }

    sql += ` WHERE reviewID = ?`;
    params.push(reviewId);

    await db.query(sql, params);
    res.json({ message: "Review updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update review" });
  }
});

  router.delete("/delete-review/:reviewId", async (req, res) => {
  const { reviewId } = req.params;

  try {
    await db.query("DELETE FROM reviews WHERE reviewID = ?", [reviewId]);
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete review" });
  }
});


  return router;
};

export default createReviewRouter;
