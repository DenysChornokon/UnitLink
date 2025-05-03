// src/App.js
import React from "react";
// BrowserRouter тепер в index.js, тому тут не потрібен
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage/LoginPage";
import DashboardPage from "./pages/DashboardPage/DashboardPage";
import AdminRequestsPage from "./pages/AdminRequestsPage/AdminRequestsPage";
import { useAuth } from "./contexts/AuthContext";

function App() {
  const { isAuthenticated, currentUser } = useAuth(); // <--- Отримуємо статус автентифікації з контексту

  // Компонент-обгортка для захисту маршрутів адміна
  const AdminRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    if (currentUser?.role !== "ADMIN") {
      // Якщо не адмін, можна перенаправити на дашборд або показати помилку доступу
      return <Navigate to="/dashboard" />; // або return <div>Access Denied</div>;
    }
    return children;
  };

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
        path="/admin/requests"
        element={
          <AdminRoute>
            <AdminRequestsPage />
          </AdminRoute>
        }
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
