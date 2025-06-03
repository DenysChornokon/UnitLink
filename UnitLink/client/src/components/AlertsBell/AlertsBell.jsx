// client/src/components/AlertsBell/AlertsBell.jsx
import React, { useState } from "react";
import { useAlerts } from "../../contexts/AlertsContext";
import AlertsDropdown from "../AlertsDropdown/AlertsDropdown";
import "./AlertsBell.scss";
// Потрібно додати іконку дзвіночка, наприклад з react-icons
// npm install react-icons
import { FaBell } from "react-icons/fa";

const AlertsBell = () => {
  const { alertCount } = useAlerts();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="alerts-bell-wrapper">
      <button className="alerts-bell-button" onClick={() => setIsOpen(!isOpen)}>
        <FaBell />
        {alertCount > 0 && <span className="alerts-badge">{alertCount}</span>}
      </button>
      {isOpen && <AlertsDropdown setIsOpen={setIsOpen} />}
    </div>
  );
};

export default AlertsBell;
