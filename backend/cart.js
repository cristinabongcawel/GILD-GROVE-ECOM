import express from "express";

const router = express.Router();

export default (db) => {

  router.post("/add", async (req, res) => {
    try {
      const { user_id, product_id, variant_id, quantity } = req.body;
      if (!user_id) return res.status(401).json({ message: "Login required" });

      // 1. First check available stock
      const [stockResult] = await db.query(
        "SELECT stock FROM product_variants WHERE id = ?",
        [variant_id]
      );
      
      if (stockResult.length === 0) {
        return res.status(404).json({ message: "Product variant not found" });
      }
      
      const availableStock = stockResult[0].stock || 0;

      // 2. Check if item already in cart
      const [existing] = await db.query(
        `SELECT * FROM cart WHERE user_id = ? AND product_id = ? AND variant_id = ?`,
        [user_id, product_id, variant_id]
      );

      if (existing.length > 0) {
        // Item already exists in cart
        const currentQuantity = existing[0].quantity || 0;
        const newTotalQuantity = currentQuantity + quantity;
        
        // Check if new total exceeds available stock
        if (newTotalQuantity > availableStock) {
          const canAdd = availableStock - currentQuantity;
          return res.status(400).json({ 
            message: `Cannot add ${quantity} items. Only ${canAdd} more available in stock.` 
          });
        }
        
        // Update existing cart item
        await db.query("UPDATE cart SET quantity = ? WHERE id = ?", [
          newTotalQuantity,
          existing[0].id,
        ]);
        return res.json({ 
          message: "Quantity updated",
          quantity: newTotalQuantity 
        });
        
      } else {
        if (quantity > availableStock) {
          return res.status(400).json({ 
            message: `Only ${availableStock} items available in stock.` 
          });
        }
        
        // Add new cart item
        await db.query(
          `INSERT INTO cart (user_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)`,
          [user_id, product_id, variant_id, quantity]
        );
        return res.json({ 
          message: "Added to cart successfully",
          quantity: quantity 
        });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  });

  // GET USER CART
  router.get("/retrive-cart/:user_id", async (req, res) => {
    try {
      const user_id = req.params.user_id;
      if (!user_id) return res.status(400).json({ message: "User ID required" });

      const [results] = await db.query(
        `SELECT 
          c.id AS cart_id,
          c.quantity,
          c.variant_id,
          v.sku,
          v.volume,
          v.price,
          v.stock,
          p.id AS product_id,
          p.name,
          (
            SELECT image_url 
            FROM product_images 
            WHERE product_id = p.id AND is_main = 1 
            LIMIT 1
          ) AS image_url
        FROM cart c
        INNER JOIN product p ON c.product_id = p.id
        INNER JOIN product_variants v ON c.variant_id = v.id
        WHERE c.user_id = ?;`,
        [user_id]
      );

      res.json(results);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // UPDATE QUANTITY
  router.put("/update", async (req, res) => {
    try {
      const { cart_id, variant_id, quantity } = req.body;

      if (quantity <= 0) {
        await db.query("DELETE FROM cart WHERE id = ?", [cart_id]);
        return res.json({ message: "Item removed from cart" });
      }

      if (!variant_id) return res.status(400).json({ message: "Variant ID required" });

      const [stockResult] = await db.query(
        "SELECT stock FROM product_variants WHERE id = ?",
        [variant_id]
      );
      if (stockResult.length === 0) return res.status(404).json({ message: "Variant not found" });
      if (quantity > stockResult[0].stock) return res.status(400).json({ message: "Exceeds stock" });

      await db.query("UPDATE cart SET quantity = ? WHERE id = ?", [quantity, cart_id]);
      res.json({ message: "Quantity updated" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  });

  // REMOVE ITEM
  router.delete("/remove/:id", async (req, res) => {
    try {
      const cart_id = req.params.id;
      await db.query("DELETE FROM cart WHERE id = ?", [cart_id]);
      res.json({ message: "Item removed" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  });

  return router;
};
