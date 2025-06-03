// client/src/components/AlertsDropdown/AlertsDropdown.jsx
import React from "react";
import { useAlerts } from "../../contexts/AlertsContext";
import "./AlertsDropdown.scss";

const AlertsDropdown = ({ setIsOpen }) => {
  const { alerts, acknowledgeAlert } = useAlerts();

  return (
    <div className="alerts-dropdown">
      <div className="alerts-header">
        <h4>Активні сповіщення</h4>
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
              <small>{new Date(alert.timestamp).toLocaleString()}</small>
              <button
                onClick={() => acknowledgeAlert(alert.id)}
                className="ack-btn"
              >
                Прочитано
              </button>
            </div>
          ))
        ) : (
          <p className="no-alerts">Немає активних сповіщень.</p>
        )}
      </div>
    </div>
  );
};

export default AlertsDropdown;
