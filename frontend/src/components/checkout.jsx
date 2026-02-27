import React, { useState, useEffect } from "react"; 
import "./checkout.css";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import locationData from "./location.json";
import { FaTicketAlt, FaCheck, FaTag, FaShippingFast } from "react-icons/fa";

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const user_id = user?.userID;
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [items, setItems] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [showOrderCompleted, setShowOrderCompleted] = useState(false);
  const checkoutSource = location.state?.checkoutSource || "unknown";
  
  // Voucher states
  const [showVouchers, setShowVouchers] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [voucherTypeFilter, setVoucherTypeFilter] = useState("all");
  const [claimedVouchers, setClaimedVouchers] = useState([]);
  const [selectedProductVoucher, setSelectedProductVoucher] = useState(null);
  const [selectedShippingVoucher, setSelectedShippingVoucher] = useState(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherError, setVoucherError] = useState("");
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  useEffect(() => {
    if (location.state?.productVoucher) {
      const voucher = location.state.productVoucher;
      voucher.discount_value = Number(voucher.discount_value || 0);
      voucher.max_discount = Number(voucher.max_discount || 0);
      setSelectedProductVoucher(voucher);
    }
    
    if (location.state?.shippingVoucher) {
      const voucher = location.state.shippingVoucher;
      voucher.discount_value = Number(voucher.discount_value || 0);
      voucher.max_discount = Number(voucher.max_discount || 0);
      setSelectedShippingVoucher(voucher);
    }
  }, [location.state]);

const sanitizeItem = (raw) => ({
  productID: raw.product_id || raw.id || raw.productID || raw._id,
  variantID: raw.variantID ?? raw.variant_id ?? raw.variantId ?? null,
  name: raw.name,
  price: Number(raw?.price ?? raw?.price_string ?? 0),
  quantity: Math.max(1, Math.floor(Number(raw?.quantity ?? 1))),
  image: raw.image || raw.image_url,
  color: raw.color,
  size: raw.size,
  stock: raw.stock ?? 0  // <-- add stock here
});

  // Fetch user details
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

  // Load cart items
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

  // Location data
  useEffect(() => {
    const countryObj = locationData.countries.find(c => c.name === userDetails.country);
    setRegions(countryObj?.regions || []);
  }, [userDetails.country]);

  useEffect(() => {
    const countryObj = locationData.countries.find(c => c.name === userDetails.country);
    const regionObj = countryObj?.regions.find(r => r.name === userDetails.region);
    setCities(regionObj?.cities || []);
  }, [userDetails.region]);

