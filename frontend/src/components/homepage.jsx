import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { FaStar, FaArrowRight, FaInstagram, FaTiktok, FaFacebookF, FaTwitter, FaChevronRight } from "react-icons/fa";
import { BsTruck, BsShieldCheck, BsGift } from "react-icons/bs";
import { GiSoap, GiPerfumeBottle, GiSparkles, GiDroplets } from "react-icons/gi";
import { IoSparkles } from "react-icons/io5";
import "./HomePage.css";
import Login from "./Login";
import PerfumeImg from "./images/floral.jpg";
import ScrubImg from "./images/scrubs.jpg";
import BodyCare from "./images/bodycare.jpg";
import fragrance from "./images/spray.jpg";
import perfume from "./images/layering.jpg"
import soap from "./images/soap.jpg";
export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (location.state?.openLogin) {
      setLoginOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:8800/api/prodpage/retrieve-producthomepage");
        setProducts(res.data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const blogPosts = [
    { id: 1, title: "Choosing Your Signature Scent", excerpt: "Discover how to find the perfect fragrance that matches your personality and style.", image: perfume },
    { id: 2, title: "The Art of Body Care", excerpt: "Learn the secrets to maintaining soft, glowing skin with our handcrafted soaps and scrubs.", image: BodyCare },
    { id: 3, title: "Fragrance Layering 101", excerpt: "Master the technique of combining perfumes and body mists for a lasting, unique scent.", image: fragrance },
  ];

  return (
    <div className="page">
      {loginOpen && <Login isOpen={loginOpen} onClose={() => setLoginOpen(false)} />}

      {/* HERO SECTION */}
      <section
        className="hero"
        style={{ backgroundImage: `url(${PerfumeImg})` }}
      >
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="hero-tag">LUXURY FRAGRANCES & BODY CARE</span>
          <h1>GILD + GROVE</h1>
          <p className="hero-subtitle">
            Elevate your daily ritual with handcrafted perfumes, soaps, body mists, and scrubs
          </p>
          <Link to="/shop" className="cta-button">
            DISCOVER COLLECTION <FaArrowRight />
          </Link>
        </div>
      </section>


      {/* FEATURES ICONS */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon"><GiPerfumeBottle /></div>
            <h4>Perfumes</h4>
            <p>Signature Scents</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><GiSoap /></div>
            <h4>Artisan Soaps</h4>
            <p>Handcrafted</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><GiDroplets /></div>
            <h4>Body Mists</h4>
            <p>Refreshing Sprays</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><GiSparkles /></div>
            <h4>Body Scrubs</h4>
            <p>Exfoliating</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><IoSparkles /></div>
            <h4>Premium Quality</h4>
            <p>Finest Ingredients</p>
          </div>
      </div>
      </section>

      {/* TWO COLUMN WITH IMAGE - LEFT */}
      <section className="two-column-section">
        <div className="two-column-content">
          <div className="column-image" style={{ backgroundImage: `url(${ScrubImg})` }}></div>
          
          <div className="column-text">
            <span className="section-tag">OUR COLLECTIONS</span>
            <h2>Crafted for Elegance</h2>
            <p>At GILD + GROVE, we believe luxury should be part of your everyday routine. Each product is carefully formulated with premium ingredients to create an indulgent experience.</p>
            <p>From our captivating perfumes to our nourishing body scrubs, every item is designed to make you feel extraordinary.</p>
            
            <div className="benefits-list">
              <div className="benefit-box">
                <div className="benefit-box-icon"><GiPerfumeBottle /></div>
                <h4>Long-Lasting Scents</h4>
                <p>Fragrances that stay with you</p>
              </div>
              <div className="benefit-box">
                <div className="benefit-box-icon"><GiSoap /></div>
                <h4>Gentle Formulas</h4>
                <p>Kind to your skin</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section className="benefits-section">
        <div className="benefits-grid">
          <div className="benefit">
            <BsTruck className="benefit-icon" />
            <div className="benefit-text">
              <h4>Free Shipping</h4>
              <p>On orders over ₱1,500 nationwide</p>
            </div>
          </div>
          <div className="benefit">
            <BsShieldCheck className="benefit-icon" />
            <div className="benefit-text">
              <h4>Secure Payment</h4>
              <p>Safe and encrypted transactions</p>
            </div>
          </div>
          <div className="benefit">
            <BsGift className="benefit-icon" />
            <div className="benefit-text">
              <h4>Gift Wrapping</h4>
              <p>Complimentary elegant packaging</p>
            </div>
          </div>
          <div className="benefit">
            <GiSparkles className="benefit-icon" />
            <div className="benefit-text">
              <h4>Premium Quality</h4>
              <p>Only the finest ingredients</p>
            </div>
          </div>
        </div>
      </section>

      {/* TWO COLUMN WITH IMAGE - RIGHT */}
      <section className="two-column-section">
        <div className="two-column-content">
          <div className="column-text">
            <span className="section-tag">WHY CHOOSE US</span>
            <h2>The GILD + GROVE Experience</h2>
            <p>We believe that self-care is not a luxury—it's a necessity. Our collection of perfumes, soaps, body mists, and scrubs transforms your daily routine into a moment of pure indulgence.</p>
            <p>Each product is crafted in small batches to ensure the highest quality. From the first spray to the last use, you'll feel the difference that attention to detail makes.</p>
            <Link to="/about" className="cta-button" style={{ marginTop: '20px' }}>
              OUR STORY
            </Link>
          </div>
          
          <div className="column-image" style={{  backgroundImage: `url(${soap})`  }}></div>
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section className="reviews-section">
        <div className="reviews-header">
          <h2>Loved by Our Customers</h2>
          <p>See what people are saying about their GILD + GROVE experience</p>
        </div>
        
        <div className="reviews-grid">
          <div className="review-card">
            <div className="review-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80')" }}></div>
            <div className="review-stars">★★★★★</div>
            <h4>Perfect Signature Scent!</h4>
            <p>"I've been searching for the perfect perfume and finally found it. The scent lasts all day and I get compliments everywhere!"</p>
          </div>
          <div className="review-card">
            <div className="review-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80')" }}></div>
            <div className="review-stars">★★★★★</div>
            <h4>Amazing Body Scrub</h4>
            <p>"The body scrub leaves my skin so soft and smooth. It's become an essential part of my self-care routine!"</p>
          </div>
          <div className="review-card">
            <div className="review-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80')" }}></div>
            <div className="review-stars">★★★★★</div>
            <h4>Luxurious Soaps</h4>
            <p>"These artisan soaps are incredible! They smell divine and make my skin feel pampered. Worth every peso!"</p>
          </div>
        </div>
      </section>
        {/* SHOP BESTSELLERS - MATCHING SHOP PAGE STYLE */}
        <section className="shop-section">
          <div className="section-header">
            <h2>Shop Bestsellers</h2>
            <p className="section-subtitle">Our most loved products</p>
          </div>

          <div className="products-grid">
            {products.slice(0, 4).map((product, index) => (
              <Link to={`/product/${product.id}`} className="bestseller-card" key={product.id}>
                {product.status === "New" && <span className="bestseller-badge">NEW</span>}
                {index === 0 && <span className="bestseller-badge">BESTSELLER</span>}
                
                <div className="bestseller-img">
                  <img 
                    src={product.main_image} 
                    alt={product.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/300";
                    }}
                  />
                </div>
                
                <p className="bestseller-name">{product.name}</p>
                
                <div className="bestseller-rating">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const rating = Math.round(Number(product.avg_rating) || 4);
                    return <span key={i}>{i < rating ? "★" : "☆"}</span>;
                  })}
                  <span className="bestseller-rating-count">
                    ({product.avg_rating?.toFixed(1) || "4.5"})
                  </span>
                </div>
                
                <p className="bestseller-price">
                  ₱{Number(product.price || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </p>
              </Link>
            ))}
          </div>

          <div className="view-all-btn">
            <Link to="/shop" className="cta-button">
              VIEW ALL PRODUCTS <FaArrowRight />
            </Link>
          </div>
        </section>
      {/* BLOG SECTION */}
      <section className="blog-section">
        <div className="section-header">
          <h2>Beauty & Fragrance Journal</h2>
          <p className="section-subtitle">Tips, guides & inspiration</p>
        </div>
        
        <div className="blog-grid">
          {blogPosts.map((post) => (
            <div className="blog-card" key={post.id}>
              <div className="blog-image">
                <img src={post.image} alt={post.title} />
              </div>
              <div className="blog-content">
                <h3>{post.title}</h3>
                <p className="blog-excerpt">{post.excerpt}</p>
                <Link to={`/blog/${post.id}`} className="read-more">
                  Read More <FaChevronRight />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* NEWSLETTER */}
      <section className="newsletter">
        <div className="newsletter-content">
          <GiPerfumeBottle className="newsletter-icon" />
          <h2>Join Our Inner Circle</h2>
          <p>Be the first to know about new releases, exclusive offers, and fragrance tips</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email address" />
            <button>Subscribe</button>
          </div>
          <p className="newsletter-note">By subscribing, you agree to our Privacy Policy</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Shop</h4>
            <Link to="/perfumes">Perfumes</Link>
            <Link to="/soaps">Artisan Soaps</Link>
            <Link to="/body-mists">Body Mists</Link>
            <Link to="/scrubs">Body Scrubs</Link>
            <Link to="/gift-sets">Gift Sets</Link>
          </div>
          
          <div className="footer-section">
            <h4>Information</h4>
            <Link to="/about">Our Story</Link>
            <Link to="/ingredients">Ingredients</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <Link to="/shipping">Shipping & Delivery</Link>
            <Link to="/returns">Returns & Exchanges</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/track-order">Track Order</Link>
          </div>
          
          <div className="footer-section">
            <h4>Connect</h4>
            <div className="social">
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
              <a href="#" aria-label="TikTok"><FaTiktok /></a>
              <a href="#" aria-label="Facebook"><FaFacebookF /></a>
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
            </div>
            <div className="contact-info">
              <p>📧 hello@gildandgrove.com</p>
              <p>📞 +63 912 345 6789</p>
              <p>📍 Manila, Philippines</p>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2025 GILD + GROVE. Luxury Fragrances & Body Care Made in the Philippines.</p>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/cookies">Cookie Policy</Link>
          </div>
          {!localStorage.getItem("user") && (
                <div className="admin-login">
                  <Link to="/adminlog">Admin Login</Link>
                </div>
              )}
        </div>
      </footer>
    </div>
  );
}