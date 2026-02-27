import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaChartBar, FaBoxOpen, FaShoppingCart, FaUsers, FaTags, FaStar, FaGift, FaBars, FaTimes, FaSignOutAlt, FaGifts } from "react-icons/fa";
import "./sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8800/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Logout failed");

      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      alert(err.message || "Logout failed");
    } finally {
      setLoading(false);
      setShowLogoutModal(false);
    }
  };

  const menuItems = [
    { name: "Dashboard", icon: <FaChartBar />, path: "/dashboardadmin" },
    { name: "Product", icon: <FaBoxOpen />, path: "/adminprod" },
    { name: "Order", icon: <FaShoppingCart />, path: "/adminorder" },
    { name: "Customer", icon: <FaUsers />, path: "/user" },
    { name: "Category", icon: <FaTags />, path: "/category" },
    { name: "Review", icon: <FaStar />, path: "/adminreviews" },
      { name: "Voucher", icon: <FaGift />, path: "/voucher" },
  ];

  return (
    <>
      <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-top">
          {/* Toggle Button */}
          <button 
            className="toggle-btn" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <FaBars /> : <FaTimes />}
          </button>

          {/* Brand */}
          <h1 className="brand">
            {isCollapsed ? "G+G" : "GILD + GROVE"}
          </h1>

          {/* Admin Profile Section */}
          {!isCollapsed && (
            <div className="admin-profile">
              <div className="profile-avatar">
                <FaUsers />
              </div>
              <div className="profile-info">
                <h3>Admin</h3>
                <p>Administrator</p>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="nav-menu">
            {menuItems.map((item) => (
              <div 
                key={item.name}
                className="nav-item-wrapper"
              >
                <Link
                  to={item.path}
                  className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
                  title={isCollapsed ? item.name : ""}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && <span className="nav-text">{item.name}</span>}
                  {location.pathname === item.path && (
                    <span className="active-indicator"></span>
                  )}
                </Link>
              </div>
            ))}
          </nav>
        </div>

        {/* Logout Button */}
        <button 
          className="logout-btn" 
          onClick={() => setShowLogoutModal(true)}
          disabled={loading}
        >
          <FaSignOutAlt />
          {!isCollapsed && <span>{loading ? "Logging out..." : "LOG OUT"}</span>}
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay-log" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-log" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <FaSignOutAlt />
            </div>
            <h2>Confirm Logout</h2>
            <p>Are you sure you want to log out?</p>
            <div className="modal-buttons-log">
              <button 
                className="btn-cancel-log" 
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-confirm-log" 
                onClick={handleLogout}
                disabled={loading}
              >
                {loading ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}