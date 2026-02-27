import React, { useState, useEffect, useRef } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faApple, faWindows } from "@fortawesome/free-brands-svg-icons";
import { FiUser, FiLock } from "react-icons/fi";
import "./login.css";

export default function Login({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
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
  const handleCaptchaVerify = (token) => setCaptchaToken(token);

  useEffect(() => {
    document.body.style.overflow = showForgotModal ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showForgotModal]);

  if (!isOpen && !showForgotModal) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setHasError(false);
    setError("");
  };

  const handleForgotChange = (e) => setForgotEmail(e.target.value);

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!captchaToken) {
    setHasError(true);
    setError("Please complete the captcha.");
    captchaRef.current?.resetCaptcha();
    return;
  }

  if (!formData.identifier || !formData.password) {
    triggerError();
    return;
  }

  setLoading(true);

  try {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier);
    const isPhone = /^09\d{9}$/.test(formData.identifier);

    if (!isEmail && !isPhone) {
      setHasError(true);
      setError("Enter a valid email or phone number");
      setLoading(false);
      return;
    }

    const body = isEmail
      ? { email: formData.identifier, password: formData.password }
      : { phone: formData.identifier, password: formData.password };

    const res = await fetch("http://localhost:8800/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...body, captchaToken }),
    });

    const data = await res.json();
    console.log("Login response:", data);

    if (!res.ok || !data.user) {   // ✅ safe check
      triggerError();
      return;
    }

    const user = {
      userID: data.user.userID || data.user.id,
      first_name: data.user.first_name,
      last_name: data.user.last_name,
      image: data.user.image || null,
    };

    localStorage.setItem("user", JSON.stringify(user));
    if (data.token) localStorage.setItem("token", data.token);
    window.dispatchEvent(new Event("userUpdated"));

    // Optional speech
    const msg = new SpeechSynthesisUtterance(`Welcome ${user.first_name}`);
    window.speechSynthesis.speak(msg);

    onClose();
    setFormData({ identifier: "", password: "" });
    navigate("/shop");

  } catch (err) {
    console.error(err);
    triggerError();
  } finally {
    setLoading(false);
  }
};

  const triggerError = () => {
    setHasError(true);
    setError("Invalid Credentials");
    setFormData({ identifier: "", password: "" });
    setCaptchaToken(null);          // reset token
    captchaRef.current?.resetCaptcha(); // reset HCaptcha visually
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
    setOtpTimer(30);
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
    if (!forgotEmail) {
      alert("Please enter your email or phone number");
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail);
    const isPhone = /^09\d{9}$/.test(forgotEmail);
    if (!isEmail && !isPhone) {
      alert("Please enter a valid email or phone number");
      return;
    }

    try {
      setForgotLoading(true);

      // FIND USER - Changed role to "User" for regular users
      const findRes = await fetch("http://localhost:8800/api/otp-res/find-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          emailOrPhone: forgotEmail, 
          role: "Customer"  // Changed from "Admin" to "User"
        }),
      });
      
      const findData = await findRes.json();
      if (!findRes.ok) throw new Error(findData.message || "User not found");

      // SEND OTP - Changed role to "User" for regular users
      const sendRes = await fetch("http://localhost:8800/api/otp-res/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          role: "Customer",  // Changed from "Admin" to "User"
          email: isEmail ? forgotEmail : undefined, 
          phone: isPhone ? forgotEmail : undefined 
        }),
      });
      
      const otpData = await sendRes.json();
      if (!sendRes.ok) throw new Error(otpData.message || "Failed to send OTP");

      setStep(2);
      startOtpTimer();
      alert("OTP sent successfully!");
    } catch (err) {
      alert(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setForgotLoading(false);
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
      setForgotLoading(true);

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail);
      const body = { 
        otp: otpCode, 
        ...(isEmail ? { email: forgotEmail } : { phone: forgotEmail }) 
      };

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
      setForgotLoading(false);
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
      setForgotLoading(true);

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail);
      const body = { 
        newPassword, 
        role: "Customer",  // Changed from "Admin" to "User"
        ...(isEmail ? { email: forgotEmail } : { phone: forgotEmail }) 
      };

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
      setForgotLoading(false);
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
      {isOpen && (
        <div className="login-overlay">
          <div className="login-box">
            <button className="close-btn" onClick={onClose}>×</button>

            <h2 className="title-login">Welcome Back</h2>
            <p className="subtitle">Sign in to your account</p>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-group-login">
                <span className="input-label-login">Email or Phone</span>
                <input
                  type="text"
                  name="identifier"
                  placeholder="Enter your email or phone"
                  value={formData.identifier}
                  onChange={handleChange}
                  className={`input-field-login ${hasError ? "error" : ""}`}
                />
              </div>

              <div className="input-group-login">
                <span className="input-label-login">Password</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field-login ${hasError ? "error" : ""}`}
                />
                <div className="forgot-container">
                  <button 
                    type="button" 
                    className="forgot-password" 
                    onClick={() => setShowForgotModal(true)}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {error && <div className="error-text-login">{error}</div>}
              <div className="input-group-login">
                <HCaptcha
                  sitekey={process.env.REACT_APP_HCAPTCHA_SITEKEY}
                  onVerify={handleCaptchaVerify}
                  ref={captchaRef}
                />
              </div>

              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "LOG IN"}
              </button>
            </form>

            <div className="divider">or continue with</div>

            <div className="social-login">
              <button><FontAwesomeIcon icon={faGoogle} /></button>
              <button><FontAwesomeIcon icon={faApple} /></button>
              <button><FontAwesomeIcon icon={faWindows} /></button>
            </div>

            <p className="signup">
              Don&apos;t have an account? <Link to="/sign" onClick={onClose}>Sign Up</Link>
            </p>
          </div>
        </div>
      )}
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
            <button className="submit-btn-logad" onClick={sendOtp} disabled={forgotLoading}>
              {forgotLoading ? <div className="spinner-logad"></div> : "Send OTP"}
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
            <button className="submit-btn-logad" onClick={verifyOtp} disabled={forgotLoading}>
              {forgotLoading ? <div className="spinner-logad"></div> : "Verify OTP"}
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
            <button className="submit-btn-logad" onClick={handleResetPassword} disabled={forgotLoading}>
              {forgotLoading ? <div className="spinner-logad"></div> : "Reset Password"}
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