import React, { createContext, useState, useContext, useEffect } from "react";
import authService from "../services/authService"; // Ваш сервіс аутентифікації
import { useNavigate } from "react-router-dom";

// 1. Створюємо контекст
const AuthContext = createContext(null);

// 2. Створюємо Провайдер Контексту (компонент, що огортає додаток)
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Зберігаємо інфо про користувача (або хоча б статус)
  const [isLoading, setIsLoading] = useState(true); // Для перевірки початкового стану
  const navigate = useNavigate(); // Потрібен тут для logout

  // Перевірка статусу логіну при завантаженні додатка
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("userRole");
    if (token && role) {
      // TODO: В ідеалі, тут треба перевіряти валідність токена на бекенді
      // Для простоти поки що довіряємо наявності токена і ролі
      setCurrentUser({ token, role }); // Встановлюємо користувача
    }
    setIsLoading(false); // Завершили перевірку
  }, []);

  // Функція для логіну
  const login = async (credentials) => {
    const data = await authService.loginUser(credentials); // Викликаємо API
    if (data.access_token && data.refresh_token && data.user_role) {
      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("refreshToken", data.refresh_token);
      localStorage.setItem("userRole", data.user_role);
      setCurrentUser({ token: data.access_token, role: data.user_role }); // Оновлюємо стан!
      // Навігація тепер має відбуватися в компоненті LoginPage ПІСЛЯ успішного виклику login
      return true; // Повертаємо успіх
    }
    throw new Error(data.message || "Login failed: Invalid response"); // Кидаємо помилку якщо дані не повні
  };

  // Функція для виходу
  const logout = () => {
    // TODO: Опціонально - викликати API бекенду для інвалідації токена (refresh token)
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userRole");
    setCurrentUser(null); // Очищаємо стан!
    navigate("/login"); // Перенаправляємо тут або в компоненті
  };

  // Значення, яке буде доступне всім дочірнім компонентам
  const value = {
    currentUser, // Поточний користувач (null якщо не залогінений)
    isAuthenticated: !!currentUser, // Зручний boolean прапорець
    isLoading, // Чи йде початкова перевірка
    login,
    logout,
  };

  // Показуємо дітей тільки після завершення початкової перевірки
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// 3. Створюємо кастомний хук для зручного доступу до контексту
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
