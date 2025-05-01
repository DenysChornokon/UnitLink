import React from "react";
import LoginPage from "./pages/LoginPage/LoginPage"; // Імпортуємо нашу сторінку
// Якщо у вас є глобальний CSS/SCSS, імпортуйте його тут
// import './index.css'; // або './App.scss', etc.

function App() {
  // На даному етапі просто повертаємо LoginPage
  // В майбутньому тут буде логіка маршрутизації
  return (
    <div className="App">
      <LoginPage />
    </div>
  );
}

export default App;
