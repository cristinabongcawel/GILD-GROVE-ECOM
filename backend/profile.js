import express from "express";
import bcrypt from "bcryptjs";
import otpResetRoutes from "./forgotpass_otp.js"; 

const router = express.Router();

export default (db) => {
  // ===== Mount OTP Router =====
  router.use("/otp-res", otpResetRoutes); // all otp routes will be under /otp

  // ===== GET user by ID =====
  router.get("/get/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const [rows] = await db.query("SELECT * FROM users WHERE userID = ?", [id]);
      if (rows.length === 0) return res.status(404).json({ message: "User not found" });

      const user = rows[0];
      let profile_image = null;

      if (user.profile_image) {
        const img = user.profile_image.toString();
        profile_image = img.startsWith("data:image")
          ? img
          : `data:image/png;base64,${Buffer.from(img, "binary").toString("base64")}`;
      }

      res.json({ ...user, profile_image });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ===== UPDATE user profile =====
  router.put("/update/:id", async (req, res) => {
    const { id } = req.params;
    const {
      first_name, last_name, email, phone,
      country, region, city, zip_code, address,
      profile_image_base64
    } = req.body;

    try {
      const [rows] = await db.query("SELECT * FROM users WHERE userID = ?", [id]);
      if (rows.length === 0) return res.status(404).json({ message: "User not found" });

      const updateQuery = `
        UPDATE users
        SET first_name=?, last_name=?, email=?, phone=?, country=?, region=?, city=?, zip_code=?, address=?
        ${profile_image_base64 ? ", profile_image=?" : ""}
        WHERE userID=?
      `;
      const params = [first_name, last_name, email, phone, country, region, city, zip_code, address];
      if (profile_image_base64) params.push(profile_image_base64);
      params.push(id);

      await db.query(updateQuery, params);
      res.json({ message: "User updated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ===== UPDATE password =====
  router.put("/updatepassword/:id/password", async (req, res) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword)
        return res.status(400).json({ message: "Current and new password required" });

      const [rows] = await db.query("SELECT password FROM users WHERE userID = ?", [id]);
      if (rows.length === 0) return res.status(404).json({ message: "User not found" });

      const user = rows[0];
      const match = bcrypt.compareSync(currentPassword, user.password);
      if (!match) return res.status(400).json({ message: "Current password is incorrect" });

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_]).{8,}$/;
      if (!passwordRegex.test(newPassword))
        return res.status(400).json({ message: "New password does not meet requirements" });

      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      await db.query("UPDATE users SET password=? WHERE userID=?", [hashedPassword, id]);

      res.json({ message: "Password updated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

// DELETE Customer and all related info
router.delete("/delete/:userID", async (req, res) => {
  const { userID } = req.params;

  const db = req.app.get("db"); // use the db from app
  try {
    await db.beginTransaction();

    // Check if user exists
    const [userCheck] = await db.query("SELECT * FROM users WHERE userID = ?", [userID]);
    if (userCheck.length === 0) {
      await db.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    // Delete orders and order_items
    await db.query("DELETE FROM order_items WHERE orderID IN (SELECT orderID FROM orders WHERE userID = ?)", [userID]);
    await db.query("DELETE FROM orders WHERE userID = ?", [userID]);

    // Delete cart items
    await db.query("DELETE FROM cart WHERE user_id = ?", [userID]);

    // Delete reviews
    await db.query("DELETE FROM reviews WHERE userID = ?", [userID]);

    // Delete refunds
    await db.query("DELETE FROM refunds WHERE userID = ?", [userID]);

    // Delete user vouchers
    await db.query("DELETE FROM user_vouchers WHERE userID = ?", [userID]);

    // Finally, delete the user
    await db.query("DELETE FROM users WHERE userID = ?", [userID]);

    await db.commit();

    res.json({ success: true, message: "Customer and all related data deleted successfully" });
  } catch (err) {
    await db.rollback();
    console.error(err);
    res.status(500).json({ message: "Failed to delete customer" });
  }
});


  return router;
};
