import React from "react";
import { Link } from "react-router-dom";   // <-- important
import "./dashboard.css"
export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-top">
        <h1 className="brand">GILD + GROVE</h1>

        <ul className="nav-menu">
          
          <li className="nav-item active main-dashboard">
            <Link to="/dashboardadmin">
              📊 <span>Dashboard</span>
            </Link>
          </li>

          <li className="nav-item">
            <Link to="/adminprod">
              <span>Product</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/adminorder">
              <span>Order</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/customer">
              <span>Customer</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/category">
              <span>Category</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/review">
              <span>Review</span>
            </Link>
          </li>
        </ul>
      </div>

      <button className="logout-btn">LOG OUT</button>
    </div>
  );
}
