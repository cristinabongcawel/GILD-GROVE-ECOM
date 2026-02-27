import React, { useState, useEffect } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useNavigate } from "react-router-dom";
import "./sign.css";
import locationsData from "./location.json";
import Select from "react-select";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleCaptchaVerify = (token) => {
  setCaptchaToken(token);
};

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    region: "",
    city: "",
    address: "",
    zipcode: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [stepLoadingText, setStepLoadingText] = useState("");
  const [country, setCountry] = useState(null);
  const [region, setRegion] = useState(null);
  const [city, setCity] = useState(null);

  const selectedCountry = locationsData.countries.find(
    (c) => c.code === country?.value
  );
  const selectedRegion = selectedCountry?.regions.find(
    (r) => r.code === region?.value
  );

  const countryOptions = locationsData.countries.map((c) => ({
    value: c.code,
    label: c.name,
  }));

  const regionOptions =
    selectedCountry?.regions.map((r) => ({
      value: r.code,
      label: r.name,
    })) || [];

  const cityOptions =
    selectedRegion?.cities.map((c) => ({
      value: c.name,
      label: c.name,
    })) || [];

  // OTP STATES
  const [otpBoxes, setOtpBoxes] = useState(["", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otpError, setOtpError] = useState("");

  // HANDLE INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updatedFormData = { ...prev, [name]: value };
      validateField(name, value, updatedFormData);

      if (name === "password" && updatedFormData.confirmPassword) {
        validateField("confirmPassword", updatedFormData.confirmPassword, updatedFormData);
      }

      if (name === "confirmPassword" && updatedFormData.password) {
        validateField("confirmPassword", value, updatedFormData);
      }

      return updatedFormData;
    });
  };

  // FIELD VALIDATION
  const validateField = (field, value, currentForm = formData) => {
    let error = "";
    switch (field) {
      case "firstName":
        if (!value.trim()) error = "First Name is required.";
        else if (value.trim().length < 2) error = "Invalid First Name.";
        break;
      case "lastName":
        if (!value.trim()) error = "Last Name is required.";
        else if (value.trim().length < 2) error = "Invalid Last Name.";
        break;
      case "phone":
        if (value && !/^[0-9]{11}$/.test(value))
          error = "Phone number must be 11 digits.";
        break;
      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          error = "Enter a valid email.";
        break;
      case "password":
        if (!value) error = "Password is required.";
        else if (value.length < 8) error = "Password must be at least 8 characters.";
        else if (!/[A-Z]/.test(value)) error = "Password must contain an uppercase letter.";
        else if (!/[a-z]/.test(value)) error = "Password must contain a lowercase letter.";
        else if (!/[0-9]/.test(value)) error = "Password must contain a number.";
        else if (!/[!@#$%^&*(),.?":{}|<>_=-]/.test(value))
          error = "Password must contain a special character.";
        break;
      case "confirmPassword":
        if (!value) error = "Confirm Password is required.";
        else if (value !== currentForm.password) error = "Passwords do not match.";
        break;
      case "address":
        if (!value.trim()) error = "Address is required.";
        break;
      case "zipcode":
        if (!value.trim()) error = "ZIP Code is required.";
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  // STEP 1 → STEP 2
  const nextStep = (e) => {
    e.preventDefault();

    if (!formData.email && !formData.phone) {
      alert("Please provide either email or phone.");
      return;
    }

    if (Object.values(errors).some((err) => err)) {
      alert("Fix errors before continuing.");
      return;
    }

    setStep(2);
  };

  // OTP TIMER
  const startOtpTimer = () => {
    setOtpTimer(300);
    setCanResend(false);

    let interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // STEP 2 → SEND OTP
  const handleAddressNext = async (e) => {
    e.preventDefault();

    if (!country || !region || !city || !formData.address || !formData.zipcode) {
      alert("Please complete your address details.");
      return;
    }

    if (!formData.email && !formData.phone) {
      alert("Provide either email or phone for OTP.");
      return;
    }

    if (!captchaToken) {
    alert("Please complete the captcha.");
    return;
  }

    try {
      setStepLoadingText("Sending OTP...");
      setLoading(true);

      const res = await fetch("http://localhost:8800/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email || "",
          phone: formData.phone || "",
          captchaToken, 
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message);
        return;
      }

      setStep(3);
      startOtpTimer();
    } catch (err) {
      console.log(err);
      alert("Failed to send OTP.");
    } finally {
      setLoading(false);
      setStepLoadingText("");
    }
  };

  // OTP HANDLERS
  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otpBoxes];
    newOtp[index] = value;
    setOtpBoxes(newOtp);

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

  const resendOtp = async () => {
    if (!canResend) return;

    try {
      setStepLoadingText("Resending OTP...");
      setLoading(true);
      await fetch("http://localhost:8800/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email || "", phone: formData.phone || "" }),
      });
      setOtpBoxes(["", "", "", ""]);
      startOtpTimer();
    } catch (err) {
      console.log(err);
      alert("Failed to resend OTP.");
    } finally {
      setLoading(false);
      setStepLoadingText("");
    }
  };

  // FINAL REGISTER
  const handleSubmitFinal = async () => {
    const finalData = {
      ...formData,
      country: country.label,
      region: region.label,
      city: city.label,
    };

    try {
      setStepLoadingText("Registering...");
      setLoading(true);
      const response = await fetch("http://localhost:8800/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(4);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        navigate("/", { state: { openLogin: true } });
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
      setStepLoadingText("");
    }
  };

  const verifyOtp = async () => {
    const otpCode = otpBoxes.join("");
    if (otpCode.length !== 4) {
      setOtpError("Enter all 4 digits.");
      return;
    }

    try {
      setStepLoadingText("Verifying OTP...");
      setLoading(true);
      const res = await fetch("http://localhost:8800/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email || "",
          phone: formData.phone || "",
          otp: otpCode,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setOtpError(data.message);
        return;
      }

      await handleSubmitFinal();
    } catch (err) {
      console.log(err);
      setOtpError("Verification failed.");
    } finally {
      setLoading(false);
      setStepLoadingText("");
    }
  };

  // MASK CONTACT FUNCTION
  const maskContact = () => {
    if (formData.phone) {
      return formData.phone.replace(/^(\d{2})\d+(\d{3})$/, "$1*******$2");
    }
    if (formData.email) {
      const [name, domain] = formData.email.split("@");
      return name.length > 3
        ? name.substring(0, 3) + "****@" + domain
        : name + "****@" + domain;
    }
    return "your contact";
  };

  // Loading Overlay
  function LoadingOverlay({ message }) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div className="lux-white-wrapper">
      {loading && <LoadingOverlay message={stepLoadingText} />}
      <div className="lux-white-card">
        {/* HEADER */}
        <div className="lux-header">
          <h2>Create Account</h2>
          <p>Sign up to get started</p>
        </div>

        {/* PROGRESS STEPS */}
        <div className="horizontal-steps">
          <div className={`step-item ${step >= 1 ? "active" : ""} ${step > 1 ? "complete" : ""}`}>
            <div className="step-badge">1</div>
            <div className="step-label">Personal</div>
          </div>
          <div className={`step-item ${step >= 2 ? "active" : ""} ${step > 2 ? "complete" : ""}`}>
            <div className="step-badge">2</div>
            <div className="step-label">Address</div>
          </div>
          <div className={`step-item ${step === 3 ? "active" : ""}`}>
            <div className="step-badge">3</div>
            <div className="step-label">OTP</div>
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <form className="lux-form" onSubmit={nextStep}>
            <div className="input-row">
              <div className="lux-input-group">
                <label>First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={errors.firstName ? "error" : ""} placeholder="First Name" />
                {errors.firstName && <span className="error-message">{errors.firstName}</span>}
              </div>
              <div className="lux-input-group">
                <label>Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={errors.lastName ? "error" : ""} placeholder="Last Name" />
                {errors.lastName && <span className="error-message">{errors.lastName}</span>}
              </div>
            </div>

            <div className="input-row">
              <div className="lux-input-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={errors.email ? "error" : ""} placeholder="email@example.com" />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
              <div className="lux-input-group">
                <label>Phone</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={errors.phone ? "error" : ""} placeholder="09123456789" />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
            </div>

            <div className="input-row">
              <div className="lux-input-group">
                <label>Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} className={errors.password ? "error" : ""} placeholder="••••••••" />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
              <div className="lux-input-group">
                <label>Confirm Password</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={errors.confirmPassword ? "error" : ""} placeholder="••••••••" />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            </div>

            <button className="lux-btn" type="submit">Continue</button>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form className="lux-form" onSubmit={handleAddressNext}>
            <div className="input-row">
              <div className="lux-input-group">
                <label>Country</label>
                <Select options={countryOptions} value={country} onChange={(val) => { setCountry(val); setRegion(null); setCity(null); }} placeholder="Select Country" classNamePrefix="lux-select" />
              </div>
              <div className="lux-input-group">
                <label>Region</label>
                <Select options={regionOptions} value={region} onChange={(val) => { setRegion(val); setCity(null); }} isDisabled={!country} placeholder="Select Region" classNamePrefix="lux-select" />
              </div>
              <div className="lux-input-group">
                <label>City</label>
                <Select options={cityOptions} value={city} onChange={setCity} isDisabled={!region} placeholder="Select City" classNamePrefix="lux-select" />
              </div>
            </div>

            <div className="lux-input-group">
              <label>Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className={errors.address ? "error" : ""} placeholder="Street address" />
              {errors.address && <span className="error-message">{errors.address}</span>}
            </div>

            <div className="lux-input-group">
              <label>ZIP Code</label>
              <input type="text" name="zipcode" value={formData.zipcode} onChange={handleChange} className={errors.zipcode ? "error" : ""} placeholder="ZIP Code" />
              {errors.zipcode && <span className="error-message">{errors.zipcode}</span>}
            </div>

              <div className="captcha-wrapper">
                <HCaptcha
                  sitekey={process.env.REACT_APP_HCAPTCHA_SITEKEY}
                  onVerify={handleCaptchaVerify}
                />
              </div>

            <button className="lux-btn" type="submit">Send OTP</button>
          </form>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="otp-section">
            <h3>Verify OTP</h3>
            <p>Enter 4-digit code sent to {maskContact()}</p>
            <div className="otp-box-container">
              {otpBoxes.map((val, i) => (
                <input key={i} id={`otp-${i}`} maxLength={1} value={val} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)} className="otp-box" autoFocus={i === 0} />
              ))}
            </div>
            {otpError && <p className="error-message">{otpError}</p>}

            <div className="otp-timer">
              {otpTimer > 0 ? (
                <p>
                  Resend in <strong>{Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, "0")}</strong>
                </p>
              ) : (
                <button className="resend-btn" onClick={resendOtp}>Resend OTP</button>
              )}
            </div>


            <button className="lux-btn" onClick={verifyOtp} disabled={loading || otpBoxes.some((box) => !box)}>Verify & Complete</button>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && <div className="success-message">Registration successful! Redirecting to login...</div>}
      </div>
    </div>
  );
}
