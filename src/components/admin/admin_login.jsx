import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./log.css";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8800/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token or user data if needed
        localStorage.setItem("token", data.token);
        alert("Login successful!");
        navigate("/adminprod"); // Redirect to dashboard or home page
      } else {
        alert(data.message || "Login failed");
        setFormData({ email: "", password: "" });
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Image Side with Wave Animation */}
      <div className="image-side">
        <div className="wave-container">
          <div className="wave wave-1"></div>
          <div className="wave wave-2"></div>
          <div className="wave wave-3"></div>
          <div className="wave wave-4"></div>
          <div className="wave-overlay"></div>
        </div>
        <div className="floating-elements">
          <div className="floating-element"></div>
          <div className="floating-element"></div>
          <div className="floating-element"></div>
          <div className="floating-element"></div>
          <div className="floating-element"></div>
        </div>
        <div className="image-content">
          <div className="icon">🔐</div>
          <h3>Welcome Back to FHR</h3>
          <p>Sign in to your account and continue managing your system efficiently</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="form-side">
        <div className="form-card">
          <div className="brand-logo">
            <h1 className="logo-text">GILD + GROVE</h1>
            <div className="logo-subtitle">Admin Portal</div>
          </div>

          <div className="form-header">
            <h3>Sign In to Your Account</h3>
            <p className="desc">Enter your credentials to access the portal</p>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange}
                placeholder="you@company.com"
                className={errors.email ? "input-error" : ""}
              />
              {errors.email && <small className="error-text">{errors.email}</small>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange}
                placeholder="Enter your password"
                className={errors.password ? "input-error" : ""}
              />
              {errors.password && <small className="error-text">{errors.password}</small>}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
              <a href="/forgot-password" className="forgot-link">Forgot password?</a>
            </div>

            <div className="actions-row">
              <button 
                type="submit" 
                className="continue-btn"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </div>

            <div className="signup-link">
              Don't have an account? <Link to="/adminreg">Create account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;