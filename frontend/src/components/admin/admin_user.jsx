import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./sidebar";
import Header from "./header";
import "./admin-layout.css";
import "./user.css";
import locationData from "../location.json";
export default function AdminUsers() {
  const [customers, setCustomers] = useState([]);
  const [actionDropdown, setActionDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const [spentFilter, setSpentFilter] = useState({ min: "", max: "" });
  const [refunds, setRefunds] = useState([]);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedRefundCustomer, setSelectedRefundCustomer] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Add notification state (same as Products and Orders pages)
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success" // "success", "error", "info"
  });
  const toggleSidebar = () => {
      setSidebarCollapsed(!sidebarCollapsed);
    };

    // Notification function (same as Products and Orders pages)
  const showNotification = (message, type = "success") => {
    setNotification({
      show: true,
      message,
      type
    });
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };
const countries = ["All", ...locationData.countries.map(c => c.name)];

  // Helper for consistent row ID
  const getRowID = (customer) => customer.userID || customer.id;

  useEffect(() => {
    const close = () => setActionDropdown(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

useEffect(() => {
  const fetchCustomers = async () => {
    try {
      const response = await axios.get("http://localhost:8800/api/customer/fetch-all");
      const fetchedCustomers = response.data;
      setCustomers(fetchedCustomers);
      showNotification("Customers loaded successfully!", "success");

      // Collect all customers with pending refunds
      const pendingRefundCustomers = [];

      for (const customer of fetchedCustomers) {
        const uid = customer.userID || customer.id;
        try {
          const refundResponse = await axios.get(
            `http://localhost:8800/api/customer/fetch-refunds/${uid}`
          );
          const customerRefunds = refundResponse.data || [];
          const pendingRefunds = customerRefunds.filter(r => r.status === "pending");
          if (pendingRefunds.length > 0) {
            pendingRefundCustomers.push(`${customer.first_name} ${customer.last_name}`);
          }
        } catch (err) {
          console.error(`Error fetching refunds for ${customer.first_name}:`, err);
        }
      }

      if (pendingRefundCustomers.length > 0) {
        showNotification(
          `Pending refund requests from: ${pendingRefundCustomers.join(", ")}`,
          "info"
        );
      }

    } catch (error) {
      console.error("Error fetching customers:", error);
      showNotification("Failed to load customers.", "error");
    }
  };
  fetchCustomers();
}, []);

  // Stats
  const calculateStats = () => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === "Active").length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
    const avgLTV = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const totalAbandonedCartValue = customers
      .filter(c => c.cart_items?.length > 0)
      .reduce((sum, c) => sum + c.cart_items.reduce((cartSum, item) => cartSum + (item.price * item.quantity), 0), 0);

    return { totalCustomers, activeCustomers, totalRevenue, avgLTV, totalAbandonedCartValue };
  };

  const stats = calculateStats();

  // Utils
  const formatDate = dateString => dateString === "Never" ? "Never" : new Date(dateString).toLocaleDateString();
  const formatCurrency = amount =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  const getStatusColor = (status) => ({
    bg: status === "Active" ? "#e6f4ea" : status === "Inactive" ? "#fdecea" : "#fff4e5",
    color: status === "Active" ? "#1e7f43" : status === "Inactive" ? "#b42318" : "#b54708",
  });

  const calculateCartTotal = cartItems =>
    cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const toggleStatus = async (customer) => {
    try {
      const rowID = getRowID(customer);
      const newStatus = customer.status === "Active" ? "Inactive" : "Active";

      await axios.patch(
        `http://localhost:8800/api/customer/update-status/${rowID}`,
        { status: newStatus }
      );

      // Update the specific customer in state
      setCustomers(prev =>
        prev.map(c => getRowID(c) === rowID ? { ...c, status: newStatus } : c)
      );
      showNotification(`Customer ${customer.first_name} ${customer.last_name} status changed to ${newStatus}`, "success");
    } catch (err) {
      console.error("Error updating status:", err);
      showNotification("Failed to update customer status.", "error");
    }
  };


const acceptRefund = async (refundID) => {
  if (!refundID){
    console.error("refundID is undefined");
    console.error("refundID is undefined");
    return
  }
  try {
    await axios.post(`http://localhost:8800/api/refund/update-status/${refundID}`, {
      status: "approved",
    });

    // Update the local refunds state immediately
    setRefunds((prevRefunds) =>
      prevRefunds.map((refund) =>
        (refund.refundID || refund.id) === refundID
          ? { ...refund, status: "approved" }
          : refund
      )
    );
  showNotification("Refund request approved successfully!", "success");
  } catch (err) {
    console.error("Error accepting refund:", err);
    showNotification("Failed to approve refund request.", "error");
  }
};

  // Open refund modal
  const openRefundModal = async (customer) => {
    try {
      const uid = customer.userID || customer.id;
      const response = await axios.get(
        `http://localhost:8800/api/customer/fetch-refunds/${uid}`
      );

      setRefunds(response.data || []);
      setSelectedRefundCustomer(customer);
      setShowRefundModal(true);
      showNotification(`Loaded refund requests for ${customer.first_name} ${customer.last_name}`, "info");
    } catch (err) {
      console.error("Error fetching refunds:", err);
      showNotification("Failed to load refund requests.", "error");
    }
  };

  // Filter and sort
  const filteredCustomers = customers.filter(customer => {
    const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();

    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm));

    const matchesTab =
      activeTab === "all"
        ? true
        : activeTab === "active"
        ? customer.status === "Active"
        : activeTab === "inactive"
        ? customer.status === "Inactive"
        : customer.status === "Pending";

    const matchesCountry =
      selectedCountry === "All" || customer.country === selectedCountry;

    const joinDate = new Date(customer.join_date);
    const matchesDate =
      (!dateFilter.from || joinDate >= new Date(dateFilter.from)) &&
      (!dateFilter.to || joinDate <= new Date(dateFilter.to));

    const matchesSpent =
      (!spentFilter.min || customer.total_spent >= parseFloat(spentFilter.min)) &&
      (!spentFilter.max || customer.total_spent <= parseFloat(spentFilter.max));

    return matchesSearch && matchesTab && matchesCountry && matchesDate && matchesSpent;
  });

  const sortedCustomers = [...filteredCustomers].sort(
    (a, b) => b.total_spent - a.total_spent
  );

  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
  const currentCustomers = sortedCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const nextPage = () => {
  if (currentPage < Math.ceil(sortedCustomers.length / itemsPerPage)) {
    setCurrentPage(prev => prev + 1);
  }
};

