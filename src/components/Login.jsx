// Login.jsx
import React, { useState } from "react";
import loginImage from "../components/images/denim.jpg"; // replace with your hero image
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faApple, faWindows } from "@fortawesome/free-brands-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "Required";
    if (!formData.password.trim()) newErrors.password = "Required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8800/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed")
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      localStorage.setItem("user_id", data.user.userID);
      console.log("Login successful, user stored:", data.user);
      debugger;
      window.dispatchEvent(new Event("userUpdated"));
      navigate("/");
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-hero">
      <div className="login-left">
        <div className="login-form-wrapper">
          <h2 className="brand">GILD + GROVE</h2>
          <h1 className="title">Welcome Back</h1>
          <p className="subtitle">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "error" : ""}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "error" : ""}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-options">
              <label className="remember">
                <input type="checkbox" /> Remember me
              </label>
              <Link to="#" className="forgot">Forgot Password?</Link>
            </div>

            <button type="submit" className="login-btn">{loading ? "Logging in..." : "LOG IN"}</button>

            {errors.general && <div className="general-error">{errors.general}</div>}
          </form>

          <div className="divider">or continue with</div>
          <div className="social-login">
            <button><FontAwesomeIcon icon={faGoogle} /></button>
            <button><FontAwesomeIcon icon={faApple} /></button>
            <button><FontAwesomeIcon icon={faWindows} /></button>
          </div>

          <p className="signup">
            Don't have an account? <Link to="/sign">Sign Up</Link>
          </p>
        </div>
      </div>

      <div className="login-right" style={{ backgroundImage: `url(${loginImage})` }} />
    </div>
  );
}

export default Login;
