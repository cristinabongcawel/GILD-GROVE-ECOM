import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./sidebar";
import Header from "./header";
import "./admin-layout.css";
import "./category.css";

const AdminCategory = () => {
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "", parentCategoryID: "" });
  const [editCategory, setEditCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isMainCategory, setIsMainCategory] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
   // Add notification state (same as other pages)
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success" // "success", "error", "info"
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

   // Notification function (same as other pages)
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

  // Track which subcategory dropdowns are open
  const [openDropdowns, setOpenDropdowns] = useState({}); // { category_id: true/false }

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8800/api/category/retrieve");
      setCategories(res.data);

      // Initialize all main category dropdowns as open
      const dropdownState = {};
      res.data.forEach(cat => {
        if (cat.subcategories?.length > 0) dropdownState[cat.category_id] = true;
      });
      setOpenDropdowns(dropdownState);
      showNotification("Categories loaded successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Failed to load categories.", "error");
    }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  // Add category
  const handleAddCategory = async () => {
    if (!newCategory.name) {
      showNotification("Category name is required", "error");
      return;
    }
      try {
      await axios.post("http://localhost:8800/api/category/add", {
        name: newCategory.name,
        description: newCategory.description,
        parentCategoryID: isMainCategory ? null : newCategory.parentCategoryID,
      });
      showNotification("Category name is required", "error");
      setNewCategory({ name: "", description: "", parentCategoryID: "" });
      setIsMainCategory(true);
      setShowAddModal(false);
      fetchCategories();
    } catch (err) { 
      console.error(err); 
      showNotification("Failed to add category.", "error");
    }
  };

