import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./myreview.css";
import UserSidebar from "./usersidebar";
import {
  FaStar,
  FaRegStar,
  FaCalendarAlt,
  FaEllipsisV,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

export default function MyReviews() {
  const [userID, setUserID] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [image, setImage] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [activeMenu, setActiveMenu] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const dropdownRefs = useRef({}); // refs for each review dropdown
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedAdminReplies, setExpandedAdminReplies] = useState({});


  // --- GET userID from localStorage ---
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const detectedID = storedUser?.userID || storedUser?.id;
    if (detectedID) setUserID(detectedID);

    const handleUserUpdate = () => {
      const updatedUser = JSON.parse(localStorage.getItem("user"));
      setUserID(updatedUser?.userID || updatedUser?.id);
    };

    window.addEventListener("userUpdated", handleUserUpdate);
    return () => window.removeEventListener("userUpdated", handleUserUpdate);
  }, []);

  // --- FETCH USER REVIEWS ---
  useEffect(() => {
    if (!userID) return;
    const fetchReviews = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8800/api/reviews/fetch-user-reviews/${userID}`
        );
        setReviews(res.data);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch reviews.");
      }
    };
    fetchReviews();
  }, [userID]);

  // --- CLOSE DROPDOWN WHEN CLICKING OUTSIDE ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-wrapper') && activeMenu) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenu]);

  // --- UI Handlers ---
  const toggleComment = (reviewID) => {
    setExpandedComments((prev) => ({
      ...prev,
      [reviewID]: !prev[reviewID],
    }));
  };

  // --- DELETE REVIEW ---
  const handleDeleteReview = async (reviewID) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      await axios.delete(`http://localhost:8800/api/reviews/delete-review/${reviewID}`);
      setReviews(reviews.filter((r) => r.reviewID !== reviewID));
      setActiveMenu(null);
      alert("Review deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete review.");
    }
  };

  function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}
