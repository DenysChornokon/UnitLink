import axios from "axios";

// Використовуємо змінну середовища для базового URL
const API_URL = process.env.REACT_APP_API_BASE_URL + "/api/auth";

/**
 * Надсилає запит на логін користувача
 * @param {object} credentials - Об'єкт з { username, password }
 * @returns {Promise<object>} - Проміс з даними відповіді (включаючи токени)
 */
const loginUser = async (credentials) => {
  try {
    // Надсилаємо POST-запит на /api/auth/login
    const response = await axios.post(`${API_URL}/login`, credentials);
    // Повертаємо дані з відповіді (зазвичай містить токени, роль і т.д.)
    return response.data;
  } catch (error) {
    // Обробляємо помилки (наприклад, 401 Unauthorized)
    console.error("Login API error:", error.response || error.message);
    // Перекидаємо помилку далі, щоб компонент міг її обробити
    // Додаємо дані відповіді помилки, якщо вони є, для відображення повідомлення
    throw error.response?.data || new Error("Login failed");
  }
};

/**
 * Надсилає запит на реєстрацію (заявку)
 * @param {object} requestData - Об'єкт з { requested_username, email, reason }
 * @returns {Promise<object>} - Проміс з даними відповіді
 */
const registerRequest = async (requestData) => {
  try {
    const response = await axios.post(
      `${API_URL}/register_request`,
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

// Експортуємо функції сервісу
const authService = {
  loginUser,
  registerRequest,
  // Тут можна додати logout, refresh token і т.д.
};

export default authService;
