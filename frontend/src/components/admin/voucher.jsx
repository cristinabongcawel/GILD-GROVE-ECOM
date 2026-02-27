// AdminVouchers.jsx - React Component
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Sidebar from "./sidebar";
import Header from "./header";
import { FaRegCopy } from "react-icons/fa";
import "./voucher.css";
import "./admin-layout.css";

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [actionDropdown, setActionDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const dropdownRef = useRef(null);

  // Form States
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    minPurchase: "",
    maxDiscount: "",
    usageLimit: "",
    unlimited: false,
    startDate: "",
    endDate: "",
    status: "Active"
  });

  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success"
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Fetch vouchers
  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const res = await axios.get("http://localhost:8800/api/voucher/retrieve-all-vouchers");
      setVouchers(res.data.vouchers || []);
      console.log("DEBUG: ", res.data.vouchers); 
    } catch (err) {
      console.error("Failed to fetch vouchers:", err);
      setVouchers([]);
    }
  };

  // Get voucher status
  const getVoucherStatus = (voucher) => {
    const now = new Date();
    const start = new Date(voucher.start_date);
    const end = new Date(voucher.end_date);

    if (voucher.status === "Inactive") return "inactive";
    if (now < start) return "upcoming";
    if (now > end) return "expired";
    return "active";
  };

  // Filter vouchers
  const filteredVouchers = vouchers.filter(v => {
  const status = getVoucherStatus(v);

  if (status === "inactive") return false;
  if (activeTab === "active") return status === "active";
  if (activeTab === "expired") return status === "expired";

  // "all" tab → active + expired + upcoming
  return true;
});


  // Pagination
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);
  const currentVouchers = filteredVouchers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle form input
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Generate random voucher code
  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleInputChange("code", code);
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.code || !formData.discountValue) {
      showNotification("Voucher code and discount value are required.", "error");
      return;
    }

    try {
      if (editingVoucher) {
        await axios.put(
          `http://localhost:8800/api/voucher/update-voucher/${editingVoucher.id}`,
          formData
        );
        showNotification(`Voucher "${formData.code}" updated successfully!`);
      } else {
        await axios.post("http://localhost:8800/api/voucher/insert-voucher", formData);
        showNotification(`Voucher "${formData.code}" created successfully!`);
      }

      setShowModal(false);
      resetForm();
      fetchVouchers();
    } catch (err) {
      console.error("Failed to save voucher:", err);
      showNotification("Failed to save voucher.", "error");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      code: "",
      discountType: "percentage",
      discountValue: "",
      minPurchase: "",
      maxDiscount: "",
      usageLimit: "",
      unlimited: false,
      startDate: "",
      endDate: "",
      status: "Active"
    });
    setEditingVoucher(null);
  };

  const handleEdit = (voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      discountType: voucher.discount_type,
      discountValue: voucher.discount_value,
      minPurchase: voucher.min_purchase || "",
      maxDiscount: voucher.max_discount || "",
      usageLimit: voucher.usage_limit || "",
      unlimited: !voucher.usage_limit,
      startDate: voucher.start_date ? voucher.start_date.split("T")[0] : "",
      endDate: voucher.end_date ? voucher.end_date.split("T")[0] : "",
      status: voucher.status
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    const voucherToDelete = vouchers.find(v => v.id === id);
    if (!voucherToDelete) return;

    if (!window.confirm(`Are you sure you want to delete voucher "${voucherToDelete.code}"?`)) return;

    try {
      await axios.delete(`http://localhost:8800/api/voucher/delete/${id}`);
      setVouchers(prev => prev.filter(v => v.id !== id));
      showNotification(`Voucher "${voucherToDelete.code}" deleted successfully!`);
    } catch (err) {
      console.error("Failed to delete voucher:", err);
      showNotification("Failed to delete voucher.", "error");
    }
  };

  // Toggle status
  const toggleStatus = async (voucher) => {
    try {
      const newStatus = voucher.status === "Active" ? "Inactive" : "Active";
      await axios.put(`http://localhost:8800/api/voucher/update-status/${voucher.id}`, {
        status: newStatus
      });
      setVouchers(prev => prev.map(v =>
        v.id === voucher.id ? { ...v, status: newStatus } : v
      ));
      showNotification(`Voucher "${voucher.code}" ${newStatus.toLowerCase()} successfully!`);
    } catch (err) {
      console.error("Failed to toggle status:", err);
      showNotification("Failed to change voucher status.", "error");
    }
  };

  // Copy code to clipboard
  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    showNotification(`Code "${code}" copied to clipboard!`, "info");
  };

  const expiredCount = vouchers.filter(v => getVoucherStatus(v) === "expired").length;
  const upcomingCount = vouchers.filter(v => getVoucherStatus(v) === "upcoming").length;

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
        <h2 className="page-title">Vouchers</h2>

        {/* Notification */}
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

        {/* Top Actions */}
        <div className="top-actions">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Vouchers
            </button>
            <button
              className={`tab ${activeTab === "upcoming" ? "active" : ""}`}
              onClick={() => setActiveTab("upcoming")}
            >
              Upcoming {upcomingCount > 0 && <span className="badge-count">{upcomingCount}</span>}
            </button>
            <button
              className={`tab ${activeTab === "expired" ? "active" : ""}`}
              onClick={() => setActiveTab("expired")}
            >
              Expired {expiredCount > 0 && <span className="badge-count">{expiredCount}</span>}
            </button>
          </div>

          <div className="right-actions">
            <button className="btn add" onClick={() => setShowModal(true)}>
              + Add Voucher
            </button>
          </div>
        </div>

       {/* Table */}
