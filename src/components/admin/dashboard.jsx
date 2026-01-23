import React from "react";
import "./dashboard.css";
import Sidebar from "./sidebar";
import Header from "./header";

export default function Dashboard() {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        
        {/* Stats Section - Modern Design */}
        <div className="stats-container">
          <div className="stat-box">
            <div className="stat-box-title">
              Total Visitor
              <span className="stat-change">▲ 12.87%</span>
            </div>
            <div className="stat-value">$45,987</div>
          </div>
          
          <div className="stat-box">
            <div className="stat-box-title">
              Total Products
              <span className="stat-change">▲ 85.23%</span>
            </div>
            <div className="stat-value">$632,235</div>
          </div>
          
          <div className="stat-box">
            <div className="stat-box-title">
              Total Product Views
              <span className="stat-change">▲ 90.89%</span>
            </div>
            <div className="stat-value">$25,987</div>
          </div>
          
          <div className="stat-box">
            <div className="stat-box-title">
              Average Orders
              <span className="stat-change">▲ 21.12%</span>
            </div>
            <div className="stat-value">$19,214</div>
          </div>
        </div>

        {/* Charts + Product Section */}
        <div className="lower-section">
          {/* Sales Chart */}
          <div className="chart-box">
            <h3>Product Sales at Category</h3>
            <div className="fake-chart">
              Sales Chart Visualization
              <div style={{marginTop: '10px', fontSize: '14px', color: '#64748b'}}>
                Total Sales: $290 ▲ 2.29%<br/>
                Total Coming: $27,208 ▲ 2.03%
              </div>
            </div>
          </div>

          {/* Product Card */}
          <div className="product-card">
            <h3>Top Selling Products</h3>
            <img src="https://i.imgur.com/8Km9tLL.png" alt="Nike Shoes" className="product-image" />
            <p className="product-name">Nike Shoes</p>
            <p className="product-price">$132.2</p>
          </div>
        </div>
      </div>
    </div>
  );
}