const prevPage = () => {
  if (currentPage > 1) {
    setCurrentPage(prev => prev - 1);
  }
};
useEffect(() => {
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }
}, [sortedCustomers, totalPages, currentPage]);



  return (
    <div className="admin-page">
      <Sidebar />
      <div className="admin-content">
        <Header />
        <div className="admin-content-us">
        <h2 className="page-title">Customer Management</h2>
         {/* Add Notification Display (same as Products and Orders pages) */}
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

        {/* Stats */}
        <div className="user-stats-us">
          <div className="stat-card-us">
            <div className="stat-icon-us">👥</div>
            <div className="stat-content-us">
              <h3>Total Customers</h3>
              <p className="stat-value-us">{stats.totalCustomers}</p>
              <p className="stat-change-us">
                Avg. LTV: {formatCurrency(stats.avgLTV)}
              </p>
            </div>
          </div>

          <div className="stat-card-us">
            <div className="stat-icon-us">💰</div>
            <div className="stat-content-us">
              <h3>Total Revenue</h3>
              <p className="stat-value-us">{formatCurrency(stats.totalRevenue)}</p>
              <p className="stat-change-us">{stats.activeCustomers} active</p>
            </div>
          </div>

          <div className="stat-card-us">
            <div className="stat-icon-us">🛒</div>
            <div className="stat-content-us">
              <h3>Abandoned Carts</h3>
              <p className="stat-value-us">
                {formatCurrency(stats.totalAbandonedCartValue)}
              </p>
              <p className="stat-change-us">Potential revenue</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="advanced-filters-us">
          <h3>Filters</h3>
          <div className="filter-grid-us">
            <div className="filter-group-us">
              <label>Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="filter-group-us">
              <label>Join Date From</label>
              <input
                type="date"
                value={dateFilter.from}
                onChange={(e) =>
                  setDateFilter((prev) => ({ ...prev, from: e.target.value }))
                }
              />
            </div>

            <div className="filter-group-us">
              <label>Join Date To</label>
              <input
                type="date"
                value={dateFilter.to}
                onChange={(e) =>
                  setDateFilter((prev) => ({ ...prev, to: e.target.value }))
                }
              />
            </div>

            <div className="filter-group-us">
              <label>Min Total Spent (₱)</label>
              <input
                type="number"
                placeholder="0"
                value={spentFilter.min}
                onChange={(e) =>
                  setSpentFilter((prev) => ({ ...prev, min: e.target.value }))
                }
              />
            </div>

            <div className="filter-group-us">
              <label>Max Total Spent (₱)</label>
              <input
                type="number"
                placeholder="10000"
                value={spentFilter.max}
                onChange={(e) =>
                  setSpentFilter((prev) => ({ ...prev, max: e.target.value }))
                }
              />
            </div>

            <div className="filter-group-us">
              <button
                className="btn-us filter-clear-us"
                onClick={() => {
                  setSelectedCountry("All");
                  setDateFilter({ from: "", to: "" });
                  setSpentFilter({ min: "", max: "" });
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Customer Table */}
        <div className="table-wrapper-us">
          <table className="user-table-us">
            <thead>
              <tr>
                <th>Customer Profile</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Financial Metrics</th>
                <th>Activity</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {currentCustomers.length > 0 ? (
                currentCustomers.map((customer) => {
                  console.log(customer.profile_image);
                  const rowID = getRowID(customer);
                  const statusColors = getStatusColor(customer.status);

                  return (
                    <tr key={rowID} className={customer.status === "Inactive" ? "inactive-row-us" : ""}>
                      <td>
                        <div className="user-info-us">
                        <div className="user-avatar-us">
                          {customer.profile_image ? (
                            <img
                              src={customer.profile_image}
                              alt="Profile"
                              className="avatar-img-us"
                            />
                          ) : (
                            <>
                              {customer.first_name?.charAt(0)}
                              {customer.last_name?.charAt(0)}
                            </>
                          )}
                        </div>
                          <div className="user-details-us">
                            <strong>
                              {customer.first_name} {customer.last_name}
                            </strong>
                            <div className="user-meta-us">
                              <span className="meta-item-us">ID: {rowID}</span>
                              <span className="meta-item-us">
                                Joined: {formatDate(customer.created_at)}
                              </span>
                              <span className="meta-item-us">{customer.country}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="contact-info-us">
                          <div>{customer.email}</div>
                          <div className="phone-us">{customer.phone || "N/A"}</div>
                        </div>
                      </td>

                      <td>
                        <div className="status-cell-us">
                          <label className="switch-us">
                            <input
                              type="checkbox"
                              checked={customer.status === "Active"}
                              onChange={() => toggleStatus(customer)}
                            />
                            <span className="slider-us"></span>
                          </label>
                          <span
                            className="status-badge-us"
                            style={{
                              backgroundColor: statusColors.bg,
                              color: statusColors.color,
                            }}
                          >
                            {customer.status}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="financial-metrics-us">
                          <div className="metric-item-us">
                            <span className="metric-label-us">LTV:</span>
                            <span className="metric-value-us">
                              {formatCurrency(customer.total_spent)}
                            </span>
                          </div>

                          <div className="metric-item-us">
                            <span className="metric-label-us">AOV:</span>
                            <span className="metric-value-us">
                              {formatCurrency(customer.avg_order_value)}
                            </span>
                          </div>

                          <div className="metric-item-us">
                            <span className="metric-label-us">Orders:</span>
                            <span className="metric-value-us">
                              {customer.total_orders}
                            </span>
                          </div>

                          <div className="metric-item-us">
                            <span className="metric-label-us">Refunds:</span>
                            <span className="metric-value-us refund-us">
                              {formatCurrency(customer.total_refunds)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="activity-info-us">
                          <div className="activity-item-us">
                            <span className="activity-label-us">Cart:</span>
                            <span className="activity-value-us">
                              {customer.cart_items?.length || 0} items (
                              {formatCurrency(
                                calculateCartTotal(customer.cart_items || [])
                              )}
                              )
                            </span>
                          </div>

                          <div className="activity-item-us">
                            <span className="activity-label-us">Wishlist:</span>
                            <span className="activity-value-us">
                              {customer.wishlist_items?.length || 0} items
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="actions-cell-us">
                        <div
                          className="action-wrapper-us"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="action-btn-us"
                            onClick={() =>
                              setActionDropdown(
                                actionDropdown === rowID ? null : rowID
                              )
                            }
                          >
                            •••
                          </button>

                          {actionDropdown === rowID && (
                            <div
                              className="action-menu-us"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="menu-item-us"
                                onClick={() => {
                                   setActionDropdown(null);
                                  setTimeout(() => openRefundModal(customer), 0);
                                }}
                              >
                                View Refund Requests
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="no-user-us">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-controls">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={nextPage}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>

        </div>
      </div>
      
      {/* ===== Refund Modal ===== */}
      {showRefundModal && selectedRefundCustomer && (
        <div
          className="detail-modal-overlay-us"
          onClick={() => setShowRefundModal(false)}
        >
          <div
            className="detail-modal-us"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="detail-modal-header-us">
              <h2>
                Refund Requests for {selectedRefundCustomer.first_name}{" "}
                {selectedRefundCustomer.last_name}
              </h2>
              <button
                className="close-btn-us"
                onClick={() => setShowRefundModal(false)}
              >
                ×
              </button>
            </div>

            <div className="refund-list-us">
              {refunds.length > 0 ? (
                refunds.map((refund) => (
                  <div key={refund.refundID || refund.id} className="refund-item-us">
                    <p><strong>Order ID:</strong> {refund.orderID || "N/A"}</p>
                    <p><strong>Status:</strong> {refund.status || "Pending"}</p>
                    <p><strong>Reason:</strong> {refund.reason || "N/A"}</p>

                    {refund.status === "approved" ? (
                            <span className="approved-indicator-us">✔ Approved</span>
                          ) : (
                            <button
                              className="btn-us"
                              onClick={() => acceptRefund(refund.refundID || refund.id)}
                            >
                              Accept Refund
                            </button>
                    )}
                  </div>
                ))
              ) : (
                <p>No refund requests found.</p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
