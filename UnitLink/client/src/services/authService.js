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

/**
 * Змінює пароль поточного користувача
 * @param {object} passwordData - { currentPassword, newPassword, confirmPassword }
 */
const changePassword = async (passwordData) => {
  try {
      const response = await apiClient.post('/api/auth/change-password', passwordData);
      return response.data;
  } catch (error) {
      console.error("Change Password API error:", error.response || error.message);
      // Перекидаємо помилку, щоб компонент міг її обробити (наприклад, показати повідомлення)
      throw error.response?.data || error;
  }
};

/**
 * Оновлює ім'я користувача
 * @param {object} usernameData - { newUsername: string }
 */
const updateUsername = async (usernameData) => {
  try {
      const response = await apiClient.put('/api/auth/profile/username', usernameData);
      return response.data; // Очікуємо відповідь з оновленими даними користувача
  } catch (error) {
      console.error("Update Username API error:", error.response || error.message);
      throw error.response?.data || error;
  }
};

const authService = {
  loginUser,
  registerRequest,
  logoutUser,
  changePassword,
  updateUsername,
};

export default authService;
