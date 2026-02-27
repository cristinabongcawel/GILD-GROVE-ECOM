import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEdit3 } from "react-icons/fi";
import locations from "./location.json";
import {FiMail, FiPhone} from "react-icons/fi";
import "./userprofile.css";
import UserSidebar from "./usersidebar";

const UserProfile = () => {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = storedUser?.userID;
  const [user, setUser] = useState(storedUser || null);
  const [image, setImage] = useState("/default-avatar.png");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");          // selected region
  const [regionOptions, setRegionOptions] = useState([]); // regions in the selected country
  const [cityOptions, setCityOptions] = useState([]);
  const [country, setCountry] = useState("PH"); // default Philippines
  const [countryOptions, setCountryOptions] = useState([]);
  const [zipCode, setZipCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [otpDestination, setOtpDestination] = useState(""); // will store email or phone for display
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]); // 4 boxes
  const [tempCurrentPassword, setTempCurrentPassword] = useState("");
  const [tempNewPassword, setTempNewPassword] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteOTPModal, setShowDeleteOTPModal] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState(["", "", "", ""]);
  const [deleteOtpDestination, setDeleteOtpDestination] = useState("");
  const [confirmDeleteWord, setConfirmDeleteWord] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const navigate = useNavigate();

useEffect(() => {
  if (locations?.countries?.length) {
    setCountryOptions(locations.countries);

    // Default selected country
    const selectedCountry = locations.countries.find(c => c.code === country) || locations.countries[0];
    setRegionOptions(selectedCountry.regions);
  }
}, []);

useEffect(() => {
  const selectedCountry = countryOptions.find(c => c.code === country);
  if (selectedCountry) {
    setRegionOptions(selectedCountry.regions);
    setCityOptions([]);
  } else {
    setRegionOptions([]);
    setCityOptions([]);
  }
}, [country, countryOptions]);

useEffect(() => {
  const selectedRegion = regionOptions.find(r => r.code === region);
  if (selectedRegion) setCityOptions(selectedRegion.cities);
  else setCityOptions([]);
}, [region, regionOptions]);


useEffect(() => {
  if (!userId || countryOptions.length === 0) return;

  const loadUser = async () => {
    try {
      const res = await fetch(`http://localhost:8800/api/profile/get/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user data");
      const data = await res.json();

      console.log("Backend user data:", data); // 🔵 Check backend response

      // Map country name to country code
      const selectedCountry = countryOptions.find(c => c.name === data.country) || countryOptions[0];
      setCountry(selectedCountry.code);

      // Map region name to region code
      const selectedRegion = selectedCountry.regions.find(r => r.name === data.region);
      setRegion(selectedRegion ? selectedRegion.code : "");

      // Set cities based on selected region
      const cities = selectedRegion?.cities || [];
      setCityOptions(cities);

      // Map city directly (usually name matches)
      setCity(data.city || "");

      // Other fields
      setZipCode(data.zip_code || "");
      setAddress(data.address || "");
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");

      // Profile image fallback logic
      let profileImage = "/default-avatar.png"; // default fallback
      if (data.image?.data) {
        profileImage = `data:image/png;base64,${Buffer.from(data.image.data).toString("base64")}`;
      } else if (data.profile_image) {
        profileImage = data.profile_image;
      } else if (user?.image) {
        profileImage = user.image; // stored local fallback
      } else {
        // fallback to initials avatar
        profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.first_name)}+${encodeURIComponent(data.last_name)}&background=random&rounded=true`;
      }

      setImage(profileImage);

      const updatedUser = { ...data, image: profileImage };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("userUpdated"));
    } catch (err) {
      console.error(err);
    }
  };

  loadUser();
}, [userId, countryOptions]);

  const handleLogout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  setUser(null);
  setImage("https://i.pravatar.cc/300?img=12");

  window.dispatchEvent(new Event("userUpdated"));
  navigate("/");
};

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setImage(URL.createObjectURL(file));
  };

  const triggerFileInput = () => {
    document.getElementById("upload-photo").click();
  };

  const handleSaveProfile = async () => {
    try {
      let profile_image_base64 = null;
      if (image && image.startsWith("blob:")) {
        const blob = await fetch(image).then(r => r.blob());
        profile_image_base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }

      const payload = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        country,
        region,
        city,
        zip_code: zipCode,
        address,
        profile_image_base64,
      };

      const res = await fetch(`http://localhost:8800/api/profile/update/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Profile updated successfully!");
        setIsEditing(false);

        // Update localStorage & sidebar
        const updatedUser = { ...user, ...payload };
        if (profile_image_base64) updatedUser.image = profile_image_base64;
        setUser(updatedUser);
        setImage(updatedUser.image);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("userUpdated"));
      } else {
        alert(data.message || "Error updating profile");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating profile");
    }
  };

const handleSendOTP = async (action) => {
  try {
    let payload = {};
    if (email) payload.email = email;
    else if (phone) payload.phone = phone;
    else return alert("Email or phone required for OTP");

    const res = await fetch(`http://localhost:8800/api/otp-res/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      if (action === "password") setOtpDestination(email || phone);
      if (action === "delete") setDeleteOtpDestination(email || phone);

      if (action === "password") {
        setShowPasswordModal(false);
        setShowOTPModal(true);
      } else if (action === "delete") {
        setShowDeleteModal(false);
        setShowDeleteOTPModal(true);
      }
    } else {
      alert(data.message || "Error sending OTP");
    }
  } catch (err) {
    console.error(err);
    alert("Error sending OTP");
  }
};

  const handleVerifyOTP = async (action) => {
  const code = (action === "password" ? otp : deleteOtp).join("");
  if (code.length !== 4) return alert("Enter complete 4-digit OTP");

  try {
    const payload = { email, otp: code };
    const res = await fetch(`http://localhost:8800/api/profile/otp-res/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      if (action === "password") {
        setShowOTPModal(false);
        // proceed to update password
        const updateRes = await fetch(`http://localhost:8800/api/profile/updatepassword/${userId}/password`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: tempCurrentPassword, newPassword: tempNewPassword }),
        });
        const updateData = await updateRes.json();
        if (updateRes.ok) alert("Password updated successfully!");
        else alert(updateData.message || "Error updating password");

        setOtp(["", "", "", ""]);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

      } else if (action === "delete") {
        setShowDeleteOTPModal(false);
        setConfirmDeleteWord(""); // reset input
        setShowConfirmDelete(true); // modal to type DELETE
      }
    } else {
      alert(data.message || "Incorrect OTP");
    }
  } catch (err) {
    console.error(err);
    alert("OTP verification error");
  }
};


  const handleOtpChange = (value, index) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) document.getElementById(`otp-box-${index + 1}`)?.focus();
  };