const fetchVouchers = async () => {
  setLoadingVouchers(true);
  try {
    // Fetch all active vouchers
    const activeRes = await axios.get("http://localhost:8800/api/voucher/retrieve-vouchers");
    const allVouchers = activeRes.data.vouchers || [];

    const claimedRes = await axios.get(`http://localhost:8800/api/voucher/my/${user_id}`);
    const claimedVoucherIds = claimedRes.data?.map(v => v.voucherID || v.id) || [];
    setClaimedVouchers(claimedVoucherIds);

    const unclaimedVouchers = allVouchers.filter(v => !claimedVoucherIds.includes(v.id || v.voucherID));
    setVouchers(unclaimedVouchers);

  } catch (err) {
    console.error("Error fetching vouchers:", err);
    setVouchers([]);  // fallback
    setClaimedVouchers([]);
  } finally {
    setLoadingVouchers(false);
  }
};

  const handleVoucherClick = () => {
    setShowVouchers(true);
    setVoucherError("");
    setVoucherTypeFilter("all");
    fetchVouchers();
  };

  const handleSelectVoucher = (voucher) => {
    if (voucher.discount_type === 'free_shipping') {
      setSelectedShippingVoucher(voucher);
    } else {
      setSelectedProductVoucher(voucher);
    }
    setShowVouchers(false);
    setVoucherError("");
  };

  const handleEnterVoucherCode = () => {
    const matched = vouchers.find(v => v.code.toUpperCase() === voucherCode.toUpperCase());
    if (!matched) {
      setVoucherError("Invalid voucher code");
      return;
    }
    handleSelectVoucher(matched);
    setVoucherCode("");
  };

  const removeProductVoucher = () => {
    setSelectedProductVoucher(null);
  };

  const removeShippingVoucher = () => {
    setSelectedShippingVoucher(null);
  };

  // Format currency helper
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "₱0";
    return `₱${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  };

  // Calculate product discount
  const calculateProductDiscount = (subtotal, voucher) => {
    if (!voucher || !subtotal || voucher.discount_type === 'free_shipping') return 0;
    
    let discount = 0;

    if (voucher.discount_type === "percentage") {
      discount = (subtotal * Number(voucher.discount_value || 0)) / 100;
      if (voucher.max_discount && discount > Number(voucher.max_discount)) {
        discount = Number(voucher.max_discount);
      }
    } else if (voucher.discount_type === "fixed") {
      discount = Number(voucher.discount_value || 0);
    }

    return isNaN(discount) ? 0 : discount;
  };

  // Calculate shipping discount
  const calculateShippingDiscount = (shipping, voucher) => {
    if (!voucher || voucher.discount_type !== 'free_shipping') return 0;
    
    if (voucher.discount_type === 'free_shipping') {
      return shipping; // Free shipping means full shipping discount
    }
    return 0;
  };

  const subtotal = items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 0), 0);
  const shipping = 50; // Example shipping fee
  const productDiscount = calculateProductDiscount(subtotal, selectedProductVoucher);
  const shippingDiscount = calculateShippingDiscount(shipping, selectedShippingVoucher);
  const totalDiscount = productDiscount + shippingDiscount;
  const totalWithDiscount = Math.max(0, subtotal + shipping - totalDiscount);

  const handleQuantityChange = (index, change) => {
  setItems(prev => {
    const updated = [...prev];
    const item = { ...updated[index] };
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) return updated; // min 1
    if (item.stock && newQuantity > item.stock) return updated; // max stock
    item.quantity = newQuantity;
    updated[index] = item;
    return updated;
  });
};

const handleConfirmOrder = async () => {
try {
    setSubmitting(true);

    // Validate stock before placing the order
    for (const item of items) {
      if (item.stock !== undefined && item.quantity > item.stock) {
        alert(`❌ Insufficient stock for "${item.name}". Available: ${item.stock}`);
        setSubmitting(false);
        return; // Stop the order
      }
    }

    const fullDeliveryAddress = `
      ${userDetails.address || ""} 
      ${userDetails.city || ""}, ${userDetails.region || ""} 
      ${userDetails.zip || ""} 
      ${userDetails.country || ""}
    `.replace(/\s+/g, ' ').trim();

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
      total_amount: totalWithDiscount,
      delivery_name: userDetails.name,
      delivery_phone: userDetails.phone,
      delivery_email: userDetails.email,
      delivery_address: fullDeliveryAddress,
      product_voucher_code: selectedProductVoucher?.code || null,
      shipping_voucher_code: selectedShippingVoucher?.code || null
    };

    
    // Place the order first
    const response = await axios.post(
      "http://localhost:8800/api/order/place-order",
      orderPayload
    );
    console.log("Order Response:", response.data);

    const orderID = response.data.orderID; // make sure backend returns orderID

    console.log("Claiming voucher:", selectedShippingVoucher);
      if (selectedProductVoucher) {
      // Claim product voucher if not already claimed
      await axios.post("http://localhost:8800/api/voucher/claim", {
        userID: user_id,
        code: selectedProductVoucher.code
      });

      // Use product voucher
      await axios.post("http://localhost:8800/api/voucher/use", {
        userID: user_id,
        voucherID: selectedProductVoucher.voucherID || selectedProductVoucher.id,
        orderID: orderID,
        discount: productDiscount
      });
    }

    if (selectedShippingVoucher) {
      // Claim shipping voucher if not already claimed
      await axios.post("http://localhost:8800/api/voucher/claim", {
        userID: user_id,
        code: selectedShippingVoucher.code
      });

      // Use shipping voucher
      await axios.post("http://localhost:8800/api/voucher/use", {
        userID: user_id,
        voucherID: selectedShippingVoucher.voucherID || selectedShippingVoucher.id,
        orderID: orderID,
        discount: shippingDiscount
      });
    }

    
    
    // Remove purchased items from cart
    if (checkoutSource === "cart") {
      await axios.post("http://localhost:8800/api/order/remove-purchased", {
        userID: user_id,
        items: items,
        checkoutSource
      });
        window.dispatchEvent(new Event("cartUpdated"));
    }
    setShowOrderCompleted(true);

  } catch (error) {
    console.error("❌ Error placing order:", error);
  } finally {
    setSubmitting(false);
  }
};

// Filter vouchers by type and exclude already claimed ones
const filteredVouchers = vouchers
  .filter(voucher => {
    const voucherId = voucher.id || voucher.voucherID;
    // Exclude already claimed vouchers
    if (claimedVouchers.includes(voucherId)) return false;

    // Filter by type
    if (voucherTypeFilter === "all") return true;
    if (voucherTypeFilter === "shipping") return voucher.discount_type === 'free_shipping';
    if (voucherTypeFilter === "product") return voucher.discount_type === 'percentage' || voucher.discount_type === 'fixed';
    
    return true;
  });

  // Get voucher type label
  const getVoucherTypeLabel = (voucher) => {
    if (voucher.discount_type === 'free_shipping') {
      return "Shipping Voucher";
    } else if (voucher.discount_type === 'percentage') {
      return "Percentage Discount";
    } else if (voucher.discount_type === 'fixed') {
      return "Fixed Amount Discount";
    }
    return "Voucher";
  };

// Check if subtotal meets voucher's minimum purchase
const isVoucherEligible = (voucher) => {
  if (!voucher || !voucher.min_purchase) return true; // no min requirement
  return subtotal >= Number(voucher.min_purchase);
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
                    <p className="product-price">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="quantity-control">
                    <button className="qty-btn-left" onClick={() => handleQuantityChange(index, -1)}>-</button>
                    <span className="qty-number">{item.quantity}</span>
                    <button className="qty-btn-right" onClick={() => handleQuantityChange(index, 1)}>+</button>
                  </div>
                </div>
              ))}
              
              <div className="order-summary-bottom">
                {/* Compact Voucher Trigger Section */}
                <div className="compact-voucher-trigger">
                  <div className="voucher-trigger-mini" onClick={handleVoucherClick}>
                    <FaTicketAlt className="voucher-trigger-icon-mini" />
                    <span className="voucher-trigger-text-mini">
                      {selectedProductVoucher || selectedShippingVoucher 
                        ? "Vouchers Applied" 
                        : "Apply Voucher"}
                    </span>
                    <span className="voucher-trigger-arrow">›</span>
                  </div>
                  
                  {/* Voucher warning */}
                  {selectedProductVoucher && !isVoucherEligible(selectedProductVoucher) && (
                    <div className="voucher-warning">
                      ⚠ Minimum purchase of {formatCurrency(selectedProductVoucher.min_purchase)} required to use this voucher.
                    </div>
                  )}

                  {/* Selected vouchers */}
                  <div className="selected-vouchers-list-mini">
                    {selectedProductVoucher && (
                      <div
                        className={`selected-voucher-mini product ${!isVoucherEligible(selectedProductVoucher) ? 'disabled' : ''}`}
                      >
                        <div className="selected-voucher-info-mini">
                          <FaTag className="voucher-type-icon-mini" />
                          <span className="selected-voucher-desc-mini">
                            {selectedProductVoucher.code} - 
                            {selectedProductVoucher.discount_type === 'percentage' 
                              ? ` ${selectedProductVoucher.discount_value}% off`
                              : ` ${formatCurrency(selectedProductVoucher.discount_value)} off`}
                          </span>
                          {isVoucherEligible(selectedProductVoucher) && (
                            <button className="remove-voucher-mini" onClick={removeProductVoucher}>×</button>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedShippingVoucher && (
                      <div
                        className={`selected-voucher-mini shipping ${!isVoucherEligible(selectedShippingVoucher) ? 'disabled' : ''}`}
                      >
                        <div className="selected-voucher-info-mini">
                          <FaShippingFast className="voucher-type-icon-mini" />
                          <span className="selected-voucher-desc-mini">
                            {selectedShippingVoucher.code} - Free Shipping
                          </span>
                          {isVoucherEligible(selectedShippingVoucher) && (
                            <button className="remove-voucher-mini" onClick={removeShippingVoucher}>×</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                <div className="summary-divider"></div>

                <div className="summary-line">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                {selectedProductVoucher && productDiscount > 0 && (
                  <div className="summary-line discount">
                    <span>Product Discount</span>
                    <span>-{formatCurrency(productDiscount)}</span>
                  </div>
                )}
                
                <div className="summary-line">
                  <span>Shipping</span>
                  <span>{formatCurrency(shipping)}</span>
                </div>
                
                {selectedShippingVoucher && shippingDiscount > 0 && (
                  <div className="summary-line discount">
                    <span>Shipping Discount</span>
                    <span>-{formatCurrency(shippingDiscount)}</span>
                  </div>
                )}
                
                <div className="summary-line total">
                  <span>Total</span>
                  <span>{formatCurrency(totalWithDiscount)}</span>
                </div>

                <button 
                  className={`btn-confirm-order ${!selectedPayment ? "btn-disabled" : ""}`} 
                  onClick={handleConfirmOrder} 
                  disabled={!selectedPayment || submitting}
                >
                  {submitting ? "Processing..." : "Confirm Order"}
                </button>
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

      {/* Voucher Modal */}
      {showVouchers && (
        <div className="voucher-overlay" onClick={() => setShowVouchers(false)}>
          <div className="voucher-modal" onClick={(e) => e.stopPropagation()}>
            <div className="voucher-modal-header">
              <h3>Vouchers & Discounts</h3>
              <button className="modal-close-btn" onClick={() => setShowVouchers(false)}>×</button>
            </div>

            {/* Voucher Input */}
            <div className="voucher-input-section">
              <div className="voucher-input-wrapper">
                <input
                  type="text"
                  className="voucher-input"
                  placeholder="Enter voucher code to claim"
                  value={voucherCode}
                  onChange={(e) => {
                    setVoucherCode(e.target.value.toUpperCase());
                    setVoucherError("");
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleEnterVoucherCode()}
                />
              </div>
              {voucherError && (
                <div className="voucher-error">
                  <span>⚠</span> {voucherError}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="voucher-type-tabs">
              <button 
                className={`voucher-tab ${voucherTypeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setVoucherTypeFilter('all')}
              >
                All Vouchers
              </button>
              <button 
                className={`voucher-tab ${voucherTypeFilter === 'product' ? 'active' : ''}`}
                onClick={() => setVoucherTypeFilter('product')}
              >
                <FaTag size={12} /> Product
              </button>
              <button 
                className={`voucher-tab ${voucherTypeFilter === 'shipping' ? 'active' : ''}`}
                onClick={() => setVoucherTypeFilter('shipping')}
              >
                <FaShippingFast size={12} /> Shipping
              </button>
            </div>

            {/* Voucher List Header */}
            <div className="voucher-list-header">
              <h4>Available Vouchers to Claim</h4>
            </div>

            {/* Voucher List */}
            <div className="voucher-list-container">
              {loadingVouchers && (
                <div className="loading-vouchers">
                  <p>Loading vouchers...</p>
                </div>
              )}
              
              {!loadingVouchers && filteredVouchers.length === 0 && (
                <div className="no-vouchers">
                  <FaTicketAlt size={32} style={{ marginBottom: '12px', color: '#ddd' }} />
                  <p>No vouchers available to claim at the moment</p>
                </div>
              )}

              {!loadingVouchers && (
                <div className="voucher-list">
                  {filteredVouchers.map((voucher) => {
                    const isClaimed = claimedVouchers.includes(voucher.id || voucher.voucherID);
                    const isShippingVoucher = voucher.discount_type === 'free_shipping';
                    
                    const isProductSelected = selectedProductVoucher?.id === voucher.id;
                    const isShippingSelected = selectedShippingVoucher?.id === voucher.id;
                    const isSelected = isProductSelected || isShippingSelected;
                    
                    return (
                      <div 
                        key={voucher.id || voucher.voucherID} 
                        className={`voucher-card ${isClaimed ? 'claimed' : ''} ${isShippingVoucher ? 'shipping' : 'product'}`}
                      >
                        {isClaimed && <div className="voucher-selected-check">✓</div>}
                        
                        <div className="voucher-card-header">
                          <div className={`voucher-icon-circle ${isShippingVoucher ? 'shipping' : 'product'}`}>
                            {isShippingVoucher ? (
                              <FaShippingFast className="voucher-card-icon" />
                            ) : (
                              <FaTicketAlt className="voucher-card-icon" />
                            )}
                          </div>
                          
                          <div className="voucher-card-code">
                            <h4>{voucher.code || "VOUCHER"}</h4>
                            <p className="voucher-card-description">
                              {getVoucherTypeLabel(voucher)}
                              {voucher.min_purchase > 0 ? ` • Min. purchase: ${formatCurrency(voucher.min_purchase)}` : ' • No minimum purchase'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="voucher-card-body">
                          <div className="voucher-details-row">
                            <span className={`voucher-discount-badge ${isShippingVoucher ? 'shipping' : 'product'}`}>
                              {isShippingVoucher ? '🚚 ' : '🏷️ '}
                              {voucher.discount_type === 'percentage' 
                                ? `${voucher.discount_value || 0}% OFF` 
                                : voucher.discount_type === 'free_shipping'
                                ? 'FREE SHIPPING'
                                : `${formatCurrency(voucher.discount_value)} OFF`}
                            </span>
                            {voucher.min_purchase > 0 && (
                              <span className="voucher-min-badge">
                                Min: {formatCurrency(voucher.min_purchase)}
                              </span>
                            )}
                          </div>
                          
                          {voucher.end_date && (
                            <p className="voucher-expiry">
                              <span>⏰</span> Valid until {new Date(voucher.end_date).toLocaleDateString()}
                            </p>
                          )}
                          
                          <button 
                              className={`voucher-claim-btn ${isClaimed ? 'claimed' : ''} ${isShippingVoucher ? 'shipping' : 'product'}`}
                              onClick={() => !isClaimed && handleSelectVoucher(voucher)}
                              disabled={
                                isClaimed || 
                                (isShippingVoucher && selectedShippingVoucher) || 
                                (!isShippingVoucher && selectedProductVoucher) ||
                                (!isShippingVoucher && subtotal < (voucher.min_purchase || 0)) // disable if subtotal too low
                              }
                            >
                              {isClaimed ? (
                                <>
                                  <FaCheck size={12} />
                                  <span>Claimed</span>
                                </>
                              ) : (isShippingVoucher && selectedShippingVoucher) ? (
                                'Shipping Voucher Selected'
                              ) : (!isShippingVoucher && selectedProductVoucher) ? (
                                'Product Voucher Selected'
                              ) : (
                                subtotal < (voucher.min_purchase || 0) ? `Min ${formatCurrency(voucher.min_purchase)}` : 'Claim Voucher'
                              )}
                            </button>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              <div className="detail-row">
                <span>Total Amount</span>
                <span className="total-amount">{formatCurrency(totalWithDiscount)}</span>
              </div>
              {(selectedProductVoucher || selectedShippingVoucher) && (
                <div className="voucher-summary">
                  {selectedProductVoucher && (
                    <div className="detail-row discount">
                      <span>Product Discount</span>
                      <span>{selectedProductVoucher.code} (-{formatCurrency(productDiscount)})</span>
                    </div>
                  )}
                  {selectedShippingVoucher && (
                    <div className="detail-row discount">
                      <span>Shipping Discount</span>
                      <span>{selectedShippingVoucher.code} (-{formatCurrency(shippingDiscount)})</span>
                    </div>
                  )}
                </div>
              )}
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