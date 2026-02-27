import React, { useState, useEffect, useMemo } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import axios from "axios";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Tooltip, Legend, Filler } from "chart.js";
import Sidebar from "./sidebar";
import Header from "./header";
import "./admin-layout.css";
import "./dashboard.css";

// Register Chart.js
ChartJS.register( CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Tooltip, Legend, Filler);

export default function DashboardDash() {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("sold");
  const [sortDir, setSortDir] = useState("desc");
  const [revenueLabels, setRevenueLabels] = useState([]);
  const [revenueWeekA, setRevenueWeekA] = useState([]);
  const [revenueWeekB, setRevenueWeekB] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [topCategoryCounts, setTopCategoryCounts] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const gradientColors = {
    primary: ['#6366f1', '#818cf8', '#a5b4fc'],
    success: ['#10b981', '#34d399', '#6ee7b7'],
    warning: ['#f59e0b', '#fbbf24', '#fcd34d'],
    info: ['#06b6d4', '#22d3ee', '#67e8f9'],
    purple: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
  };

    const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    customers: 0,
    avgOrderValue: 0
  });

  // Add stock alert states
  const [lowStockCount, setLowStockCount] = useState(0);
  const [criticalStockCount, setCriticalStockCount] = useState(0);
  const [dismissedAlerts, setDismissedAlerts] = useState({
    critical: false,
    low: false,
    out: false,
  });

  const lowStockThreshold = 5; // Adjust as needed
  const warningStockThreshold = 10; // Warning threshold

  const statsCards = [
    { 
      title: "Total Revenue", 
      value: `₱${Number(stats.totalRevenue || 0).toFixed(2)}`, 
      trend: "+8.4%", 
      increase: true, 
      icon: "💰", 
      color: "primary" 
    },
    { 
      title: "Total Orders", 
      value: stats.totalOrders || 0, 
      trend: "+3.1%", 
      increase: true, 
      icon: "📦", 
      color: "success" 
    },
    { 
      title: "Customers", 
      value: stats.customers || 0, 
      trend: "+1.8%", 
      increase: true, 
      icon: "👥", 
      color: "warning" 
    },
    { 
      title: "Avg. Order Value", 
      value: `₱${Number(stats.avgOrderValue || 0).toFixed(2)}`, 
      trend: "Stable", 
      increase: null, 
      icon: "📊", 
      color: "info" 
    },
  ];

  // Stock alert helper functions
  const hasLowStock = (product) => {
  if (product.stock > lowStockThreshold && product.stock <= warningStockThreshold) return true;
  if (product.variants?.some(
      v => v.stock > lowStockThreshold && v.stock <= warningStockThreshold
  )) return true;
  return false;
};

  const hasCriticalStock = (product) => {
    if (product.stock > 0 && product.stock <= lowStockThreshold) return true;
    if (product.variants?.some(v => v.stock > 0 && v.stock <= lowStockThreshold)) return true;
    return false;
  };

    // Calculate stock counts from products
  const calculateStockCounts = (products) => {
    let lowCount = 0;
    let criticalCount = 0;
    let outCount = 0;

    products.forEach(product => {
      // Check for out of stock
      if (product.stock === 0 || product.variants?.some(v => v.stock === 0)) {
        outCount++;
      }
      
      // Check for critical stock (excluding out of stock)
      if (hasCriticalStock(product)) {
        criticalCount++;
      }
      
      // Check for low stock (excluding critical)
      if (hasLowStock(product) && !hasCriticalStock(product)) {
        lowCount++;
      }
    });

    // FIX: Remove the call to setOutStockCount
    setLowStockCount(lowCount);
    setCriticalStockCount(criticalCount);
    // setOutStockCount(outCount); // <-- Remove or comment out this line
  };

  // Fetch backend data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [revenueRes, ordersRes, productsRes, statsRes, categoriesRes] = await Promise.all([
          axios.get("http://localhost:8800/api/dashboard/revenue-weekly"),
          axios.get("http://localhost:8800/api/dashboard/recent-orders"),
          axios.get("http://localhost:8800/api/dashboard/products"),
          axios.get("http://localhost:8800/api/dashboard/stats"),
          axios.get("http://localhost:8800/api/dashboard/top-categories")
        ]);

        // Weekly Revenue
        const weeklyData = revenueRes.data || [];
        setRevenueLabels(weeklyData.map(d => d.day || ""));
        setRevenueWeekA(weeklyData.map(d => Number(d.thisWeek || 0)));
        setRevenueWeekB(weeklyData.map(d => Number(d.lastWeek || 0)));

        // Orders, products, stats
        setOrders(ordersRes.data || []);
        const productsData = productsRes.data || [];
        setProducts(productsData);
        calculateStockCounts(productsData);
        
        setStats(statsRes.data || { totalRevenue:0, totalOrders:0, customers:0, avgOrderValue:0 });

        // Top Categories
        const topData = categoriesRes.data || { labels: [], revenue: [] };
        setTopCategories(topData.labels || []);
        setTopCategoryCounts((topData.revenue || []).map(r => Number(r)));

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };

    fetchData();
  }, []);

  // Weekly Revenue Line Chart
  const lineData = useMemo(() => ({
    labels: revenueLabels,
    datasets: [
      {
        label: "This Week",
        data: revenueWeekA,
        borderColor: gradientColors.primary[0],
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: gradientColors.primary[0],
        borderWidth: 2,
      },
      {
        label: "Last Week",
        data: revenueWeekB,
        borderColor: gradientColors.info[0],
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: gradientColors.info[0],
        borderWidth: 2,
        borderDash: [5,5],
      },
    ],
  }), [revenueLabels, revenueWeekA, revenueWeekB]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12, padding: 10, font: { size: 11 } } },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
      }
    },
    scales: {
      y: { grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { font: { size: 10 } } }
    }
  };

  // Top Categories Doughnut Chart
  const doughnutData = useMemo(() => ({
    labels: topCategories,
    datasets: [
      {
        data: topCategoryCounts,
        backgroundColor: [
          gradientColors.primary[0],
          gradientColors.success[0],
          gradientColors.warning[0],
          gradientColors.info[0],
          gradientColors.purple[0]
        ],
        borderWidth: 1,
      }
    ]
  }), [topCategories, topCategoryCounts]);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 11 } } },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
      }
    }
  };

  // Filter & sort products
  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(query.toLowerCase()) ||
                 p.category.toLowerCase().includes(query.toLowerCase()) ||
                 p.sku.toLowerCase().includes(query.toLowerCase()))
    .sort((a,b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if(["price","stock","sold"].includes(sortKey)) return dir * (a[sortKey] - b[sortKey]);
      return dir * a[sortKey].localeCompare(b[sortKey]);
    });

  const popularProducts = [...products].sort((a,b)=> b.sold - a.sold).slice(0,3);

   const outStockCount = products.filter(
    p => p.stock === 0 || p.variants?.some(v => v.stock === 0)
  ).length;
