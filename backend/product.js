import express from "express";

const router = express.Router();

// Generate product ID
function generateProductId() {
  return "PROD-" + Math.floor(100000 + Math.random() * 900000);
}

// Generate SKU for variants
function generateSKU(product_ref, volume) {
  const random = Math.floor(1000 + Math.random() * 9000); // random 4 digits
  const cleanVolume = volume.replace(/\s+/g, "").toUpperCase();
  return `${product_ref}-${cleanVolume}-${random}`;
}

// Adjust category usage (including parent if subcategory)
async function adjustCategoryUsage(db, prevCategoryId, newCategoryId) {
  const updateUsage = async (catId, delta) => {
    if (!catId) return;

    // Update the category itself
    await db.execute(
      "UPDATE categories SET usage_count = usage_count + ? WHERE category_id = ?",
      [delta, catId]
    );

    // Check for parent
    const [rows] = await db.execute(
      "SELECT parent_category_id FROM categories WHERE category_id = ?",
      [catId]
    );
    const parentId = rows.length ? rows[0].parent_category_id : null;
    if (parentId && parentId !== 0) {
      await db.execute(
        "UPDATE categories SET usage_count = usage_count + ? WHERE category_id = ?",
        [delta, parentId]
      );
    }
  };

  // Decrement previous category
  await updateUsage(prevCategoryId, -1);

  // Increment new category
  await updateUsage(newCategoryId, 1);
}

