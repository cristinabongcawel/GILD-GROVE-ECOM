import React from "react";
import Navbar from "./navbar";
import { FiFilter } from "react-icons/fi";
import "./product.css";
import banner from './images/likod.png';
export default function GildHome() {
  return (
    <div className="gild-page">

      {/* -------- TOP BAR -------- */}
      <div className="topbar text-white d-flex justify-content-between align-items-center px-4">
        <span>Free Shipping on Orders ₱1500+</span>
        <div className="d-flex gap-4 small-links">
          <a href="#">Help</a>
          <a href="#">Track Order</a>
          <a href="#">PH (₱)</a>
        </div>
      </div>

      {/* -------- NAVBAR -------- */}
      <Navbar showAuthButtons={true} />

      {/* -------- HERO -------- */}
      <div className="hero-section position-relative">
        <img
          src= {banner}
          alt="Gild + Grove Fashion"
          className="hero-banner"
        />

        <div className="hero-text position-absolute top-50 start-50 translate-middle">
          <h1 className="fw-bold">FALL | WINTER COLLECTION 2025</h1>
          <p className="mt-3 mb-4">Timeless pieces made for everyday comfort.</p>
          <button className="btn btn-dark px-4 py-2">Shop New Arrivals</button>
        </div>
      </div>

      {/* -------- FILTER BAR -------- */}
      <div className="container filter-bar d-flex justify-content-between align-items-center mt-4 p-3 bg-white shadow-sm">
        <div className="d-flex gap-3">
          <select className="form-select">
            <option>All</option>
            <option>Men</option>
            <option>Women</option>
            <option>Unisex</option>
          </select>

          <select className="form-select">
            <option>Category</option>
            <option>Shirts</option>
            <option>Hoodies</option>
            <option>Pants</option>
          </select>

          <select className="form-select">
            <option>Price</option>
            <option>₱300 - ₱700</option>
            <option>₱700 - ₱1200</option>
          </select>

          <button className="btn btn-outline-dark d-flex align-items-center gap-2">
            <FiFilter /> More Filters
          </button>
        </div>

        <select className="form-select sort-select">
          <option>Sort by: Featured</option>
          <option>Price: Low to High</option>
          <option>Price: High to Low</option>
          <option>Newest</option>
        </select>
      </div>

      {/* -------- PRODUCT GRID -------- */}
      <div className="container mt-5">
        <h2 className="fw-bold mb-4">Trending This Season</h2>

        <div className="row g-4">
          {[1,2,3,4,5,6,7,8].map((i) => (
            <div className="col-md-3" key={i}>
              <div className="product-card">
                <div className="prod-img"></div>

                <div className="p-2 mt-2">
                  <h6 className="fw-semibold">Classic Oversized Hoodie</h6>
                  <p className="text-muted small">100% Cotton</p>
                  <p className="fw-bold">₱899</p>
                  <button className="btn btn-outline-dark w-100">Add to Cart</button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* -------- POPULAR CATEGORIES -------- */}
      <div className="container mt-5">
        <h3 className="fw-bold mb-4">Popular Categories</h3>

        <div className="row g-3">
          {["Hoodies","Shirts","Pants","Accessories"].map((cat) => (
            <div className="col-md-3" key={cat}>
              <div className="category-box text-center">
                <div className="cat-img"></div>
                <p className="fw-semibold mt-2">{cat}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="footer mt-5 text-center py-4">
        © 2025 Gild + Grove. All Rights Reserved.
      </div>

    </div>
  );
}
