// client/src/pages/AdminRequestsPage/AdminRequestsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import adminService from "../../services/adminService";
import notify from "../../services/notificationService";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal"; // Імпортуємо наш модальний компонент
import { FaCheck, FaTimes, FaCopy } from "react-icons/fa"; // Іконки для дій
import "./AdminRequestsPage.scss";

const AdminRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processInfo, setProcessInfo] = useState({ url: null, message: null });

  // Стан для модального вікна підтвердження
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmText, setConfirmText] = useState("");

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getPendingRequests();
      setRequests(data);
    } catch (err) {
      setError(err.message || "Failed to load requests.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = (requestId) => {
    setConfirmText(
      "Схвалити цей запит? Потрібно буде безпечно передати посилання користувачу."
    );
    setConfirmAction(() => () => performApprove(requestId)); // Зберігаємо дію для виконання
    setIsConfirmOpen(true);
  };

  const handleReject = (requestId) => {
    setConfirmText("Ви впевнені, що хочете відхилити цей запит?");
    setConfirmAction(() => () => performReject(requestId)); // Зберігаємо дію для виконання
    setIsConfirmOpen(true);
  };

  const performApprove = async (requestId) => {
    setProcessInfo({ url: null, message: null });
    setError(null);
    try {
      const response = await adminService.approveRequest(requestId);
      setProcessInfo({ url: response.setup_url, message: response.message });
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      setError(`Помилка схвалення запиту: ${err.message}`);
    }
  };

  const performReject = async (requestId) => {
    try {
      const response = await adminService.rejectRequest(requestId);
      notify.success(response.message || "Запит успішно відхилено!");
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      notify.error(`Помилка відхилення запиту: ${err.message}`);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url).then(
      () => notify.success("Посилання для встановлення пароля скопійовано!"),
      () =>
        notify.error("Не вдалося скопіювати. Будь ласка, зробіть це вручну.")
    );
  };

  const renderEmptyState = () => (
    <tr className="empty-row">
      <td colSpan="7">
        {" "}
        {/* Змінено на 7 колонок */}
        <div className="empty-state-content">
          <h4>Немає запитів на реєстрацію</h4>
          <p>Коли нові користувачі подадуть запит, він з'явиться тут.</p>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="admin-page-container">
      <h2>Запити на реєстрацію</h2>
      {isLoading && <p>Завантаження запитів...</p>}
      {error && <p className="error-message">{error}</p>}

      {processInfo.url && (
        <div className="process-info-box">
          <p className="success-message">{processInfo.message}</p>
          <p className="instruction-message">
            Будь ласка, безпечно передайте це посилання користувачу:
          </p>
          <div className="setup-link-container">
            <input type="text" value={processInfo.url} readOnly />
            <button
              onClick={() => copyToClipboard(processInfo.url)}
              className="btn-secondary"
            >
              <FaCopy />
              <span>Копіювати</span>
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="table-wrapper">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Дата запиту</th>
                <th>Username</th>
                <th>Email</th>
                <th>ПІБ</th>
                <th>Звання</th>
                <th>Причина</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
                            {requests.length > 0 ? requests.map((req) => (
                                <tr key={req.id}>
                                    <td data-label="Дата запиту">{new Date(req.requested_at).toLocaleString('uk-UA')}</td>
                                    <td data-label="Username">{req.requested_username}</td>
                                    <td data-label="Email">{req.email}</td>
                                    <td data-label="ПІБ">{req.full_name}</td>
                                    <td data-label="Звання">{req.rank || "-"}</td>
                                    <td data-label="Причина">{req.reason || "-"}</td>
                                    <td data-label="Дії" className="actions-cell"> {/* Додаємо клас і сюди */}
                                        <button className="btn-action btn-success" onClick={() => handleApprove(req.id)}>
                                            <FaCheck />
                                            <span>Схвалити</span>
                                        </button>
                                        <button className="btn-action btn-danger" onClick={() => handleReject(req.id)}>
                                            <FaTimes />
                                            <span>Відхилити</span>
                                        </button>
                                    </td>
                                </tr>
                            )) : renderEmptyState()}
                        </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          if (confirmAction) confirmAction();
          setIsConfirmOpen(false);
        }}
        title="Підтвердження дії"
      >
        <p>{confirmText}</p>
      </ConfirmModal>
    </div>
  );
};

export default AdminRequestsPage;
