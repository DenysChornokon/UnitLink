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

/**
 * Створює новий підрозділ
 * @param {object} unitData - Дані нового підрозділу
 */
const addUnit = async (unitData) => {
  try {
      const response = await apiClient.post(API_URL, unitData);
      return response.data;
  } catch (error) {
      console.error("Add Unit API error:", error.response || error.message);
      throw error.response?.data || new Error("Failed to add unit");
  }
};

/**
* Оновлює існуючий підрозділ
* @param {string} unitId - ID підрозділу для оновлення
* @param {object} unitData - Нові дані
*/
const updateUnit = async (unitId, unitData) => {
  try {
      const response = await apiClient.put(`${API_URL}/${unitId}`, unitData);
      return response.data;
  } catch (error) {
      console.error("Update Unit API error:", error.response || error.message);
      throw error.response?.data || new Error("Failed to update unit");
  }
};

/**
* Видаляє підрозділ
* @param {string} unitId - ID підрозділу для видалення
*/
const deleteUnit = async (unitId) => {
  try {
      const response = await apiClient.delete(`${API_URL}/${unitId}`);
      return response.data;
  } catch (error) {
      console.error("Delete Unit API error:", error.response || error.message);
      throw error.response?.data || new Error("Failed to delete unit");
  }
};

const unitService = {
  getUnits,
  addUnit,
  updateUnit,
  deleteUnit,
};

export default unitService;
