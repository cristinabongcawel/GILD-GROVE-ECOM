import React, { useState, useEffect } from "react";
import { FiSearch, FiBell, FiUser } from "react-icons/fi";
import "./sidebar.css";

export default function Header() {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      // Format time as "hh:mm am/pm dd MMM yyyy"
      const options = { hour: 'numeric', minute: 'numeric', hour12: true };
      const timeStr = now.toLocaleTimeString('en-US', options);

      const dateStr = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

      setCurrentTime(`${timeStr} ${dateStr}`);
    };

    updateTime(); // Initialize immediately
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="header">
      <div className="header-right">
        <span className="datetime">{currentTime}</span>
      </div>
    </div>
  );
}
