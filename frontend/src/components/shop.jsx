import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import axios from "axios";
import "./ShopPage.css";
import Login from "./Login.jsx";

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [loginOpen, setLoginOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [sortBy, setSortBy] = useState("popular");
  const [minRating, setMinRating] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8800/api/prodpage/retrieve-producthomepage"
        );
        setProducts(response.data);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://localhost:8800/api/category/retrieve");
        setCategories(response.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  const toggleSize = (size) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const applyFilters = () => {
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setPriceRange({ min: 0, max: 10000 });
    setSelectedSizes([]);
    setMinRating(0);
    setSortBy("popular");
    setCurrentPage(1);
    setExpandedCategories({});
  };

  const filteredProducts = products.filter((product) => {
    const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory ||
      product.subcategory === selectedCategory;

    const matchPrice = product.price >= priceRange.min && product.price <= priceRange.max;

    const matchSize = selectedSizes.length === 0 || 
      (product.variants && product.variants.some(v => selectedSizes.includes(v.size)));

    const matchRating = (product.avg_rating || 0) >= minRating;

    return matchSearch && matchCategory && matchPrice && matchSize && matchRating;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at) - new Date(a.created_at);
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return (b.avg_rating || 0) - (a.avg_rating || 0);
      case "popular":
      default:
        return (b.total_sales || 0) - (a.total_sales || 0);
    }
  });

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const user_id = user?.userID;

    if (!token || !user_id) {
      alert("Please login to add items to cart.");
      setLoginOpen(true);
      return;
    }

    const selectedVariant = product.variants?.[0] || null;

    if (!selectedVariant) {
      alert("Please select a variant before adding to cart.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:8800/api/cart/add", {
        user_id,
        product_id: product.id,
        variant_id: selectedVariant.id,
        quantity: 1,
      });

      alert(response.data.message || "Added to cart!");
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert("Failed to add to cart");
    }
  };

  if (loading) return <p>Loading products...</p>;

  return (
    <div className="shop-root">
      <div className="shop-container">
        <div className="shop-search">
          <input
            placeholder="Search products by name or description..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <FaSearch className="shop-search-icon" />
        </div>

        <div className="shop-layout">
          <aside className="shop-sidebar">
            <h4>Categories</h4>
            <ul>
              <li>
                <span
                  className={`${selectedCategory === "All" ? "active" : ""} ${categories.some(cat => cat.subcategories.length > 0) ? "has-subcategory" : ""}`}
                  onClick={() => {
                    setSelectedCategory("All");
                    setCurrentPage(1);
                    setExpandedCategories({});
                  }}
                >
                  All Products
                  {selectedCategory === "All" && <span className="subcategory-checkmark">✓</span>}
                </span>
              </li>

              {categories.map((cat) => {
                const isCategoryExpanded = expandedCategories[cat.category_id];
                const hasSubcategories = cat.subcategories.length > 0;
                
                return (
                  <React.Fragment key={cat.category_id}>
                    <li>
                      <span
                        className={`${selectedCategory === cat.name ? "active" : ""} ${hasSubcategories ? "has-subcategory" : ""}`}
                        onClick={() => {
                          if (hasSubcategories) {
                            setExpandedCategories(prev => ({
                              ...prev,
                              [cat.category_id]: !prev[cat.category_id]
                            }));
                          } else {
                            setSelectedCategory(cat.name);
                            setCurrentPage(1);
                          }
                        }}
                      >
                        {cat.name}
                        {hasSubcategories && (
                          <span className="category-count">
                            {cat.subcategories.length}
                          </span>
                        )}
                      </span>
                      
                      {hasSubcategories && (
                        <ul className={`subcategory-list ${isCategoryExpanded ? "show" : ""}`}>
                          {cat.subcategories.map((sub) => (
                            <li
                              key={sub.category_id}
                              className={selectedCategory === sub.name ? "active" : ""}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCategory(sub.name);
                                setCurrentPage(1);
                              }}
                            >
                              {sub.name}
                              {selectedCategory === sub.name && (
                                <span className="subcategory-checkmark">✓</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  </React.Fragment>
                );
              })}
            </ul>

            <hr />

            <h4>Price Range</h4>
            <div className="shop-filter">
              <div className="price-range-container">
                <div className="price-input-wrapper">
                  <label className="price-label">Min Price</label>
                  <input
                    type="number"
                    className="price-input"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                    min="0"
                    max={priceRange.max}
                  />
                </div>
                <div className="price-input-wrapper">
                  <label className="price-label">Max Price</label>
                  <input
                    type="number"
                    className="price-input"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                    min={priceRange.min}
                    max="10000"
                  />
                </div>
              </div>
            </div>

            <hr />

            <h4>Rating</h4>
            <div className="shop-filter">
              {[4, 3, 2, 1].map((rating) => (
                <label key={rating}>
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === rating}
                    onChange={() => {
                      setMinRating(rating);
                      setCurrentPage(1);
                    }}
                  />
                  {rating}★ & above
                </label>
              ))}
              <label>
                <input
                  type="radio"
                  name="rating"
                  checked={minRating === 0}
                  onChange={() => {
                    setMinRating(0);
                    setCurrentPage(1);
                  }}
                />
                All Ratings
              </label>
            </div>

            <hr />

            <button className="shop-apply" onClick={applyFilters}>
              Apply Filters
            </button>
            <button className="shop-clear" onClick={clearFilters}>
              Clear All Filters
            </button>
          </aside>

          <main className="shop-products">
            <div className="shop-products-header">
              <h2>
                {searchTerm ? `"${searchTerm}"` : selectedCategory !== "All" ? selectedCategory : "All Products"}{" "}
                <span className="shop-items-count">({filteredProducts.length} items)</span>
              </h2>
              <select 
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            <div className="shop-grid">
              {paginatedProducts.map((product) => (
                <Link
                  to={`/product/${product.id}`}
                  className="shop-card"
                  key={product.id}
                >
                  {product.status === "New" && <span className="shop-badge">NEW</span>}
                  <div
                    className="shop-img"
                    style={{
                      backgroundImage: `url(${product.main_image})`,
                    }}
                  ></div>
                  <p className="shop-name">{product.name}</p>

                  <div className="shop-rating">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const rating = Math.round(Number(product.avg_rating) || 0);
                      return <span key={i}>{i < rating ? "★" : "☆"}</span>;
                    })}
                    <span className="shop-rating-count">({product.avg_rating?.toFixed(1) || "0.0"})</span>
                  </div>

                  <p className="shop-price">
                    ₱{Number(product.price || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
               </Link>
              ))}
            </div>

            {paginatedProducts.length === 0 && (
              <div className="no-results-container">
                <p className="no-results-title">No products found</p>
                <p className="no-results-message">Try adjusting your filters or search terms</p>
                <button 
                  className="clear-filters-button"
                  onClick={clearFilters}
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {paginatedProducts.length > 0 && (
              <div className="pagination-controls">
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
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
      {loginOpen && <Login isOpen={loginOpen} onClose={() => setLoginOpen(false)} />}
    </div>
  );
}