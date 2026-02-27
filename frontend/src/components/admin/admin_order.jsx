import React, { useState, useEffect } from "react";
import { FiPrinter, FiSearch } from "react-icons/fi"; 
import Sidebar from "./sidebar";
import Header from "./header";
import "./order.css";
import "./admin-layout.css"

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDestination, setFilterDestination] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const rowsPerPage = 6;

  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success"
  });

  // Status configuration
  const ALL_STATUSES = [
    "pending",
    "paid",
    "shipping",
    "completed",
    "refunded",
    "cancelled"
  ];

  // Statuses that cannot be changed once set
  const FINAL_STATUSES = ["completed", "cancelled", "refunded"];
  
  // Statuses that are editable
  const EDITABLE_STATUSES = ["pending", "paid", "shipping"];

  // Replace the STATUS_TRANSITIONS object with this correct version:
  const STATUS_TRANSITIONS = {
    pending: ["pending", "shipping"],  // Can stay pending, become paid, or be cancelled
    shipping: ["shipping"],        // Can stay shipping or become completed
    completed: ["completed"],                    // Cannot be changed from completed
    refunded: ["refunded"],                     // Cannot be changed from refunded
    cancelled: ["cancelled"]                    // Cannot be changed from cancelled
};
  // Priority for sorting
  const STATUS_PRIORITY = {
    pending: 1,
    shipping: 2,
    paid: 3,
    completed: 4,
    refunded: 5,
    cancelled: 6,
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const showNotification = (message, type = "success") => {
    setNotification({
      show: true,
      message,
      type
    });
    
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Get available status options for a specific order
  const getAvailableStatuses = (currentStatus) => {
    // If status is final, return only the current status
    if (FINAL_STATUSES.includes(currentStatus)) {
      return [currentStatus];
    }
    
    // Return allowed transitions based on current status
    return STATUS_TRANSITIONS[currentStatus] || ALL_STATUSES;
  };

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      const matchesDate = filterDate ? order.date === filterDate : true;
      const matchesStatus = filterStatus ? order.status === filterStatus : true;
      const matchesDestination = filterDestination
        ? order.destination.toLowerCase().includes(filterDestination.toLowerCase())
        : true;
      return matchesDate && matchesStatus && matchesDestination;
    })
    .filter(order => {
      const query = searchQuery ? searchQuery.toLowerCase() : "";
      return order.order_number.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      return STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    });

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredOrders.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterStatus, filterDestination, searchQuery]);

  // Fetch orders
  useEffect(() => {
    fetch("http://localhost:8800/api/admin/adminorder/order-history")
      .then((res) => res.json())
      .then((data) => {
        setOrders(
          data.map((o) => ({
            id: o.orderID,
            order_number: o.order_number,
            date: o.created_at.split("T")[0],
            user_id: o.userID,
            destination: o.delivery_address,
            items: o.products.length,
            status: o.status,
            products: o.products.map((p) => ({
              name: p.name,
              info: `Qty: ${p.quantity} | Price: ₱${p.price}`,
              image: p.image_url || null,
            })),
          }))
        );
        showNotification("Orders loaded successfully!", "success");
      })
      .catch((err) => {
        console.error(err);
        showNotification("Failed to load orders.", "error");
      });
  }, []);

  const handleSelect = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const handlePrintSelected = async () => {
    if (selectedOrders.length === 0) {
      showNotification("Please select at least one order to print.", "info"); 
      return;
    }
    const ids = selectedOrders.join(",");

    try {
      const res = await fetch(
        `http://localhost:8800/api/admin/adminorder/waybill?ids=${ids}`
      );

      if (!res.ok) {
        showNotification("Failed to generate PDF.", "error");
        console.error("Failed to generate PDF");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      showNotification(`Waybill for ${selectedOrders.length} order(s) generated successfully!`, "success");

    } catch (err) {
      console.error("Error printing waybill:", err);
      showNotification("Error generating waybill.", "error");
    }
  };

  const handleStatusChange = async (orderID, newStatus) => {
    const orderToUpdate = orders.find(order => order.id === orderID);
    if (!orderToUpdate) return;

    const oldStatus = orderToUpdate.status;
    
    // Validate if status transition is allowed
    const allowedStatuses = getAvailableStatuses(oldStatus);
    if (!allowedStatuses.includes(newStatus)) {
      showNotification(`Cannot change status from ${oldStatus} to ${newStatus}`, "error");
      return;
    }
    
    // Optimistic update
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderID ? { ...order, status: newStatus } : order
      )
    );

    try {
      const response = await fetch(
        `http://localhost:8800/api/admin/adminorder/update-order/${orderID}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      showNotification(`Order #${orderToUpdate.order_number} status updated from ${oldStatus} to ${newStatus}`, "success");
    } catch (err) {
      console.error("Failed to update status:", err);
      
      // Revert optimistic update on error
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderID ? { ...order, status: oldStatus } : order
        )
      );
      
      showNotification(`Failed to update order status: ${err.message}`, "error");
    }
  };

  // Helper function to format status for display
  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="admin-page">
      <Sidebar 
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
        toggleSidebar={toggleSidebar}
      />
      <div className="admin-content">
        <Header 
          toggleSidebar={toggleSidebar}
          isSidebarCollapsed={sidebarCollapsed}
        />
        <h2 className="page-title">Order</h2>
        <div className="orders-container">
          {/* Notification Display */}
          {notification.show && (
            <div className={`notification notification-${notification.type}`}>
              <div className="notification-content">
                <span className="notification-icon">
                  {notification.type === "success" ? "✅" : 
                  notification.type === "error" ? "❌" : "ℹ️"}
                </span>
                <span className="notification-message">{notification.message}</span>
              </div>
              <button 
                className="notification-close"
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              >
                ×
              </button>
            </div>
          )}
          
          <div className="toolbar">
            <div className="search-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search Order Number"
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filters">
              <input 
                type="date" 
                value={filterDate} 
                onChange={(e) => setFilterDate(e.target.value)} 
              />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                {ALL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </select>
            </div>
            <div className="actions-order">
              <button
                className="btn primary-order"
                disabled={selectedOrders.length === 0}
                onClick={handlePrintSelected}
              >
                <FiPrinter style={{ marginRight: "6px" }} />
                Print WayBill
              </button>
            </div>
          </div>

          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>SELECT</th>
                  <th>ORDER NUMBER</th>
                  <th>DATE</th>
                  <th>CUSTOMER ID</th>
                  <th>DESTINATION</th>
                  <th>ITEMS</th>
                  <th>STATUS</th>
                  <th>EXPAND</th>
                </tr>
              </thead>

              <tbody>
                {currentRows.map((order) => {
                  const availableStatuses = getAvailableStatuses(order.status);
                  const isFinalStatus = FINAL_STATUSES.includes(order.status);
                  
                  return (
                    <React.Fragment key={order.id}>
                      <tr className="order-row">
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => handleSelect(order.id)}
                          />
                        </td>
                        <td className="blue-link">{order.order_number}</td>
                        <td>{order.date}</td>
                        <td>{order.user_id}</td>
                        <td>{order.destination}</td>
                        <td>{order.items}</td>
                        <td>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`status-select ${order.status}`}
                            disabled={isFinalStatus}
                          >
                            {availableStatuses.map((status) => (
                              <option key={status} value={status}>
                                {formatStatus(status)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {order.products.length > 0 && (
                            <button
                              className="dropdown-btn"
                              onClick={() => toggleRow(order.id)}
                            >
                              {expandedRows[order.id] ? "▲" : "▼"}
                            </button>
                          )}
                        </td>
                      </tr>

                      {expandedRows[order.id] && (
                        <tr className="details-row">
                          <td></td>
                          <td colSpan={7}>
                            <div className="details-wrapper">
                              {order.products.map((prod, index) => (
                                <div className="detail-item" key={index}>
                                  {prod.image ? (
                                    <img
                                      src={prod.image}
                                      alt={prod.name}
                                      className="item-img"
                                    />
                                  ) : (
                                    <div className="item-img placeholder"></div>
                                  )}
                                  <div>
                                    <p>{prod.name}</p>
                                    <span>{prod.info}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pagination-controls">
            <button onClick={prevPage} disabled={currentPage === 1}>
              Previous
            </button>
            <span>
              Page {currentPage} of {Math.ceil(filteredOrders.length / rowsPerPage)}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage === Math.ceil(filteredOrders.length / rowsPerPage)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}