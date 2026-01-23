import React, { useEffect, useState } from "react";
import "./cart.css";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Cart({ closeCart }) {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState({}); // track selected items

  const user_id = localStorage.getItem("user_id"); 
  const token = localStorage.getItem("token"); 

  useEffect(() => {
    const fetchCart = async () => {
      if (!user_id || !token) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `http://localhost:8800/api/cart/retrive-cart/${user_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCartItems(res.data);
        // initialize all selected items as unchecked
        const initialSelected = {};
        res.data.forEach(item => initialSelected[item.cart_id] = false);
        setSelectedItems(initialSelected);
      } catch (err) {
        console.error("Error fetching cart:", err);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const handleDelete = async (cart_id) => {
    try {
      if (user_id && token) {
        await axios.delete(`http://localhost:8800/api/cart/remove/${cart_id}`);
        setCartItems(cartItems.filter((item) => item.cart_id !== cart_id));
        setSelectedItems(prev => {
          const copy = { ...prev };
          delete copy[cart_id];
          return copy;
        });
      }
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

const updateQuantity = async (cart_id,  variant_id, newQty) => {
  debugger; // pause when function is called
  console.log("Updating quantity:", cart_id, newQty);

  if (newQty < 1) {
    console.log("Quantity < 1, will delete item");
    try {
      await axios.delete(`http://localhost:8800/api/cart/remove/${cart_id}`);
      setCartItems(cartItems.filter((item) => item.cart_id !== cart_id));
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
    return;
  }

  try {
    const res = await axios.put("http://localhost:8800/api/cart/update", { cart_id, variant_id, quantity: newQty });
    console.log("Quantity updated response:", res.data);
    setCartItems(
      cartItems.map((item) =>
        item.cart_id === cart_id ? { ...item, quantity: newQty } : item
      )
    );
  } catch (err) {
    console.error("Failed to update quantity:", err);
  }
};


  const toggleSelect = (cart_id) => {
    setSelectedItems(prev => ({ ...prev, [cart_id]: !prev[cart_id] }));
  };

  const handleCheckout = () => {
    if (!token || !user_id) {
      navigate("/login");
      return;
    }

  const itemsToCheckout = cartItems.filter(item => selectedItems[item.cart_id]);
  if (itemsToCheckout.length === 0) return;
  closeCart();
  navigate("/checkout", { state: { checkoutSource: "cart", items: itemsToCheckout } });
  };

  // subtotal only counts checked items
  const subtotal = cartItems.reduce(
    (acc, item) => selectedItems[item.cart_id] ? acc + item.price * item.quantity : acc,
    0
  );

  return (
    <div className="cart-overlay">
      <div className="cart-container">
        <div className="cart-header">
          <h2>Cart</h2>
          <button className="close-btn" onClick={closeCart}>×</button>
        </div>

        <div className="cart-content">
          {loading && <p>Loading cart...</p>}
          {!loading && cartItems.length === 0 && <p>Your cart is empty</p>}

          {!loading && cartItems.length > 0 &&
            cartItems.map((item) => (
              <div key={item.cart_id} className="cart-item">
                <div className="item-selector">
                  <input
                    type="checkbox"
                    className="select-item"
                    checked={!!selectedItems[item.cart_id]}
                    onChange={() => toggleSelect(item.cart_id)}
                  />
                </div>

                <div className="item-image">
                  <img
                    src={item.image_url || "/api/placeholder/70/70"}
                    alt={item.name}
                  />
                </div>

                <div className="item-info">
                  <div className="item-top">
                    <p className="item-name">{item.name}</p>
                    <p className="item-price">₱{item.price.toLocaleString()}</p>
                  </div>

                  <div className="item-details">
                    <p className="item-detail">Size: {item.volume || "Default"}</p>
                  </div>

                  <div className="item-actions">
                    <div className="qty-box">
                      <button
                        className="qty-btn"
                        onClick={() =>{
                        const newQty = item.quantity - 1;
                        console.log("Increment clicked:", item.cart_id, newQty, "Stock:", item.stock);
                        updateQuantity(item.cart_id, item.variant_id, newQty);
                        }}
                      >
                        -
                      </button>
                      <div className="qty-display">{item.quantity}</div>
                      <button
                        className="qty-btn"
                        onClick={() => {
                        debugger; // pause here when clicking "+"
                        const newQty = item.quantity + 1;
                        console.log("Increment clicked:", item.cart_id, newQty, "Stock:", item.stock);
                        updateQuantity(item.cart_id, item.variant_id, newQty);
                      }}
                      disabled={item.quantity >= item.stock} // make sure stock is correct
                    >
                        +
                      </button>
                    </div>

                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(item.cart_id)}
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="cart-summary">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>₱{subtotal.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Shipping:</span>
            <span>₱0</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>₱{subtotal.toLocaleString()}</span>
          </div>

          <button
            className="checkout-btn"
            onClick={handleCheckout}
            disabled={Object.values(selectedItems).every(v => !v)}
          >
            Continue to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
