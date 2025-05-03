import React, { useState, useEffect, useCallback } from "react";
import adminService from "../../services/adminService";
import { useAuth } from "../../contexts/AuthContext";
import "./AdminRequestsPage.scss"; // Стилі для сторінки

const AdminRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
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
        "Are you sure you want to approve this request? A new inactive user will be created."
      )
    )
      return;
    try {
      const response = await adminService.approveRequest(requestId);
      alert(response.message || "Request approved successfully!");
      // Оновлюємо список, видаливши оброблений запит
      setRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== requestId)
      );
    } catch (err) {
      alert(`Error approving request: ${err.message}`);
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm("Are you sure you want to reject this request?"))
      return;
    try {
      const response = await adminService.rejectRequest(requestId);
      alert(response.message || "Request rejected successfully!");
      // Оновлюємо список
      setRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== requestId)
      );
    } catch (err) {
      alert(`Error rejecting request: ${err.message}`);
    }
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

      {!isLoading && !error && requests.length === 0 && (
        <p>No pending registration requests found.</p>
      )}

      {!isLoading && !error && requests.length > 0 && (
        <table className="requests-table">
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
                    title="Approve Request"
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleReject(req.id)}
                    title="Reject Request"
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
