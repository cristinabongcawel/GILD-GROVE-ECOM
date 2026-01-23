// src/components/AdminRegister.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./regis.css";
const locationData = {
  "Philippines": {
    "NCR": ["Quezon City", "Manila", "Makati"],
    "Region I": ["San Fernando", "La Union"],
    "Region VII": ["Cebu City", "Lapu-Lapu"]
  },
  "United States": {
    "California": ["Los Angeles", "San Francisco", "San Diego"],
    "New York": ["New York City", "Buffalo"]
  },
  "Canada": {
    "Ontario": ["Toronto", "Ottawa"],
    "British Columbia": ["Vancouver", "Victoria"]
  }
};

export default function AdminRegister() {
  const [step, setStep] = useState(1);

  // Personal details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");

  // Account details
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // OTP
  const [otpSent, setOtpSent] = useState(false);
  const [inputOtp, setInputOtp] = useState("");
  const [otpBoxes, setOtpBoxes] = useState(["", "", "", ""]);
  const [resendTimeout, setResendTimeout] = useState(0);
  const otpRefs = useRef([]);
  // Derived lists
  const countries = Object.keys(locationData);
  const regionsList = country ? Object.keys(locationData[country]) : [];
  const citiesList = country && region ? (locationData[country][region] || []) : [];

  // Reset dependent selects
  useEffect(() => {
    setRegion("");
    setCity("");
  }, [country]);

  useEffect(() => {
    setCity("");
  }, [region]);

  // Countdown for resend
  useEffect(() => {
    let timer;
    if (resendTimeout > 0) {
      timer = setTimeout(() => setResendTimeout(resendTimeout - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimeout]);

  // --- Validation ---
  const validatePersonal = () => {
    if (!firstName.trim() || !lastName.trim() || !address.trim()) {
      alert("Please fill in name and address.");
      return false;
    }
    if (!country || !region || !city) {
      alert("Please select country, region and city.");
      return false;
    }
    return true;
  };

  const validateAccount = () => {
    if (!email.trim() && !phone.trim()) {
      alert("Please enter at least one: Email or Phone number.");
      return false;
    }
    if (password && password.length < 6) {
      alert("Password should be at least 6 characters.");
      return false;
    }
    if (password && password !== confirmPassword) {
      alert("Passwords do not match.");
      return false;
    }
    return true;
  };

  const getPreferredContact = () => email ? email : phone;

  // --- Step Actions ---
  const goToAccountStep = (e) => {
    e.preventDefault();
    if (!validatePersonal()) return;
    setStep(2);
  };

  const goToVerifyStep = async (e) => {
    e.preventDefault();
    if (!validateAccount()) return;

    try {
      await axios.post("http://localhost:8800/api/send-otp", {
        email: email || null,
        phone: phone || null,
      });
      alert(`OTP sent to ${getPreferredContact()}`);
      setOtpSent(true);
      setResendTimeout(30);
      setStep(3);
    } catch (err) {
      alert("Failed to send OTP. Check backend.");
    }
  };

  // --- OTP Box Handling ---
const handleOtpBoxChange = (value, index) => {
  if (!/^[0-9]?$/.test(value)) return;

  const updated = [...otpBoxes];
  updated[index] = value;
  setOtpBoxes(updated);

  if (value && index < otpBoxes.length - 1) {
    otpRefs.current[index + 1].focus();
  }

  setInputOtp(updated.join(""));
};

const handleOtpKeyDown = (e, index) => {
  if (e.key === "Backspace" && !otpBoxes[index] && index > 0) {
    // Move to previous box if backspace is pressed on empty input
    otpRefs.current[index - 1].focus();
  }
};

  // --- Verify & Register ---
const handleVerifyOtp = async (e) => {
  e.preventDefault();

  if (otpBoxes.some(d => d === "")) {
    alert("Please enter all 4 digits of the OTP.");
    return;
  }

  const otp = otpBoxes.join("");

  try {
    // Step 1: Verify OTP
    await axios.post("http://localhost:8800/api/verify-otp", {
      email: email || null,
      phone: phone || null,
      otp: otp
    });

    // Step 2: Register admin if OTP is correct
    await axios.post("http://localhost:8800/api/admin/register", {
      firstName,
      lastName,
      address,
      country,
      region,
      city,
      zip,
      email: email || null,
      phone: phone || null,
      password: password || null,
    });

    alert("Registration successful!");
    resetAll();
    window.location.href = "/adminlog";
  } catch (err) {
    if (err.response && err.response.data && err.response.data.message) {
      alert(`Error: ${err.response.data.message}`);
    } else {
      alert("Registration failed. Check OTP or backend.");
    }
  }
};


  const handleResend = async () => {
    if (resendTimeout > 0) return;
    setOtpBoxes(["", "", "", ""]);
    setInputOtp("");
    try {
      await axios.post("http://localhost:8800/api/send-otp", {
        email: email || null,
        phone: phone || null,
      });
      setResendTimeout(30);
      alert(`OTP resent to ${getPreferredContact()}`);
    } catch (err) {
      alert("Failed to resend OTP.");
    }
  };

  const resetAll = () => {
    setStep(1);
    setFirstName(""); setLastName(""); setAddress("");
    setCountry(""); setRegion(""); setCity(""); setZip("");
    setEmail(""); setPhone(""); setPassword(""); setConfirmPassword("");
    setOtpBoxes(["", "", "", ""]);
    setInputOtp(""); setOtpSent(false); setResendTimeout(0);
  };

  return (
    <div className="admin-container">
      <div className="image-side">
        <div className="wave-container">
          <div className="wave wave-1"></div>
          <div className="wave wave-2"></div>
          <div className="wave wave-3"></div>
          <div className="wave wave-4"></div>
          <div className="wave-overlay"></div>
        </div>
        <div className="image-content">
          <div className="icon">🌊</div>
          <h3>Welcome to FHR</h3>
          <p>Create your admin account and manage your system efficiently</p>
        </div>
      </div>

      <div className="form-side">
        <div className="form-card">
          <div className="brand-logo">
            <h1 className="logo-text">GILD + GROVE</h1>
            <div className="logo-subtitle">Admin Portal</div>
          </div>

          {/* Steps */}
          <div className="horizontal-steps">
            {["Personal","Account","Verify","Complete"].map((label,i)=>(
              <div key={i} className={`step-item ${step>=i+1?"active":""} ${step>i+1?"complete":""}`}>
                <div className="step-badge">{i+1}</div>
                <div className="step-label">{label}</div>
              </div>
            ))}
          </div>

          {/* STEP 1: Personal */}
          {step===1 && (
            <form onSubmit={goToAccountStep}>
              <div className="form-group">
                <label>First Name</label>
                <input value={firstName} onChange={e=>setFirstName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input value={lastName} onChange={e=>setLastName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input value={address} onChange={e=>setAddress(e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Country</label>
                  <select value={country} onChange={e=>setCountry(e.target.value)}>
                    <option value="">-- Select country --</option>
                    {countries.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Region</label>
                  <select value={region} onChange={e=>setRegion(e.target.value)} disabled={!country}>
                    <option value="">-- Select region --</option>
                    {regionsList.map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <select value={city} onChange={e=>setCity(e.target.value)} disabled={!region}>
                    <option value="">-- Select city --</option>
                    {citiesList.map(c=> <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>ZIP</label>
                  <input value={zip} onChange={e=>setZip(e.target.value)} />
                </div>
              </div>
              <div className="actions-row">
                <button type="submit">Continue</button>
              </div>
            </form>
          )}

          {/* STEP 2: Account */}
          {step===2 && (
            <form onSubmit={goToVerifyStep}>
              <div className="form-group">
                <label>Email</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Optional" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Optional" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
                </div>
              </div>
              <div className="actions-row">
                <button type="submit">Send Verification Code</button>
              </div>
            </form>
          )}

          {/* STEP 3: OTP */}
          {step===3 && (
            <form onSubmit={handleVerifyOtp}>
              <p>Verification code sent to <strong>{getPreferredContact()}</strong></p>
              <div className="otp-box-container">
                {otpBoxes.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    className={`otp-box ${digit ? "filled" : ""}`}
                    maxLength="1"
                    value={digit}
                    onChange={e => handleOtpBoxChange(e.target.value, i)}
                    onKeyDown={e => handleOtpKeyDown(e, i)}
                  />
                ))}
              </div>
              <div className="helper">
                <button type="button" onClick={handleResend} disabled={resendTimeout>0}>
                  {resendTimeout>0?`RESEND CODE IN ${Math.floor(resendTimeout/60)}:${(resendTimeout%60).toString().padStart(2, '0')}`:"RESEND CODE"}
                </button>
              </div>
              <div className="actions-row">
                <button type="submit">Verify</button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
