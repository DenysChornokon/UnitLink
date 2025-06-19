// client/src/components/UserProfileDropdown/UserProfileDropdown.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./UserProfileDropdown.scss";
// Імпортуємо іконки
import {
  FaUserEdit,
  FaSignOutAlt,
  FaUserShield,
  FaUserCircle,
} from "react-icons/fa"; // FaUserShield для адміна, або FaUser для оператора

const UserProfileDropdown = ({ onLogout }) => {
  const { currentUser } = useAuth();

const RoleIcon = currentUser?.role === "ADMIN" ? FaUserShield : FaUserCircle;

  return (
    <div className="user-profile-dropdown">
      <div className="dropdown-header">
        <RoleIcon size="2em" className="header-role-icon" />
        <div className="user-details">
          <span className="username">
            {currentUser?.username || "Користувач"}
          </span>
          <span className="role">Role: {currentUser?.role || "Гість"}</span>
        </div>
      </div>
      <hr className="dropdown-divider" />
      <Link to="/profile" className="dropdown-item">
        <FaUserEdit className="dropdown-item-icon" />
        <span>My Profile</span>
      </Link>
      <button onClick={onLogout} className="dropdown-item logout-button">
        <FaSignOutAlt className="dropdown-item-icon" />
        <span>Leave</span>
      </button>
    </div>
  );
};

export default UserProfileDropdown;
