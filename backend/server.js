import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import session from "express-session"; // ✅ Import session
import { Server } from "socket.io";
import http from "http";
// your route imports
import { registerUser } from "./sign.js";
import { loginUser } from "./login.js";
import { registerAdmin, loginAdmin } from "./admin_login_regis.js";
import otpRoutes from "./otp.js";
import productRoutes from "./product.js";
import productPageRoutes from "./productpage.js";
import cartRoutes from "./cart.js";
import userRoutes from "./user.js";
import orderRoutes from "./checkout.js";
import orderAdminRoutes from "./order.js";
import orderCustomerRoutes from "./ordercustomer.js";
import trackingRoutes from "./orderdeets.js"; // 🔥 your Socket.IO init file
import profile from "./profile.js";
import createReviewRouter from "./review.js";
import AdminReviewRouter from "./adminreview.js";
import categoryRoutes from "./category.js";
import dashboarRoutes from "./dashboard.js";
import RefundRoutes from "./refund.js";
import voucherRoutes from "./voucher.js";
import createCustomerRouter from "./customer.js";
import otpResetRoutes from "./forgotpass_otp.js"; 

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(cors({
  origin: "http://localhost:3000", // React app origin
  credentials: true, // important to allow cookies
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(session({
  secret: process.env.SESSION_SECRET || "mysecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
  },
}));

async function init() {
  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "gildandgrove",
  });

  console.log("Connected to database using Promise wrapper");

  app.set("db", db);

// ROUTES
// ----------------------


app.post("/api/register", registerUser(db));
app.post("/api/login", loginUser(db));
app.post("/api/admin/login", loginAdmin(db));
app.post("/api/admin/register", registerAdmin(db));
app.use("/api", otpRoutes);
app.use("/api/product", productRoutes);
app.use("/api/prodpage", productPageRoutes(db));
app.use("/api/cart", cartRoutes(db));
app.use("/api/users", userRoutes);
app.use("/api/order", orderRoutes(db));
app.use("/api/admin/adminorder", orderAdminRoutes(db));
app.use("/api/ordercustomer", orderCustomerRoutes(db));
app.use("/api/profile", profile(db));
app.use("/api/tracking", trackingRoutes(db, io));
app.use("/api/reviews", createReviewRouter(db));
app.use("/api/admin-review", AdminReviewRouter(db));
app.use("/api/category", categoryRoutes(db));
app.use("/api/dashboard", dashboarRoutes(db));
app.use("/api/refund", RefundRoutes(db));
app.use("/api/customer", createCustomerRouter(db));
app.use("/api/voucher", voucherRoutes(db));
app.use("/api/otp-res", otpResetRoutes); 

app.post("/api/logout", (req, res) => {
  console.log("Logout attempt. Session ID:", req.sessionID, "Customer:", req.session.user, "Admin:", req.session.admin);

  //]if (!req.session.user && !req.session.admin) {
    //return res.status(400).json({ message: "No user is logged in" });
  //}

  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Failed to logout" });
    }
    res.clearCookie("connect.sid"); // clear session cookie
    res.json({ message: "Logout successful" });
  });
});

const PORT = 8800;
  server.listen(PORT, () => {
    console.log(`Server with Socket.IO running on port ${PORT}`);
  });
}

init().catch(err => {
  console.error("Failed to initialize server:", err);
});
