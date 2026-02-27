import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiShoppingBag } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import Login from "./Login";
import "./navbar.css";
import axios from "axios";

export default function Navbar({ setCartOpen }) {
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [cartCount, setCartCount] = useState(0);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef(null);

// In Navbar.js, update the first useEffect:
useEffect(() => {
  // Function to update user state from localStorage
  const updateUserFromStorage = () => {
    const storedUser = localStorage.getItem("user");
    console.log("Navbar updating user from storage:", storedUser);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null); // Explicitly set to null when no user
    }
  };

  // Initial load
  updateUserFromStorage();

  // Event listener for updates
  window.addEventListener("userUpdated", updateUserFromStorage);
  
  // Cleanup
  return () => window.removeEventListener("userUpdated", updateUserFromStorage);
}, []);
  // Fetch cart count if user exists
  useEffect(() => {
    const fetchCartCount = async () => {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      const user_id = user?.userID;
      if (!user_id) return setCartCount(0);

      try {
        const { data } = await axios.get(
          `http://localhost:8800/api/cart/retrive-cart/${user_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const totalQuantity = Array.isArray(data)
          ? data.reduce((acc, item) => acc + (item.quantity || 0), 0)
          : 0;

        setCartCount(totalQuantity);
      } catch (err) {
        console.error("Failed to fetch cart:", err);
        setCartCount(0);
      }
    };

    fetchCartCount();
    const handleCartUpdate = () => fetchCartCount();
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, [user]);

  // Scroll effect
  useEffect(() => {
    if (!isHome) return;
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  // Click outside for category dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
const handleUserUpdate = () => {
  const updatedUser = localStorage.getItem("user");
  console.log("Navbar user update:", updatedUser);
  if (updatedUser) setUser(JSON.parse(updatedUser));
  else setUser(null);
};

  return (
    <>
      <nav className={`navbar ${isHome ? "navbar-home" : ""} ${scrolled ? "navbar-scrolled" : ""}`}>
        <div className="nav-container">

          {/* LEFT LINKS */}
          <div className="nav-left">
            <Link className="nav-link" to="/">HOME</Link>
            <Link className="nav-link" to="/shop">SHOP</Link>

            <div className="nav-dropdown" ref={categoryRef}>
              <button
                className="nav-link dropdown-toggle"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCategoryOpen((prev) => !prev);
                }}
              >
                CATEGORY
              </button>
              {categoryOpen && (
                <div className="dropdown-menu">
                  <Link to="/category/soap" onClick={() => setCategoryOpen(false)}>Soap</Link>
                  <Link to="/category/perfume" onClick={() => setCategoryOpen(false)}>Perfume</Link>
                  <Link to="/category/body-mist" onClick={() => setCategoryOpen(false)}>Body Mist</Link>
                  <Link to="/category/scrubs" onClick={() => setCategoryOpen(false)}>Scrubs</Link>
                </div>
              )}
            </div>
          </div>

          {/* CENTER LOGO */}
          <div className="nav-center">
            <h2 className="nav-logo">GILD + GROVE</h2>
          </div>

          {/* RIGHT USER & CART */}
          <div className="nav-right">
            <div className="nav-cart-wrapper" onClick={() => setCartOpen(true)}>
              <FiShoppingBag className="nav-icon nav-cart-icon" />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </div>

            {user ? (
              <div className="nav-user" onClick={() => navigate("/userprof")}>
                <FaUserCircle className="nav-account-icon" size={28} />
                <span className="nav-username">{user.first_name}</span>
              </div>
            ) : (
              <>
                <button className={`nav-login ${isHome ? "nav-login-home" : ""}`} onClick={() => setLoginOpen(true)}>LOGIN</button>
                <Link to="/sign" className="nav-join">JOIN</Link>
              </>
            )}
          </div>

        </div>
      </nav>

      {/* Login modal */}
      <Login isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
