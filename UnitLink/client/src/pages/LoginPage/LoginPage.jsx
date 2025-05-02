import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext"; // Імпортуємо хук useAuth
import authService from "../../services/authService"; // Імпортуємо для запиту на реєстрацію
import "./LoginPage.scss"; // Імпортуємо стилі

const LoginPage = () => {
  // Локальні стани для полів форми, помилок та індикатора завантаження
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Хук для навігації після успішного логіну
  const navigate = useNavigate();
  // Отримуємо функцію login з нашого AuthContext
  const { login } = useAuth();

  // Обробник відправки форми логіну
  const handleLoginSubmit = async (event) => {
    event.preventDefault(); // Запобігаємо стандартній поведінці форми
    setIsLoading(true); // Встановлюємо індикатор завантаження
    setError(null); // Скидаємо попередні помилки

    try {
      // Викликаємо функцію login з контексту, передаючи облікові дані
      // Ця функція всередині викличе authService.loginUser,
      // оновить стан контексту та збереже токени в localStorage
      await login({ username, password });

      // Якщо функція login відпрацювала без помилок,
      // стан автентифікації оновлено в контексті.
      // Тепер можна перенаправляти користувача.
      navigate("/dashboard");
    } catch (err) {
      // Якщо login кинув помилку (неправильні дані, помилка сервера),
      // відображаємо її користувачу.
      const errorMessage =
        err.message || "Login failed. Please check your credentials.";
      setError(errorMessage);
      console.error("Login component failed:", err); // Лог для розробника
    } finally {
      // Незалежно від результату, прибираємо індикатор завантаження
      setIsLoading(false);
    }
  };

  // Обробник для кнопки запиту реєстрації
  // (Можна розширити, додавши форму для введення даних)
  const handleRegistrationRequest = async () => {
    // Тут можна додати логіку відображення модального вікна або окремої форми
    // для введення 'requested_username', 'email', 'reason'
    // Або тимчасово використати статичні дані для тесту:
    const testRequestData = {
      requested_username: `testuser_${Date.now()}`.slice(0, 15), // Генеруємо унікальне ім'я
      email: `test_${Date.now()}@test.local`, // Генеруємо унікальний email
      reason: "Automated test registration request",
    };

    setIsLoading(true); // Показуємо завантаження і для цієї кнопки
    setError(null);

    try {
      const data = await authService.registerRequest(testRequestData);
      alert("Registration request submitted: " + data.message); // Показуємо відповідь сервера
    } catch (err) {
      const errorMessage = err.message || "Registration request failed.";
      setError(errorMessage); // Показуємо помилку
      console.error("Registration request failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // JSX розмітка компонента
  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">UnitLink Monitoring</h1>
        <p className="login-description">
          System for monitoring communication channels. Please log in to
          continue.
        </p>

        {/* Блок для відображення помилок логіну або реєстрації */}
        {error && <p className="error-message">{error}</p>}

        {/* Форма логіну */}
        <form className="login-form" onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              value={username}
              // Оновлюємо стан при зміні значення поля
              onChange={(e) => setUsername(e.target.value)}
              required // Поле обов'язкове
              autoComplete="username"
              // Блокуємо поле під час відправки запиту
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              // Оновлюємо стан при зміні значення поля
              onChange={(e) => setPassword(e.target.value)}
              required // Поле обов'язкове
              autoComplete="current-password"
              // Блокуємо поле під час відправки запиту
              disabled={isLoading}
            />
          </div>
          {/* Кнопка відправки форми */}
          <button type="submit" className="btn btn-login" disabled={isLoading}>
            {/* Змінюємо текст кнопки під час завантаження */}
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Секція запиту на реєстрацію */}
        <div className="registration-section">
          <p>Don't have an account?</p>
          <button
            type="button" // Важливо: type="button", щоб не сабмітити форму логіну
            className="btn btn-register"
            onClick={handleRegistrationRequest}
            // Блокуємо кнопку під час будь-якого запиту
            disabled={isLoading}
          >
            Request Registration
          </button>
          <p className="registration-note">
            (Registration requires administrator approval)
          </p>
        </div>
      </div>
    </div>
  );
};

// Експортуємо компонент для використання в інших частинах додатку (напр. App.js)
export default LoginPage;
