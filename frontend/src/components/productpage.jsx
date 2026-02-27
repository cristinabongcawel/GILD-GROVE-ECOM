import React, { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./prodpage.css";
import Review from "./review.jsx";

export default function ProductPage({ setCartOpen, setLoginOpen }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState("");
 
  // Fetch product details
  useEffect(() => {
    axios
      .get(`http://localhost:8800/api/prodpage/retrieve-productpage/${id}`)
      .then((res) => {
        const data = res.data;
        setProduct(data);
        setActiveImage(data.main_image || (data.images?.[0]?.image_url || ""));
        if (data.variants?.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      })
      .catch((err) => console.error("Error loading product:", err));
  }, [id]);

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) setQuantity(newQuantity);
  };

const handleAddToCart = async () => { // Remove the parameter
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const user_id = user?.userID;

  if (!token || !user_id) {
    alert("Please login to add items to cart.");
    setLoginOpen(true);
    return;
  }

  // Use the selectedVariant state, NOT product.variants?.[0]
  if (!selectedVariant) {
    alert("Please select a variant (e.g., size) before adding to cart.");
    return;
  }

  try {
    const response = await axios.post("http://localhost:8800/api/cart/add", {
      user_id,
      product_id: product.id, // Make sure product is defined
      variant_id: selectedVariant.id,
      quantity: 1, // Or use the quantity state if you want
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    alert(response.data.message || "Added to cart!");
    window.dispatchEvent(new Event("cartUpdated"));
  } catch (err) {
    console.error("Error adding to cart:", err);
    
    // Handle different error scenarios
    if (err.response) {
      // Server responded with an error status
      switch (err.response.status) {
        case 400:
          // Stock limit error or other validation error
          alert(err.response.data.message || "Not enough stock available");
          break;
        case 401:
          alert("Please login to add items to cart.");
          setLoginOpen(true);
          break;
        case 404:
          alert("Product not found. It may have been removed.");
          break;
        case 500:
          alert("Server error. Please try again later.");
          break;
        default:
          alert("Failed to add to cart. Please try again.");
      }
    } else if (err.request) {
      // Request was made but no response received
      alert("Network error. Please check your connection.");
    } else {
      // Something else happened
      alert("Failed to add to cart. Please try again.");
    }
  }
};

  const handleBuyNow = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    const user_id = user?.userID; // <-- add this line

    if (!user?.userID || !token) {
      alert("Please login first.");
       setLoginOpen(true);
      return;
    }


    if (!selectedVariant) {
      alert("Please select a variant before buying.");
      return;
    }

    navigate("/checkout", {
      state: {
        buyNow: {
          product_id: product.id,
          name: product.name,
          price: selectedVariant.price,
          size: selectedVariant.variant,
          quantity,
          image: activeImage,
          variant_id: selectedVariant.id,
          stock: selectedVariant.stock, 
          user_id,
          checkoutSource: 'product_page'
        }
      }
    });
  };

  if (!product) return <div className="loading">Loading...</div>;

  const sizeOptions = product.variants?.map(v => v.variant) || [];

  return (
    <div className="product-page-container">
      <button className="back-btn-prod" onClick={() => navigate(-1)}>
        ← 
      </button>

      <div className="product-left">
        <img src={activeImage} alt={product.name} className="main-image" />
        <div className="thumbnail-row">
          {product.images?.map((img, index) => (
            <img
              key={index}
              className="thumbnail-img"
              src={img.image_url}
              onClick={() => setActiveImage(img.image_url)}
            />
          ))}
        </div>
      </div>

      <div className="product-right">
        <h2 className="prod-title">{product.name}</h2>
        <p className="prod-category">{product.category}</p>

        <div className="prod-rating">
          {Array.from({ length: 5 }).map((_, i) => (
            <FaStar 
              key={i} 
              className={`star-icon ${i < Math.round(product.avg_rating) ? 'filled-star' : 'empty-star'}`} 
            />))}
          <span className="rating-number">({product.avg_rating.toFixed(1)})</span>        </div>
        <h3 className="prod-price">
          ₱{selectedVariant ? Number(selectedVariant.price).toLocaleString() : '0'}
        </h3>
        <p className="prod-description">{product.description}</p>

        <label className="label">Size / Volume</label>
          <div className="size-buttons-container">
            {product.variants
              ?.filter(v => v.status === 'active') // only active variants
              .map(v => {
                const isOutOfStock = v.stock === 0;
                const isLowStock = v.stock > 0 && v.stock <= 5;

                return (
                  <div key={v.id} className="variant-wrapper">
                    <button
                      className={`size-btn ${selectedVariant?.id === v.id ? 'size-btn-active' : ''}`}
                      onClick={() => setSelectedVariant(v)}
                      disabled={isOutOfStock}
                    >
                      {v.variant}
                    </button>
                    {isLowStock && <div className="stock-warning">⚠ Only {v.stock} left!</div>}
                    {isOutOfStock && <div className="stock-out">Out of Stock</div>}
                  </div>
                );
              })}
          </div>

          <label className="label">Quantity</label>
          <div className="qty-box">
            <button
              className="qty-btn"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1 || selectedVariant?.stock === 0}
            >
              -
            </button>
            <div className="qty-display">{quantity}</div>
            <button
              className="qty-btn"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= (selectedVariant?.stock || 999) || selectedVariant?.stock === 0}
            >
              +
            </button>
          </div>

          <div className="button-row">
            <button
              className="add-cart-btn"
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant?.stock === 0}
            >
              ADD TO CART
            </button>
            <button
              className="buy-now-btn"
              onClick={handleBuyNow}
              disabled={!selectedVariant || selectedVariant?.stock === 0}
            >
              BUY NOW
            </button>
          </div>

      </div>
      {product && (
        <div className="review-section-full">
          <Review 
            productId={product.id} 
          />
        </div>
      )}
    </div>
  );
}
