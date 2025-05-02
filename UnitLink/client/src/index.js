// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // Імпортуємо BrowserRouter сюди
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext"; // Імпортуємо наш провайдер
// import './index.css'; // Глобальні стилі

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
