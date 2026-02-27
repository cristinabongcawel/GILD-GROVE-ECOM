import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OrderTabs.css";
import { FaCreditCard, FaShippingFast, FaTruck, FaBoxOpen, FaCheckCircle, FaStar, FaChevronRight} from "react-icons/fa";
import UserSidebar from "./usersidebar";
import axios from "axios";
const statusFilters = [
  { key: "all", label: "ALL ORDERS" },
  { key: "toPay", label: "TO PAY" },
  { key: "toShip", label: "TO SHIP" },
  { key: "toReceive", label: "TO RECEIVE" },
  { key: "cancelled", label: "CANCELLED" },
  { key: "rate", label: "RATE & REVIEW" },
];

export default function OrderTabs() {
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState("toPay");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const [showCardModal, setShowCardModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [otpInput, setOtpInput] = useState(""); 
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [phoneInput, setPhoneInput] = useState(""); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [writeRating, setWriteRating] = useState(0);
  const [comment, setComment] = useState("");
  const [image, setImage] = useState(null);
  const [purchasedVariants, setPurchasedVariants] = useState([]);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundOrder, setRefundOrder] = useState(null);
  const [selectedRefundItem, setSelectedRefundItem] = useState(null);

  const ITEMS_PER_PAGE = 6;

const storedUser = (() => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
})();
const user_id = storedUser?.id;
const token = localStorage.getItem("token");


useEffect(() => {
    if (!storedUser) return;

    const fetchOrders = async () => {
      try {
        const res = await axios.get(`http://localhost:8800/api/ordercustomer/customer-orders/${storedUser.userID}`);
              console.log("[DEBUG] Fetched orders:", res.data);
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setOrders([]);
      }
    };

    fetchOrders();
  }, [storedUser]);

const mapStatus = (orderOrProduct) => {
  // If it's a product with refundStatus
  if (orderOrProduct.refundStatus) {
    switch (orderOrProduct.refundStatus.toLowerCase()) {
      case "pending":
        return "refundPending";
      case "approved":
      case "refunded":
        return "refunded";  // <-- new status
      case "rejected":
      case "cancelled":
        return "refundRejected";
    }
  }

  // Otherwise, treat as order
  const status = (orderOrProduct.status || "").toLowerCase();
  const payment_method = (orderOrProduct.payment_method || "").toLowerCase();

  if (payment_method === "cod" && status === "pending") return "toShip";

  switch (status) {
    case "pending": return "toPay";
    case "paid": return "toShip";
    case "shipping": return "toReceive";
    case "cancelled": return "cancelled";
    case "completed": return "completed";
    case "refunded": return "refunded";  // <-- new status
    default: return status || "toPay";
  }
};


const filteredOrders =
  activeFilter === "all"
    ? [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    : orders.filter(order => {
        if (activeFilter === "rate") {
          // Only completed orders with unreviewed products
          return order.status.toLowerCase() === "completed" &&
                 order.products.some(p => !p.reviewed);
        }

        const status = mapStatus(order);
        return status === activeFilter;
      });

const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

const paginatedOrders = filteredOrders.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);
useEffect(() => {
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }
}, [filteredOrders, totalPages, currentPage]);


  const getStatusColor = (status) => {
    const colors = {
      toPay: "#e74c3c",
      toShip: "#3498db",
      toReceive: "#f39c12",
      cancelled: "#95a5a6",
      completed: "#2ecc71",
      rate: "#9b59b6",
      refunded: "#4a0c2cff", // purple for refunded

    };
    return colors[status] || "#999";
  };

  const getStatusIcon = (status) => {
    const icons = {
      toPay: <FaCreditCard />,
      toShip: <FaShippingFast />,
      toReceive: <FaTruck />,
      cancelled: <FaCheckCircle />,
      completed: <FaCheckCircle />,
      rate: <FaStar />,
      refunded: <FaCheckCircle />, 
    };
    return icons[status] || <FaBoxOpen />;
  };

  const getActionLabel = (status) => {
    const actions = {
      toPay: "PAY NOW",
      toShip: "PENDING",
      toReceive: "COMPLETED",
      cancelled: "CANCELED",
      completed: "COMPLETED",
      rate: "RATE NOW",
    };
    return actions[status] || "VIEW DETAILS";
  };

  const handleRefund = (order) => {
  setRefundOrder({
    orderID: order.orderID,
    order_number: order.order_number,
    products: order.products
  });

  // default to first item
  setSelectedRefundItem(order.products?.[0]?.orderItemID || null);

  setRefundReason("");
  setRefundModalOpen(true);
};


