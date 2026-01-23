// category.js
import express from "express";

export default function categoryRoutes(db) {
  const router = express.Router();


  router.get("/retrieve", async (req, res) => {
    try {
      // Get all main categories
      const [mainCategories] = await db.execute(
        "SELECT * FROM categories WHERE parent_category_id IS NULL"
      );

      // Get subcategories for each main category
      const categoriesWithSubs = await Promise.all(
        mainCategories.map(async (cat) => {
          const [subcategories] = await db.execute(
            "SELECT * FROM categories WHERE parent_category_id = ?",
            [cat.category_id]
          );
          return { ...cat, subcategories };
        })
      );

      res.json(categoriesWithSubs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  router.post("/add", async (req, res) => {
    try {
      const { name, description, parentCategoryID } = req.body;
      if (!name) return res.status(400).json({ message: "Name is required" });

      const [result] = await db.execute(
        "INSERT INTO categories (name, description, parent_category_id) VALUES (?, ?, ?)",
        [name, description || "", parentCategoryID || null]
      );

      res.json({ message: "Category added", category_id: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add category" });
    }
  });

  // =========================
  // UPDATE CATEGORY
  // =========================
  router.put("/update/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, parentCategoryID } = req.body;

      await db.execute(
        "UPDATE categories SET name = ?, description = ?, parent_category_id = ? WHERE category_id = ?",
        [name, description || "", parentCategoryID || null, id]
      );

      res.json({ message: "Category updated" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  // =========================
  // DELETE CATEGORY
  // =========================
  router.delete("/delete/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Delete subcategories first
      await db.execute("DELETE FROM categories WHERE parent_category_id = ?", [id]);

      // Delete main category
      await db.execute("DELETE FROM categories WHERE category_id = ?", [id]);

      res.json({ message: "Category deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  return router;
}
