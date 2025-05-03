import React from "react";
// useNavigate більше не імпортуємо напряму для логауту, оскільки це обробляється в AuthContext
import { useAuth } from "../../contexts/AuthContext"; // Імпортуємо наш кастомний хук useAuth

// Імпортуємо стилі, якщо вони є (опціонально)
// import './DashboardPage.scss';

const DashboardPage = () => {
  // Отримуємо поточного користувача та функцію виходу з нашого AuthContext
  const { currentUser, logout } = useAuth();

  // Обробник натискання кнопки виходу
  // Робимо асинхронним, оскільки logout в контексті тепер може бути асинхронним (чекає на запит до API)
  const handleLogout = async () => {
    console.log("Logout button clicked."); // Додамо лог для ясності
    try {
      await logout(); // Викликаємо функцію logout з AuthContext
      // Навігація на '/login' тепер відбувається всередині функції logout (або clearAuthData) в AuthContext
      console.log("Logout process completed on frontend.");
    } catch (error) {
      // Обробка можливих помилок (хоча logout в нашому authService зараз не кидає помилок на фронтенд)
      console.error("Error during logout:", error);
      // Можна показати повідомлення користувачу тут, якщо потрібно
    }
  };

  return (
    // Додаємо простий контейнер та інлайн-стилі для демонстрації
    <div
      className="dashboard-container"
      style={{ padding: "20px", fontFamily: "sans-serif" }}
    >
      <h1>Welcome to UnitLink Dashboard!</h1>

      {/* Відображаємо роль користувача, безпечно перевіряючи чи currentUser існує */}
      <p>
        Your role: <strong>{currentUser?.role || "Unknown"}</strong>
      </p>

      <p>This is a placeholder page for authenticated users.</p>
      <p>Here you will see the map, device statuses, logs, etc.</p>

      {/* Кнопка виходу */}
      <button
        onClick={handleLogout}
        style={{
          marginTop: "20px",
          padding: "10px 15px",
          fontSize: "1rem",
          cursor: "pointer",
          backgroundColor: "#e74c3c", // Червоний колір для кнопки виходу
          color: "white",
          border: "none",
          borderRadius: "4px",
        }}
      >
        Logout
      </button>

      {/* TODO: Тут буде основний контент дашборду: мапа, таблиці, графіки */}
    </div>
  );
};

export default DashboardPage;