const handleDelete = async (id) => {
    const categoryToDelete = categories.find(cat => cat.category_id === id) || 
                            categories.flatMap(cat => cat.subcategories || []).find(sub => sub.category_id === id);
    
    if (!categoryToDelete) return;
    
    if (!window.confirm(`Are you sure you want to delete category "${categoryToDelete.name}"?`)) return;
    
    try {
      await axios.delete(`http://localhost:8800/api/category/delete/${id}`);
      showNotification(`Category "${categoryToDelete.name}" successfully deleted!`, "success");
      fetchCategories();
    } catch (err) {
      console.error(err);
      showNotification("Failed to delete category.", "error");
    }
  };

  // Edit category
  const openEditModal = (category) => {
    setEditCategory({ ...category });
    setIsMainCategory(!category.parent_category_id);
    setShowEditModal(true);
  };

  const handleEditCategory = async () => {
    try {
      await axios.put(`http://localhost:8800/api/category/update/${editCategory.category_id}`, {
        name: editCategory.name,
        description: editCategory.description,
        parentCategoryID: isMainCategory ? null : editCategory.parentCategoryID,
      });
      showNotification(`Category "${editCategory.name}" successfully updated!`, "success");
      setShowEditModal(false);
      setEditCategory(null);
      setIsMainCategory(true);
      fetchCategories();
    } catch (err) { 
      console.error(err); 
      showNotification("Failed to update category.", "error");
    }
  };

  const getPopularityLevel = (count) => (count > 20 ? "High" : count > 10 ? "Medium" : "Low");

  return (
 <div className="admin-page">
       <Sidebar className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
               toggleSidebar={toggleSidebar}/>
       <div className="admin-content">
         <Header toggleSidebar={toggleSidebar}  // Pass toggle function to header
                 isSidebarCollapsed={sidebarCollapsed}/>
      <div className="admin-content-cat">
        <h2 className="page-title">Categories</h2>
 
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

        <div className="top-actions-cat">
          <button className="btn add" onClick={() => setShowAddModal(true)}>+ Add Category</button>
        </div>

        <div className="table-wrapper-cat">
          {loading ? <p>Loading categories...</p> : (
            <table className="product-table-cat">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Usage</th>
                  <th>Popularity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <React.Fragment key={cat.category_id}>
                    {/* Main Category Row */}
                    <tr>
                      <td>
                        <strong>{cat.name}</strong>
                        {cat.subcategories?.length > 0 && (
                          <span
                            style={{ cursor: "pointer", marginLeft: 8 }}
                            onClick={() => setOpenDropdowns(prev => ({ ...prev, [cat.category_id]: !prev[cat.category_id] }))}
                          >
                            {openDropdowns[cat.category_id] ? "▼" : "▶"}
                          </span>
                        )}
                      </td>
                      <td>{cat.description}</td>
                      <td>{cat.usage_count}</td>
                      <td>{getPopularityLevel(cat.usage_count)}</td>
                      <td className="actions-cell-cat">
                        <div className="dropdown-cat">
                          <button
                            className="dots-btn-cat"
                            onClick={() => setOpenMenuId(openMenuId === cat.category_id ? null : cat.category_id)}
                          >
                            •••
                          </button>
                          {openMenuId === cat.category_id && (
                            <div className="dropdown-menu-cat">
                              <button onClick={() => openEditModal(cat)}>Edit</button>
                              <button onClick={() => handleDelete(cat.category_id)}>Delete</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Subcategories Dropdown */}
                    {cat.subcategories && openDropdowns[cat.category_id] && cat.subcategories.map(sub => (
                      <tr key={sub.category_id} className="sub-row-cat">
                        <td>↳ {sub.name}</td>
                        <td>{sub.description}</td>
                        <td>{sub.usage_count}</td>
                        <td>{getPopularityLevel(sub.usage_count)}</td>
                        <td className="actions-cell-cat">
                          <div className="dropdown-cat">
                            <button className="dots-btn-cat" onClick={() => setOpenMenuId(openMenuId === sub.category_id ? null : sub.category_id)}>⋮</button>
                            {openMenuId === sub.category_id && (
                              <div className="dropdown-menu-cat">
                                <button onClick={() => openEditModal(sub)}>Edit</button>
                                <button onClick={() => handleDelete(sub.category_id)}>Delete</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add & Edit Modals */}
        {showAddModal && (
          <div className="admin-modal-overlay-cat">
            <div className="admin-modal-cat">
              <h3>Add Category</h3>
              <label>Name</label>
              <input type="text" value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} />
              <label>Description</label>
              <textarea value={newCategory.description} onChange={e => setNewCategory({ ...newCategory, description: e.target.value })} />
              <label>Category Type</label>
              <div className="radio-group-cat">
                <label>
                  <input type="radio" name="categoryTypeAdd" checked={isMainCategory} onChange={() => { setIsMainCategory(true); setNewCategory({ ...newCategory, parentCategoryID: "" }); }} />
                  Main Category
                </label>
                <label>
                  <input type="radio" name="categoryTypeAdd" checked={!isMainCategory} onChange={() => setIsMainCategory(false)} />
                  Subcategory
                </label>
              </div>
              <label>Parent Category</label>
              <select disabled={isMainCategory} value={newCategory.parentCategoryID} onChange={e => setNewCategory({ ...newCategory, parentCategoryID: e.target.value })}>
                <option value="" disabled>Select</option>
                {categories.filter(cat => !cat.parent_category_id).map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                ))}
              </select>
              <div className="modal-actions-cat">
                <button className="btn-cat" onClick={() => { setShowAddModal(false); setIsMainCategory(true); }}>Cancel</button>
                <button className="btn-cat add-cat" onClick={handleAddCategory}>Save</button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && editCategory && (
          <div className="admin-modal-overlay-cat">
            <div className="admin-modal-cat">
              <h3>Edit Category</h3>
              <label>Name</label>
              <input type="text" value={editCategory.name} onChange={e => setEditCategory({ ...editCategory, name: e.target.value })} />
              <label>Description</label>
              <textarea value={editCategory.description} onChange={e => setEditCategory({ ...editCategory, description: e.target.value })} />
              <label>Category Type</label>
              <div className="radio-group-cat">
                <label>
                  <input type="radio" name="categoryTypeEdit" checked={!editCategory.parent_category_id} disabled />
                  Main Category
                </label>
                <label>
                  <input type="radio" name="categoryTypeEdit" checked={!!editCategory.parent_category_id} disabled />
                  Subcategory
                </label>
              </div>
              {!(!editCategory.parent_category_id) && (
                <>
                  <label>Parent Category</label>
                  <select value={editCategory.parentCategoryID || ""} onChange={e => setEditCategory({ ...editCategory, parentCategoryID: e.target.value })}>
                    <option value="" disabled>Select</option>
                    {categories.filter(cat => !cat.parent_category_id).map(cat => (
                      <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                    ))}
                  </select>
                </>
              )}
              <div className="modal-actions-cat">
                <button className="btn-cat" onClick={() => { setShowEditModal(false); setEditCategory(null); }}>Cancel</button>
                <button className="btn-cat add-cat" onClick={handleEditCategory}>Save</button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default AdminCategory;