const handleEditReview = (review) => {
  setEditingReview(review);       // opens the modal
  setEditRating(review.rating);   // pre-fill star rating
  setEditComment(review.comment); // pre-fill comment
  setImage(null);                 // reset selected image
  setRemoveExistingImage(false);  // reset remove image flag
  setIsModalOpen(true);           // show modal
};

  const handleUpdateReview = async () => {
  if (!editingReview) return;

  // Validate rating and comment
  if (editRating === 0 || editComment.trim() === "") {
    alert("Please provide rating and comment.");
    return;
  }

  // Convert image to Base64 if there is one
  let base64Image = null;
  if (image) {
    try {
      base64Image = await toBase64(image);
    } catch (err) {
      console.error("Failed to convert image to Base64:", err);
      return;
    }
  }

  // Prepare payload WITHOUT variantID
  const payload = {
    rating: editRating,
    comment: editComment,
    image_url: base64Image || null,
  };

  try {
    await axios.put(
      `http://localhost:8800/api/reviews/update-review/${editingReview.reviewID}`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    // Update local state immediately
    setReviews(reviews.map(r =>
      r.reviewID === editingReview.reviewID
        ? {
            ...r,
            rating: editRating,
            comment: editComment,
            image_url: base64Image || r.image_url,
          }
        : r
    ));

    // Reset modal
    setEditingReview(null);
    setIsModalOpen(false);
    setEditRating(0);
    setEditComment("");
    setImage(null);
    setRemoveExistingImage(false);

    alert("Review updated successfully!");
  } catch (err) {
    console.error("Failed to update review:", err);
    alert("Failed to update review");
  }
};

  // --- FILTER + SORT ---
  const filteredAndSortedReviews = reviews
    .filter((review) => {
      if (filter === "all") return true;
      if (filter === "5-star") return review.rating === 5;
      if (filter === "4-star") return review.rating === 4;
      if (filter === "3-star") return review.rating === 3;
      if (filter === "2-star") return review.rating === 2;
      if (filter === "1-star") return review.rating === 1;
      if (filter === "with-photos") return review.image_url?.length > 0;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest") return a.rating - b.rating;
      return 0;
    });

  const toggleAdminReply = (reviewID) => {
    setExpandedAdminReplies((prev) => ({
      ...prev,
      [reviewID]: !prev[reviewID],
    }));
  };

  return (
    <div className="review-page">
      <div className="review-container-my">
        <UserSidebar />

        <div className="reviews-content-my">
          {/* HEADER */}
          <div className="reviews-header-my">
            <div className="header-top">
              <h1>My Reviews</h1>
              <p className="reviews-subtitle-my">Manage all reviews you've written</p>
            </div>

            <div className="reviews-controls">
              <div className="filters">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Reviews</option>
                  <option value="5-star">5 Stars</option>
                  <option value="4-star">4 Stars</option>
                  <option value="3-star">3 Stars</option>
                  <option value="2-star">2 Stars</option>
                  <option value="1-star">1 Star</option>
                  <option value="with-photos">With Photos</option>
                </select>
              </div>

              <div className="sort">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>
            </div>
          </div>

          {/* REVIEWS LIST */}
          <div className="reviews-scrollable">
            {filteredAndSortedReviews.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✍️</div>
                <h3>No reviews found</h3>
                <p>Try changing your filters to see more reviews.</p>
              </div>
            ) : (
              filteredAndSortedReviews.map((review) => (
                <div key={review.reviewID} className="review-card">
                  <div className="review-header">
                      {/* LEFT: Product info */}
                      <div className="review-product-info">
                        <img
                          src={review.product_image || ""}
                          alt={review.product_name}
                          className="review-product-img"
                        />
                        <div className="review-product-details">
                          <div className="product-name-row">
                            <h3 className="review-product-name">{review.product_name}</h3>
                          </div>

                          <div className="review-product-meta">
                            <span className="review-variant">{review.variant}</span>
                            <span className="review-date-small">
                              <FaCalendarAlt size={12}/>
                              {new Date(review.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            {review.is_edited && <span className="edited-badge-small">Edited</span>}
                          </div>

                          <div className="review-body">
                            {review.comment && (
                              <p className="review-comment">
                                {expandedComments[review.reviewID] || review.comment.length <= 120
                                  ? review.comment
                                  : review.comment.slice(0, 120) + "..."}
                              </p>
                            )}
                            {review.comment && review.comment.length > 120 && (
                              <button
                                className="toggle-comment-btn"
                                onClick={() => toggleComment(review.reviewID)}
                              >
                                {expandedComments[review.reviewID] ? (
                                  <>
                                    Show Less <FaChevronUp size={10} />
                                  </>
                                ) : (
                                  <>
                                    Show More <FaChevronDown size={10} />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                         </div>
                      </div>

                    <div className="review-actions-container-myrev">
                        <div className="stars-dropdown-row-myrev">
                          <div className="review-rating-small-myrev">
                              {[1, 2, 3, 4, 5].map((star) =>
                                star <= review.rating ? (
                                  <FaStar key={star} className="star-filled-myrev" />
                                ) : (
                                  <FaRegStar key={star} className="star-empty-myrev" />
                                )
                              )}
                            </div>

                          <div className="dropdown-wrapper-myrev" ref={el => dropdownRefs.current[review.reviewID] = el}>
                            <button
                              className="menu-toggle-btn-myrev"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(activeMenu === review.reviewID ? null : review.reviewID);
                              }}
                              type="button"
                            >
                              <FaEllipsisV size={14} />
                            </button>

                            {activeMenu === review.reviewID && (
                              <div className="dropdown-menu-myrev">
                                <button
                                  className="dropdown-item edit-item"
                                  onClick={() => handleEditReview(review)}
                                  type="button"
                                >
                                  Edit Review
                                </button>
                                <button
                                  className="dropdown-item delete-item"
                                  onClick={() => handleDeleteReview(review.reviewID)}
                                  type="button"
                                >
                                  Delete Review
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          className="view-product-btn"
                          onClick={() => window.open(`/product/${review.product_id}`, "_blank")}
                          type="button"
                        >
                          View Product
                        </button>
                      </div>
                      {review.adminReply && (
                        <div className="admin-reply-box-myrev">
                          <div className="admin-reply-header-myrev">
                            <strong>GILD + GROVE</strong>
                            <span className="admin-reply-date-myrev">
                              {new Date(review.updated_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>

                          {/* LIMITED ADMIN REPLY TEXT */}
                          <p className="admin-reply-text-myrev">
                            {expandedAdminReplies[review.reviewID] || review.adminReply.length <= 150
                              ? review.adminReply
                              : review.adminReply.slice(0, 145) + "…"}
                          </p>

                          {/* SHOW MORE / SHOW LESS BUTTON */}
                          {review.adminReply.length > 145 && (
                            <button
                              className="toggle-comment-btn"
                              onClick={() => toggleAdminReply(review.reviewID)}
                            >
                              {expandedAdminReplies[review.reviewID] ? (
                                <>
                                  Show Less <FaChevronUp size={10} />
                                </>
                              ) : (
                                <>
                                  Show More <FaChevronDown size={10} />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
              ))
            )}
          </div>
        </div>

        {/* EDIT MODAL */}
      {editingReview && (
        <div className="review-modal-backdrop" onClick={() => setEditingReview(null)}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Your Review</h3>

            {/* Product Info */}
            <div className="product-review-item">
              <img
                src={editingReview.product_image || ""}
                alt={editingReview.product_name}
                className="product-thumb"
              />
              <div className="product-info">
                <p className="product-name">{editingReview.product_name}</p>
                <p className="product-variant">{editingReview.variant}</p>
              </div>
            </div>

            {/* Star Rating */}
            <div className="write-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className="write-star"
                  onClick={() => setEditRating(star)}
                >
                  {star <= editRating ? '★' : '☆'}
                </span>
              ))}
            </div>

            {/* Comment */}
            <textarea
              className="write-textarea"
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              placeholder="Share your updated thoughts..."
            />

            {/* Image Upload / Show file name */}
              <div className="edit-image-section">
                <label>Update Image (optional):</label>
                
                <input type="file"  accept="image/*" onChange={(e) => setImage(e.target.files[0])}/>
                {/* Show file name: either newly selected or existing */}
                <div className="selected-image-wrapper">
                  <span>{image ? image.name : removeExistingImage ? "No file chosen" : editingReview.product_image || "No file chosen"}</span>
                  {(image || (editingReview.product_image && !removeExistingImage)) && (
                    <button
                      className="remove-image-btn"
                      onClick={() => {
                        if (image) setImage(null);
                        else setRemoveExistingImage(true);
                         }}
                       >
                      ×
                    </button>
                  )}
                </div>
              </div>


            {/* Modal Buttons */}
            <div className="modal-buttons">
              <button
                className="cancel-review-btn"
                onClick={() => setEditingReview(null)}
              >
                Cancel
              </button>
              <button
                className="submit-review-btn"
                onClick={handleUpdateReview}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