const handleDeleteAccount = async () => {
  if (confirmDeleteWord !== "DELETE") return alert('Type "DELETE" to confirm');

  try {
    const res = await fetch(`http://localhost:8800/api/profile/delete/${userId}`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (res.ok) {
      alert("Account deleted successfully!");
      handleLogout();
    } else {
      alert(data.message || "Error deleting account");
    }
  } catch (err) {
    console.error(err);
    alert("Error deleting account");
  }
};
  return (
    <div className="profile-page">
      <div className="profile-container">
        <UserSidebar />

        {/* MAIN CONTENT - REMOVED SCROLL */}
        <div className="profile-main">
          <div className="edit-panel">

            {!isEditing && (
              <button className="edit-pencil-btn" onClick={() => setIsEditing(true)}>
                <FiEdit3 size={20} />
              </button>
            )}

            {/* PHOTO UPLOAD */}
            <div className="photo-upload-section">
              <div className="upload-preview">
                <img src={image} alt="Profile Preview" />
                {isEditing && (
                  <div className="upload-overlay" onClick={triggerFileInput}>Change Photo</div>
                )}
                <input type="file" id="upload-photo" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
              </div>

              <div className="upload-info">
                <h4>Profile Picture</h4>
                <p>Upload a clear photo of yourself.</p>
                <p><strong>Requirements:</strong> JPG/PNG, max 2MB, 400×400</p>
              </div>
            </div>

            {/* PERSONAL INFO */}
            <div className="form-section">
              <h2 className="section-title">Personal Information</h2>

              <form className="form-grid">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input type="text" className="form-input" value={firstName} disabled={!isEditing}onChange={(e) => setFirstName(e.target.value)}/>
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input type="text" className="form-input" value={lastName} disabled={!isEditing} onChange={(e) => setLastName(e.target.value)}/>
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <div className="input-with-icon">
                     <FiMail className="input-icon"/>
                    <input type="email" className="form-input" value={email} disabled={!isEditing} onChange={(e) => setEmail(e.target.value)}/>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div className="input-with-icon">
                    <FiPhone className="input-icon"/>
                    <input type="tel" className="form-input" value={phone} disabled={!isEditing}onChange={(e) => setPhone(e.target.value)}/>
                  </div>
                </div>
              </form>

            <p className="delete-account-link" onClick={() => setShowDeleteModal(true)}>
              Delete Account
            </p>
              <p
                className="change-password-link"
                onClick={() => setShowPasswordModal(true)}
              >
              Change Password
              </p>
            </div>

            <div className="form-section">
              <h2 className="section-title">Address Information</h2>

              <form className="form-grid">
                {/* COUNTRY */}
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <select
                    className="form-input"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    disabled={!isEditing}
                  >
                    <option value="" disabled hidden>Select Country</option>
                    {countryOptions.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* REGION */}
                <div className="form-group">
                  <label className="form-label">Region</label>
                  <select
                    className="form-input"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    disabled={!isEditing || regionOptions.length === 0}
                  >
                    <option value="" disabled hidden>Select Region</option>
                    {regionOptions.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CITY */}
                <div className="form-group">
                  <label className="form-label">City</label>
                  <select
                    className="form-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!isEditing || cityOptions.length === 0}
                  >
                    <option value="" disabled hidden>Select City</option>
                    {cityOptions.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Zip Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter Zip Code"
                  />
                </div>

                <div className="form-group full">
                  <label className="form-label">Street Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={address}
                    disabled={!isEditing}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </form>
            </div>
            {/* BOTTOM BUTTONS */}
            {isEditing && (
              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setIsEditing(false)}>Discard Changes</button>
                <button className="btn-primary" onClick={handleSaveProfile}>Save Profile Changes</button>
              </div>
            )}

          </div>
        </div>
      </div>

      {showPasswordModal && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h3>Change Password</h3>

      <div className="modal-group">
        <label>Current Password</label>
        <input
          type="password"
          className="modal-input"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>

      <div className="modal-group">
        <label>New Password</label>
        <input
          type="password"
          className="modal-input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>

      <div className="modal-group">
        <label>Confirm New Password</label>
        <input
          type="password"
          className="modal-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <div className="modal-actions">
        <button className="btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
       <button className="btn-primary" onClick={() => handleSendOTP("password")}>Update Password</button>

      </div>
    </div>
  </div>
)}
    {showOTPModal && (
        <div className="modal-overlay">
          <div className="modal-box">

            <h3>OTP Verification</h3>
            <p>
              4-digit code sent to{" "}
              <strong>
                {otpDestination.includes("@") 
                  ? otpDestination.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + "*".repeat(b.length)) // mask email
                  : otpDestination.replace(/(\d{4})(\d+)(\d{3})/, (_, a, b, c) => a + "*".repeat(b.length) + c) // mask phone
                }
              </strong>
            </p>

            <div className="otp-container">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-box-${i}`}
                  type="text"
                  maxLength="1"
                  className="otp-box"
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                />
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowOTPModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={() => handleVerifyOTP("password")}>Verify OTP</button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="logout-overlay">
          <div className="logout-modal">
            <p>Are you sure you want to log out?</p>
            <div className="logout-actions">
              <button className="btn-cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn-logout" onClick={handleLogout}>Yes, Log Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Delete Account Modal */}
          {showDeleteModal && (
            <div className="modal-overlay">
              <div className="modal-box">
                <h3>Delete Account</h3>
                <p>Are you sure you want to delete your account? This action is irreversible.</p>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                 <button className="btn-primary" onClick={() => handleSendOTP("delete")}>Send OTP</button>
                </div>
              </div>
            </div>
          )}

          {/* OTP Verification for Delete */}
          {showDeleteOTPModal && (
            <div className="modal-overlay">
              <div className="modal-box">
                <h3>OTP Verification</h3>
                <p>
                  4-digit code sent to{" "}
                  <strong>
                    {deleteOtpDestination.includes("@") 
                      ? deleteOtpDestination.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + "*".repeat(b.length))
                      : deleteOtpDestination.replace(/(\d{4})(\d+)(\d{3})/, (_, a, b, c) => a + "*".repeat(b.length) + c)
                    }
                  </strong>
                </p>

                <div className="otp-container">
                  {deleteOtp.map((digit, i) => (
                    <input
                      key={i}
                      id={`delete-otp-box-${i}`}
                      type="text"
                      maxLength="1"
                      className="otp-box"
                      value={digit}
                      onChange={(e) => {
                        const newOtp = [...deleteOtp];
                        newOtp[i] = e.target.value;
                        setDeleteOtp(newOtp);
                        if (e.target.value && i < 3) document.getElementById(`delete-otp-box-${i + 1}`)?.focus();
                      }}
                    />
                  ))}
                </div>

                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setShowDeleteOTPModal(false)}>Cancel</button>
                 <button className="btn-primary" onClick={() => handleVerifyOTP("delete")}>Verify OTP</button>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Delete "Type DELETE" */}
          {showConfirmDelete && (
            <div className="modal-overlay">
              <div className="modal-box">
                <h3>Confirm Account Deletion</h3>
                <p>Type <strong>DELETE</strong> to permanently delete your account.</p>
                <input
                  type="text"
                  className="modal-input"
                  value={confirmDeleteWord}
                  onChange={(e) => setConfirmDeleteWord(e.target.value)}
                />
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setShowConfirmDelete(false)}>Cancel</button>
                  <button className="btn-primary" onClick={handleDeleteAccount}>Delete Account</button>
                </div>
              </div>
            </div>
          )}

    </div>
  );
};

export default UserProfile;