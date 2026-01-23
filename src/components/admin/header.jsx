import React from "react";
import { FiSearch, FiBell, FiUser } from "react-icons/fi";
import "./dashboard.css";

export default function Header() {
  return (
    <div className="header">
      <div className="search-bar">
        <input type="text" placeholder="Search" />
        <FiSearch className="search-icon" />
      </div>

      <div className="header-right">
       <span className="datetime">9:25 am 17 Nov 2025</span>
        <FiBell className="notification-icon" />
        <div className="admin-btn">
          <FiUser className="user-icon" />
          Admin
        </div>
      </div>
    </div>
  );
}