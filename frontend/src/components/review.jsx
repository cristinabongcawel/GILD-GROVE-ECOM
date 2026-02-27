import React, { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import "./review.css";

export default function Review({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average: 0, total: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
  const [filter, setFilter] = useState("all");

  // Fetch reviews on mount
  useEffect(() => {
    if (!productId) return;

    axios
      .get(`http://localhost:8800/api/reviews/fetch-review/${productId}`)
      .then((res) => {
        console.log("Fetched reviews:", res.data); // <--- add this
        const fetched = res.data;
        setReviews(fetched);

        // calculate stats
        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let totalRating = 0;
        fetched.forEach(r => {
          breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
          totalRating += r.rating;
        });
        const total = fetched.length;
        const average = total > 0 ? totalRating / total : 0;
        setStats({ average, total, breakdown });
      })
      .catch((err) => console.error("Error fetching reviews:", err));
  }, [productId]);

  const filteredReviews = filter === "all"
    ? reviews || []
    : (reviews || []).filter(r => r.rating === Number(filter));

  const maxCount = Math.max(...Object.values(stats.breakdown));

  return (
    <div className="prod-reviews-container">
      <h2 className="reviews-title">Product Reviews</h2>

      <div className="reviews-layout">
        <div className="left-column">
          <div className="filter-row">
            <label>Filter:</label>
            <select
              className="review-filter-dropdown"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Reviews</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div className="reviews-list-customer">
            {filteredReviews.map((r) => (
              <div className="review-card-list" key={r.reviewID}>
                <div className="review-header-customer">
                  <div className="review-header-left-customer">
                    <div className="review-avatar-wrapper-customer">
                      <img
                        src={r.profile_image || `https://ui-avatars.com/api/?name=${r.first_name}+${r.last_name}&background=random`}
                        className="review-avatar"
                        alt="avatar"
                      />
                    </div>
                    <div className="review-info-customer">
                      <strong>{r.first_name} {r.last_name}</strong>
                      <p className="review-date-customer">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="review-header-right-customer">
                    <div className="review-rating-customer">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="review-star-customer" style={{ opacity: i < r.rating ? 1 : 0.3 }} />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="review-text">{r.comment}</p>
                {r.image_url && <img src={r.image_url} alt="review" style={{ width: "100px", marginTop: "5px" }} />}
                <p style={{ fontSize: "13px", fontStyle: "italic" }}>Variant: {r.variant}</p>
                  
                {/* Admin Reply Section - Added Here */}
                {r.adminReply && (
                  <div className="admin-reply-container">
                    <div className="admin-reply-header">
                      <div className="admin-avatar-wrapper">
                        <div className="admin-avatar-placeholder">
                          <span>👨‍💼</span>
                        </div>
                      </div>
                      <div className="admin-reply-info">
                        <strong>GILD + GROVE</strong>
                        <p className="admin-reply-date">
                          {new Date(r.reply_updated_at || r.reply_created_at || new Date()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="admin-reply-text">{r.adminReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="right-column">
          <div className="reviews-summary-wrapper">
            <div className="left-summary">
              <h1 className="avg-rating">{stats.average.toFixed(1)}</h1>
              <div className="stars-row">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="summary-star" style={{ opacity: i < Math.round(stats.average) ? 1 : 0.3 }} />
                ))}
              </div>
              <p className="total-reviews">{stats.total} Reviews</p>
            </div>

            <div className="right-bars">
              {[5, 4, 3, 2, 1].map((star) => (
                <div className="bar-row" key={star}>
                  <span className="bar-star-label">{star}★</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(stats.breakdown[star] / maxCount) * 100}%` }}></div>
                  </div>
                  <span className="bar-count">{stats.breakdown[star]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
