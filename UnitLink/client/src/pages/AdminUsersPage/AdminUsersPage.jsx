// client/src/pages/AdminUsersPage/AdminUsersPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import adminService from "../../services/adminService";
import { useAuth } from "../../contexts/AuthContext";
import notify from "../../services/notificationService";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal"; // Make sure this path is correct
import "./AdminUsersPage.scss";

const AdminUsersPage = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null); // Stores the user object to be deleted

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null); // Clear previous errors
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || "Failed to load users.");
      notify.error(err.message || "Failed to load users."); // English alert
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
      notify.success("User data updated!"); // English alert
    } catch (err) {
      notify.error(`Update error: ${err.message}`); // English alert
      fetchUsers(); // Re-fetch to revert optimistic UI update if failed
    }
  };

  // This function now just opens the modal
  const handleDelete = (user) => {
    // Changed parameter from userId to user object
    setUserToDelete(user); // Store the whole user object
    setIsConfirmOpen(true);
  };

  // This function is called when "Confirm" is clicked in the modal
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await adminService.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      notify.success(`User ${userToDelete.username} deleted.`); // English alert
    } catch (err) {
      notify.error(`Deletion error: ${err.message}`); // English alert
    } finally {
      setIsConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  if (isLoading) return <p>Loading users...</p>; // English text
  if (error) return <p className="error-message">{error}</p>; // Error message can be in English too if setError is updated

  return (
    <div className="admin-users-container">
      <h2>User Management</h2> {/* English title */}
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th> {/* English header */}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) =>
                    handleUpdate(user.id, "role", e.target.value)
                  }
                  disabled={user.id === currentUser.id}
                >
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
              <td>
                <select
                  value={user.is_active}
                  onChange={(e) =>
                    handleUpdate(
                      user.id,
                      "is_active",
                      e.target.value === "true" // Convert string "true" to boolean true
                    )
                  }
                  disabled={user.id === currentUser.id}
                  className={
                    user.is_active ? "status-active" : "status-inactive"
                  }
                >
                  <option value={true}>Active</option> {/* English text */}
                  <option value={false}>Deactivated</option>{" "}
                  {/* English text */}
                </select>
              </td>
              <td>
                <button
                  onClick={() => handleDelete(user)} // Pass the whole user object
                  className="btn-danger"
                  disabled={user.id === currentUser.id}
                >
                  Delete {/* English text */}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* This is where Step 5 (rendering the ConfirmModal) goes */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDeleteUser}
        title="Confirm Deletion" // English title
      >
        {userToDelete && ( // Check if userToDelete is not null
          <p>
            Are you sure you want to delete user{" "}
            <strong>{userToDelete.username}</strong>? This action cannot be
            undone.
          </p> // English text
        )}
      </ConfirmModal>
    </div>
  );
};

export default AdminUsersPage;
