// client/src/pages/UserProfilePage/UserProfilePage.jsx
import React, { useState } from "react";
import authService from "../../services/authService";
import notify from "../../services/notificationService";
import "./UserProfilePage.scss"; // Створимо цей файл для стилів

const UserProfilePage = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      notify.error("Нові паролі не співпадають!");
      return;
    }
    // TODO: Додати клієнтську валідацію складності нового пароля

    setIsLoading(true);
    try {
      const response = await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword, // Бекенд теж перевірить, але можна і тут
      });
      notify.success(response.message || "Пароль успішно змінено!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      notify.error(
        error.message || "Помилка зміни пароля. Перевірте поточний пароль."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="user-profile-container">
      <h2>Зміна пароля</h2>
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label htmlFor="currentPassword">Поточний пароль</label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">Новий пароль</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            // TODO: додати атрибут pattern для валідації складності, наприклад:
            // pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
            // title="Має містити принаймні одну цифру, одну велику та малу літеру, і бути не менше 8 символів"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Підтвердіть новий пароль</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? "Збереження..." : "Змінити пароль"}
        </button>
      </form>
    </div>
  );
};

export default UserProfilePage;
