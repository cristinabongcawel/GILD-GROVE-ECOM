import React, { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./prodpage.css";

export default function ProductPage({ setCartOpen }) {
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

  const handleAddToCart = async () => {
    const token = localStorage.getItem("token");
    const user_id = localStorage.getItem("user_id");

    if (!token || !user_id) {
      alert("Please login to add items to cart.");
      navigate("/login");
      return;
    }

    if (!selectedVariant) {
      alert("Please select a variant before adding to cart.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:8800/api/cart/add", {
        user_id,
        product_id: product.id,
        variant_id: selectedVariant.id,
        quantity
      });

      alert(response.data.message || "Added to cart!");
      setCartOpen(true);
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert("Failed to add to cart");
    }
  };

  const handleBuyNow = () => {
    const token = localStorage.getItem("token");
    const user_id = localStorage.getItem("user_id");

    if (!token || !user_id) {
      alert("Please login first.");
      navigate("/login");
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
          checkoutSource: 'product_page'
        }
      }
    });
  };

  if (!product) return <div className="loading">Loading...</div>;

  const sizeOptions = product.variants?.map(v => v.variant) || [];

  return (
    <div className="product-page-container">
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
          {[1, 2, 3, 4, 5].map(n => <FaStar key={n} className="star-icon" />)}
          <span className="rating-number">4.8</span>
        </div>

        <h3 className="prod-price">
          ₱{selectedVariant ? Number(selectedVariant.price).toLocaleString() : '0'}
        </h3>
        <p className="prod-description">{product.description}</p>

        <label className="label">Size / Volume</label>
        <div className="size-buttons-container">
          {product.variants?.map(v => (
            <button
              key={v.id}
              className={`size-btn ${selectedVariant?.id === v.id ? 'size-btn-active' : ''}`}
              onClick={() => setSelectedVariant(v)}
            >
              {v.variant}
            </button>
          ))}
        </div>

        <label className="label">Quantity</label>
        <div className="qty-box">
          <button className="qty-btn" onClick={() => handleQuantityChange(-1)}>-</button>
          <div className="qty-display">{quantity}</div>
          <button className="qty-btn" onClick={() => handleQuantityChange(1)}>+</button>
        </div>

        <div className="button-row">
          <button className="add-cart-btn" onClick={handleAddToCart}>ADD TO CART</button>
          <button className="buy-now-btn" onClick={handleBuyNow}>BUY NOW</button>
        </div>
      </div>
    </div>
  );
}
