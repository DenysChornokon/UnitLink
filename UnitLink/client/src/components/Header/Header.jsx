import React from "react";
import { Link } from "react-router-dom"; // Для посилання на головну/мапу
import AlertsBell from "../AlertsBell/AlertsBell";
import { useAuth } from "../../contexts/AuthContext";
import "./Header.scss";

const Header = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Навігація тепер відбувається всередині logout в AuthContext
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/map" className="logo">
          UnitLink
        </Link>
        <nav className="main-nav">
          <Link to="/map">Map</Link>
          <Link to="/logs">Logs</Link>
          {currentUser?.role === "ADMIN" && (
            <>
              <Link to="/admin-requests">Admin Requests</Link>
              <Link to="/admin-units">Manage Units</Link>
              <Link to="/admin-users">Manage Users</Link>
            </>
          )}
          {/* Додайте інші посилання за потребою */}
        </nav>

        <div className="user-info">
          <AlertsBell />
          <span>Role: {currentUser?.role || "Guest"}</span>
          <Link to="/profile" className="btn btn-profile" style={{marginRight: '10px'}}>Profile</Link>
          <button onClick={handleLogout} className="btn btn-logout">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
