import apiClient from "./api"; // Використовуємо той самий налаштований клієнт

const API_URL = "/api/admin"; // Базовий URL для адмінських маршрутів

/**
 * Отримує список запитів на реєстрацію зі статусом PENDING
 * Потребує дійсного access_token адміністратора в заголовку (додається інтерцептором)
 * @returns {Promise<Array>} - Масив об'єктів запитів
 */
const getPendingRequests = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/registration_requests`);
    return response.data.requests || []; // Повертаємо масив запитів
  } catch (error) {
    console.error(
      "Get Pending Requests API error:",
      error.response || error.message
    );
    throw error.response?.data || new Error("Failed to fetch pending requests");
  }
};

/**
 * Схвалює запит на реєстрацію
 * @param {string} requestId - UUID запиту
 * @returns {Promise<object>} - Відповідь сервера
 */
const approveRequest = async (requestId) => {
  try {
    const response = await apiClient.post(
      `${API_URL}/registration_requests/${requestId}/approve`
    );
    return response.data;
  } catch (error) {
    console.error(
      "Approve Request API error:",
      error.response || error.message
    );
    throw error.response?.data || new Error("Failed to approve request");
  }
};

/**
 * Відхиляє запит на реєстрацію
 * @param {string} requestId - UUID запиту
 * @returns {Promise<object>} - Відповідь сервера
 */
const rejectRequest = async (requestId) => {
  try {
    const response = await apiClient.post(
      `${API_URL}/registration_requests/${requestId}/reject`
    );
    return response.data;
  } catch (error) {
    console.error("Reject Request API error:", error.response || error.message);
    throw error.response?.data || new Error("Failed to reject request");
  }
};

/**
 * Отримує список всіх користувачів
 */
const getUsers = async () => {
  try {
      const response = await apiClient.get(`${API_URL}/users`);
      return response.data.users || [];
  } catch (error) {
      console.error("Get Users API error:", error);
      throw error.response?.data || new Error("Failed to fetch users");
  }
};

/**
* Оновлює дані користувача
* @param {string} userId
* @param {object} data - { role?: string, is_active?: boolean }
*/
const updateUser = async (userId, data) => {
  try {
      const response = await apiClient.put(`${API_URL}/users/${userId}`, data);
      return response.data;
  } catch (error) {
      console.error("Update User API error:", error);
      throw error.response?.data || new Error("Failed to update user");
  }
};

/**
* Видаляє користувача
* @param {string} userId
*/
const deleteUser = async (userId) => {
  try {
      const response = await apiClient.delete(`${API_URL}/users/${userId}`);
      return response.data;
  } catch (error) {
      console.error("Delete User API error:", error);
      throw error.response?.data || new Error("Failed to delete user");
  }
};

const adminService = {
  getPendingRequests,
  approveRequest,
  rejectRequest,
  getUsers,
  updateUser,
  deleteUser,
};

export default adminService;
