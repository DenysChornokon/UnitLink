// client/src/pages/AdminUsersPage/AdminUsersPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import adminService from "../../services/adminService";
import { useAuth } from "../../contexts/AuthContext";
import notify from "../../services/notificationService";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import { FaTrash, FaUserShield, FaUser } from "react-icons/fa"; // Імпортуємо всі потрібні іконки
import "./AdminUsersPage.scss";

const AdminUsersPage = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || "Failed to load users.");
      notify.error(err.message || "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdate = async (userId, field, value) => {
    try {
      await adminService.updateUser(userId, { [field]: value });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, [field]: value } : u))
      );
      notify.success("User data updated!");
    } catch (err) {
      notify.error(`Update error: ${err.message}`);
      fetchUsers();
    }
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setIsConfirmOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await adminService.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      notify.success(`User ${userToDelete.username} deleted.`);
    } catch (err) {
      notify.error(`Deletion error: ${err.message}`);
    } finally {
      setIsConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  if (isLoading) return <p>Loading users...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="admin-users-container">
      <h2>User Management</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td data-label="Username">{user.username}</td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Role">
                  <div className="role-cell-content">
                    <span className="role-icon" title={user.role}>
                      {user.role === "ADMIN" ? <FaUserShield /> : <FaUser />}
                    </span>
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleUpdate(user.id, "role", e.target.value)
                      }
                      disabled={user.id === currentUser.id}
                      className="role-select"
                    >
                      <option value="OPERATOR">OPERATOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </td>
                <td data-label="Status">
                  <select
                    value={user.is_active}
                    onChange={(e) =>
                      handleUpdate(
                        user.id,
                        "is_active",
                        e.target.value === "true"
                      )
                    }
                    disabled={user.id === currentUser.id}
                    className={`status-select ${
                      user.is_active ? "status-active" : "status-inactive"
                    }`}
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Deactivated</option>
                  </select>
                </td>
                <td data-label="Actions">
                  <button
                    onClick={() => handleDelete(user)}
                    className="btn-action btn-danger"
                    disabled={user.id === currentUser.id}
                    title="Delete user" // Підказка при наведенні
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDeleteUser}
        title="Confirm Deletion"
      >
        {userToDelete && (
          <p>
            Are you sure you want to delete user{" "}
            <strong>{userToDelete.username}</strong>? This action cannot be
            undone.
          </p>
        )}
      </ConfirmModal>
    </div>
  );
};

export default AdminUsersPage;
