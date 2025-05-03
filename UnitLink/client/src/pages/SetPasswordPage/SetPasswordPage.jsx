import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios"; // Можна використовувати apiClient, якщо додати ці ендпоінти туди
import "./SetPasswordPage.scss"; // Стилі

const API_URL = process.env.REACT_APP_API_BASE_URL + "/api/auth";

const SetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [isValidToken, setIsValidToken] = useState(null); // null - перевіряємо, true - валідний, false - невалідний
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(true);

  // 1. Перевірка токена при завантаженні
  useEffect(() => {
    if (!token) {
      setError("No setup token provided in the URL.");
      setIsValidToken(false);
      setValidationLoading(false);
      return;
    }

    const validateToken = async () => {
      setValidationLoading(true);
      setError("");
      try {
        await axios.post(`${API_URL}/validate-setup-token`, { token });
        setIsValidToken(true);
      } catch (err) {
        setError(
          err.response?.data?.message || "Invalid or expired setup link."
        );
        setIsValidToken(false);
      } finally {
        setValidationLoading(false);
      }
    };

    validateToken();
  }, [token]);

  // 2. Обробка відправки форми встановлення паролю
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      // Приклад простої валідації
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/complete-setup`, {
        token,
        password,
      });
      setSuccessMessage(
        response.data.message ||
          "Password set successfully! Redirecting to login..."
      );
      // Перенаправлення на логін через 3 секунди
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to set password.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Рендеринг ---
  if (validationLoading) {
    return (
      <div className="set-password-page">
        <p>Validating link...</p>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="set-password-page error-page">
        <h2>Invalid Link</h2>
        <p className="error-message">
          {error || "This password setup link is invalid or has expired."}
        </p>
        <Link to="/login">Go to Login</Link>
      </div>
    );
  }

  // Якщо токен валідний - показуємо форму
  return (
    <div className="set-password-page">
      <h2>Set Your Password</h2>

      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}

      {!successMessage && ( // Ховаємо форму після успіху
        <form onSubmit={handleSubmit} className="set-password-form">
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Setting Password..." : "Set Password"}
          </button>
        </form>
      )}
      {successMessage && (
        <Link
          to="/login"
          className="btn btn-secondary"
          style={{ marginTop: "15px", display: "inline-block" }}
        >
          Go to Login
        </Link>
      )}
    </div>
  );
};

export default SetPasswordPage;
