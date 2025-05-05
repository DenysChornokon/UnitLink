// src/App.js
import React from "react";
// BrowserRouter тепер в index.js, тому тут не потрібен
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage/LoginPage";
import MapPage from "./pages/MapPage/MapPage";
import AdminRequestsPage from "./pages/AdminRequestsPage/AdminRequestsPage";
import SetPasswordPage from "./pages/SetPasswordPage/SetPasswordPage";
import { useAuth } from "./contexts/AuthContext";
import MainLayout from "./layouts/MainLayout/MainLayout";

function App() {
  const { isAuthenticated, currentUser } = useAuth(); // <--- Отримуємо статус автентифікації з контексту

  // Компонент-обгортка для захисту маршрутів адміна
  const AdminRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    if (currentUser?.role !== "ADMIN") {
      // Якщо не адмін, можна перенаправити на дашборд або показати помилку доступу
      return <Navigate to="/map" />; // або return <div>Access Denied</div>;
    }
    return children;
  };

  // Компонент для захисту звичайних сторінок
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    // BrowserRouter вже огортає цей компонент в index.js
    <Routes>
      {/* Використовуємо isAuthenticated з контексту */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/map" /> : <LoginPage />}
      />

      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <MainLayout>
              <MapPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/requests"
        element={
          <AdminRoute>
            <MainLayout>
              <AdminRequestsPage />
            </MainLayout>
          </AdminRoute>
        }
      />

      <Route path="/set-password" element={<SetPasswordPage />} />

      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/map" : "/login"} />}
      />

      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}

export default App;
