import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiBell, FiShoppingBag, FiUser, FiPackage, FiStar, FiHeart, FiLogOut, FiHelpCircle, FiMessageCircle  } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import "./navbar.css";

export default function Navbar({ setCartOpen }) {
  const [user, setUser] = useState(null);
  const [sideOpen, setSideOpen] = useState(false); 
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); 

  useEffect(() => {
  // initialize
  const storedUser = localStorage.getItem("user");
  console.log("Navbar mount, storedUser:", storedUser);
  if (storedUser) setUser(JSON.parse(storedUser));

  // listener
  const handleUserUpdate = () => {
    console.log("userUpdated event fired");
    debugger; // <- execution will pause here in DevTools
    const updatedUser = localStorage.getItem("user");
    console.log("Updated user from localStorage:", updatedUser);
    if (updatedUser) setUser(JSON.parse(updatedUser));
    else setUser(null);
  };

  window.addEventListener("userUpdated", handleUserUpdate);

  return () => window.removeEventListener("userUpdated", handleUserUpdate);
}, []);

  const handleLogout = () => {
  // remove all relevant keys
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  window.dispatchEvent(new Event("userUpdated"));
  setSideOpen(false);
  window.location.href = "/";
};


  return (
    <>
      <nav className="navbar">
        <div className="nav-container">

          <div className="nav-left">
            <Link className="nav-link" to="/home">HOME</Link>
            <Link className="nav-link" to="/shop">SHOP</Link>
            <Link className="nav-link" to="/collection">COLLECTION</Link>
            <Link className="nav-link" to="/category">CATEGORY</Link>
          </div>

          <div className="nav-center">
            <h2 className="nav-logo">GILD + GROVE</h2>
          </div>

          <div className="nav-right">
            <FiShoppingBag className="nav-icon" onClick={() => setCartOpen(true)} />
            <FiBell className="nav-icon" />

            {user ? (
              <div
                className="nav-user"
                onClick={() => setSideOpen(true)}   // OPEN SIDEBAR
              >
                <FaUserCircle className="nav-account-icon" size={28} />
                <span className="nav-username">{user.first_name}</span>
              </div>
            ) : (
              <>
                <Link to="/login" className="nav-login">LOGIN</Link>
                <Link to="/sign" className="nav-join">JOIN</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* SIDEBAR MENU */}
          <div className={`side-menu ${sideOpen ? "open" : ""}`}>
            <button className="close-btn" onClick={() => setSideOpen(false)}>×</button>

            <div className="side-section">
              <Link className="side-item" to="/profile">
                <FiUser className="side-icon" />
                My Profile
              </Link>

              <Link className="side-item" to="/orders">
                <FiPackage className="side-icon" />
                Orders
              </Link>

              <Link className="side-item" to="/wishlist">
                <FiHeart className="side-icon" />
                Wishlist
              </Link>
              
              <Link className="side-item" to="/reviews">
                <FiStar className="side-icon" />
                My Reviews
              </Link>
              
              <Link className="side-item" to="/help">
                <FiHelpCircle className="side-icon" />
                Help Center
              </Link>

              <Link className="side-item" to="/messages">
                <FiMessageCircle className="side-icon" />
                Chat with Gild Crew
              </Link>
            </div>

            <div className="side-section bottom-section">
              <button className="side-item logout" onClick={ () => setShowLogoutConfirm(true) }>
                <FiLogOut className="side-icon" />
                Logout
              </button>
            </div>
          </div>

          {/* BACKDROP */}
          {sideOpen && <div className="backdrop" onClick={() => setSideOpen(false)}></div>}

           {/* LOGOUT CONFIRM OVERLAY */}
          {showLogoutConfirm && (
            <div className="logout-overlay">
              <div className="logout-modal">
                <p>Are you sure you want to log out?</p>
                <div className="logout-actions">
                  <button className="btn-cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                  <button className="btn-logout" onClick={handleLogout}>Yes, Log Out</button>
                </div>
              </div>
            </div>
          )}
    </>
  );
}