// INSERT PRODUCT
router.post("/insert-product", async (req, res) => {
  const { name, description, category_id, images, variants } = req.body;
  const db = req.app.get("db");

  if (!name || !images || images.length === 0) {
    return res.status(400).json({ message: "Name and at least 1 image are required." });
  }

  try {
    const id = generateProductId();
    const product_ref = "REF-" + Math.floor(1000 + Math.random() * 9000);

    // Insert product
    await db.execute(
      "INSERT INTO product (id, name, description, product_ref, status, category_id) VALUES (?, ?, ?, ?, 'Active', ?)",
      [id, name, description, product_ref, category_id || null]
    );

    // Adjust category usage
    await adjustCategoryUsage(db, null, category_id);

    // Insert images
    if (images.length > 0) {
      const imageSQL = "INSERT INTO product_images (product_id, image_url, is_main, order_index) VALUES ?";
      const imageValues = images.map((url, index) => [id, url, index === 0 ? 1 : 0, index + 1]);
      await db.query(imageSQL, [imageValues]);
    }

    // Insert variants
    if (variants && variants.length > 0) {
      const variantSQL = "INSERT INTO product_variants (product_id, sku, volume, price, stock) VALUES ?";
      const variantValues = variants.map(v => [
        id,
        generateSKU(product_ref, v.volume),
        v.volume,
        v.price || 0,
        v.stock || 0
      ]);
      await db.query(variantSQL, [variantValues]);
    }

    res.status(201).json({ message: "Product created!", productId: id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});
// product.js backend
// product.js backend - /retrieve-product route
router.get("/retrieve-product", async (req, res) => {
  const db = req.app.get("db");

  try {
    // Get ALL categories with their subcategories
    const [allCategories] = await db.execute(`
      SELECT 
        c1.category_id,
        c1.name,
        c1.parent_category_id,
        c1.usage_count,
        c2.category_id as sub_id,
        c2.name as sub_name,
        c2.parent_category_id as sub_parent_id
      FROM categories c1
      LEFT JOIN categories c2 ON c2.parent_category_id = c1.category_id
      WHERE c1.parent_category_id IS NULL OR c1.parent_category_id = 0
      ORDER BY c1.name, c2.name
    `);

    // Organize categories into main categories with their subcategories
    const categoryMap = {};
    allCategories.forEach(row => {
      const mainCatId = row.category_id;
      
      if (!categoryMap[mainCatId]) {
        categoryMap[mainCatId] = {
          category_id: mainCatId,
          name: row.name,
          parent_category_id: row.parent_category_id,
          usage_count: row.usage_count,
          subcategories: []
        };
      }
      
      // Add subcategory if it exists
      if (row.sub_id) {
        categoryMap[mainCatId].subcategories.push({
          category_id: row.sub_id,
          name: row.sub_name,
          parent_category_id: row.sub_parent_id
        });
      }
    });

    // Get products with ALL their images
    const [products] = await db.execute(`
      SELECT p.*, 
        (SELECT image_url FROM product_images 
         WHERE product_id = p.id AND is_main = 1 LIMIT 1) AS main_image
      FROM product p
      ORDER BY p.created_at DESC
    `);

    if (!products.length) {
      return res.json({
        products: [],
        categories: Object.values(categoryMap)
      });
    }

    const productIds = products.map(p => p.id);
    const placeholders = productIds.map(() => '?').join(',');
    
    // Get ALL images for each product
    const [allImages] = await db.query(`
      SELECT product_id, image_url 
      FROM product_images 
      WHERE product_id IN (${placeholders})
      ORDER BY product_id, order_index
    `, productIds);

    // Get variants
    const [variants] = await db.query(`
      SELECT * FROM product_variants 
      WHERE product_id IN (${placeholders})
    `, productIds);

    // Group images by product
    const imagesByProduct = {};
    allImages.forEach(img => {
      if (!imagesByProduct[img.product_id]) {
        imagesByProduct[img.product_id] = [];
      }
      imagesByProduct[img.product_id].push(img.image_url);
    });

    // Create product-category lookup
    const productCategories = {};
    products.forEach(p => {
      productCategories[p.category_id] = true;
    });

    // Merge everything
    const mergedProducts = products.map(p => {
      return {
        ...p,
        // ALL product images
        images: imagesByProduct[p.id] || [],
        // Use main_image as fallback if no images array
        main_image: p.main_image || (imagesByProduct[p.id] && imagesByProduct[p.id][0]),
        variants: variants.filter(v => v.product_id === p.id),
        // Find if this category is a subcategory
        is_subcategory: false, // We'll determine this below
        parent_category_id: null // We'll set this below
      };
    });

    // Add category hierarchy info to products
    mergedProducts.forEach(product => {
      const catId = product.category_id;
      
      // Find which category this belongs to
      for (const mainCat of Object.values(categoryMap)) {
        // Check if it's the main category itself
        if (mainCat.category_id === catId) {
          product.is_subcategory = false;
          product.parent_category_id = null;
          break;
        }
        
        // Check if it's a subcategory of this main category
        const subcat = mainCat.subcategories.find(sc => sc.category_id === catId);
        if (subcat) {
          product.is_subcategory = true;
          product.parent_category_id = mainCat.category_id;
          break;
        }
      }
    });

    res.json({
      products: mergedProducts,
      categories: Object.values(categoryMap)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});
// UPDATE PRODUCT STATUS
router.put("/update-status", async (req, res) => {
  const db = req.app.get("db");
  const { id, status } = req.body;
  if (!id || !status) return res.status(400).json({ message: "Product id and status are required." });

  try {
    await db.execute("UPDATE product SET status = ? WHERE id = ?", [status, id]);
    res.json({ message: `Product status updated to ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// UPDATE PRODUCT + VARIANTS + CATEGORY USAGE
router.put("/update-product/:id", async (req, res) => {
  const db = req.app.get("db");
  const productId = req.params.id;
  const { name, description, category_id, variants } = req.body;

  try {
    // Get previous category
    const [prevRows] = await db.execute("SELECT category_id, product_ref FROM product WHERE id=?", [productId]);
    const prevCategory = prevRows.length ? prevRows[0].category_id : null;
    const product_ref = prevRows.length ? prevRows[0].product_ref : null;

    // Update product
    await db.execute("UPDATE product SET name=?, description=?, category_id=? WHERE id=?", [name, description, category_id || null, productId]);

    // Adjust category usage
    await adjustCategoryUsage(db, prevCategory, category_id);

    // Update variants
    if (variants && Array.isArray(variants)) {
      await db.execute("DELETE FROM product_variants WHERE product_id=?", [productId]);
      if (variants.length > 0 && product_ref) {
        const insertSQL = "INSERT INTO product_variants (product_id, sku, volume, price, stock) VALUES ?";
        const values = variants.map(v => [
          productId,
          generateSKU(product_ref, v.volume),
          v.volume,
          v.price || 0,
          v.stock || 0
        ]);
        await db.query(insertSQL, [values]);
      }
    }

    res.json({ message: "Product updated!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE PRODUCT + CATEGORY USAGE
router.delete("/delete/:id", async (req, res) => {
  const db = req.app.get("db");
  const productId = req.params.id;

  try {
    const [rows] = await db.execute("SELECT category_id FROM product WHERE id=?", [productId]);
    const categoryId = rows.length ? rows[0].category_id : null;

    await db.execute("DELETE FROM product_images WHERE product_id=?", [productId]);
    await db.execute("DELETE FROM product WHERE id=?", [productId]);

    await adjustCategoryUsage(db, categoryId, null);

    res.json({ message: "Product deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// UPDATE VARIANT STATUS
router.put("/update-variant-status/:variantId", async (req, res) => {
  const db = req.app.get("db");
  const variantId = req.params.variantId;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "Status is required." });
  }

  try {
    const [result] = await db.execute(
      "UPDATE product_variants SET status = ? WHERE id = ?",
      [status, variantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Variant not found." });
    }

    res.json({ message: `Variant status updated to ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
