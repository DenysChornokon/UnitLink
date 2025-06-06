// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import authService from "../services/authService";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/api";

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
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    setCurrentUser(null);
    delete apiClient.defaults.headers.common["Authorization"];
    console.log("Auth data cleared, navigating to login.");
    navigate("/login");
  };

  // Перевірка статусу логіну при завантаженні
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("userRole");
    const username = localStorage.getItem("username");
    const userId = localStorage.getItem("userId");
    if (token && role && username && userId) {
      setCurrentUser({ token, role, username, id: userId });
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
    setIsLoading(true);
    try {
      const data = await authService.loginUser(credentials);
        if (data.access_token && data.refresh_token && data.user_role) {
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("refreshToken", data.refresh_token);
            localStorage.setItem("userRole", data.user_role);
            localStorage.setItem("username", data.username);
            localStorage.setItem("userId", data.user_id);

            // Встановлюємо дані користувача
            setCurrentUser({
              token: data.access_token,
              role: data.user_role,
              username: data.username,
              id: data.id,
            });
            return true;
        }
        throw new Error(data.message || "Login failed: Invalid response");
    } catch (error) {
      clearAuthData(); // Очищаємо, щоб не було залишків
      console.error("Login process failed:", error);
      throw error; // Перекидаємо помилку далі
    } finally {
      setIsLoading(false);
    }
  };

  // Оновлена функція виходу
  const logout = async () => {
    console.log("Logout process initiated...");
    await authService.logoutUser(); // Спочатку викликаємо API для інвалідації токена на бекенді
    clearAuthData(); // Потім очищаємо дані на фронтенді
  };

  // Нова функція для оновлення даних користувача в стані та localStorage
  const updateCurrentUserData = (updatedFields) => {
    setCurrentUser((prevUser) => {
      const newUser = { ...prevUser, ...updatedFields };
      // Оновлюємо localStorage, якщо поля там є
      if (updatedFields.username) {
        localStorage.setItem("username", updatedFields.username);
      }
      // Тут можна додати оновлення інших полів, якщо вони зберігаються
      return newUser;
    });
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    logout,
    updateCurrentUserData,
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
