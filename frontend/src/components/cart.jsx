import React, { useEffect, useState } from "react";
import "./cart.css";
import { FaTrash, FaTicketAlt, FaCheck, FaTag, FaShippingFast } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Cart({ closeCart }) {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState({});
  const [showVouchers, setShowVouchers] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [voucherTypeFilter, setVoucherTypeFilter] = useState("all");
  const [selectedProductVoucher, setSelectedProductVoucher] = useState(null);
  const [selectedShippingVoucher, setSelectedShippingVoucher] = useState(null);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [claimedVouchers, setClaimedVouchers] = useState([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherError, setVoucherError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const user_id = user?.userID;

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

   // Calculate if all items are selected
  const allSelected = cartItems.length > 0 && 
    cartItems.every(item => {
      // Only consider in-stock items for select all
      if (item.stock === 0) return true; // Skip out of stock items in calculation
      return selectedItems[item.cart_id];
    });

  // Calculate if some items are selected (for indeterminate state)
  const someSelected = cartItems.some(item => selectedItems[item.cart_id]) && !allSelected;

  // Handle Select All
  const handleSelectAll = () => {
    const newSelectedItems = { ...selectedItems };
    const inStockItems = cartItems.filter(item => item.stock > 0);
    
    if (allSelected) {
      // If all are selected, deselect all
      inStockItems.forEach(item => {
        newSelectedItems[item.cart_id] = false;
      });
    } else {
      // If not all selected, select all in-stock items
      inStockItems.forEach(item => {
        newSelectedItems[item.cart_id] = true;
      });
    }
    
    setSelectedItems(newSelectedItems);
  };

const fetchVouchers = async () => {
  setLoadingVouchers(true);
  try {
    // Fetch all active vouchers
    const activeRes = await axios.get(
      `http://localhost:8800/api/voucher/retrieve-vouchers`
    );

    // Fetch vouchers the user already claimed
    const claimedRes = await axios.get(
      `http://localhost:8800/api/voucher/my/${user_id}`
    );

    const activeVouchers = activeRes.data.vouchers || [];
    const claimedVoucherIds = claimedRes.data?.map(v => v.voucherID || v.id) || [];
    setClaimedVouchers(claimedVoucherIds);

    // Filter out claimed vouchers from active vouchers
    const availableVouchers = activeVouchers.filter(v => 
      !claimedVoucherIds.includes(v.id || v.voucherID)
    );

    setVouchers(availableVouchers);

  } catch (err) {
    console.error("Error fetching vouchers:", err);
    setVouchers([]);
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

  const handleEnterCode = () => {
    const matched = vouchers.find(v => v.code.toUpperCase() === voucherCode.toUpperCase());
    if (!matched) {
      setVoucherError("Invalid voucher code");
      return;
    }
    handleSelectVoucher(matched);
    setVoucherCode("");
  };

  const handleSelectVoucher = (voucher) => {
    // Use discount_type from backend to determine voucher type
    if (voucher.discount_type === 'free_shipping') {
      setSelectedShippingVoucher(voucher);
    } else {
      setSelectedProductVoucher(voucher);
    }
    setShowVouchers(false);
    setVoucherError("");
  };

  const removeProductVoucher = () => {
    setSelectedProductVoucher(null);
  };

  const removeShippingVoucher = () => {
    setSelectedShippingVoucher(null);
  };

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

const updateQuantity = async (cart_id, variant_id, newQty) => {
  if (newQty < 1) {
    try {
      await axios.delete(`http://localhost:8800/api/cart/remove/${cart_id}`);
      setCartItems(cartItems.filter((item) => item.cart_id !== cart_id));
      window.dispatchEvent(new Event("cartUpdated"));
      setSelectedItems(prev => {
        const copy = { ...prev };
        delete copy[cart_id];
        return copy;
      });
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
    return;
  }

  try {
    await axios.put("http://localhost:8800/api/cart/update", { 
      cart_id, 
      variant_id, 
      quantity: newQty 
    });
    setCartItems(
      cartItems.map((item) =>
        item.cart_id === cart_id ? { ...item, quantity: newQty } : item
      )
    );
    window.dispatchEvent(new Event("cartUpdated"));
  } catch (err) {
    console.error("Failed to update quantity:", err);
  }
};

  const toggleSelect = (cart_id) => {
    setSelectedItems(prev => ({ ...prev, [cart_id]: !prev[cart_id] }));
  };

  // Handle checkout - pass both vouchers to checkout
  const handleCheckout = () => {
    if (!token || !user_id) {
      navigate("/login");
      return;
    }

    const itemsToCheckout = cartItems.filter(item => selectedItems[item.cart_id]);
    if (itemsToCheckout.length === 0) return;

    closeCart();
    navigate("/checkout", { 
      state: { 
        checkoutSource: "cart", 
        items: itemsToCheckout,
        productVoucher: selectedProductVoucher,
        shippingVoucher: selectedShippingVoucher
      } 
    });
  };

  // Calculate product discount
  const calculateProductDiscount = (subtotal, voucher) => {
    if (!voucher || !subtotal || voucher.discount_type === 'free_shipping') return 0;
    
    let discount = 0;
    
    if (voucher.discount_type === 'percentage') {
      discount = (subtotal * (voucher.discount_value || 0)) / 100;
      if (voucher.max_discount && discount > voucher.max_discount) {
        discount = voucher.max_discount;
      }
    } else if (voucher.discount_type === 'fixed') {
      discount = voucher.discount_value || 0;
    }
    
    return discount;
  };

  // Calculate shipping discount
  const calculateShippingDiscount = (shipping, voucher) => {
    if (!voucher || voucher.discount_type !== 'free_shipping') return 0;
    
    if (voucher.discount_type === 'free_shipping') {
      return shipping; // Free shipping means full shipping discount
    }
    return 0;
  };

  // Calculate totals with safe defaults
  const subtotal = cartItems.reduce(
    (acc, item) => selectedItems[item.cart_id] ? acc + (item.price || 0) * (item.quantity || 1) : acc,
    0
  );

  const shipping = 50; // Example shipping fee
  const productDiscount = calculateProductDiscount(subtotal, selectedProductVoucher);
  const shippingDiscount = calculateShippingDiscount(shipping, selectedShippingVoucher);
  const totalDiscount = productDiscount + shippingDiscount;
  const total = Math.max(0, subtotal + shipping - totalDiscount);

  // Format currency safely
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "₱0";
    return `₱${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  };

 const filteredVouchers = Array.isArray(vouchers) 
  ? vouchers.filter(voucher => {
      if (voucherTypeFilter === "all") return true;
      if (voucherTypeFilter === "shipping") return voucher.discount_type === 'free_shipping';
      if (voucherTypeFilter === "product") return ['percentage','fixed'].includes(voucher.discount_type);
      return true;
    }) 
  : [];

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

  const sortedCartItems = [...cartItems].sort((a, b) => {
  const aOut = a.stock === 0;
  const bOut = b.stock === 0;

  if (aOut && !bOut) return 1;
  if (!aOut && bOut) return -1;

  return b.cart_id - a.cart_id;
});



  return (
    <>
      <div className="cart-overlay">
        <div className="cart-container">
          <div className="cart-header">
            <h2>Shopping Cart</h2>
            <button className="close-btn" onClick={closeCart}>×</button>
          </div>

          <div className="cart-content">
            {loading && <p className="empty-message">Loading cart...</p>}
            {!loading && cartItems.length === 0 && (
              <div className="empty-cart">
                <p className="empty-message">Your cart is empty</p>
                <p className="empty-sub">Add items to get started</p>
              </div>
            )}

            {/* SELECT ALL CHECKBOX - ADDED HERE */}
            {!loading && cartItems.length > 0 && (
              <div className="select-all-container">
                <div className="select-all-checkbox">
                  <input
                    type="checkbox"
                    id="select-all"
                    className="select-all-input"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = someSelected;
                      }
                    }}
                    onChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="select-all-label">
                    {allSelected ? "Deselect All" : "Select All"}
                  </label>
                </div>
                <div className="selected-count">
                  {Object.values(selectedItems).filter(Boolean).length} item(s) selected
                </div>
              </div>
            )}

              {!loading && cartItems.length > 0 &&
                  sortedCartItems.map((item) => {
                    const isOutOfStock = item.stock === 0;
                    const isLowStock = item.stock > 0 && item.stock <= 5;
                    return (
                      <div key={item.cart_id} className={`cart-item ${isOutOfStock ? 'out-of-stock' : ''}`}>
                        <div className="item-selector">
                          <input
                            type="checkbox"
                            className="select-item"
                            checked={!!selectedItems[item.cart_id]}
                            onChange={() => toggleSelect(item.cart_id)}
                            disabled={isOutOfStock}
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
                            <p className="item-name">{item.name || "Product"}</p>
                            <p className="item-price">{formatCurrency(item.price)}</p>
                          </div>

                          <div className="item-details">
                            <span className="item-badge">{item.volume || "Default"}</span>
                            {isLowStock && <span className="stock-warning">⚠ Only {item.stock} left!</span>}
                            {isOutOfStock && <span className="stock-out">Out of Stock</span>}
                          </div>

                          <div className="item-actions">
                            <div className="qty-box">
                              {/* MINUS BUTTON - Always enabled (except out of stock) */}
                              <button
                                className="qty-btn"
                                onClick={() => {
                                  const newQty = (item.quantity || 1) - 1;
                                  updateQuantity(item.cart_id, item.variant_id, newQty);
                                }}
                                disabled={isOutOfStock} // Only disable if completely out of stock
                              >
                                -
                              </button>

                              <div className="qty-display">{item.quantity || 1}</div>

                              {/* PLUS BUTTON - Disable when quantity reaches stock limit */}
                            <button
                              className="qty-btn"
                              onClick={() => {
                                const newQty = (item.quantity || 1) + 1;
                                updateQuantity(item.cart_id, item.variant_id, newQty);
                              }}
                              disabled={
                                isOutOfStock || // Disable if out of stock
                                (Number(item.quantity || 1) >= Number(item.stock || 0)) // OR quantity >= available stock
                              }
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
                    );
                  })
                }
            </div>

          <div className="cart-summary">
            {/* Compact Voucher Trigger Section - Same as checkout */}
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
              
              {(selectedProductVoucher || selectedShippingVoucher) && (
                <div className="selected-vouchers-list-mini">
                  {selectedProductVoucher && (
                    <div className="selected-voucher-mini product">
                      <div className="selected-voucher-info-mini">
                        <FaTag className="voucher-type-icon-mini" />
                        <span className="selected-voucher-desc-mini">
                          {selectedProductVoucher.code} - 
                          {selectedProductVoucher.discount_type === 'percentage' 
                            ? ` ${selectedProductVoucher.discount_value}% off`
                            : ` ${formatCurrency(selectedProductVoucher.discount_value)} off`}
                        </span>
                        <button className="remove-voucher-mini" onClick={removeProductVoucher}>×</button>
                      </div>
                    </div>
                  )}
                  
                  {selectedShippingVoucher && (
                    <div className="selected-voucher-mini shipping">
                      <div className="selected-voucher-info-mini">
                        <FaShippingFast className="voucher-type-icon-mini" />
                        <span className="selected-voucher-desc-mini">
                          {selectedShippingVoucher.code} - Free Shipping
                        </span>
                        <button className="remove-voucher-mini" onClick={removeShippingVoucher}>×</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            
            {selectedProductVoucher && productDiscount > 0 && (
              <div className="summary-row discount">
                <span>Product Discount:</span>
                <span>-{formatCurrency(productDiscount)}</span>
              </div>
            )}
            
            <div className="summary-row">
              <span>Shipping:</span>
              <span>{formatCurrency(shipping)}</span>
            </div>
            
            {selectedShippingVoucher && shippingDiscount > 0 && (
              <div className="summary-row discount">
                <span>Shipping Discount:</span>
                <span>-{formatCurrency(shippingDiscount)}</span>
              </div>
            )}
            
            <div className="summary-row total">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
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
                  onKeyPress={(e) => e.key === 'Enter' && handleEnterCode()}
                />
              </div>
              {voucherError && (
                <div className="voucher-error">
                  <span>⚠</span> {voucherError}
                </div>
              )}
            </div>

            {/* Voucher Type Tabs */}
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

              {!loadingVouchers && filteredVouchers.length > 0 && (
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

                        {/* Add minimum purchase warning */}
                        {!isShippingVoucher && subtotal < (voucher.min_purchase || 0) && (
                          <p className="voucher-warning">
                            ⚠ Requires minimum purchase of {formatCurrency(voucher.min_purchase)}
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
                            'Claim Voucher'
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
    </>
  );
}