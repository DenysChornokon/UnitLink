// client/src/components/AlertsBell/AlertsBell.jsx
import React from "react";
import { useAlerts } from "../../contexts/AlertsContext"; // Припускаю, шлях до контексту правильний
import AlertsDropdown from "../AlertsDropdown/AlertsDropdown"; // Припускаю, шлях до дропдауна правильний
import "./AlertsBell.scss"; // Файл стилів для дзвіночка
import { FaBell } from "react-icons/fa"; // Іконка дзвіночка

const AlertsBell = ({ isOpen, onToggle }) => {
  const { alertCount } = useAlerts();

  // Функція, яку AlertsDropdown може викликати, щоб закрити себе
  // Вона, по суті, викликає onToggle(false), але ми передаємо її як setIsOpen
  const handleCloseDropdown = () => {
    if (onToggle) {
      onToggle(false); // Сигналізуємо Header, що потрібно закрити цей дропдаун
    }
  };

  return (
    <div className="alerts-bell-wrapper">
      <button
        className="alerts-bell-button"
        onClick={onToggle} // Викликаємо onToggle, переданий з Header.jsx
        aria-expanded={isOpen}
        aria-label="Show notifications"
      >
        <FaBell />
        {alertCount > 0 && <span className="alerts-badge">{alertCount}</span>}
      </button>
      {/* AlertsDropdown відображається на основі пропса isOpen */}
      {/* і отримує функцію для свого закриття */}
      {isOpen && <AlertsDropdown setIsOpen={handleCloseDropdown} />}
    </div>
  );
};

export default AlertsBell;
