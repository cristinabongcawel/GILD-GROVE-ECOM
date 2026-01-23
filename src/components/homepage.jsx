import React from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./navbar";
import bannerImg from './images/lay.jpg';
import banner from './images/hug.jpg';
import { FaFacebookF, FaInstagram, FaPinterestP, FaTiktok, FaShoppingCart } from "react-icons/fa";
import "./HomePage.css";
import "./product.css"

export default function HomePage() {
  const [products, setProducts] = React.useState([]);
  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:8800/api/prodpage/retrieve-producthomepage");
        setProducts(res.data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setProducts([]); // fallback
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="page">
      {/* ---------- HERO SECTION ---------- */}
      <header className="hero">
        <img src={bannerImg} alt="model" className="hero-img" />

        <div className="hero-content">
          <h4>NEW COLLECTION DROP NOW</h4>
          <button className="discover-btn">DISCOVER</button>
        </div>
      </header>
        {/* ---------- BLANK SLIDER SECTION ---------- */}
        <div className="blank-slider">
          <button className="slider-btn left-btn">❮</button>

          <div className="slider-empty-box">
            {/* empty for now — future images will go here */}
          </div>

          <button className="slider-btn right-btn">❯</button>
        </div>

        <div className="hero-section position-relative">
                <img
                  src= {banner}
                  alt="Gild + Grove Fashion"
                  className="hero-banner"
                />
        
                <div className="hero-text position-absolute top-50 start-50 translate-middle">
                  <h1 className="fw-bold">FALL | WINTER COLLECTION 2025</h1>
                  <p className="mt-3 mb-4">Timeless pieces made for everyday comfort.</p>
                </div>
        </div>
        {/* ---------- CATEGORIES SECTION ---------- */}
      <section className="categories-section">
        {/* ---------- FILTER BAR ---------- */}
        <div className="filter-bar">
          <div className="filter-left">

            <select className="filter-select">
              <option>All</option>
              <option>Men</option>
              <option>Women</option>
              <option>Unisex</option>
            </select>

            <select className="filter-select">
              <option>Category</option>
              <option>Shirts</option>
              <option>Hoodies</option>
              <option>Pants</option>
            </select>

            <select className="filter-select">
              <option>Price</option>
              <option>₱300 - ₱700</option>
              <option>₱700 - ₱1200</option>
            </select>

          </div>

          <select className="filter-select">
            <option>Sort by: Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest</option>
          </select>
        </div>

      </section>

      {/* ---------- PRODUCT SECTION ---------- */}
      <section className="products-section">
        <h2 className="section-title">Trending This Season</h2>

        <div className="products-grid">
          {products.length > 0 ? (
            products.map((product) => (
              <Link  to={`/product/${product.id}`} 
                className="product-card" 
                key={product.id}
                style={{ textDecoration: "none", color: "inherit" }}
              >  
                {/* Product Image */}
                <div className="product-img-wrapper">
                  <img
                    src={product.main_image || "https://via.placeholder.com/300"}
                    alt={product.name}
                    className="product-img"
                  />
                </div>

                {/* Product Info */}
                <div className="product-info">

                  {/* Name + Price (aligned horizontally) */}
                  <div className="name-price">
                    <h5 className="product-name">{product.name}</h5>
                    <p className="product-price">
                      ₱{Number(product.price).toLocaleString()}
                    </p>
                  </div>

                  {/* Short description */}
                  <p className="product-desc">
                    {product.description?.slice(0, 60) || "No description available"}...
                  </p>

                  {/* ⭐ Rating */}
                  <div className="product-rating">
                    {"⭐".repeat(product.rating || 5)}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p>No products available.</p>
          )}
        </div>

      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="footer-modern">

        <div className="footer-top">
          <div className="footer-col">
            <h4>SHOP</h4>
            <a>New Arrivals</a>
            <a>Collections</a>
            <a>Accessories</a>
            <a>Shoes</a>
            <a>Inspiration</a>
            <a>Brands</a>
            <a>Gift Cards</a>
          </div>

          <div className="footer-col">
            <h4>POPULAR</h4>
            <a>Seasonal Favorites</a>
            <a>Must-Have Bags</a>
            <a>Cozy Knitwear</a>
            <a>Trendy Accessories</a>
          </div>

          <div className="footer-col">
            <h4>SUPPORT</h4>
            <a>Contact Us</a>
            <a>Account</a>
            <a>Store Locations</a>
            <a>Shipping & Delivery</a>
            <a>Returns</a>
          </div>

          <div className="footer-col">
            <h4>INFO</h4>
            <a>About</a>
            <a>Career</a>
            <a>Sustainability</a>
            <a>Investor Relations</a>
            <a>Press</a>
          </div>

          <div className="footer-col">
            <h4>ADMIN</h4>
            <a href="/adminlog">Login</a>
            <a href="/adminreg">Register</a>
          </div>
        </div>

        {/* Payment Icons */}
        <div className="footer-icons">
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="visa" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png" alt="mc" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="apple" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c5/Google_Pay_Logo.svg" alt="gpay" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/8c/PayPal_logo.svg" alt="paypal" />
        </div>

        <div className="footer-socials">
          <FaFacebookF />
          <FaInstagram />
          <FaPinterestP />
          <FaTiktok />
        </div>

        <div className="footer-bottom">
          <p>© 2025 Gild + Grove</p>

          <div className="footer-bottom-links">
            <a>Cookies</a>
            <a>Privacy Policy</a>
            <a>Terms & Conditions</a>
            <a>Sitemap</a>
          </div>

          <p>Philippines</p>
        </div>
      </footer>
    </div>
  );
}