const getLowStockProducts = () => {
  return products
    .filter(p => hasLowStock(p)) // ❌ remove critical here
    .map(p => {
      const stocks = [p.stock];
      if (p.variants) p.variants.forEach(v => stocks.push(v.stock));

      const minStock = Math.min(
        ...stocks.filter(s => s > lowStockThreshold)
      );

      return {
        name: p.name,
        minStock,
        isCritical: false
      };
    })
    .sort((a, b) => a.minStock - b.minStock);
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
        <div className="main-area-dash">
          <div className="page-content-dash">
            
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
            {/* Stats Cards - Row 1 */}
            <div className="stats-grid-dash">
              {statsCards.map((card, index) => (
                <div 
                  key={index} 
                  className={`stat-card-dash stat-${card.color}-dash`}
                  style={{
                    background: `linear-gradient(135deg, ${gradientColors[card.color][0]}20, ${gradientColors[card.color][1]}10)`,
                    borderLeft: `4px solid ${gradientColors[card.color][0]}`
                  }}
                >
                  <div className="stat-header-dash">
                    <span className="stat-icon-dash">{card.icon}</span>
                    <span className="stat-trend-dash">
                      <span className={`trend-indicator-dash ${card.increase === true ? 'trend-up' : card.increase === false ? 'trend-down' : ''}`}>
                        {card.increase === true ? '↗' : card.increase === false ? '↘' : '→'}
                      </span>
                      {card.trend}
                    </span>
                  </div>
                  <div className="stat-value-dash">{card.value}</div>
                  <div className="stat-title-dash">{card.title}</div>
                </div>
              ))}
            </div>

            {/* Row 2: Revenue Trend | Top Categories | Recent Orders */}
            <div className="charts-row-dash">
              {/* Revenue Trend */}
              <div className="chart-card revenue-trend-dash">
                <div className="card-dash chart-container-wrapper">
                  <div className="card-header-dash">
                    <h3>Revenue Trend</h3>
                    <div className="time-filter-dash">
                      <span className="time-active-dash">Weekly</span>
                      <span>Monthly</span>
                      <span>Yearly</span>
                    </div>
                  </div>
                  <div className="chart-short-container">
                    <Line data={lineData} options={lineOptions} height={150} />
                  </div>
                </div>
              </div>

              {/* Top Categories */}
              <div className="chart-card top-categories-dash">
                <div className="card-dash">
                  <div className="card-header-dash">
                    <h3>Top Categories</h3>
                    <span className="card-subtitle-dash">By products sold</span>
                  </div>
                  <div className="chart-short-container" style={{height: 150}}>
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="chart-card recent-orders-dash">
                <div className="card-dash">
                  <div className="card-header-dash">
                    <h3>Recent Orders</h3>
                    <button className="view-all-btn-dash">View All →</button>
                  </div>
                  <div className="orders-list-dash">
                    {orders.map((o) => (
                      <div key={o.id} className="order-item-dash">
                        <div className="order-left-dash">
                          <div className="order-id-dash">{o.id}</div>
                          <div className="order-details-dash">
                            <div className="order-customer-dash">{o.customer}</div>
                            <div className="order-item-dash-text">{o.item}</div>
                          </div>
                        </div>
                        <div className="order-right-dash">
                          <span className={`order-status-badge-dash status-${o.status.toLowerCase()}`}>
                            {o.status}
                          </span>
                          <div className="order-amount-dash">${Number(o.total).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Best Selling Products | Most Popular Products */}
            <div className="products-row-dash">
              {/* Best Selling Products */}
              <div className="best-selling-dash">
                <div className="card-dash">
                  <div className="card-header-dash">
                    <h3>Best Selling Products</h3>
                    <div className="table-controls-dash">
                      <div className="search-box-dash">
                        <input 
                          type="text" 
                          placeholder="Search products..." 
                          value={query} 
                          onChange={e => setQuery(e.target.value)}
                        />
                        <span className="search-icon-dash">🔍</span>
                      </div>
                      <div className="sort-controls-dash">
                        <select value={sortKey} onChange={e=>setSortKey(e.target.value)}>
                          <option value="sold">Sold</option>
                          <option value="price">Price</option>
                          <option value="stock">Stock</option>
                          <option value="name">Name</option>
                        </select>
                        <button 
                          className="sort-btn-dash" 
                          onClick={()=>setSortDir(s=>s==="asc"?"desc":"asc")}
                        >
                          {sortDir==="asc"?"↑ Asc":"↓ Desc"}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="table-responsive-dash">
                    <table className="modern-table-dash">
                      <thead>
                        <tr>
                          <th>SKU</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Sold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((p, index) => (
                          <tr key={p.sku} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                            <td><span className="sku-badge-dash">{p.sku}</span></td>
                            <td><span className="product-name-dash">{p.name}</span></td>
                            <td><span className="category-badge-dash">{p.category}</span></td>
                            <td className="price-cell-dash">₱{Number(p.price).toFixed(2)}</td>
                            <td>
                              <div className="stock-indicator-dash">
                                <div 
                                  className="stock-bar-dash" 
                                  style={{width: `${Math.min((p.stock / 200) * 100, 100)}%`}}
                                ></div>
                                <span>{p.stock}</span>
                              </div>
                            </td>
                            <td className="sold-cell-dash">{p.sold}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Most Popular Products */}
              <div className="popular-products-dash">
                <div className="card-dash">
                  <div className="card-header-dash">
                    <h3>Most Popular Products</h3>
                  </div>
                  <div className="popular-products-list">
                    {popularProducts.map((p,index)=>{
                      const maxSold = Math.max(...products.map(x => x.sold));
                      const pct = Math.round((p.sold/maxSold)*100);
                      const colors = [gradientColors.primary, gradientColors.success, gradientColors.warning][index];
                      
                      return (
                        <div className="popular-item-dash" key={p.sku}>
                          <div className="popular-rank-dash">
                            <span className={`rank-circle-dash rank-${index+1}`}>#{index+1}</span>
                          </div>
                          <div className="popular-info-dash">
                            <div className="popular-name-dash">{p.name}</div>
                            <div className="popular-meta-dash">
                              <span className="category-tag-dash">{p.category}</span>
                              <span className="price-tag-dash">₱{Number(p.price).toFixed(2)}</span>
                            </div>
                            <div className="popular-progress-dash">
                              <div 
                                className="progress-bar-dash" 
                                style={{
                                  width: `${pct}%`,
                                  background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`
                                }}
                              >
                                <div className="progress-fill-dash"></div>
                              </div>
                              <span className="progress-text-dash">{p.sold} sold ({pct}%)</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}