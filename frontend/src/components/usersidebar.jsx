import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiUser, FiBox, FiHeart, FiStar, FiHelpCircle, FiMessageCircle, FiLogOut,} from "react-icons/fi";
import "./usersidebar.css";

export default function UserSidebar() {
  const [showModal, setShowModal] = useState(false);
  const [userData, setUserData] = useState({
    image: "/default-avatar.png",
    first_name: "User",
    userID: null,
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const current = location.pathname;

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (!storedUser?.userID) return; // must have userID
        const userId = storedUser.userID;

        const response = await fetch(`http://localhost:8800/api/profile/get/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch user data");

        const data = await response.json();

        const firstName = data.first_name || storedUser.first_name || "User";
        const lastName = data.last_name || storedUser.last_name || "";

        const imageUrl =
          data.image?.data
            ? `data:image/png;base64,${Buffer.from(data.image.data).toString("base64")}`
            : data.profile_image
            ? data.profile_image
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=random&rounded=true`;

        const updatedUser = {
          userID: data.userID || userId,
          first_name: data.first_name || storedUser.first_name || "User",
          last_name: data.last_name || storedUser.last_name || "",
          image: imageUrl,
        };

        setUserData(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();

    window.addEventListener("userUpdated", loadUserData);
    return () => window.removeEventListener("userUpdated", loadUserData);
  }, []);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleLogout = async () => {
  try {
    const response = await fetch("http://localhost:8800/api/logout", {
      method: "POST",
      credentials: "include", // ✅ must be included for sessions
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || "Failed to logout");
    }

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");

    setUserData({ image: "/default-avatar.png", first_name: "User", userID: null });
    window.dispatchEvent(new Event("userUpdated"));
    window.dispatchEvent(new Event("cartUpdated"));
    navigate("/");
  } catch (err) {
    console.error("Logout error:", err);
    alert(err.message || "Logout failed");
  }
};


  return (
    <>
      <div className="profile-sidebar">
        <div className="user-summary">
          <div className="avatar-container">
            <img
              src={userData.image || "/default-avatar.png"}
              alt="Profile"
              className="user-avatar"
            />
          </div>
          <h3>{userData.first_name || "User"}</h3>
        </div>

        <ul className="nav-menu">
          <Link
            to="/userprof"
            className={`nav-item ${current.startsWith("/userprof") ? "active" : ""}`}
          >
            <FiUser className="nav-icon" /> My Profile
          </Link>

          <Link
            to="/ordertabs"
            className={`nav-item ${current.startsWith("/ordertabs") ? "active" : ""}`}
          >
            <FiBox className="nav-icon" /> Orders
          </Link>

          <Link
            to="/myreview"
            className={`nav-item ${current.startsWith("/myreview") ? "active" : ""}`}
          >
            <FiStar className="nav-icon" /> My Reviews
          </Link>

          <Link
            to="/messages"
            className={`nav-item ${current.startsWith("/messages") ? "active" : ""}`}
          >
            <FiMessageCircle className="nav-icon" /> Chat with Gild Crew
          </Link>

          <button className="nav-item logout-btn" onClick={openModal}>
            <FiLogOut className="nav-icon" /> Logout
          </button>
        </ul>

      </div>

            {showModal && (
              <div className="modal-overlay-log" onClick={() => setShowModal(false)}>
                <div className="modal-log" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-icon">
                    <FiLogOut />
                  </div>
                  <h2>Confirm Logout</h2>
                  <p>Are you sure you want to log out?</p>
                  <div className="modal-buttons-log">
                    <button 
                      className="btn-cancel-log" 
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn-confirm-log" 
                      onClick={handleLogout}
                      disabled={loading}
                    >
                      {loading ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                </div>
              </div>
            )}
    </>
  );
}
