import React, { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import "./order.css";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = orders.slice(indexOfFirst, indexOfLast);

  const nextPage = () => {
    if (currentPage < Math.ceil(orders.length / rowsPerPage)) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  useEffect(() => {
    fetch("http://localhost:8800/api/admin/adminorder/order-history")
      .then((res) => res.json())
      .then((data) => {
              console.log("Orders from backend:", data); // <- add this here
        setOrders(
          data.map((o) => ({
            id: o.order_number,
            order_number: o.order_number,
            date: o.created_at.split("T")[0],
            user_id: o.userID,
            destination: o.delivery_address,
            items: o.products.length,
            status: o.status,
            products: o.products.map((p) => ({
              name: p.name,
              info: `Qty: ${p.quantity} | Price: ₱${p.price}`,
              image: p.image_url ? p.image_url : null,
            })),
          }))
        );
      })
      .catch((err) => console.error(err));
  }, []);

  const handleStatusChange = async (orderID, newStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderID ? { ...order, status: newStatus } : order
      )
    );
    try {
      await fetch(
        `http://localhost:8800/api/admin/adminorder/update-order/${orderID}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="admin-page">
      <Sidebar />
      <div className="admin-content">
        <Header />

        <div className="orders-container">
          <h2>Orders</h2>

          <div className="toolbar">
            <input
              type="text"
              placeholder="Search Order Number"
              className="search-input"
            />
            <div className="filters">
              <select>
                <option>Date</option>
              </select>
              <select>
                <option>Status</option>
              </select>
              <select>
                <option>Destination</option>
              </select>
            </div>

            <div className="actions">
              <button className="btn primary">Print WayBill</button>
            </div>
          </div>

          <table className="orders-table">
            <thead>
              <tr>
                <th></th>
                <th>Order Number</th>
                <th>Date</th>
                <th>Customer ID</th>
                <th>Destination</th>
                <th>Items</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {currentRows.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className="order-row">
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
                    <td className="blue-link">{order.order_number}</td>
                    <td>{order.date}</td>
                    <td>{order.user_id}</td>
                    <td>{order.destination}</td>
                    <td>{order.items}</td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        className={`status-select ${order.status.toLowerCase()}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="shipping">Shipped</option>
                        <option value="completed">Delivered</option>
                      </select>
                    </td>
                  </tr>

                  {expandedRows[order.id] && order.products.length > 0 && (
                    <tr className="details-row">
                      <td></td>
                      <td colSpan={6}>
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
              ))}
            </tbody>
          </table>

          <div className="pagination-controls">
            <button onClick={prevPage} disabled={currentPage === 1}>
              Previous
            </button>

            <span>
              Page {currentPage} of {Math.ceil(orders.length / rowsPerPage)}
            </span>

            <button
              onClick={nextPage}
              disabled={currentPage === Math.ceil(orders.length / rowsPerPage)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
