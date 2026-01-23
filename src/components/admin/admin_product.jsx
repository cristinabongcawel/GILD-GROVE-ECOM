// AdminProducts.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Sidebar from "./sidebar";
import Header from "./header";
import "./adminprod.css";

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
  const itemsPerPage = 10; // Show 10 items per page
  const [variants, setVariants] = useState([
    { volume: "", price: "", stock: "" },
  ]);

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
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
    }
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

  // add custom category
  const handleAddCategory = () => {
    if (!customCategory.trim()) return;
    setCategory(customCategory.trim());
    setCustomCategory("");
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setDescription(product.description);
    setCategory(product.category);
    setImages(product.images || []);
    setVariants(product.variants || [{ volume: "", price: "", stock: "" }]);
    setDiscount(product.discount || "");
    setDiscountType(product.discountType || "Percentage");
    setShowModal(true);
  };

  // save product to backend with variant validation
  const handleSave = async () => {
    if (!productName || images.length === 0) {
      alert("Product name and at least 1 image are required.");
      return;
    }

    // Validate variants
    for (let v of variants) {
      if (!v.volume || !v.price || !v.stock) {
        alert("All variants must have volume, price, and stock.");
        return;
      }
    }

    const payload = {
      name: productName,
      description,
      category,
      images,
      variants,
      discount,
      discountType,
    };

    try {
      if (editingProduct) {
        // UPDATE existing product
        await axios.put(
          `http://localhost:8800/api/product/update-product/${editingProduct.id}`,
          payload
        );
        alert("Product updated successfully!");
      } else {
        // INSERT new product
        await axios.post("http://localhost:8800/api/product/insert-product", payload);
        alert("Product added successfully!");
      }

      // Reset modal and form
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

      // Refresh the product list
      fetchProducts();
    } catch (err) {
      console.error("Failed to save product:", err);
      alert("Failed to save product.");
    }
  };

  // Filter products based on active tab
  const filteredProducts = products.filter(p => {
    if (activeTab === "active") return p.status === "Active";
    if (activeTab === "inactive") return p.status === "Inactive";
    if (activeTab === "out") return p.status === "Out of Stock";
    return true; // all products
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice(
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
      }, {
        headers: { "Content-Type": "application/json" }
      });

      // Update local state
      setProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, status: newStatus } : p
      ));
    } catch (err) {
      console.error("Failed to toggle status:", err);
      alert("Failed to toggle status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(`http://localhost:8800/api/product/delete/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Failed to delete product:", err);
      alert("Failed to delete product.");
    }
  };

  return (
    <div className="admin-page">
      <Sidebar />

      <div className="admin-content">
        <Header />
        <h2 className="page-title">Products</h2>

        {/* TOP ACTIONS */}
        <div className="top-actions">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >All Products</button>
            <button
              className={`tab ${activeTab === "active" ? "active" : ""}`}
              onClick={() => setActiveTab("active")}
            >Active</button>
            <button
              className={`tab ${activeTab === "inactive" ? "active" : ""}`}
              onClick={() => setActiveTab("inactive")}
            >Inactive</button>
            <button
              className={`tab ${activeTab === "out" ? "active" : ""}`}
              onClick={() => setActiveTab("out")}
            >Out of stock</button>
          </div>
          <div className="right-actions">
            <button className="btn add" onClick={() => setShowModal(true)}>+ Add Product</button>
          </div>
        </div>

        {/* FILTER + SEARCH */}
        <div className="filter-row">
          <div className="left-info">{products.length} Products</div>
        </div>

        {/* TABLE */}
        <div className="table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th></th>
                <th>Product Name</th>
                <th>Image</th>
                <th>Sale Price</th>
                <th>Status</th>
                <th>Inventory</th>
                <th>Product Reference</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {currentProducts.length > 0 ? (
                currentProducts.map((p, i) => (
                  <tr key={i}>
                    <td><input type="checkbox" /></td>
                    <td>{p.name}</td>
                    <td>
                      <img
                        src={p.main_image || "https://via.placeholder.com/40"}
                        className="prod-img"
                        alt="product"
                      />
                    </td>
                    <td>AED {p.price}</td>
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
                    <td>{p.stock}</td>
                    <td>{p.product_ref}</td>
                    <td className="actions-cell">
                      <button
                        className="action-btn"
                        onClick={() => setActionDropdown(prev => prev === p.id ? null : p.id)}
                      >
                        •••
                      </button>

                      {actionDropdown === p.id && (
                        <div className="action-menu">
                          <button className="menu-item" onClick={() => handleEdit(p)}>Edit</button>
                          <button className="menu-item" onClick={() => handleDelete(p.id)}>Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>No product added</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="pagination">
          <button onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1 || totalPages === 0}
          >
            {"< Prev"}
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i + 1}
              className={currentPage === i + 1 ? "active" : ""}
              onClick={() => goToPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            {"Next >"}
          </button>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal modal-wide">

            <div className="admin-modal-header">
              <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
            </div>

            <div className="admin-modal-grid two-col">
              {/* LEFT COLUMN */}
              <div className="left-col">
                <label className="label">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Puffer Jacket With Pocket Detail"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />

                <label className="label">Description</label>
                <textarea
                  placeholder="Product description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <div className="row">
                  <label className="label">Product Options</label>
                  <div className="product-options-card">
                    <div className="variants-table">
                      <table>
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
                                  onChange={(e) =>
                                    updateVariant(index, "volume", e.target.value)
                                  }
                                />
                              </td>

                              <td>
                                <input
                                  type="number"
                                  placeholder="0.00"
                                  value={v.price}
                                  onChange={(e) =>
                                    updateVariant(index, "price", e.target.value)
                                  }
                                />
                              </td>

                              <td>
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={v.stock}
                                  onChange={(e) =>
                                    updateVariant(index, "stock", e.target.value)
                                  }
                                />
                              </td>

                              <td>
                                <button className="delete-row" onClick={() => removeVariant(index)}>
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <button className="add-variant-btn" onClick={addVariant}>
                        + Add Variant
                      </button>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="input-stack full">
                    <label className="label">Discount</label>
                    <div className="discount-row">
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
              <div className="right-col">
                <div className="image-card">
                  <div className="image-preview">
                    {images && images.length > 0 ? (
                      <img src={images[mainIndex]} alt="main preview" />
                    ) : (
                      <div className="image-placeholder">No image</div>
                    )}
                  </div>

                  <div className="thumbnail-row">
                    {images.map((src, idx) => (
                      <div key={idx} className={`thumb ${idx === mainIndex ? "selected" : ""}`}>
                        <img src={src} alt={`thumb-${idx}`} onClick={() => setMain(idx)} />
                        <button className="thumb-del" onClick={() => removeImage(idx)} aria-label="Remove image">×</button>
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

                <div className="category-card">
                  <label className="label">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="" disabled>Select category</option>
                    <option>Jacket</option>
                    <option>Shirt</option>
                    <option>Pants</option>
                    <option>Accessories</option>
                    <option>Other</option>
                  </select>

                  <div className="add-category">
                    <input
                      type="text"
                      placeholder="Add new category"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                    />
                    <button className="btn small" onClick={handleAddCategory}>Add</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-modal-actions">
              <button className="admin-btn admin-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="admin-btn admin-save" onClick={handleSave}>Save Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}