import React, { useState, useEffect } from "react"; 
import "./checkout.css";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import locationData from "./location.json";

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user_id = localStorage.getItem("user_id");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [items, setItems] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [showOrderCompleted, setShowOrderCompleted] = useState(false);
  const checkoutSource = location.state?.checkoutSource || "unknown";


  // ------------------------
  // Helper function
  // ------------------------
  const sanitizeItem = (raw) => ({
    productID: raw.product_id || raw.id || raw.productID || raw._id,
    variantID: raw.variantID || raw.variant_id || null, // ✅ Add variantID
    name: raw.name,
    price: Number(raw?.price ?? raw?.price_string ?? 0),
    quantity: Math.max(1, Math.floor(Number(raw?.quantity ?? 1))),
    image: raw.image || raw.image_url,
    color: raw.color,
    size: raw.size,
  });


  // ------------------------
  // Redirect if not logged in
  // ------------------------
  useEffect(() => {
    if (!token || !user_id) {
      alert("Please login to proceed to checkout.");
      navigate("/login", { replace: true });
    }
  }, [token, user_id, navigate]);

  // ------------------------
  // Load user details
  // ------------------------
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:8800/api/users/details/${user_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUserDetails(data || {});
      } catch (err) {
        console.error("Failed to load user details:", err);
      }
    };
    loadUser();
  }, [user_id, token]);

  // ------------------------
  // Load cart / Buy Now
  // ------------------------
  useEffect(() => {
    const buyNowItem = location.state?.buyNow;
    const selectedItemsFromCart = location.state?.items;

    if (buyNowItem) {
      setItems([sanitizeItem(buyNowItem)]);
      return;
    }

    if (selectedItemsFromCart && selectedItemsFromCart.length > 0) {
      setItems(selectedItemsFromCart.map(sanitizeItem));
      return;
    }

    const loadCart = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:8800/api/cart/retrive-cart/${user_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const safeItems = Array.isArray(data) ? data.map(sanitizeItem) : [];
        setItems(safeItems);
      } catch (err) {
        console.error("Failed to load cart:", err);
        setItems([]);
      }
    };
    loadCart();
  }, [location.state, user_id, token]);

  // ------------------------
  // Region update
  // ------------------------
  useEffect(() => {
    const countryObj = locationData.countries.find(c => c.name === userDetails.country);
    setRegions(countryObj?.regions || []);
  }, [userDetails.country]);

  // ------------------------
  // City update
  // ------------------------
  useEffect(() => {
    const countryObj = locationData.countries.find(c => c.name === userDetails.country);
    const regionObj = countryObj?.regions.find(r => r.name === userDetails.region);
    setCities(regionObj?.cities || []);
  }, [userDetails.region]);

  // ------------------------
  // Update Quantity
  // ------------------------
  const handleQuantityChange = (index, change) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      item.quantity = Math.max(1, item.quantity + change);
      updated[index] = item;
      return updated;
    });
  };

  const subtotal = items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 0), 0);
  const shipping = 0;
  const total = subtotal + shipping;

  // ------------------------
  // CONFIRM ORDER FUNCTION
  // ------------------------
