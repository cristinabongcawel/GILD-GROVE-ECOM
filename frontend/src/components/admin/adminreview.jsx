import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./sidebar";
import Header from "./header";
import "./admin-layout.css"
import "./adminreviews.css";
import { FiSearch } from "react-icons/fi";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [filterDate, setFilterDate] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success" // "success", "error", "info"
  });
  const API_BASE_URL = "http://localhost:8800/api/admin-review";

    const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
 const showNotification = (message, type = "success") => {
    setNotification({
      show: true,
      message,
      type
    });
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/retrieve-reviews`);
      const transformedReviews = res.data.map(review => ({
        id: review.reviewID,
        productName: review.productName || "Unknown Product",
        variant: review.variant || "Standard",
        customerName: review.first_name && review.last_name ? `${review.first_name} ${review.last_name}` : "Anonymous",
        email: review.email,
        rating: review.rating || 0,
        reviewText: review.comment || "",
        createdAt: review.created_at,
        isVisible: review.isVisible !== undefined ? review.isVisible : true,
        adminReply: review.adminReply || "",
        orderId: review.orderID,
        reviewImage: review.image_url || null,
      }));
      setReviews(transformedReviews);
      setLoading(false);
      showNotification("Reviews loaded successfully!", "success");
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      setLoading(false);
      showNotification("Failed to load reviews. Please try again.", "error");
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (activeTab === "all") return true;
    if (activeTab === "visible") return review.isVisible;
    if (activeTab === "hidden") return !review.isVisible;
    return true;
  }).filter(review => selectedProduct ? review.productName === selectedProduct : true);

  const searchedReviews = filteredReviews.filter(review => {
    const query = searchQuery.toLowerCase();
    const productName = (review.productName || "").toString().toLowerCase();
    const customerName = (review.customerName || "").toString().toLowerCase();
    const reviewText = (review.reviewText || "").toString().toLowerCase();
    const email = (review.email || "").toString().toLowerCase();
    const orderId = (review.orderId || "").toString().toLowerCase();

    const matchesSearch =
      productName.includes(query) ||
      customerName.includes(query) ||
      reviewText.includes(query) ||
      email.includes(query) ||
      orderId.includes(query);

    const matchesDate = filterDate
      ? new Date(review.createdAt).toISOString().slice(0, 10) === filterDate
      : true;

    return matchesSearch && matchesDate;
  });

  const toggleVisibility = async (reviewId, currentVisibility) => {
    try {
      await axios.put(`${API_BASE_URL}/toggle-visibility/${reviewId}`, {
        isVisible: !currentVisibility
      });
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, isVisible: !currentVisibility } : r));
      showNotification(
        `Review ${!currentVisibility ? "made visible" : "hidden"} successfully!`,
        "success"
      );
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
      showNotification("Failed to update review visibility", "error");
    }
  };

  const startReply = (reviewId, currentReply) => {
    setReplyingTo(reviewId);
    setReplyText(currentReply || "");
    setShowReplyModal(true);
  };

  const saveReply = async (reviewId) => {
     if (!replyText.trim()) {
      showNotification("Reply cannot be empty", "error");
      return;
    }
    try {
      await axios.put(`${API_BASE_URL}/reply/${reviewId}`, { adminReply: replyText });
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, adminReply: replyText } : r));
      showNotification("Reply sent successfully!", "success");
      setShowReplyModal(false);
      setReplyingTo(null);
      setReplyText("");
    } catch (err) {
      console.error("Failed to save reply:", err);
      showNotification("Failed to sent reply", "error");
    }
  };

  const renderStars = (rating) => (
    <div className="rating-stars">
      {[...Array(5)].map((_, i) => <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>★</span>)}
      <span className="rating-number">({rating})</span>
    </div>
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const stats = {
    total: reviews.length,
    averageRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0"
  };

    // Get unique product names from searchedReviews
  const searchedProducts = [...new Set(searchedReviews.map(r => r.productName))];

  // Compute average for the first matched product
  const avgProduct = searchedProducts.length > 0
    ? (() => {
        const productReviews = searchedReviews.filter(r => r.productName === searchedProducts[0]);
        const total = productReviews.reduce((sum, r) => sum + r.rating, 0);
        const count = productReviews.length;
        return { 
          product: searchedProducts[0], 
          average: (total / count).toFixed(1), 
          count 
        };
      })()
    : null;

  return (
     <div className="admin-page">
          <Sidebar className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
                  toggleSidebar={toggleSidebar}/>
          <div className="admin-content">
            <Header toggleSidebar={toggleSidebar}  // Pass toggle function to header
                    isSidebarCollapsed={sidebarCollapsed}/>
        
         {/* Notification Component - Add this right after Header */}
        {notification.show && (
          <div className={`notification notification-${notification.type}`}>
            <div className="notification-content">
              <span className="notification-icon">
                {notification.type === "success" ? "✅" : 
                notification.type === "error" ? "❌" : "ℹ️"}
              </span>
              <span className="notification-message">{notification.message}</span>
            </div>
            <button 
              className="notification-close"
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              ×
            </button>
          </div>
        )}

        <h2 className="page-title">Review Management</h2>
       <div className="stats-container">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Reviews</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.averageRating}</div>
            <div className="stat-label">Avg Rating</div>
          </div>
            {/* Display only one product's average if it exists */}
            {avgProduct && (
              <div
                className="stat-card active"
                onClick={() => setSelectedProduct(avgProduct.product)}
              >
                <div className="stat-value">⭐ {avgProduct.average}</div>
                <div className="stat-label">{avgProduct.product} ({avgProduct.count} reviews)</div>
              </div>
            )}
        </div>

        <div className="top-actions">
          <div className="tabs">
            <button className={`tab ${activeTab==="all"?"active":""}`} onClick={()=>setActiveTab("all")}>All Reviews ({stats.total})</button>
            <button className={`tab ${activeTab==="visible"?"active":""}`} onClick={()=>setActiveTab("visible")}>Visible ({stats.visible})</button>
            <button className={`tab ${activeTab==="hidden"?"active":""}`} onClick={()=>setActiveTab("hidden")}>Hidden ({stats.hidden})</button>
          </div>
          <div className="right-actions">
            <div className="search-input-wrapper">
              <FiSearch className="search-icon" />
              <input type="text" placeholder="Search reviews..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="search-input"/>
            </div>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="date-input"/>
          </div>
        </div>

        {loading ? (
          <p style={{textAlign:"center", marginTop:"40px"}}>Loading reviews...</p>
        ) : (
          <div className="reviews-list">
            {searchedReviews.length === 0 && <p style={{textAlign:"center"}}>No reviews found.</p>}
            {searchedReviews.map(review => (
              <div className="review-card" key={review.id}>
                <div className="review-header">
                  <div className="product-name">{review.productName}</div>
                  <div className={`visibility-badge ${review.isVisible ? "visible" : "hidden"}`}>
                    {review.isVisible ? "Visible" : "Hidden"}
                  </div>
                </div>
                <div className="review-customer-my">
                  <strong>{review.customerName}</strong>
                  {review.email && <span className="customer-email">{review.email}</span>}
                </div>
                <div className="review-rating-my">{renderStars(review.rating)}</div>
                <div className="review-text-my">{review.reviewText}</div>
                {review.reviewImage && (
                  <button
                    className="view-image-btn-my"
                    onClick={() => setModalImage(review.reviewImage)}
                  >
                    View Image
                  </button>
                )}
                {review.adminReply && <div className="admin-reply-my">Admin: {review.adminReply}</div>}
                <div className="review-footer">
                  <div className="review-date">{formatDate(review.createdAt)}</div>
                 <div className="review-actions">
                  <button onClick={() => toggleVisibility(review.id, review.isVisible)}>
                    {review.isVisible ? "Hide" : "Show"}
                  </button>
                  <button onClick={() => startReply(review.id, review.adminReply)}>
                    {review.adminReply ? "Edit" : "Reply"}
                  </button>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showReplyModal && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <h2>Reply to Review</h2>
              </div>
              <div className="admin-modal-content">
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={5} />
              </div>
              <div className="admin-modal-actions">
                <button className="admin-btn admin-cancel" onClick={() => { setShowReplyModal(false); setReplyText(""); setReplyingTo(null); }}>Cancel</button>
                <button className="admin-btn admin-save" onClick={() => { saveReply(replyingTo); setShowReplyModal(false); }}>Send Reply</button>
              </div>
            </div>
          </div>
        )}

        {modalImage && (
          <div className="image-modal-overlay" onClick={() => setModalImage(null)}>
            <div className="image-modal" onClick={e => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setModalImage(null)}>×</button>
              <img src={modalImage} alt="Review" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
