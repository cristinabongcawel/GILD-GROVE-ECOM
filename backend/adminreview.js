// review.js
import express from "express";

export default function AdminReviewRouter(db) {
  const router = express.Router();

  // Get all reviews with user and product info
  router.get("/retrieve-reviews", async (req, res) => {
    try {
      const [reviews] = await db.execute(`
        SELECT r.reviewID, r.userID, r.orderID, r.productID, r.variantID,
               r.rating, r.title, r.comment, r.image_url,
               r.created_at, r.updated_at, r.isVisible, r.adminReply,
               u.first_name, u.last_name, u.email,
               p.name AS productName
        FROM reviews r
        JOIN users u ON r.userID = u.userID
        JOIN product p ON r.productID = p.id
        ORDER BY r.created_at DESC
      `);
      res.json(reviews);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      res.status(500).json({ message: "Failed to fetch reviews", error: err });
    }
  });

  // Toggle visibility
  router.put("/toggle-visibility/:reviewID", async (req, res) => {
    try {
      const { reviewID } = req.params;
      const { isVisible } = req.body;
      await db.execute(
        `UPDATE reviews SET isVisible = ? WHERE reviewID = ?`,
        [isVisible ? 1 : 0, reviewID]
      );
      res.json({ message: "Visibility updated" });
    } catch (err) {
      console.error("Failed to update visibility:", err);
      res.status(500).json({ message: "Failed to update visibility", error: err });
    }
  });

  // Admin reply to review
  router.put("/reply/:reviewID", async (req, res) => {
    try {
      const { reviewID } = req.params;
      const { adminReply } = req.body;
      await db.execute(
        `UPDATE reviews SET adminReply = ? WHERE reviewID = ?`,
        [adminReply, reviewID]
      );
      res.json({ message: "Reply saved" });
    } catch (err) {
      console.error("Failed to save reply:", err);
      res.status(500).json({ message: "Failed to save reply", error: err });
    }
  });

  // Delete review permanently
  router.delete("/delete/:reviewID", async (req, res) => {
    try {
      const { reviewID } = req.params;
      await db.execute(`DELETE FROM reviews WHERE reviewID = ?`, [reviewID]);
      res.json({ message: "Review deleted" });
    } catch (err) {
      console.error("Failed to delete review:", err);
      res.status(500).json({ message: "Failed to delete review", error: err });
    }
  });

  return router;
}
