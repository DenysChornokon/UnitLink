import React from "react";
// useNavigate більше не потрібен тут для logout, якщо він обробляється в контексті
import { useAuth } from "../../contexts/AuthContext"; // <--- Використовуємо хук useAuth

const DashboardPage = () => {
  const { currentUser, logout } = useAuth(); // <--- Отримуємо logout та currentUser з контексту

  const handleLogout = () => {
    logout(); // <--- Викликаємо logout з контексту
  };

  return (
    <div className="dashboard-container" style={{ padding: "20px" }}>
      <h1>Welcome to UnitLink Dashboard!</h1>
      {/* Використовуємо дані з currentUser */}
      <p>
        Your role: <strong>{currentUser?.role || "Unknown"}</strong>
      </p>
      <p>This is a placeholder page for authenticated users.</p>
      <p>Here you will see the map, device statuses, logs, etc.</p>
      <button
        onClick={handleLogout}
        style={{ marginTop: "20px", padding: "10px 15px" }}
      >
        Logout
      </button>
    </div>
  );
};

export default DashboardPage;