const submitRefund = async () => {
  if (!refundReason.trim()) return alert("Please provide a reason for refund.");

  try {
    const res = await axios.post(
      `http://localhost:8800/api/refund/refund/${refundOrder.orderID}`,
      { 
        reason: refundReason, 
        userID: storedUser.userID, 
        orderItemID: selectedRefundItem
      },
      { headers: { "Content-Type": "application/json" } }
    );

    if (res.data.success) {
      alert("Refund requested successfully!");
      setOrders(prev =>
        prev.map(o => ({
          ...o,
         products: o.products.map(p =>
          p.orderItemID === selectedRefundItem
            ? { ...p, isRefunded: true, refundStatus: "pending" }
            : p
        )
        }))
      );
      console.log("Refund order submitted:", refundOrder);
      console.log("Updated orders state:", orders);
      setRefundModalOpen(false);
      setRefundOrder(null);
      setRefundReason("");
    } else {
      alert(res.data.message || "Failed to request refund.");
    }
  } catch (err) {
    console.error(err);
    alert("Error requesting refund.");
  }
};
  
  const openPaymentModal = (order) => {
    if (!order) return;
    const status = mapStatus(order);
    if (status !== "toPay") return;

    setSelectedOrder(order);
    const total = (order.products || []).reduce(
      (sum, p) => sum + parseFloat(p.price || 0) * (p.quantity || 1),
      0
    );
    setPaymentAmount(total);

    const method = (order.payment_method || "").toLowerCase();
    if (method === "gcash" || method === "maya") setShowWalletModal(true);
    else setShowCardModal(true);
  };

   const handleCardPayClick = async () => {
    if (!selectedOrder) return;
    try {
      await axios.post(`http://localhost:8800/api/ordercustomer/card-pay/${selectedOrder.orderID}`);
      setShowCardModal(false);
      alert("Payment processed successfully!");
      setOrders(prev =>
        prev.map(o => o.orderID === selectedOrder.orderID ? { ...o, status: "paid" } : o)
      );
      setSelectedOrder(null);
    } catch (err) {
      console.error("Card payment failed:", err);
      alert("Failed to process card payment.");
    }
  };

  const handleWalletProceed = async () => {
    if (!selectedOrder || !phoneInput) return alert("Enter your phone number");
    try {
      await axios.post(
        `http://localhost:8800/api/ordercustomer/send-otp/${selectedOrder.orderID}`,
        { phone: phoneInput },
        { headers: { "Content-Type": "application/json" } }
      );
      setShowWalletModal(false);
      setShowOtpModal(true);
    } catch (err) {
      console.error("Wallet OTP failed:", err);
      alert("Failed to send OTP.");
    }
  };

  const confirmOtpPayment = async () => {
    if (!selectedOrder) return alert("No order selected");
    if (otpInput.length !== 4) return alert("Enter the 4-digit OTP");
    if (!phoneInput) return alert("Phone number missing");

    try {
      const res = await axios.post(
        `http://localhost:8800/api/ordercustomer/confirm-otp/${selectedOrder.orderID}`,
        { otp: otpInput, phone: phoneInput },
        { headers: { "Content-Type": "application/json" } }
      );
      const data = res.data;
      if (data.success) {
        alert(data.message || "Payment confirmed!");
        setOrders(prev =>
          prev.map(o => o.orderID === selectedOrder.orderID ? { ...o, status: "paid" } : o)
        );
        closeAllModals();
      } else alert(data.message || "OTP verification failed.");
    } catch (err) {
      console.error("OTP verification failed:", err);
      alert("OTP verification failed.");
    }
  };

  useEffect(() => {
    document.body.style.overflow = showCardModal || showWalletModal || showOtpModal ? "hidden" : "auto";
  }, [showCardModal, showWalletModal, showOtpModal]);

  const closeAllModals = () => {
    setShowCardModal(false);
    setShowWalletModal(false);
    setShowOtpModal(false);
    setSelectedOrder(null);
    setOtpInput("");
    setPhoneInput("");
  };

  const maskPhoneNumber = (phone) => {
    if (!phone || phone.length < 6) return phone;
    const firstTwo = phone.slice(0, 2);
    const lastFour = phone.slice(-4);
    const masked = "*".repeat(phone.length - 6);
    return `${firstTwo}${masked}${lastFour}`;
  };

  const formatCurrency = (n) =>
    Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

  const handleCompleteOrder = async (order) => {
    if (!order) return;
    try {
      const res = await axios.post(`http://localhost:8800/api/ordercustomer/complete-order/${order.orderID}`);
      const data = res.data;
      if (data.success) {
        alert(data.message || "Order marked as completed!");
        setOrders(prev =>
          prev.map(o => o.orderID === order.orderID ? { ...o, status: "completed" } : o)
        );
      } else {
        alert(data.message || "Failed to complete order.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to complete order.");
    }
  };

  const handleOrderAgain = (order) => {
    if (!order || !order.products) return;

    const itemsToCheckout = order.products.map(item => {
      let variantID = null;
      let size = "";

      // Use backend returned fields
      if (item.variantID != null) {
        variantID = Number(item.variantID);
        size = item.size || "";
      }

      return {
        productID: item.productID || item.product_id,
        variantID,
        name: item.name || item.product_name,
        price: Number(item.price || 0),
        quantity: item.quantity || item.order_quantity || 1,
        image: item.image || item.image_url || item.variants?.[0]?.image_url || "/placeholder.png",
        size,
      };
    });

    navigate("/checkout", {
      state: {
        checkoutSource: "orderAgain",
        items: itemsToCheckout
      }
    });
  };

const openReviewModal = (order) => {
  if (!order || !order.products || order.products.length === 0) return;

  // Flatten all variants for all products
  const variants = order.products.flatMap((p) =>
    (p.variants || [{ id: p.variantID, variant: p.size || p.name }]).map((v) => ({
      id: v.id,
      variant: v.variant || v.volume || p.size || `Variant ${v.id}`,
      productID: p.productID,
    }))
  );

  setPurchasedVariants(variants);
  setSelectedProduct(order.products[0]); // default to first product
  setSelectedVariant(variants[0]?.id || null); // default first variant
  setSelectedOrder(order); // now this works
  setIsModalOpen(true);
};

// Helper function to convert File to Base64
const toBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

  const handleSubmitReview = async () => {
  if (writeRating === 0 || comment.trim() === "") {
    alert("Please provide rating and comment.");
    return;
  }

  let base64Image = null;
  if (image) {
    try {
      base64Image = await toBase64(image);
    } catch (err) {
      console.error("Failed to convert image to Base64:", err);
      return;
    }
  }

  const payload = {
    productID: selectedProduct?.productID,
    orderID: selectedOrder?.orderID, // make sure this exists
    userID: storedUser.userID,
    rating: writeRating,
    comment,
    image_url: base64Image,
    variantID: selectedVariant,
};
  console.log(payload)

  try {
    await axios.post(
      "http://localhost:8800/api/reviews/insert-review",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    alert("Review submitted!");

    // Reset modal inputs
    setWriteRating(0);
    setComment("");
    setImage(null);
    setIsModalOpen(false);

  } catch (err) {
    console.error("Error submitting review:", err.response || err);
    alert("Failed to submit review");
  }
};
const getOrderRefundStatus = (order) => {
  if (!order.products || order.products.length === 0) return "none";

  if (order.products.some(p => p.refundStatus === "pending")) {
    return "pending";
  }

  if (order.products.every(p =>
    p.refundStatus === "approved" || p.refundStatus === "refunded"
  )) {
    return "refunded";
  }

  return "available";
};

  return (
      <div className="user-page-container">
      <UserSidebar />
    <div className="user-content-area">
       <div className="order-tabs-container">
                {/* Status Filters Tabs */}
        <div className="status-filters">
          {statusFilters.map(filter => (
            <button
              key={filter.key}
              className={`status-filter-btn ${activeFilter === filter.key ? "active" : ""}`}
              onClick={() => { setActiveFilter(filter.key); setCurrentPage(1); }}
            >
              <span className="filter-icon">{getStatusIcon(filter.key)}</span>
              <span>{filter.label}</span>
              <span className="filter-count"> {filter.key === "all" ? orders.length : filter.key === "rate"? orders.filter(o => 
                        o.status.toLowerCase() === "completed" &&
                        o.products.some(p => !p.reviewed)
                      ).length
                    : orders.filter(o => mapStatus(o) === filter.key).length
                }
              </span>
            </button>
          ))}
        </div>

          <div className="orders-list">
        {paginatedOrders.map(order => (
          <div key={order.orderID} className="order-card compact">
            <div className="order-left">
              <img src={order.products?.[0]?.image_url || "/placeholder.png"} alt="product" className="order-thumb"/>
            </div>
            <div className="order-right">
              <div className="order-header-min">
                <div className="order-title-min">{order.products?.[0]?.name}</div>
                <div className="order-meta-min">{order.order_number} • {order.created_at ? new Date(order.created_at).toLocaleDateString() : ""}</div>
                <div className="order-price-min">
                  ₱{(order.products || []).reduce((sum, p) => sum + parseFloat(p.price || 0) * (p.quantity || 1), 0).toLocaleString()}
                </div>
              </div>
              <div className="order-actions-min">
                  {mapStatus(order) === "toPay" && (
                    <button
                      className="pay-btn"
                      style={{ backgroundColor: getStatusColor("toPay") }}
                      onClick={() => openPaymentModal(order)}
                    >
                      {getActionLabel("toPay")}
                    </button>
                  )}

                  {mapStatus(order) === "toReceive" && (
                    <button
                      className="pay-btn"
                      style={{ backgroundColor: getStatusColor("toReceive") }}
                      onClick={() => handleCompleteOrder(order)}
                    >
                      {getActionLabel("toReceive")}
                    </button>
                  )}

                  {mapStatus(order) === "toShip" && (
                    <button
                      className="pay-btn"
                      style={{ backgroundColor: getStatusColor("toShip") }}
                      disabled
                    >
                      {getActionLabel("toShip")}
                    </button>
                  )}
                  {["completed", "cancelled", "refunded"].includes(mapStatus(order))&& (
                    <div className="order-actions-buttons">
                      <button
                        className="order-again-btn"
                        onClick={() => handleOrderAgain(order)}
                      >
                        ORDER AGAIN
                      </button>

                      {order.products.some(p => !p.reviewed) && mapStatus(order) === "completed" && (
                        <button
                          className="review-btn"
                          onClick={() => openReviewModal(order)}
                        >
                          REVIEW NOW
                        </button>
                      )}

                      {(() => {
                        const refundStatus = getOrderRefundStatus(order);

                        if (refundStatus === "refunded") {
                          return (
                            <button
                              className="refund-btn"
                              disabled
                              style={{ backgroundColor: "#000000ff" }}
                            >
                              REFUNDED
                            </button>
                          );
                        }
                        if (refundStatus === "pending") {
                          return (
                            <button
                              className="refund-btn"
                              disabled
                              style={{ backgroundColor: "#f39c12" }}
                            >
                              REFUND PENDING
                            </button>
                          );
                        }
                        return (
                          <button
                            className="refund-btn"
                            style={{ backgroundColor: "#e74c3c" }}
                            onClick={() => handleRefund(order)}
                          >
                            REQUEST REFUND
                          </button>
                        );
                      })()}
                    </div>
                  )}

                  {mapStatus(order) === "rate" && (
                    <button
                      className="pay-btn"
                      style={{ backgroundColor: getStatusColor("rate") }}
                      onClick={() => openReviewModal(order)} // <-- use the helper
                    >
                      {getActionLabel("rate")}
                    </button>
                  )}
                  <button className="details-btn" onClick={() => navigate(`/order/${order.orderID}`)}>
                    VIEW DETAILS <FaChevronRight size={12}/>
                  </button>
                </div>
            </div>
          </div>
        ))}
        {paginatedOrders.length === 0 && <div className="no-orders">No orders found.</div>}
      </div>

          {paginatedOrders.length > 0 && totalPages > 1 && (
            <div className="pagination-container">
              <button
                onClick={() => setCurrentPage(prev => prev - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}


          {/* Modals remain unchanged */}
          {showCardModal && selectedOrder && (
            <div className="pay-modal-backdrop" onClick={closeAllModals}>
              <div className="payment-modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <div className="modal-sub">PAYMENT</div>
                    <div className="modal-title">{(selectedOrder.payment_method || "Card").toUpperCase()}</div>
                  </div>
                </div>
                <div className="payment-divider"/>
                <div className="payment-total-row">
                  <div className="small-label">TOTAL</div>
                  <div className="total-amount">₱ {formatCurrency(paymentAmount)}</div>
                </div>
                <label className="payment-label">Card number</label>
                <input className="payment-input" placeholder="1234 5678 9012 3456"/>
                <label className="payment-label">Cardholder name</label>
                <input className="payment-input" placeholder="JOHN DOE"/>
                <div className="payment-two-columns">
                  <div className="payment-column">
                    <label className="payment-label">Expiry</label>
                    <input className="payment-input" placeholder="MM / YY"/>
                  </div>
                  <div className="payment-column">
                    <label className="payment-label">CVV</label>
                    <input className="payment-input" placeholder="123"/>
                  </div>
                </div>
                <div className="payment-btn-row">
                  <button className="payment-cancel-btn" onClick={closeAllModals}>Cancel</button>
                  <button className="payment-submit-btn" onClick={handleCardPayClick}>Confirm</button>
                </div>
              </div>
            </div>
          )}

          {showWalletModal && selectedOrder && (
            <div className="pay-modal-backdrop" onClick={closeAllModals}>
              <div className="wallet-modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <div className="modal-sub">WALLET PAYMENT</div>
                    <div className="modal-title">{(selectedOrder.payment_method || "GCash").toUpperCase()}</div>
                  </div>
                </div>
                <div className="payment-divider"/>
                <div className="payment-total-row">
                  <div className="small-label">TOTAL</div>
                  <div className="total-amount">₱ {formatCurrency(paymentAmount)}</div>
                </div>
                <label className="payment-label">Phone number</label>
                <input className="payment-input" placeholder="09xxxxxxxxx" value={phoneInput} onChange={e => setPhoneInput(e.target.value)}/>
                <div className="payment-btn-row">
                  <button className="payment-cancel-btn" onClick={closeAllModals}>Cancel</button>
                  <button className="payment-submit-btn" onClick={handleWalletProceed}>Proceed</button>
                </div>
              </div>
            </div>
          )}

          {showOtpModal && selectedOrder && (
            <div className="pay-modal-backdrop" onClick={closeAllModals}>
              <div className="pay-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <div className="modal-sub">OTP VERIFICATION</div>
                    <div className="modal-title">Confirm Payment</div>
                  </div>
                </div>
                <div className="payment-divider"/>
                <p className="muted">Enter the 4-digit code sent to {maskPhoneNumber(phoneInput)}.</p>
                <div className="otp-inputs">
                  {[0,1,2,3].map(i => (
                    <input key={i} type="text" maxLength={1} className="otp-box"
                      value={otpInput[i] || ""}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g,"");
                        const newOtp = otpInput.split("");
                        newOtp[i] = val;
                        setOtpInput(newOtp.join(""));
                        if (val && i < 3) document.getElementById(`otp-${i+1}`)?.focus();
                        else if (!val && i > 0) document.getElementById(`otp-${i-1}`)?.focus();
                      }}
                      id={`otp-${i}`}
                    />
                  ))}
                </div>
                <div className="payment-btn-row">
                  <button className="payment-cancel-btn" onClick={closeAllModals}>Cancel</button>
                  <button className="payment-submit-btn" onClick={confirmOtpPayment}>Confirm</button>
                </div>
              </div>
            </div>
          )}

          {isModalOpen && (
              <div className="review-modal-backdrop">
                <div className="review-modal">

                  <h3>Write a Review</h3>

                  {/* Variant Select */}
                  <label className="modal-label">Select Variant:</label>
                  <select className="review-filter-dropdown" value={selectedVariant || ""} onChange={(e) => setSelectedVariant(Number(e.target.value))}>
                    {purchasedVariants.length > 0 ? (
                      purchasedVariants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.variant}
                        </option>
                      ))
                    ) : (
                      <option value="">No variants available</option>
                    )}
                  </select>

                  {/* STARS */}
                  <div className="write-stars">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <FaStar
                        key={num}
                        className="write-star"
                        onClick={() => setWriteRating(num)}
                        style={{ opacity: num <= writeRating ? 1 : 0.2 }}
                      />
                    ))}
                  </div>

                  <textarea
                    className="write-textarea"
                    placeholder="Share your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />

                  {/* FILE UPLOAD */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) setImage(file);
                    }}
                  />

                  {image && (
                    <div className="selected-image-wrapper">
                      <span>{image.name}</span>
                      <button
                        className="remove-image-btn"
                        onClick={() => setImage(null)}
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* BUTTONS */}
                 <div className="modal-buttons">
                    <button className="cancel-review-btn" onClick={() => {
                        setIsModalOpen(false);
                        setWriteRating(0);
                        setComment("");
                        setImage(null);
                        setSelectedVariant(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button className="submit-review-btn" onClick={handleSubmitReview}>
                      Submit
                    </button>
                  </div>

                </div>
              </div>
          )}

       </div>
      </div>
      {/* Refund Modal */}
        {refundModalOpen && refundOrder && (
          <div className="pay-modal-backdrop" onClick={() => setRefundModalOpen(false)}>
            <div className="refund-modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div className="modal-sub">REFUND REQUEST</div>
                  <div className="modal-title">Order #{refundOrder.order_number}</div>
                </div>
              </div>
              
              <div className="payment-divider" />
            <label className="payment-label">Item</label>
              <select
                  value={selectedRefundItem || ""}
                  onChange={(e) => setSelectedRefundItem(Number(e.target.value))}
                >
                    {refundOrder.products.map(p => (
                      <option key={p.orderItemID} value={p.orderItemID}>
                        {p.name} ({p.size})
                      </option>
                    ))}
                  </select>
              <label className="payment-label">Reason for Refund</label>
              <textarea
                className="payment-input"
                placeholder="Describe why you want a refund..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />

              <div className="payment-btn-row">
                <button className="payment-cancel-btn" onClick={() => setRefundModalOpen(false)}>Cancel</button>
                <button className="payment-submit-btn" onClick={submitRefund}>Submit</button>
              </div>
            </div>
          </div>
        )}

    </div>
  );
}