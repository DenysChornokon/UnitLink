import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

// Створюємо екземпляр axios з базовим URL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Інтерцептор Запитів ---
// Додає Access Token до кожного запиту, якщо він є
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      // Тепер перевіряємо і /logout
      if (
        !config.url.endsWith("/login") &&
        !config.url.endsWith("/refresh") &&
        !config.url.endsWith("/logout")
      ) {
        // <--- ДОДАНО ЦЮ УМОВУ
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Інтерцептор Відповідей ---
// Обробляє помилки (наприклад, 401 для оновлення токена)
let isRefreshing = false; // Прапорець, щоб уникнути кількох запитів на оновлення одночасно
let failedQueue = []; // Черга запитів, які очікують на новий токен

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    // Якщо запит успішний, просто повертаємо відповідь
    return response;
  },
  async (error) => {
    const originalRequest = error.config; // Оригінальний запит, що спричинив помилку

    // Перевіряємо, чи це помилка 401 і чи це не повторна спроба (після оновлення)
    // і чи це не помилка від ендпоінта /refresh або /login
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.endsWith("/refresh") &&
      !originalRequest.url.endsWith("/login")
    ) {
      if (isRefreshing) {
        // Якщо вже йде оновлення, додаємо запит до черги
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return apiClient(originalRequest); // Повторюємо запит з новим токеном
          })
          .catch((err) => {
            return Promise.reject(err); // Якщо оновлення в іншому місці не вдалося
          });
      }

      originalRequest._retry = true; // Позначаємо запит як повторний
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        console.error("No refresh token available.");
        isRefreshing = false;
        // Тут можна викликати logout з AuthContext, якщо він доступний глобально, або перенаправити
        window.dispatchEvent(new CustomEvent("logout-event")); // Сигналізуємо про вихід
        return Promise.reject(error);
      }

      try {
        console.log("Attempting to refresh token...");
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
          }
        );

        const newAccessToken = response.data.access_token;
        console.log("Token refreshed successfully.");
        localStorage.setItem("accessToken", newAccessToken);

        // Оновлюємо заголовок оригінального запиту
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        // Виконуємо запити з черги з новим токеном
        processQueue(null, newAccessToken);

        // Повторюємо оригінальний запит з новим токеном
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error(
          "Failed to refresh token:",
          refreshError.response?.data || refreshError.message
        );
        processQueue(refreshError, null); // Повідомляємо черзі про помилку
        // Якщо оновлення не вдалося (наприклад, refresh token недійсний) - виходимо з системи
        // Потрібно викликати logout з AuthContext. Оскільки інтерцептор не має прямого доступу,
        // можна використати кастомну подію або інший механізм сповіщення.
        window.dispatchEvent(new CustomEvent("logout-event")); // Сигналізуємо про вихід
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Для всіх інших помилок просто повертаємо їх
    return Promise.reject(error);
  }
);

export default apiClient; // Експортуємо налаштований екземпляр
