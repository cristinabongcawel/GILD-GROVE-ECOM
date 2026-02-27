import React, { useState, useEffect, useRef } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiUser } from "react-icons/fi";
import "./log.css";

function AdminLogin() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [step, setStep] = useState(1);
  const [otpBoxes, setOtpBoxes] = useState(["", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const captchaRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = showForgotModal ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showForgotModal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleForgotChange = (e) => setForgotEmail(e.target.value);
  const handleCaptchaVerify = (token) => setCaptchaToken(token);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Enter a valid email address";
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!captchaToken) return alert("Please complete the captcha");

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8800/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...formData, captchaToken }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");

      console.log("Admin login successful", data.user);
      window.dispatchEvent(new Event("userUpdated"));
      navigate("/dashboardadmin");
    } catch (err) {
      alert(err.message || "Login failed");
      setFormData({ email: "", password: "" });
       setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const maskContact = (contact) => {
    if (!contact) return "your contact";
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      const [name, domain] = contact.split("@");
      return name.length > 3 ? name.substring(0, 3) + "****@" + domain : name + "****@" + domain;
    }
    if (/^\d{10,15}$/.test(contact)) return contact.substring(0, 3) + "****" + contact.slice(-2);
    return contact;
  };

  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otpBoxes];
    newOtp[index] = value;
    setOtpBoxes(newOtp);
    setOtpError("");
    if (value && index < 3) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpBoxes[index] && index > 0) {
      const newOtp = [...otpBoxes];
      newOtp[index - 1] = "";
      setOtpBoxes(newOtp);
      document.getElementById(`otp-${index - 1}`)?.focus();
      e.preventDefault();
    }
  };

  const startOtpTimer = () => {
    setOtpTimer(300);
    setCanResend(false);
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    if (!forgotEmail) return alert("Please enter your email or phone number");

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail);
    const isPhone = /^\d{10,15}$/.test(forgotEmail);
    if (!isEmail && !isPhone) return alert("Please enter a valid email or phone number");

    try {
      setIsLoading(true);

      const findRes = await fetch("http://localhost:8800/api/otp-res/find-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: forgotEmail, role: "Admin" }),
      });
      const findData = await findRes.json();
      if (!findRes.ok) throw new Error(findData.message || "User not found");

      const sendRes = await fetch("http://localhost:8800/api/otp-res/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "Admin", email: isEmail ? forgotEmail : undefined, phone: isPhone ? forgotEmail : undefined }),
      });
      const otpData = await sendRes.json();
      if (!sendRes.ok) throw new Error(otpData.message || "Failed to send OTP");

      setStep(2);
      startOtpTimer();
      alert("OTP sent successfully!");
    } catch (err) {
      alert(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!canResend) return;
    setOtpBoxes(["", "", "", ""]);
    await sendOtp();
  };

  const verifyOtp = async () => {
    const otpCode = otpBoxes.join("");
    if (otpCode.length !== 4) {
      setOtpError("Please enter all 4 digits");
      return;
    }

    try {
      setIsLoading(true);

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail);
      const body = { otp: otpCode, ...(isEmail ? { email: forgotEmail } : { phone: forgotEmail }) };

      const res = await fetch("http://localhost:8800/api/otp-res/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");

      setStep(3);
      alert("OTP verified successfully!");
    } catch (err) {
      setOtpError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setPasswordError("");
    if (!newPassword || !confirmPassword) {
      setPasswordError("Please enter all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    try {
      setIsLoading(true);

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail);
      const body = { newPassword, role: "Admin", ...(isEmail ? { email: forgotEmail } : { phone: forgotEmail }) };

      const res = await fetch("http://localhost:8800/api/otp-res/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");

      alert("Password reset successful! You can now login with your new password.");
      resetForgotPasswordState();
      setShowForgotModal(false);
    } catch (err) {
      setPasswordError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForgotPasswordState = () => {
    setStep(1);
    setForgotEmail("");
    setOtpBoxes(["", "", "", ""]);
    setOtpTimer(30);
    setOtpError("");
    setCanResend(false);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  const handleCloseModal = () => {
    setShowForgotModal(false);
    resetForgotPasswordState();
  };

  return (
    <>
      <div className="login-container-logad">
        <div className="image-side-logad">
          <div className="wave-container-logad">
            <div className="wave wave-1-logad"></div>
            <div className="wave wave-2-logad"></div>
            <div className="wave wave-3-logad"></div>
            <div className="wave wave-4-logad"></div>
            <div className="wave-overlay-logad"></div>
          </div>
          <div className="floating-elements-logad">
            <div className="floating-element-logad"></div>
            <div className="floating-element-logad"></div>
            <div className="floating-element-logad"></div>
            <div className="floating-element-logad"></div>
            <div className="floating-element-logad"></div>
          </div>
          <div className="image-content-logad">
            <h3 className="welcome-title-logad">Welcome Back to GILD + GROVE</h3>
            <p className="welcome-text-logad">
              Sign in to your account and continue managing your system efficiently
            </p>
          </div>
        </div>

        <div className="form-side-logad">
          <div className="form-card-logad">
            <div className="brand-logo-logad">
              <h1 className="logo-text-logad">GILD + GROVE</h1>
              <div className="logo-subtitle-logad">Admin Portal</div>
            </div>

            <div className="form-header-logad">
              <h3>Sign In to Your Account</h3>
              <p className="desc-logad">Enter your credentials to access the portal</p>
            </div>

            <form className="form-logad" onSubmit={handleSubmit}>
              <div className="form-group-logad">
                <label>Email Address</label>
                <div className="input-wrapper-logad">
                  <FiMail className="input-icon-logad" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    className={errors.email ? "input-error-logad" : ""}
                  />
                </div>
                {errors.email && <small className="error-text-logad">{errors.email}</small>}
              </div>

              <div className="form-group-logad">
                <label>Password</label>
                <div className="input-wrapper-logad">
                  <FiLock className="input-icon-logad" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={errors.password ? "input-error-logad" : ""}
                  />
                </div>
                {errors.password && <small className="error-text-logad">{errors.password}</small>}
                <div className="forgot-container-logad">
                  <button type="button" className="forgot-link-logad" onClick={() => setShowForgotModal(true)}>
                    Forgot password?
                  </button>
                </div>
              </div>

              <div className="captcha-wrapper-logad">
                <HCaptcha sitekey={process.env.REACT_APP_HCAPTCHA_SITEKEY} onVerify={handleCaptchaVerify}   ref={captchaRef}/>
              </div>

              <div className="actions-row-logad">
                <button type="submit" className="continue-btn-logad" disabled={isLoading}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showForgotModal && (
        <div className="modal-overlay-logad" onClick={handleCloseModal}>
          <div className="modal-container-logad" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-logad">
              <h3 className="modal-title-logad">
                {step === 1 ? "Forgot Password" : step === 2 ? "Verify OTP" : "Reset Password"}
              </h3>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>

            <div className="step-content-logad">
              {step === 1 && (
                <>
                  <p className="step-description-logad">
                    Enter your email address to receive a verification code.
                  </p>
                  <div className="input-group-logad">
                    <FiUser className="input-icon-logad" />
                    <input type="text" value={forgotEmail} onChange={handleForgotChange} placeholder="you@company.com or 09123456789" />
                  </div>
                  <button className="submit-btn-logad" onClick={sendOtp} disabled={isLoading}>
                    {isLoading ? <div className="spinner-logad"></div> : "Send OTP"}
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <p className="step-description-logad">
                    Enter the 4-digit code sent to <strong>{maskContact(forgotEmail)}</strong>
                  </p>
                  <div className="otp-box-container-logad">
                    {otpBoxes.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        className="otp-box-logad"
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                  {otpError && <p className="error-message-logad">{otpError}</p>}
                  <div className="otp-timer-logad">
                    {otpTimer > 0 ? (
                      <p>
                        Resend in <strong>{Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, "0")}</strong>
                      </p>
                    ) : (
                      <button className="resend-btn-logad" onClick={resendOtp}>Resend OTP</button>
                    )}
                  </div>
                  <button className="submit-btn-logad" onClick={verifyOtp} disabled={isLoading}>
                    {isLoading ? <div className="spinner-logad"></div> : "Verify OTP"}
                  </button>
                </>
              )}

              {step === 3 && (
                <>
                  <p className="step-description-logad">Choose a new password for your account.</p>
                  <div className="input-group-logad">
                    <FiLock className="input-icon-logad" />
                    <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <div className="input-group-logad">
                    <FiLock className="input-icon-logad" />
                    <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  {passwordError && <p className="error-message-logad">{passwordError}</p>}
                  <button className="submit-btn-logad" onClick={handleResetPassword} disabled={isLoading}>
                    {isLoading ? <div className="spinner-logad"></div> : "Reset Password"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminLogin;
