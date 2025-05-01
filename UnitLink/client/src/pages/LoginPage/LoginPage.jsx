// src / pages / LoginPage / LoginPage.jsx;

import React, { useState } from "react";
import "./LoginPage.scss"; // Імпортуємо SCSS стилі

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Обробник для відправки форми логіну
  const handleLoginSubmit = (event) => {
    event.preventDefault(); // Запобігаємо стандартній відправці форми
    console.log("Login attempt with:", { username, password });
    // TODO: Реалізувати логіку відправки даних на бекенд (API call)
    // Наприклад, виклик функції з services/authService.js
    alert("Login functionality not implemented yet.");
  };

  // Обробник для кнопки запиту реєстрації
  const handleRegistrationRequest = () => {
    console.log("Registration request initiated.");
    // TODO: Реалізувати логіку відображення форми/модального вікна
    // для запиту або пряму відправку запиту на бекенд.
    alert("Registration request functionality not implemented yet.");
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">UnitLink Monitoring</h1>
        <p className="login-description">
          System for monitoring communication channels. Please log in to
          continue.
        </p>

        <form className="login-form" onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required // Поле обов'язкове
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required // Поле обов'язкове
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-login">
            Login
          </button>
        </form>

        <div className="registration-section">
          <p>Don't have an account?</p>
          <button
            type="button" // Важливо вказати type="button", щоб не сабмітити форму
            className="btn btn-register"
            onClick={handleRegistrationRequest}
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

export default LoginPage;