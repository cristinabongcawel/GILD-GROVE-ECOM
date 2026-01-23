import express from "express";

const router = express.Router();

// GET /api/users/details/:id — promise / async-await version
router.get("/details/:id", async (req, res) => {
  try {
    const db = req.app.get("db"); // get DB from main app
    const userId = req.params.id;

    const query = `
      SELECT userID, first_name, last_name, email, phone, country, region, city, zip_code, address
      FROM users
      WHERE userID = ?
    `;

    const [results] = await db.query(query, [userId]);

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = results[0];
    const fullName = `${user.first_name} ${user.last_name}`;

    res.json({
      id: user.userID,
      name: fullName,
      email: user.email,
      phone: user.phone,
      country: user.country,
      region: user.region,
      city: user.city,
      zip: user.zip_code,
      address: user.address,
    });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
