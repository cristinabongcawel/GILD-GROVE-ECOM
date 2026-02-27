import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Sidebar from "./sidebar";
import Header from "./header";
import "./adminprod.css";
import "./admin-layout.css";
import { FiSearch } from "react-icons/fi"; 
export default function AdminProducts() {
  const [products, setProducts] = useState([]); // fetched products
  const [showModal, setShowModal] = useState(false);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState("Percentage");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [images, setImages] = useState([]);
  const [mainIndex, setMainIndex] = useState(0);
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("all");
  const [actionDropdown, setActionDropdown] = useState(null); // stores product ID whose menu is open
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [expandedRows, setExpandedRows] = useState([]);
  const [variants, setVariants] = useState([
    { volume: "", price: "", stock: "" },
  ]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subCategory, setSubCategory] = useState("");
  const lowStockThreshold = 5; // Adjust as needed
  const warningStockThreshold = 10; // Warning threshold
  const activeCount = products.filter(p => p.status === "Active").length;
  const inactiveCount = products.filter(p => p.status === "Inactive").length;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

   const dropdownRef = useRef(null); 
  // Helper functions
    const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  const getStockStatus = (stock) => {
    if (stock === 0) return { level: "out", label: "Out of Stock", color: "#b42318", bg: "#fdecea" };
    if (stock <= lowStockThreshold) return { level: "critical", label: "Critical", color: "#b42318", bg: "#fdecea" };
    if (stock <= warningStockThreshold) return { level: "warning", label: "Low Stock", color: "#b54708", bg: "#fff4e5" };
    return { level: "healthy", label: "In Stock", color: "#1e7f43", bg: "#e6f4ea" };
  };

  const hasLowStock = (product) => {
  if (product.stock >= 6 && product.stock <= 10) return true;
  
  if (product.variants?.some(v => v.stock >= 6 && v.stock <= 10)) return true;
  
  return false;
};

  const [notification, setNotification] = useState({
      show: false,
      message: "",
      type: "success" // "success", "error", "info"
    });


  // Only count products/variants with stock > 0 for critical stock
  const hasCriticalStock = (product) => {
    if (product.stock > 0 && product.stock <= lowStockThreshold) return true;
    if (product.variants?.some(v => v.stock > 0 && v.stock <= lowStockThreshold)) return true;
    return false;
  };

  function addVariant() {
    setVariants(prev => [...prev, { volume: "", price: "", stock: "" }]);
  }

  function removeVariant(index) {
    setVariants(prev => prev.filter((_, i) => i !== index));
  }

  function updateVariant(index, field, value) {
    setVariants(prev =>
      prev.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      )
    );
  }

  // fetch products from backend
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:8800/api/product/retrieve-product");
      setProducts(res.data.products || []);
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
      setCategories([]);
    }
  };
  
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
  const toggleRow = (productId) => {
    setExpandedRows(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // handle image files
  const handleFiles = (files) => {
    const MAX = 6;
    const newFiles = Array.from(files).slice(0, MAX - images.length);
    if (newFiles.length === 0) return;

    const readers = newFiles.map(file => new Promise(res => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.readAsDataURL(file);
    }));

    Promise.all(readers).then(dataUrls => {
      setImages(prev => {
        const combined = [...prev, ...dataUrls].slice(0, MAX);
        setMainIndex(Math.min(mainIndex, combined.length - 1));
        return combined;
      });
    });
  };

  // remove image
  const removeImage = (idx) => {
    setImages(prev => {
      const copy = prev.filter((_, i) => i !== idx);
      setMainIndex(Math.max(0, Math.min(mainIndex, copy.length - 1)));
      return copy;
    });
  };

  // set main image
  const setMain = (i) => setMainIndex(i);

  const handleEdit = (product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setDescription(product.description);
    
    if (product.is_subcategory) {
      setCategory(product.parent_category_id);
      setSubCategory(product.category_id);
      const selectedCat = categories.find(c => c.category_id === product.parent_category_id);
      setSubCategories(selectedCat ? selectedCat.subcategories : []);
    } else {
      setCategory(product.category_id);
      setSubCategory("");
      const selectedCat = categories.find(c => c.category_id === product.category_id);
      setSubCategories(selectedCat ? selectedCat.subcategories : []);
    }
    
    const productImages = product.images || [];
    if (productImages.length === 0 && product.main_image) {
      productImages.push(product.main_image);
    }
    setImages(productImages);
    setMainIndex(0);
    
    setVariants(product.variants || [{ volume: "", price: "", stock: "" }]);
    setDiscount(product.discount || "");
    setDiscountType(product.discountType || "Percentage");
    setCustomCategory("");
    
    setShowModal(true);
  };

  // save product to backend with variant validation
  const handleSave = async () => {
    if (!productName || images.length === 0) {
      showNotification("Product name and at least 1 image are required.", "error");
      return;
    }

    for (let v of variants) {
      if (!v.volume || !v.price || !v.stock) {
         showNotification("All variants must have volume, price, and stock.", "error");
        return;
      }
    }

    const payload = {
      name: productName,
      description,
      category_id: subCategory || category,
      images,
      variants,
      discount,
      discountType,
    };

    try {
      if (editingProduct) {
        await axios.put(
          `http://localhost:8800/api/product/update-product/${editingProduct.id}`,
          payload
        );
        showNotification(`Product "${productName}" updated successfully!`);
      } else {
        await axios.post("http://localhost:8800/api/product/insert-product", payload);
        showNotification(`Product "${productName}" added successfully!`);
      }

      setShowModal(false);
      setEditingProduct(null);
      setProductName("");
      setDescription("");
      setCategory("");
      setImages([]);
      setVariants([{ volume: "", price: "", stock: "" }]);
      setDiscount("");
      setDiscountType("Percentage");
      setCustomCategory("");
      fetchProducts();
    } catch (err) {
      console.error("Failed to save product:", err);
      showNotification("Failed to save product.", "error");
    }
  };

  const filteredProducts = products.filter(p => {
    // Filter by tab
    if (activeTab === "active" && p.status !== "Active") return false;
    if (activeTab === "inactive" && p.status !== "Inactive") return false;
    if (activeTab === "out") {
      if (p.stock !== 0 && !(p.variants?.some(v => v.stock === 0))) return false;
    }
    if (activeTab === "low" && !(hasLowStock(p) || hasCriticalStock(p))) return false;

    // Filter by search term
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      // Check product name or product reference
      if (!p.name.toLowerCase().includes(term) && !p.product_ref.toLowerCase().includes(term)) {
        return false;
      }
    }

  return true;
});

  // IMPORTANT: Sort products to push low-stock items to the top
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aCritical = hasCriticalStock(a);
    const bCritical = hasCriticalStock(b);
    if (aCritical && !bCritical) return -1;
    if (!aCritical && bCritical) return 1;
    
    const aLow = hasLowStock(a) && !hasCriticalStock(a);
    const bLow = hasLowStock(b) && !hasCriticalStock(b);
    if (aLow && !bLow) return -1;
    if (!aLow && bLow) return 1;
    
    // Priority 3: Alphabetical by name
    return a.name.localeCompare(b.name);
  });

  // Calculate counts for dashboard
  const lowStockCount = products.filter(p => hasLowStock(p)).length;
  const criticalStockCount = products.filter(p => hasCriticalStock(p)).length;

  // Apply pagination AFTER sorting
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const currentProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Pagination handlers
  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const toggleStatus = async (product) => {
    try {
      const newStatus = product.status === "Active" ? "Inactive" : "Active";
      await axios.put("http://localhost:8800/api/product/update-status", {
        id: product.id,
        status: newStatus
      }, { headers: { "Content-Type": "application/json" } });
      setProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, status: newStatus } : p
      ));
       showNotification(`Product "${product.name}" ${newStatus.toLowerCase()} successfully!`);
    } catch (err) {
      console.error("Failed to toggle status:", err);
      showNotification("Failed to change product status.", "error");
    }
  };

 // Delete product - UPDATED
  const handleDelete = async (id) => {
    const productToDelete = products.find(p => p.id === id);
    if (!productToDelete) return;
    
    if (!window.confirm(`Are you sure you want to delete "${productToDelete.name}"?`)) return;
    
    try {
      await axios.delete(`http://localhost:8800/api/product/delete/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      showNotification(`Product "${productToDelete.name}" deleted successfully!`);
    } catch (err) {
      console.error("Failed to delete product:", err);
      showNotification("Failed to delete product.", "error");
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductName("");
    setDescription("");
    setCategory("");
    setSubCategory("");
    setSubCategories([]);
    setImages([]);
    setMainIndex(0);
    setVariants([{ volume: "", price: "", stock: "" }]);
    setDiscount("");
    setDiscountType("Percentage");
    setCustomCategory("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setProductName("");
    setDescription("");
    setCategory("");
    setSubCategory("");
    setSubCategories([]);
    setImages([]);
    setMainIndex(0);
    setVariants([{ volume: "", price: "", stock: "" }]);
    setDiscount("");
    setDiscountType("Percentage");
    setCustomCategory("");
  };

  const toggleVariantStatus = async (productId, variant) => {
  // Find the product first
  const product = products.find(p => p.id === productId);
  if (!product) {
    showNotification("Product not found.", "error");
    return;
  }
  
  const currentStatus = variant.status?.toLowerCase();
  const newStatus = currentStatus === "active" ? "Inactive" : "Active";

  try {
    await axios.put(`http://localhost:8800/api/product/update-variant-status/${variant.id}`, {
      status: newStatus
    });

    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            variants: p.variants.map(v =>
              v.id === variant.id ? { ...v, status: newStatus } : v
            )
          };
        }
        return p;
      })
    );
    
    showNotification(`Variant "${variant.volume}" of "${product.name}" ${newStatus.toLowerCase()} successfully!`);
  } catch (err) {
    console.error("Failed to toggle variant status:", err);
    showNotification("Failed to change variant status.", "error");
  }
};
  useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      dropdownRef.current && 
      !dropdownRef.current.contains(event.target)
    ) {
      setActionDropdown(null);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

const [dismissedAlerts, setDismissedAlerts] = useState({
  critical: false,
  low: false,
  out: false,
});
 const outStockCount = products.filter(
    p => p.stock === 0 || p.variants?.some(v => v.stock === 0)
  ).length;
 const getLowStockProducts = () => {
    return products
      .filter(p => hasLowStock(p) || hasCriticalStock(p))
      .map(p => {
        // Find the minimum stock among product and its variants
        const stocks = [p.stock];
        if (p.variants) {
          p.variants.forEach(v => stocks.push(v.stock));
        }
        const minStock = Math.min(...stocks.filter(s => s > 0)); // Only positive stocks
        
        return {
          name: p.name,
          minStock: minStock,
          isCritical: minStock <= lowStockThreshold
        };
      })
      .sort((a, b) => a.minStock - b.minStock); // Sort by stock level (lowest first)
  };

  // NEW: Get critical stock products with their stock levels
  const getCriticalStockProducts = () => {
    return products
      .filter(p => hasCriticalStock(p))
      .map(p => {
        const stocks = [p.stock];
        if (p.variants) {
          p.variants.forEach(v => stocks.push(v.stock));
        }
        const minStock = Math.min(...stocks.filter(s => s > 0));
        
        return {
          name: p.name,
          minStock: minStock
        };
      })
      .sort((a, b) => a.minStock - b.minStock);
  };

  // NEW: Get out of stock product names
  const getOutOfStockProducts = () => {
    return products
      .filter(p => p.stock === 0 || p.variants?.some(v => v.stock === 0))
      .map(p => p.name);
  };

  const lowStockProducts = getLowStockProducts();
  const criticalStockProducts = getCriticalStockProducts();
  const outOfStockProducts = getOutOfStockProducts();

  return (
    <div className="admin-page">
      <Sidebar className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
        toggleSidebar={toggleSidebar}/>
      <div className="admin-content">
        <Header toggleSidebar={toggleSidebar}  // Pass toggle function to header
          isSidebarCollapsed={sidebarCollapsed}/>
        <h2 className="page-title">Products</h2>
    
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
            
          <div className="stock-alert-overlay">
          {/* OUT OF STOCK ALERT */}
          {outStockCount > 0 && !dismissedAlerts.out && (
            <div className="alert-card critical-alert">
              <div className="alert-icon">❌</div>
              <div className="alert-content">
                <h4>Out of Stock!</h4>
                <p>
                  {outStockCount} product{outStockCount !== 1 ? 's' : ''} {outStockCount !== 1 ? 'are' : 'is'} out of stock
                  {outOfStockProducts.length > 0 && (
                    <span className="product-list">
                      {outOfStockProducts.slice(0, 3).map((name, idx) => (
                        <span key={idx} className="product-name">"{name}"</span>
                      ))}
                      {outOfStockProducts.length > 3 && <span> and {outOfStockProducts.length - 3} more</span>}
                    </span>
                  )}
                </p>
              </div>
              <button
                className="alert-close-btn"
                onClick={() => setDismissedAlerts(prev => ({ ...prev, out: true }))}
              >
                ×
              </button>
            </div>
          )}

          {/* CRITICAL LOW STOCK ALERT - UPDATED TO USE product-name class */}
          {criticalStockCount > 0 && !dismissedAlerts.critical && (
            <div className="alert-card critical-alert">
              <div className="alert-icon">🛑</div>
              <div className="alert-content">
                <h4>Critical Low Stock!</h4>
                <p>
                  {criticalStockCount} product{criticalStockCount !== 1 ? 's' : ''} with 1-5 units remaining:
                  {criticalStockProducts.length > 0 && (
                    <div className="product-details-list">
                      {criticalStockProducts.map((product, idx) => (
                        <div key={idx} className="product-name"> {/* Changed from product-detail to product-name */}
                          "{product.name}" ({product.minStock} unit{product.minStock !== 1 ? 's' : ''})
                        </div>
                      ))}
                    </div>
                  )}
                </p>
              </div>
              <button
                className="alert-close-btn"
                onClick={() => setDismissedAlerts(prev => ({ ...prev, critical: true }))}
              >
                ×
              </button>
            </div>
          )}

          {/* WARNING LOW STOCK ALERT - UPDATED TO USE product-name class */}
          {lowStockCount > 0 && !dismissedAlerts.low && (
            <div className="alert-card warning-alert">
              <div className="alert-icon">⚠️</div>
              <div className="alert-content">
                <h4>Low Stock Warning</h4>
                <p>
                  {lowStockCount} product{lowStockCount !== 1 ? 's' : ''} with 6-10 units remaining:
                  {lowStockProducts.length > 0 && (
                    <div className="product-details-list">
                      {lowStockProducts.map((product, idx) => (
                        <div key={idx} className="product-name"> {/* Changed from product-detail to product-name */}
                          "{product.name}" ({product.minStock} unit{product.minStock !== 1 ? 's' : ''})
                        </div>
                      ))}
                    </div>
                  )}
                </p>
              </div>
              <button
                className="alert-close-btn"
                onClick={() => setDismissedAlerts(prev => ({ ...prev, low: true }))}
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* TOP ACTIONS */}
        <div className="top-actions">
          <div className="tabs">
            {/* All Products */}
            <button className={`tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
              All Products
            </button>

            {/* Active */}
            <button className={`tab ${activeTab === "active" ? "active" : ""}`} onClick={() => setActiveTab("active")}>
              Active {activeCount > 0 && <span className="badge-count-active">{activeCount}</span>}
            </button>

            {/* Inactive */}
            <button className={`tab ${activeTab === "inactive" ? "active" : ""}`} onClick={() => setActiveTab("inactive")}>
              Inactive {inactiveCount > 0 && <span className="badge-count">{inactiveCount}</span>}
            </button>

            {/* Low Stock */}
            <button className={`tab ${activeTab === "low" ? "active" : ""}`} onClick={() => setActiveTab("low")}>
              Low Stock {lowStockCount > 0 && <span className="badge-count">{lowStockCount}</span>}
            </button>

            {/* Out of Stock */}
            <button className={`tab ${activeTab === "out" ? "active" : ""}`} onClick={() => setActiveTab("out")}>
              Out of Stock {outStockCount > 0 && <span className="badge-count">{outStockCount}</span>}
            </button>
          </div>

          <div className="right-actions">
            <div className="search-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search product name or reference..."
                className="product-search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // reset pagination
                }}
              />
            </div>
            <button className="btn add" onClick={handleAddProduct}>+ Add Product</button>
          </div>
        </div>


        {/* TABLE */}
        <div className="table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>STOCK ALERT</th>
                <th>PRODUCT NAME</th>
                <th>IMAGE</th>
                <th>SALE PRICE</th>
                <th>STATUS</th>
                <th>INVENTORY</th>
                <th>PRODUCT REFERENCE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

           <tbody>
                {currentProducts.length > 0 ? (
                  currentProducts.flatMap((p, i) => {
                    const isExpanded = expandedRows.includes(p.id);
                    const stockStatus = getStockStatus(p.stock);
                    const isCritical = hasCriticalStock(p);
                    const isLow = hasLowStock(p) && !isCritical;
                    const isOutOfStock = p.stock === 0 || (p.variants && p.variants.some(v => v.stock === 0));
                    
                    return [
                      // Main Product Row
                      <tr key={`main-${i}`} className={
                        isCritical ? "critical-stock-row" : 
                        isLow ? "low-stock-row" : 
                        isOutOfStock ? "out-stock-row" : ""
                      }>
                        <td className="stock-alert-cell">
                          {/* Add out of stock badge */}
                        {isOutOfStock && (
                          <div className="stock-alert-badge out">
                            ❌ Out
                          </div>
                        )}
                        {/* Critical badge - only show if NOT out of stock */}
                        {!isOutOfStock && isCritical && (
                          <div className="stock-alert-badge critical">
                            🛑 Critical
                          </div>
                        )}
                        {/* Low stock badge - only show if NOT out of stock or critical */}
                        {!isOutOfStock && !isCritical && isLow && (
                          <div className="stock-alert-badge warning">
                            ⚠️ Low
                          </div>
                        )}
                      </td>
                      <td className="checkbox-expand-cell">
                        {p.variants && p.variants.length > 0 && (
                          <button
                            className="expand-btn"
                            onClick={() => toggleRow(p.id)}
                            aria-label="Expand variants"
                          >
                            {isExpanded ? "▼" : "▶"}
                          </button>
                        )}
                        <strong>{p.name}</strong>
                      </td>
                      <td>
                        <img
                          src={p.main_image || "https://via.placeholder.com/40"}
                          className="prod-img"
                          alt="product"
                        />
                      </td>
                      <td>₱{p.price}</td>
                      <td>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={p.status === "Active"}
                            onChange={() => toggleStatus(p)}
                          />
                          <span className="slider"></span>
                        </label>
                      </td>
                      <td>
                        <div className="inventory-display">
                          <span className={`stock-count ${stockStatus.level}`}>
                            {p.stock}
                          </span>
                          {stockStatus.level !== 'healthy' && (
                            <span className="stock-status-text">{stockStatus.label}</span>
                          )}
                        </div>
                      </td>
                      <td>{p.product_ref}</td>
                      <td className="actions-cell">
                        <div className="action-wrapper" ref={dropdownRef}>
                        <button
                          className="action-btn-prod"
                          onClick={() => 
                            setActionDropdown(prev => (prev === p.id ? null : p.id))}
                        >
                          •••
                        </button>
                        {actionDropdown === p.id && (
                          <div className="action-menu-prod" ref={dropdownRef}>
                            <button className="menu-item-prod" onClick={() => handleEdit(p)}>Edit</button>
                            <button className="menu-item-prod" onClick={() => handleDelete(p.id)}>Delete</button>
                          </div>
                        )}
                        </div>
                      </td>
                    </tr>,
                    
                    // Variant Rows (appear when expanded)
                    ...(isExpanded && p.variants && p.variants.length > 0
                      ? p.variants.map((v, idx) => {
                          const variantStockStatus = getStockStatus(v.stock);
                          const isVariantCritical = v.stock <= lowStockThreshold;
                          const isVariantLow = v.stock <= warningStockThreshold && !isVariantCritical;
                          
                          return (
                            <tr key={`variant-${i}-${idx}`} className={`variant-row ${isVariantCritical ? 'variant-critical' : isVariantLow ? 'variant-warning' : ''}`}>
                              <td>
                                {isVariantCritical || isVariantLow ? (
                                  <div className={`variant-alert-indicator ${isVariantCritical ? 'critical' : 'warning'}`}>
                                    {isVariantCritical ? '🛑' : '!'}
                                  </div>
                                ) : null}
                              </td>
                              <td className="variant-name-cell">
                                <span className="variant-indicator">↳</span>
                                <span className="variant-text">{v.volume} - {p.name}</span>
                              </td>
                              <td>
                                <img
                                  src={p.main_image || "https://via.placeholder.com/40"}
                                  className="prod-img variant-img"
                                  alt="variant"
                                />
                              </td>
                              <td>₱{v.price}</td>
                              <td>
                                <label className="switch">
                                  <input
                                    type="checkbox"
                                    checked={v.status === "Active"} 
                                    onChange={() => toggleVariantStatus(p.id, v)}
                                  />
                                  <span className="slider"></span>
                                </label>
                              </td>
                              <td>
                                <div className="inventory-display">
                                  <span className={`stock-count ${variantStockStatus.level}`}>
                                    {v.stock}
                                  </span>
                                  {variantStockStatus.level !== 'healthy' && (
                                    <span className="stock-status-text">{variantStockStatus.label}</span>
                                  )}
                                </div>
                              </td>
                              <td>{v.sku || p.product_ref}</td>
                              <td className="actions-cell">
                                <div className="dropdown-cat">
                                  <button
                                    className="dots-btn-cat"
                                    onClick={() => setActionDropdown(prev => (prev === `variant-${v.id}` ? null : `variant-${v.id}`))}
                                  >
                                    ⋮
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      : [])
                  ];
                })
              ) : (
                <tr>
                  <td colSpan="8" className="no-product-cell">No product added</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="pagination-controls">
          <button onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1}>
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </button>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="admin-modal-overlay-prod" role="dialog" aria-modal="true">
          <div className="admin-modal modal-wide-prod">

            <div className="admin-modal-header-prod">
              <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
            </div>

            <div className="admin-modal-grid-prod two-col">
              {/* LEFT COLUMN */}
              <div className="left-col-prod">
                <label className="label-prod">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Puffer Jacket With Pocket Detail"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />

                <label className="label-prod">Description</label>
                <textarea
                  placeholder="Product description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <div className="row-prod">
                  <div className="col-full-prod">
                 <div className="label-with-btn">
                    <label className="label-prod">Product Options</label>
                    <button className="add-variant-btn-prod" onClick={addVariant}>+</button>
                  </div>
                  <div className="product-options-card">
                    <div className="variants-table-wrapper">
                      <table className="variants-table">
                        <thead>
                          <tr>
                            <th>Volume/Size</th>
                            <th>Price</th>
                            <th>Stock Quantity</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {variants.map((v, index) => (
                            <tr key={index}>
                              <td>
                                <input
                                  type="text"
                                  placeholder="e.g. 100ml, M, L"
                                  value={v.volume}
                                  onChange={(e) => updateVariant(index, "volume", e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  placeholder="0.00"
                                  value={v.price}
                                  onChange={(e) => updateVariant(index, "price", e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={v.stock}
                                  onChange={(e) => updateVariant(index, "stock", e.target.value)}
                                />
                              </td>
                              <td>
                                <button
                                  className="delete-row-prod"
                                  onClick={() => removeVariant(index)}
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  </div>
                </div>
                <div className="row-prod">
                  <div className="input-stack full">
                    <label className="label-prod">Discount</label>
                    <div className="discount-row-prod">
                      <input type="number" placeholder="10" value={discount} onChange={e => setDiscount(e.target.value)} />
                      <select value={discountType} onChange={e => setDiscountType(e.target.value)}>
                        <option>Percentage</option>
                        <option>Fixed</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="right-col-prod">
                <div className="image-card-prod">
                  <div className="image-preview-prod">
                    {images && images.length > 0 ? (
                      <img src={images[mainIndex]} alt="main preview" />
                    ) : (
                      <div className="image-placeholder-prod">No image</div>
                    )}
                  </div>

                  <div className="thumbnail-row-prod">
                    {images.map((src, idx) => (
                      <div key={idx} className={`thumb-prod ${idx === mainIndex ? "selected" : ""}`}>
                        <img src={src} alt={`thumb-${idx}`} onClick={() => setMain(idx)} />
                        <button className="thumb-del-prod" onClick={() => removeImage(idx)} aria-label="Remove image">×</button>
                      </div>
                    ))}

                    {images.length < 6 && (
                      <div className="thumb add-thumb" onClick={() => fileInputRef.current?.click()}>
                        <span>+</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleFiles(e.target.files)}
                          style={{ display: "none" }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="category-card-prod">
                  <label className="label-prod">Category</label>
                  <select value={category} onChange={e => {
                    const catId = e.target.value;
                    setCategory(catId);
                    const selectedCat = categories.find(c => c.category_id === parseInt(catId));
                    setSubCategories(selectedCat?.subcategories || []);
                    setSubCategory("");
                  }}>
                    <option value="" disabled>Select category</option>
                    {categories.map(c => (
                      <option key={c.category_id} value={c.category_id}>{c.name}</option>
                    ))}
                  </select>
                    <label className="label-prod">Sub Category</label>
                    <select 
                      value={subCategory} 
                      onChange={e => setSubCategory(e.target.value)}
                      disabled={subCategories.length === 0}
                    >
                      <option value="" disabled>Select subcategory</option>
                      {subCategories.map(sc => (
                        <option key={sc.category_id} value={sc.category_id}>{sc.name}</option>
                      ))}
                    </select>
                </div>
              </div>
            </div>

            <div className="admin-modal-actions-prod">
              <button className="admin-btn admin-cancel-prod" onClick={handleCloseModal}>Cancel</button>
              <button className="admin-btn admin-save-prod" onClick={handleSave}>Save Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}