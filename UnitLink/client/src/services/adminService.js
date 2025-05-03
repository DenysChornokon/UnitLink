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

const adminService = {
  getPendingRequests,
  approveRequest,
  rejectRequest,
};

export default adminService;
