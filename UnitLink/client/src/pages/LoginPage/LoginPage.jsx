// src/pages/LoginPage/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
// Імпорт компонента модального вікна, який ми створили
import RegistrationRequestModal from "../../components/RegistrationRequestModal/RegistrationRequestModal";
import "./LoginPage.scss";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null); // Помилка для форми логіну
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // <--- Стан для модалки
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login({ username, password });
      navigate("/map");
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
      console.error("Login component failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Ця функція ТІЛЬКИ відкриває модальне вікно
  const handleOpenRegistrationModal = () => {
    setIsModalOpen(true);
  };

  // Функція для закриття модального вікна (передається в компонент модалки)
  const handleCloseRegistrationModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {" "}
      {/* Огортаємо фрагментом, щоб додати модалку */}
      <div className="login-page">
        <div className="login-container">
          <h1 className="login-title">UnitLink Monitoring</h1>
          <p className="login-description">
            System for monitoring communication channels. Please log in to
            continue.
          </p>

          {/* Відображення помилки тільки для логіну */}
          {error && <p className="error-message login-error">{error}</p>}

          <form className="login-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username or Email</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              className="btn btn-login"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="registration-section">
            <p>Don't have an account?</p>
            <button
              type="button"
              className="btn btn-register"
              onClick={handleOpenRegistrationModal} // <--- Викликає відкриття модалки
              disabled={isLoading} // Можна блокувати, поки йде логін
            >
              Request Registration
            </button>
            <p className="registration-note">
              (Registration requires administrator approval)
            </p>
          </div>
        </div>
      </div>
      {/* Рендеримо модальне вікно тут, передаючи стан і функцію закриття */}
      <RegistrationRequestModal
        isOpen={isModalOpen}
        onClose={handleCloseRegistrationModal}
      />
    </>
  );
};

export default LoginPage;
