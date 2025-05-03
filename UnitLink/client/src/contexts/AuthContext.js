// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import authService from "../services/authService";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Функція для очищення стану та localStorage
  const clearAuthData = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userRole");
    setCurrentUser(null);
    console.log("Auth data cleared, navigating to login.");
    navigate("/login");
  };

  // Перевірка статусу логіну при завантаженні
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("userRole");
    if (token && role) {
      // TODO: Перевірка валідності токена на бекенді
      setCurrentUser({ token, role });
    }
    setIsLoading(false);

    // Додаємо слухача події 'logout-event', яку може відправити інтерцептор
    const handleForcedLogout = () => {
      console.warn("Forced logout triggered (e.g., by token refresh failure).");
      clearAuthData(); // Виконуємо вихід
    };
    window.addEventListener("logout-event", handleForcedLogout);

    // Прибираємо слухача при розмонтуванні компонента
    return () => {
      window.removeEventListener("logout-event", handleForcedLogout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Залежність navigate тут може викликати цикл, якщо navigate змінюється

  const login = async (credentials) => {
    // Логіка логіну залишається без змін, але навігацію перенесено в LoginPage
    const data = await authService.loginUser(credentials);
    if (data.access_token && data.refresh_token && data.user_role) {
      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("refreshToken", data.refresh_token);
      localStorage.setItem("userRole", data.user_role);
      setCurrentUser({ token: data.access_token, role: data.user_role });
      return true;
    }
    throw new Error(data.message || "Login failed: Invalid response");
  };

  // Оновлена функція виходу
  const logout = async () => {
    console.log("Logout process initiated...");
    await authService.logoutUser(); // Спочатку викликаємо API для інвалідації токена на бекенді
    clearAuthData(); // Потім очищаємо дані на фронтенді
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
