// client/src/services/logService.js
import apiClient from "./api"; // Наш налаштований Axios клієнт

/**
 * Отримує список логів з пагінацією
 * @param {object} params - параметри
 * @param {number} params.page - номер сторінки
 * @param {number} params.perPage - кількість елементів на сторінці
 * @returns {Promise<object>} Об'єкт з логами та метаданими пагінації
 */
const getLogs = async ({ page = 1, perPage = 20 }) => {
  try {
    const response = await apiClient.get("/api/logs", {
      params: {
        page: page,
        per_page: perPage,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Get Logs API error:", error.response || error.message);
    throw error.response?.data || new Error("Failed to fetch logs");
  }
};

const logService = {
  getLogs,
};

export default logService;
