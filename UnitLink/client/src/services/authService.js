// src/services/authService.js
import apiClient from "./api"; // <--- Імпортуємо налаштований екземпляр

// Замість базового axios використовуємо apiClient
// Базовий URL вже налаштований в apiClient, тому шляхи відносні

const loginUser = async (credentials) => {
  try {
    // apiClient вже має базовий URL /api/auth/login
    const response = await apiClient.post("/api/auth/login", credentials);
    return response.data;
  } catch (error) {
    console.error("Login API error:", error.response || error.message);
    throw error.response?.data || new Error("Login failed");
  }
};

const registerRequest = async (requestData) => {
  try {
    const response = await apiClient.post(
      "/api/auth/register_request",
      requestData
    );
    return response.data;
  } catch (error) {
    console.error(
      "Registration Request API error:",
      error.response || error.message
    );
    throw error.response?.data || new Error("Registration request failed");
  }
};

// Функція для виклику бекенд-логауту
const logoutUser = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return; // Нічого робити, якщо немає рефреш токена

  try {
    // Надсилаємо запит на бекенд для інвалідації токена
    await apiClient.delete("/api/auth/logout", {
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    console.log("Logout request sent to backend.");
  } catch (error) {
    // Помилка тут не критична для виходу на фронтенді, але її варто залогувати
    console.error("Backend logout API error:", error.response || error.message);
    // Не кидаємо помилку, щоб вихід на фронтенді все одно відбувся
  }
};

const authService = {
  loginUser,
  registerRequest,
  logoutUser, // <--- Додано logoutUser
};

export default authService;
