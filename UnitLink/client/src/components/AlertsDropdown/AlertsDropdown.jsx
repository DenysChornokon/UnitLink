// client/src/components/AlertsDropdown/AlertsDropdown.jsx
import React from "react";
import { useAlerts } from "../../contexts/AlertsContext";
import "./AlertsDropdown.scss";

// Розкоментуй визначення компонента та отримання пропсів і даних з контексту
const AlertsDropdown = ({ setIsOpen }) => {
  const { alerts, acknowledgeAlert } = useAlerts();

  return (
    <div className="alerts-dropdown">
      <div className="alerts-header">
        <h4>Active Notifications</h4>
        {/* Розкоментуй та переконайся, що використовується проп setIsOpen */}
        <button onClick={() => setIsOpen(false)} className="close-btn">
          &times;
        </button>
      </div>
      <div className="alerts-list">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert.id} className="alert-item">
              <p>
                <strong>{alert.device_name}</strong>: {alert.message}
              </p>
              {/* Переконуємось, що timestamp існує перед форматуванням */}
              <small>
                {alert.timestamp
                  ? new Date(alert.timestamp).toLocaleString()
                  : "час невідомий"}
              </small>
              <button
                onClick={() => acknowledgeAlert(alert.id)}
                className="ack-btn"
              >
                Read
              </button>
            </div>
          ))
        ) : (
          <p className="no-alerts">No Active Notifications.</p>
        )}
      </div>
    </div>
  );
};

export default AlertsDropdown;
