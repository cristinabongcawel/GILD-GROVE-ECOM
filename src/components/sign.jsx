import React, { useState, useEffect } from "react";
import registerImage from "../components/images/sign.jpg";
import { Link, useNavigate } from "react-router-dom";
import "../components/sign.css";
import locationsData from "../components/location.json";
import Select from "react-select";

function Register() {
  const [step, setStep] = useState(1);

  // MAIN FORM DATA
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    zipcode: "",
    region: "",
    city: "",
    address: "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // DROPDOWN STATES
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
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  // INPUT CHANGES
  // INPUT CHANGES - FIXED VERSION
const handleChange = (e) => {
  const { name, value } = e.target;
  
  // Update form data first
  setFormData((prev) => {
    const updatedFormData = { ...prev, [name]: value };
    
    // Validate the current field with updated data
    validateField(name, value, updatedFormData);
    
    // Special case: if password changes, also validate confirmPassword
    if (name === "password" && updatedFormData.confirmPassword) {
      validateField("confirmPassword", updatedFormData.confirmPassword, updatedFormData);
    }
    
    // Special case: if confirmPassword changes and password exists, validate confirmPassword
    if (name === "confirmPassword" && updatedFormData.password) {
      validateField("confirmPassword", value, updatedFormData);
    }
    
    return updatedFormData;
  });
};

// FIELD VALIDATION - FIXED VERSION
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
      if (!value.trim()) error = "Phone number is required.";
      else if (!/^[0-9]{11}$/.test(value)) error = "Phone number must be 11 digits.";
      break;
    case "email":
      if (!value.trim()) error = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Enter a valid email.";
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
   console.log(`Field: ${field}, Value: "${value}", Error: "${error}"`); 
  setErrors((prev) => ({ ...prev, [field]: error }));
};


  // STEP 1 → STEP 2
  const nextStep = (e) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.phone ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      alert("Please complete all fields.");
      return;
    }

    if (Object.values(errors).some((err) => err)) {
      alert("Fix errors before continuing.");
      return;
    }

    setStep(2);
  };

  // START OTP TIMER
  const startOtpTimer = () => {
    setOtpTimer(30);
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

  // STEP 2 → STEP 3 (SEND OTP)
  const handleAddressNext = async (e) => {
    e.preventDefault();

    if (!country || !region || !city || !formData.address) {
      alert("Please complete your address details.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8800/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        setLoading(false);
        return;
      }

      setStep(3);
      startOtpTimer();
      setLoading(false);
    } catch (err) {
      console.log(err);
      alert("Failed to send OTP.");
      setLoading(false);
    }
  };

  // OTP BOX HANDLER
  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otpBoxes];
    newOtp[index] = value;
    setOtpBoxes(newOtp);

    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // RESEND OTP
  const resendOtp = async () => {
    if (!canResend) return;

    try {
      await fetch("http://localhost:8800/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, phone: formData.phone }),
      });

      setOtpBoxes(["", "", "", ""]);
      startOtpTimer();
    } catch (err) {
      console.log(err);
      alert("Failed to resend OTP.");
    }
  };

  // FINAL REGISTER CALL (AFTER OTP VERIFIED)
  const handleSubmitFinal = async () => {
    const finalData = {
      ...formData,
      country: country.label,
      region: region.label,
      city: city.label,
    };

    try {
      const response = await fetch("http://localhost:8800/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        navigate("/login");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  // VERIFY OTP
  const verifyOtp = async () => {
    const otpCode = otpBoxes.join("");

    if (otpCode.length !== 4) {
      setOtpError("Enter all 4 digits.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8800/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          otp: otpCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.message);
        setLoading(false);
        return;
      }

      handleSubmitFinal();
    } catch (err) {
      console.log(err);
      setOtpError("Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // BACK
    const prevStep = () => setStep((prev) => prev - 1);

  return (
    <div className="register-wrapper">
      <div className="register-card">

        {/* Left image */}
        <div className="register-left">
          <img src={registerImage} className="register-img" alt="register" />
        </div>

        {/* Right Content */}
        <div className="register-right">

          {/* Step Indicator */}
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
        {step > 1 && (
          <button className="back-arrow" onClick={prevStep} aria-label="Back">
            ←
          </button>
        )}
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div className="form-header">
                <h3>Provide Your Personal Details</h3>
                <p className="desc">Fill required fields</p>
              </div>

              <form className="form" onSubmit={nextStep}>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First name"
                      className={errors.firstName ? "input-error" : ""}
                    />
                    {errors.firstName && <small className="error-text">{errors.firstName}</small>}
                  </div>

                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last name"
                      className={errors.lastName ? "input-error" : ""}
                    />
                    {errors.lastName && <small className="error-text">{errors.lastName}</small>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="09XXXXXXXXX"
                    className={errors.phone ? "input-error" : ""}
                  />
                  {errors.phone && <small className="error-text">{errors.phone}</small>}
                </div>

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

                <div className="form-row">
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      onChange={handleChange}
                      placeholder="Enter password"
                      className={errors.password ? "input-error" : ""}
                    />
                    {errors.password && <small className="error-text">{errors.password}</small>}
                  </div>

                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      className={errors.confirmPassword ? "input-error" : ""}
                    />
                    {errors.confirmPassword && (
                      <small className="error-text">{errors.confirmPassword}</small>
                    )}
                  </div>
                </div>

                <div className="actions-row">
                  <button className="continue-btn" type="submit">
                    Continue
                  </button>
                </div>
              </form>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <div className="form-header">
                <h3>Address Information</h3>
                <p className="desc">Complete your address details.</p>
              </div>

              <form className="form" onSubmit={handleAddressNext}>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street address"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Country</label>
                    <Select
                      options={countryOptions}
                      value={country}
                      onChange={(val) => {
                        setCountry(val);
                        setRegion(null);
                        setCity(null);
                      }}
                      placeholder="-- Select country --"
                      className="my-select"
                      classNamePrefix="my-select"
                    />
                  </div>

                  <div className="form-group">
                    <label>Region</label>
                    <Select
                      options={regionOptions}
                      value={region}
                      onChange={(val) => {
                        setRegion(val);
                        setCity(null);
                      }}
                      isDisabled={!country}
                      placeholder="-- Select region --"
                      className="my-select"
                      classNamePrefix="my-select"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <Select
                      options={cityOptions}
                      value={city}
                      onChange={(val) => setCity(val)}
                      isDisabled={!region}
                      placeholder="-- Select city --"
                      className="my-select"
                      classNamePrefix="my-select"
                    />
                  </div>

                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      name="zipcode"
                      value={formData.zipcode}
                      onChange={handleChange}
                      placeholder="Zip code"
                    />
                  </div>
                </div>

                <div className="actions-row">
                  <button className="continue-btn" type="submit">
                    {loading ? "Sending OTP..." : "Continue"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* STEP 3 — OTP */}
          {step === 3 && (
            <div className="otp-section">
              <h3>Verify Your Account</h3>
              <p className="desc">Enter the 4-digit OTP sent to your email or phone.</p>

              <div className="otp-box-container">
                {otpBoxes.map((val, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    maxLength="1"
                    value={val}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    className="otp-box"
                  />
                ))}
              </div>

              {otpError && <p className="otp-error">{otpError}</p>}

              <div className="otp-info">
                {otpTimer > 0 ? (
                  <p>
                    Resend OTP in <strong>{otpTimer}</strong>s
                  </p>
                ) : (
                  <button onClick={resendOtp} className="resend-btn">
                    Resend OTP
                  </button>
                )}
              </div>

              <button className="continue-btn" onClick={verifyOtp} disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;
