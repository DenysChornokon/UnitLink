// src/services/unitService.js
import apiClient from "./api"; // Використовуємо налаштований клієнт

const API_URL = "/api/devices"; // Базовий URL для пристроїв/підрозділів

/**
 * Отримує список всіх підрозділів з бекенду
 * Потребує JWT токена (додається інтерцептором)
 * @returns {Promise<Array>} Масив об'єктів підрозділів
 */
const getUnits = async () => {
  try {
    const response = await apiClient.get(API_URL);
    return response.data.devices || [];
  } catch (error) {
    console.error("Get Units API error:", error.response || error.message);
    throw error.response?.data || new Error("Failed to fetch units");
  }
};

// TODO: Додати функції для addUnit, updateUnit, deleteUnit, getUnitDetails,
// які будуть викликати відповідні ендпоінти POST, PUT, DELETE, GET /:id
// Наприклад:
// const addUnit = async (unitData) => {
//    try {
//        const response = await apiClient.post(API_URL, unitData);
//        return response.data;
//    } catch (error) { ... }
// };

const unitService = {
  getUnits,
  // addUnit,
  // updateUnit,
  // deleteUnit,
};

export default unitService;