const handleConfirmOrder = async () => {
  try {
    setSubmitting(true);

    const orderPayload = {
      userID: user_id,
      checkoutSource,
      items: items.map(item => ({
        productID: item.productID,
        variantID: item.variantID || null,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      payment_method: selectedPayment,
      total_amount: total,
      delivery_name: userDetails.name,
      delivery_phone: userDetails.phone,
      delivery_email: userDetails.email,
      delivery_address: userDetails.address,
    };

    // Place order
    const response = await axios.post(
      "http://localhost:8800/api/order/place-order",
      orderPayload
    );

    console.log("Order Response:", response.data);

    // ✅ Delete purchased items from cart if checkout came from cart
    if (checkoutSource === "cart") {
      await axios.post("http://localhost:8800/api/order/remove-purchased", {
        userID: user_id,
        items: items,
        checkoutSource
      });
      console.log("Cart items removed after checkout.");
    }

    setShowOrderCompleted(true);
  } catch (error) {
    console.error("❌ Error placing order:", error);
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="checkout-container">
      <div className="checkout-layout">
        <div className="checkout-row">
          
          {/* LEFT */}
          <div className="checkout-left">
            <div className="checkout-card">
              <h4 className="section-title">Delivery Summary</h4>

              {/* Name & Phone */}
              <div className="form-row">
                <div className="form-col">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    type="text"
                    value={userDetails.name || ""}
                    readOnly={!isEditing}
                    onChange={e => setUserDetails(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-control"
                    type="text"
                    value={userDetails.phone || ""}
                    readOnly={!isEditing}
                    onChange={e => setUserDetails(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              {/* Email & Country */}
              <div className="form-row">
                <div className="form-col">
                  <label className="form-label">Email</label>
                  <input
                    className="form-control"
                    type="email"
                    value={userDetails.email || ""}
                    readOnly={!isEditing}
                    onChange={e => setUserDetails(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">Country</label>
                  <select
                    className="form-select"
                    value={userDetails.country || "Philippines"}
                    disabled={!isEditing}
                    onChange={e => setUserDetails(prev => ({
                      ...prev,
                      country: e.target.value,
                      region: "",
                      city: ""
                    }))}
                  >
                    {locationData.countries.map(country => (
                      <option key={country.code} value={country.name}>{country.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Region, City, Zip */}
              <div className="form-row">
                <div className="form-col">
                  <label className="form-label">Region</label>
                  <select
                    className="form-select"
                    value={userDetails.region || ""}
                    disabled={!isEditing}
                    onChange={e => setUserDetails(prev => ({ ...prev, region: e.target.value }))}
                  >
                    <option value="">Select Region</option>
                    {regions.map(region => (
                      <option key={region.code} value={region.name}>{region.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-col">
                  <label className="form-label">City</label>
                  <select
                    className="form-select"
                    value={userDetails.city || ""}
                    disabled={!isEditing}
                    onChange={e => setUserDetails(prev => ({ ...prev, city: e.target.value }))}
                  >
                    <option value="">Select City</option>
                    {cities.map(city => (
                      <option key={city.code} value={city.name}>{city.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-col">
                  <label className="form-label">Zip Code</label>
                  <input
                    className="form-control"
                    type="text"
                    value={userDetails.zip || ""}
                    readOnly={!isEditing}
                    onChange={e => setUserDetails(prev => ({ ...prev, zip: e.target.value }))}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="form-full">
                <label className="form-label">Address</label>
                <textarea
                  className="form-control textarea"
                  rows="3"
                  value={userDetails.address || ""}
                  readOnly={!isEditing}
                  onChange={e => setUserDetails(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="action-buttons">
                {isEditing && (
                  <button className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                )}
                <button
                  className="btn-save"
                  onClick={() => setIsEditing(prev => !prev)}
                >
                  {isEditing ? "Save" : "Edit"}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT - Order Summary */}
          <div className="checkout-right">
            <div className="checkout-card">
              <h4 className="section-title">Order Summary</h4>
              {items.length === 0 && <p>Your cart is empty.</p>}
              {items.map((item, index) => (
                <div className="product-item" key={index}>
                  <img className="product-image" src={item.image} alt={item.name} />
                  <div className="product-details">
                    <p className="product-name">{item.name}</p>
                    {item.color && <p className="product-attribute">Color: {item.color}</p>}
                    {item.size && <p className="product-attribute">Size: {item.size}</p>}
                    <p className="product-price">₱{item.price.toFixed(2)}</p>
                  </div>
                  <div className="quantity-control">
                    <button className="qty-btn-left" onClick={() => handleQuantityChange(index, -1)}>-</button>
                    <span className="qty-number">{item.quantity}</span>
                    <button className="qty-btn-right" onClick={() => handleQuantityChange(index, 1)}>+</button>
                  </div>
                </div>
              ))}
              <div className="order-summary-bottom">
                <div className="voucher-section">
                  <input 
                    type="text" 
                    className="voucher-input" 
                    placeholder="Voucher / Code" 
                  />
                  <button className="btn-voucher">Apply</button>
                </div>
              <div className="summary-line">
                <span>Subtotal</span>
                <span>₱{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="summary-line">
                <span>Shipping</span>
                <span>₱{shipping.toFixed(2)}</span>
              </div>
              <div className="summary-line total">
                <span>Total</span>
                <span>₱{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <button   className={`btn-confirm-order ${!selectedPayment ? "btn-disabled" : ""}`} onClick={handleConfirmOrder} disabled={!selectedPayment}>Confirm Order</button>
            </div>
          </div>
        </div>
        </div>

        {/* Payment Section */}
        <div className="payment-section">
          <div className="checkout-card">
            <h5 className="section-title">Mode of Payment</h5>
            <div className="payment-options">
              {["cod", "card", "gcash", "maya"].map(method => (
                <div className="payment-option" key={method}>
                  <input
                    className="payment-radio"
                    type="radio"
                    name="paymentMethod"
                    id={method}
                    checked={selectedPayment === method}
                    onChange={() => setSelectedPayment(method)}
                  />
                  <label className="payment-label" htmlFor={method}>
                    {method === "cod" ? "Cash on Delivery" :
                     method === "card" ? "Credit/Debit Card" : method.toUpperCase()}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ORDER COMPLETED MODAL */}
      {showOrderCompleted && (
        <div className="order-complete-overlay">
          <div className="order-complete-card">
            <div className="order-complete-img"></div>
            <p className="order-label">ORDER</p>
            <p className="order-number">#{Math.floor(Math.random() * 900000) + 100000}</p>
            <h2 className="order-title">Thank you, {userDetails.name || "Customer"}!</h2>
            <p className="order-subtitle">Your order is on the way.</p>
            <div className="order-details">
              <div className="detail-row"><span>Order Date</span><span>{new Date().toLocaleDateString()}</span></div>
              <div className="detail-row"><span>Customer ID</span><span>{user_id}</span></div>
              <div className="detail-row"><span>Total Items</span><span>{items.reduce((acc, item) => acc + item.quantity, 0)}</span></div>
              <div className="detail-row"><span>Total Amount</span><span className="total-amount">₱{total.toLocaleString()}</span></div>
            </div>
            <div className="order-footer">
              <button className="order-btn" onClick={() => { setShowOrderCompleted(false); navigate("/"); }}>Continue Shopping</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