<div className="voucher-table-card">
  <table className="voucher-table-clean">
    <thead>
      <tr>
        <th>Code</th>
        <th>Type</th>
        <th>Discount</th>
        <th>Usage</th>
        <th>Validity</th>
        <th>Status</th>
        <th></th>
      </tr>
    </thead>

    <tbody>
      {currentVouchers.length > 0 ? (
        currentVouchers.map((v) => {
          const status = getVoucherStatus(v);

          return (
            <tr key={v.id}>
              {/* CODE */}
              <td>
                <div className="code-cell">
                  <span className="code-text">{v.code}</span>
                  <button
                    className="code-copy-btn"
                    onClick={() => copyCode(v.code)}
                    title="Copy code"
                  >
                    <FaRegCopy />
                  </button>
                </div>
              </td>

              {/* TYPE */}
              <td>
                <span className={`type-pill ${v.discount_type}`}>
                  {v.discount_type === "percentage" && "Percentage"}
                  {v.discount_type === "fixed" && "Fixed"}
                  {v.discount_type === "free_shipping" && "Free Shipping"}
                </span>
              </td>

              {/* DISCOUNT */}
              <td className="discount-cell">
                {v.discount_type === "percentage"
                  ? `${v.discount_value}%`
                  : `₱${v.discount_value}`}
              </td>

              {/* USAGE */}
              <td>
                <span className="usage-text">
                  {v.used_count || 0} / {v.usage_limit || "∞"}
                </span>
              </td>

              {/* DATE */}
              <td>
                <div className="date-cell">
                  <span>{new Date(v.start_date).toLocaleDateString()}</span>
                  <span className="date-separator">→</span>
                  <span>{new Date(v.end_date).toLocaleDateString()}</span>
                </div>
              </td>

              {/* STATUS */}
              <td>
                <span className={`status-pill ${status}`}>
                  {status}
                </span>
              </td>

              {/* ACTIONS */}
              <td className="action-col">
                <div className="action-wrapper" ref={dropdownRef}>
                  <button
                    className="action-btn"
                    onClick={() =>
                      setActionDropdown(
                        actionDropdown === v.id ? null : v.id
                      )
                    }
                  >
                    •••
                  </button>

                  {actionDropdown === v.id && (
                    <div className="action-menu">
                      <button onClick={() => handleEdit(v)}>Edit</button>
                      <button onClick={() => toggleStatus(v)}>
                        {v.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => handleDelete(v.id)}>
                        Delete
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
          <td colSpan="7" className="empty-state">
            No vouchers available
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>


        {/* Pagination */}
        <div className="pagination-controls">
          <button
            onClick={() => setCurrentPage(prev => prev - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages || 1}</span>
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="voucher-modal-overlay" role="dialog" aria-modal="true">
          <div className="voucher-modal">
            <div className="voucher-modal-header">
              <h2>{editingVoucher ? "Edit Voucher" : "Create New Voucher"}</h2>
            </div>

            <div className="voucher-modal-body">
              {/* Voucher Code */}
              <div className="voucher-form-group">
                <label>Voucher Code *</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="e.g. SAVE20"
                    value={formData.code}
                    onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                    style={{ flex: 1 }}
                  />
                  <button className="btn add" onClick={generateCode}>
                    Generate
                  </button>
                </div>
                <span className="help-text">Use uppercase letters and numbers only</span>
              </div>

              {/* Discount Type */}
              <div className="voucher-form-group">
                <label>Discount Type *</label>
                <div className="discount-type-selector">
                  <div
                    className={`discount-type-option ${formData.discountType === "percentage" ? "selected" : ""}`}
                    onClick={() => handleInputChange("discountType", "percentage")}
                  >
                    <div className="discount-type-label">Percentage %</div>
                  </div>
                  <div
                    className={`discount-type-option ${formData.discountType === "fixed" ? "selected" : ""}`}
                    onClick={() => handleInputChange("discountType", "fixed")}
                  >
                    <div className="discount-type-label">Fixed Amount ₱</div>
                  </div>
                 <div
                    className={`discount-type-option ${formData.discountType === "free_shipping" ? "selected" : ""}`}
                    onClick={() => handleInputChange("discountType", "free_shipping")}
                  >
                    <div className="discount-type-label">Free Shipping</div>
                  </div>
                </div>
              </div>

              {/* Discount Value & Conditions */}
              <div className="voucher-form-row">
                <div className="voucher-form-group">
                  <label>Discount Value *</label>
                  <input
                    type="number"
                    placeholder={formData.discountType === "percentage" ? "e.g. 20" : "e.g. 100"}
                    value={formData.discountValue}
                    onChange={(e) => handleInputChange("discountValue", e.target.value)}
                  />
                </div>

                <div className="voucher-form-group">
                  <label>Minimum Purchase</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={formData.minPurchase}
                    onChange={(e) => handleInputChange("minPurchase", e.target.value)}
                  />
                </div>
              </div>

              {/* Max Discount & Usage Limit */}
              <div className="voucher-form-row">
                {formData.discountType === "percentage" && (
                  <div className="voucher-form-group">
                    <label>Maximum Discount (₱)</label>
                    <input
                      type="number"
                      placeholder="e.g. 200"
                      value={formData.maxDiscount}
                      onChange={(e) => handleInputChange("maxDiscount", e.target.value)}
                    />
                  </div>
                )}

                <div className="voucher-form-group">
                  <label>Usage Limit</label>
                  <div className="usage-limit-group">
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={formData.usageLimit}
                      onChange={(e) => handleInputChange("usageLimit", e.target.value)}
                      disabled={formData.unlimited}
                    />
                    <div className="checkbox-wrapper">
                      <input
                        type="checkbox"
                        id="unlimited"
                        checked={formData.unlimited}
                        onChange={(e) => handleInputChange("unlimited", e.target.checked)}
                      />
                      <label htmlFor="unlimited">Unlimited</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="voucher-form-row">
                <div className="voucher-form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                  />
                </div>

                <div className="voucher-form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="voucher-modal-actions">
              <button
                className="voucher-btn-cancel"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button className="voucher-btn-save" onClick={handleSave}>
                {editingVoucher ? "Update Voucher" : "Create Voucher"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}