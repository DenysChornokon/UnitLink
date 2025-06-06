// src/App.js
import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage/LoginPage";
import MapPage from "./pages/MapPage/MapPage";
import AdminRequestsPage from "./pages/AdminRequestsPage/AdminRequestsPage";
import SetPasswordPage from "./pages/SetPasswordPage/SetPasswordPage";
import { useAuth } from "./contexts/AuthContext";
import MainLayout from "./layouts/MainLayout/MainLayout";
import { SocketProvider } from "./contexts/SocketContext";
import { UnitProvider } from "./contexts/UnitContext";
import LogsPage from "./pages/LogsPage/LogsPage";
import { AlertsProvider } from "./contexts/AlertsContext";
import AdminUnitsPage from "./pages/AdminUnitsPage/AdminUnitsPage";
import AdminUsersPage from "./pages/AdminUsersPage/AdminUsersPage";
import UserProfilePage from "./pages/UserProfilePage/UserProfilePage";


function App() {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  const AdminRoute = ({ children }) => {
    if (isLoading) {
      return <div>Автентифікація...</div>; // TODO Зробити кращий спіннер
    }
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    if (currentUser?.role !== "ADMIN") {
      return <Navigate to="/map" />;
    }
    return children;
  };

  const ProtectedRoute = ({ children }) => {
    if (isLoading) {
      return <div>Завантаження...</div>; // TODO Зробити кращий спіннер
    }
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <SocketProvider>
        <UnitProvider>
          <AlertsProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  isAuthenticated ? <Navigate to="/map" /> : <LoginPage />
                }
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
                path="/admin-requests"
                element={
                  <AdminRoute>
                    <MainLayout>
                      <AdminRequestsPage />
                    </MainLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin-units"
                element={
                  <AdminRoute>
                    <MainLayout>
                      <AdminUnitsPage />
                    </MainLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin-users"
                element={
                  <AdminRoute>
                    <MainLayout>
                      <AdminUsersPage />
                    </MainLayout>
                  </AdminRoute>
                }
              />
              {/* 👇 Для LogsPage, ймовірно, теж потрібен ProtectedRoute */}
              <Route
                path="logs"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <LogsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <UserProfilePage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="/set-password" element={<SetPasswordPage />} />
              <Route
                path="/"
                element={<Navigate to={isAuthenticated ? "/map" : "/login"} />}
              />
              <Route path="*" element={<div>404 Not Found</div>} />
            </Routes>
          </AlertsProvider>
        </UnitProvider>
      </SocketProvider>
    </>
  );
}

export default App;
