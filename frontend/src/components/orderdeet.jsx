import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import io from "socket.io-client";
import "./deets.css";
import { FaArrowLeft } from "react-icons/fa";

const OrderWithMap = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  const markerRef = useRef(null);
  const socket = useRef(null);

  // Fetch Order Data
  useEffect(() => {
    fetch(`http://localhost:8800/api/tracking/orders/${orderId}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data);
        if (data.currentLocation) setCurrentPos(data.currentLocation);
      })
      .catch(err => console.error(err));
  }, [orderId]);

  // Live WebSocket updates
  useEffect(() => {
    socket.current = io(`http://localhost: 8800`);
    socket.current.emit("join:order", orderId);

    socket.current.on("location:update", data => {
      if (data.current) setCurrentPos(data.current);
    });

    return () => socket.current.disconnect();
  }, [orderId]);

  // Close cancel modal automatically if order status changes
  useEffect(() => {
    const status = order?.status?.toLowerCase().trim();
    if (["shipping", "out_for_delivery", "completed", "cancelled", "refunded"].includes(status)) {
      setShowCancelModal(false);
    }
  }, [order]);

  if (!order) return <p>Loading Order...</p>;

  if (!order) return <p>Loading Order...</p>;

  const status = order.status?.toLowerCase().trim();
  const isRefunded = status === "refunded";


  // Driver Pin
  const DriverIcon = new L.DivIcon({
    html: `<div class="driver-pin"></div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // Step Indicator
  const steps = ["Order Received", "Picked Up", "In Sorting", "Out for Delivery", "Delivered"];
  const stepStatusMap = {
    pending: 0,
    paid: 1,
    shipping: 2,
    out_for_delivery: 3,
    completed: 4,
    cancelled: 5,
  };
  const stepIndex = stepStatusMap[status] ?? 0;
  const isCancelled = status === "cancelled";

  // Handle Cancel Submission
  const handleCancelSubmit = () => {
    const reason = cancelReason === "others" ? otherReason : cancelReason;
    if (!reason) return alert("Please select a reason");

    fetch(`http://localhost:8800/api/tracking/orders/${orderId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    })
      .then(res => res.json())
      .then(() => {
        alert("Order cancelled successfully");
        setShowCancelModal(false);
        navigate(-1);
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="order-container">

      <h2 className="order-title">Order #{order.order_number || order.id}</h2>

      {/* Step Tracker */}
        <div className={`steps ${(isCancelled || isRefunded) ? 'cancelled-flow' : ''}`}>
          {steps.map((stepName, i) => {
            let stepClass = "";
            
            if (isCancelled || isRefunded) {
              // All steps inactive if cancelled or refunded
              stepClass = "inactive";
            } else if (i <= stepIndex) {
              stepClass = "active";
            }

            return (
              <div key={i} className={`step ${stepClass}`}>
                <div className="circle">{i + 1}</div>
                {i < steps.length - 1 && <div className="step-line" />}
                <p>{stepName}</p>
              </div>
            );
          })}

          {/* Show special end step */}
          {isCancelled && (
            <div className="step cancelled">
              <div className="circle">x</div>
              <p>Order Cancelled</p>
            </div>
          )}
          {isRefunded && (
            <div className="step refunded">
              <div className="circle">✔</div>
              <p>Refunded</p>
            </div>
          )}
        </div>

      {/* Order Info */}
      <div className="details-section">
        <div className="detail-box">
          <h4>Order Details</h4>
          <p><b>Status:</b> {order.status}</p>
          <p><b>Address:</b> {order.delivery.address}</p>
          <p><b>Email:</b> {order.delivery.email}</p>
        </div>
        <div className="detail-box">
          <h4>Customer Info</h4>
          <p><b>Name:</b> {order.customer.name}</p>
          <p><b>Email:</b> {order.customer.email}</p>
          <p><b>Phone:</b> {order.customer.phone}</p>
        </div>
      </div>

      {/* Order Items */}
      <table className="item-table">
        <thead>
          <tr>
            <th>#</th><th>Product</th><th>Image</th><th>Price</th><th>Qty</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={item.id}>
              <td>{i + 1}</td>
              <td>{item.name}</td>
              <td><img src={item.image_url} className="item-img"/></td>
              <td>₱{item.price}</td>
              <td>{item.quantity}</td>
              <td><b>₱{item.price * item.quantity}</b></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Map */}
      <div className="map-container">
        <MapContainer center={currentPos || [14.5995,120.9842]} zoom={15} style={{ height: 350, width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
          {currentPos && (
            <Marker position={currentPos} icon={DriverIcon} ref={markerRef}>
              <Popup>Driver Location</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Cancel Button (Conditional) */}
      {!["shipping", "out_for_delivery", "completed", "cancelled"].includes(status) && (
        <div className="cancel-order-container">
          <button className="cancel-btn" onClick={() => setShowCancelModal(true)}>Cancel Order</button>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="cancel-overlay">
          <div className="cancel-modal animate-modal">
            <button className="modal-close-x" onClick={() => setShowCancelModal(false)}>×</button>
            <h3 className="modal-title">Cancel Order</h3>
            <p className="modal-sub">Please select a reason for cancellation:</p>

            <div className="cancel-options">
              {[{ label: "Price", value: "price" },
                { label: "Change of Address", value: "change_of_address" },
                { label: "Change of Mind", value: "change_of_mind" },
                { label: "Others", value: "others" },
              ].map(opt => (
                <label key={opt.value} className="cancel-label">
                  <input type="radio" name="cancelReason" value={opt.value} checked={cancelReason === opt.value} onChange={(e) => setCancelReason(e.target.value)} />
                  {opt.label}
                </label>
              ))}

              {cancelReason === "others" && (
                <input type="text" placeholder="Please specify your reason" className="cancel-input" value={otherReason} onChange={(e) => setOtherReason(e.target.value)} />
              )}
            </div>

            <div className="cancel-actions">
              <button className="confirm-btn" onClick={handleCancelSubmit}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderWithMap;
