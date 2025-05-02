// src/App.js
import React from "react";
// BrowserRouter тепер в index.js, тому тут не потрібен
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage/LoginPage";
import DashboardPage from "./pages/DashboardPage/DashboardPage";
import { useAuth } from "./contexts/AuthContext"; // <--- Імпортуємо хук useAuth

function App() {
  const { isAuthenticated } = useAuth(); // <--- Отримуємо статус автентифікації з контексту

  return (
    // BrowserRouter вже огортає цей компонент в index.js
    <Routes>
      {/* Використовуємо isAuthenticated з контексту */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
      />

      <Route
        path="/dashboard"
        element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />}
      />

      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />}
      />

      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}

export default App;
