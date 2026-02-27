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
import CheckoutPage from "./components/checkout.jsx";
import Navbar from "./components/navbar.jsx";
import OrderAdmin from "./components/admin/admin_order.jsx";
import OrderTabs from "./components/ordertabs.jsx";
import OrderWithMap from "./components/orderdeet.jsx"; // adjust the path as needed
import UserProfile from "./components/UserProfile.jsx";
import MyReviews from "./components/myreviews.jsx";
import AdminReviews from "./components/admin/adminreview.jsx";
import ShopPage from "./components/shop.jsx";
import CategoryManagement from "./components/admin/admin_category.jsx";
import UserManagement from "./components/admin/admin_user.jsx";
import Chatbot from "./components/chatbot.jsx";
import AdminVouchers from "./components/admin/voucher.jsx";
import BlogPage from "./components/Blog.jsx";
function App() {
const [cartOpen, setCartOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false); 
return ( <BrowserRouter> <AppContent cartOpen={cartOpen}
        setCartOpen={setCartOpen}  
        loginOpen={loginOpen} 
        setLoginOpen={setLoginOpen}  
        /> 
        </BrowserRouter>
);
}

// Separate component to access the current route
function AppContent({ cartOpen, setCartOpen, loginOpen, setLoginOpen }) {
const location = useLocation();

// Routes where Navbar should NOT be shown
const hideNavbarRoutes = [
"/adminlog",
"/adminreg",
"/dashboardadmin",
"/adminprod",
"/sidebar",
"/header",
"/adminorder",
"/adminreviews",
"/category",
"/user",
"/voucher"
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
    <Route path="/product/:id" element={<ProductPage setCartOpen={setCartOpen} setLoginOpen={setLoginOpen} />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/adminorder" element={<OrderAdmin />} />
    <Route path="/ordertabs" element={<OrderTabs />} />
    <Route path="/order/:orderId" element={<OrderWithMap />} />
    <Route path="/userprof" element={<UserProfile />} />
    <Route path="/myreview" element={<MyReviews />} />
    <Route path="/adminreviews" element={<AdminReviews />} />
    <Route path="/shop" element={<ShopPage />} />
    <Route path="/category" element={<CategoryManagement />} />
    <Route path="/user" element={<UserManagement />} />
    <Route path="/chatbot" element={<Chatbot />} />
    <Route path="/voucher" element={<AdminVouchers />} />
    <Route path="/blog/:id" element={<BlogPage />} />
  </Routes>

  {cartOpen && (
    <>
      <div className="overlay" onClick={() => setCartOpen(false)} />
      <Cart closeCart={() => setCartOpen(false)} />
    </>
  )}
   {loginOpen && <Login isOpen={loginOpen} onClose={() => setLoginOpen(false)} />}
</>
);
}

export default App;
