// client/src/pages/UserProfilePage/UserProfilePage.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import authService from "../../services/authService";
import notify from "../../services/notificationService";
import "./UserProfilePage.scss";

const UserProfilePage = () => {
  const { currentUser, updateCurrentUserData } = useAuth();

  // Стан для форми зміни імені
  const [username, setUsername] = useState("");
  const [isUsernameLoading, setIsUsernameLoading] = useState(false);

  // Стан для форми зміни пароля
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    if (currentUser?.username) {
      setUsername(currentUser.username);
    }
  }, [currentUser]);

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || username.trim() === currentUser.username) {
      notify.info("Ім'я користувача не змінилося або порожнє.");
      return;
    }
    setIsUsernameLoading(true);
    try {
      const response = await authService.updateUsername({
        newUsername: username.trim(),
      });
      updateCurrentUserData({ username: response.user.username }); // Оновлюємо контекст
      notify.success(response.message || "Ім'я користувача успішно оновлено!");
    } catch (error) {
      notify.error(error.message || "Помилка оновлення імені користувача.");
      setUsername(currentUser.username); // Повертаємо старе значення у формі
    } finally {
      setIsUsernameLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      notify.error("Нові паролі не співпадають!");
      return;
    }
    if (!newPassword) {
      notify.error("Новий пароль не може бути порожнім.");
      return;
    }
    // TODO: Додати клієнтську валідацію складності нового пароля

    setIsPasswordLoading(true);
    try {
      const response = await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
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
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="user-profile-page">
      <div className="profile-section">
        <h2>Мій профіль</h2>
        <form onSubmit={handleUsernameSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="username">Ім'я користувача (логін)</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={isUsernameLoading || username === currentUser?.username}
          >
            {isUsernameLoading ? "Збереження..." : "Зберегти ім'я"}
          </button>
        </form>
      </div>

      <div className="profile-section">
        <h2>Зміна пароля</h2>
        <form onSubmit={handlePasswordSubmit} className="profile-form">
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
          <button
            type="submit"
            className="btn-primary"
            disabled={isPasswordLoading}
          >
            {isPasswordLoading ? "Зміна..." : "Змінити пароль"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserProfilePage;
