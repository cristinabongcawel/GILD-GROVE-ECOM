import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import HomePage from "./components/homepage.jsx";
import Login from "./components/Login.jsx";
import Sign from "./components/sign.jsx";
import Product from "./components/product.jsx";
import Dashboard from "./components/admin/dashboard.jsx";
import Sidebar from "./components/admin/sidebar.jsx";
import Header from "./components/admin/header.jsx";
import AdminRegister from "./components/admin/admin_regis.jsx";
import AdminLogin from "./components/admin/admin_login.jsx";
import AdminProd from "./components/admin/admin_product.jsx";
import ProductPage from "./components/productpage.jsx";
import Cart from "./components/cart.jsx";
import Checkout from "./components/checkout.jsx";
import Navbar from "./components/navbar.jsx";
import OrderAdmin from "./components/admin/admin_order.jsx";
function App() {
const [cartOpen, setCartOpen] = useState(false);

return ( <BrowserRouter> <AppContent cartOpen={cartOpen} setCartOpen={setCartOpen} /> </BrowserRouter>
);
}

// Separate component to access the current route
function AppContent({ cartOpen, setCartOpen }) {
const location = useLocation();

// Routes where Navbar should NOT be shown
const hideNavbarRoutes = [
"/adminlog",
"/adminreg",
"/dashboardadmin",
"/adminprod",
"/sidebar",
"/header",
"/adminorder"
];

const showNavbar = !hideNavbarRoutes.includes(location.pathname);

return (
<>
{showNavbar && <Navbar setCartOpen={setCartOpen} />}
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<Login />} />
    <Route path="/sign" element={<Sign />} />
    <Route path="/product" element={<Product />} />
    <Route path="/sidebar" element={<Sidebar />} />
    <Route path="/header" element={<Header />} />
    <Route path="/adminreg" element={<AdminRegister />} />
    <Route path="/adminlog" element={<AdminLogin />} />
    <Route path="/dashboardadmin" element={<Dashboard />} />
    <Route path="/adminprod" element={<AdminProd />} />
    <Route path="/product/:id" element={<ProductPage setCartOpen={setCartOpen} />} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/adminorder" element={<OrderAdmin />} />
  </Routes>

  {cartOpen && (
    <>
      <div className="overlay" onClick={() => setCartOpen(false)} />
      <Cart closeCart={() => setCartOpen(false)} />
    </>
  )}
</>
);
}

export default App;
