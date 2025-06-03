import React, { useState, useEffect, useCallback } from "react";
import adminService from "../../services/adminService";
import { useAuth } from "../../contexts/AuthContext";
import "./AdminRequestsPage.scss"; // Стилі для сторінки
import notify from "../../services/notificationService";

const AdminRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processInfo, setProcessInfo] = useState({
    requestId: null,
    url: null,
    message: null,
    instruction: null,
  }); // Ініціалізуємо зі значеннями null
  const { currentUser } = useAuth(); // Перевіряємо роль (хоча маршрут вже захищений)

  // Функція для завантаження запитів
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

  // Завантажуємо запити при першому рендері
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (requestId) => {
    if (
      !window.confirm(
        "Are you sure you want to approve this request? You will need to securely provide the setup link to the user."
      )
    )
      return; // Оновлено текст
    setProcessInfo({ requestId: null, url: null, message: null }); // Скидаємо попереднє повідомлення
    setError(null);
    try {
      // Викликаємо API схвалення
      const response = await adminService.approveRequest(requestId);

      // Показуємо повідомлення та URL адміну
      setProcessInfo({
        requestId: requestId, // Зберігаємо ID, щоб знати до якого запиту відноситься URL
        url: response.setup_url,
        message: response.message || "Request approved successfully!",
      });

      // Оновлюємо список, видаливши оброблений запит
      setRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== requestId)
      );
    } catch (err) {
      setError(`Error approving request ${requestId}: ${err.message}`); // Показуємо помилку
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm("Are you sure you want to reject this request?"))
      return;
    try {
      const response = await adminService.rejectRequest(requestId);
      notify.success(response.message || "Request rejected successfully!");
      // Оновлюємо список
      setRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== requestId)
      );
    } catch (err) {
      notify.success(`Error rejecting request: ${err.message}`);
    }
  };

  // Функція для копіювання URL в буфер обміну
  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url).then(
      () => {
        notify.success("Setup link copied to clipboard!");
      },
      (err) => {
        notify.error("Failed to copy link. Please copy it manually.");
        console.error("Clipboard copy failed: ", err);
      }
    );
  };

  // Додаткова перевірка ролі на клієнті (хоча основний захист - на рівні маршрутизації)
  if (currentUser?.role !== "ADMIN") {
    return <p>Access Denied. Administrator privileges required.</p>;
  }

  return (
    <div className="admin-requests-page">
      <h1>Pending Registration Requests</h1>
      {isLoading && <p>Loading requests...</p>}
      {error && <p className="error-message">{error}</p>}

      {/* Повідомлення після схвалення з посиланням */}
      {processInfo.url && (
        <div className="process-info success-message">
          <p>
            <strong>{processInfo.message}</strong>
          </p>
          <p>
            <strong>{processInfo.instruction}</strong>
          </p>
          <div className="setup-link-container">
            <input type="text" value={processInfo.url} readOnly />
            <button
              onClick={() => copyToClipboard(processInfo.url)}
              className="btn btn-secondary btn-sm"
            >
              Copy Link
            </button>
          </div>
          <p className="warning-message">
            Warning: Ensure this link is delivered securely (e.g., secure chat,
            in person). Do NOT send via unencrypted email.
          </p>
        </div>
      )}

      {/* ... (таблиця запитів без змін, але кнопки викликають нові handleApprove/handleReject) ... */}
      {!isLoading &&
        !error &&
        requests.length === 0 &&
        !processInfo.url /* Показуємо, тільки якщо немає інфо про обробку */ && (
          <p>No pending registration requests found.</p>
        )}

      {!isLoading && !error && requests.length > 0 && (
        <table className="requests-table">
          {/* ... thead ... */}
          <thead>
            <tr>
              <th>Requested At</th>
              <th>Username</th>
              <th>Email</th>
              <th>Full Name</th>
              <th>Rank</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{new Date(req.requested_at).toLocaleString()}</td>
                <td>{req.requested_username}</td>
                <td>{req.email}</td>
                <td>{req.full_name}</td>
                <td>{req.rank || "-"}</td>
                <td>{req.reason || "-"}</td>
                <td>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleApprove(req.id)}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleReject(req.id)}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminRequestsPage;
