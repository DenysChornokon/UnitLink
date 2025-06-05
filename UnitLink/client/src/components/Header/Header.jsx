// client/src/components/Header/Header.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import AlertsBell from "../AlertsBell/AlertsBell";
import UserProfileDropdown from "../UserProfileDropdown/UserProfileDropdown";
import "./Header.scss";

const Header = () => {
  const { currentUser, logout } = useAuth();
  // Єдиний стан для контролю, який дропдаун активний
  const [activeDropdown, setActiveDropdown] = useState(null); // null, 'profile', або 'alerts'
  const userMenuRef = useRef(null); // Ref для всього блоку .user-info, щоб закривати будь-який дропдаун

  const handleLogout = async () => {
    try {
      await logout();
      setActiveDropdown(null); // Закриваємо будь-який активний дропдаун після виходу
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Тогл для дропдауна профілю
  const handleProfileToggle = () => {
    setActiveDropdown((prev) => (prev === "profile" ? null : "profile"));
  };

  // Тогл для дропдауна сповіщень (передається в AlertsBell)
  const handleAlertsToggle = () => {
    setActiveDropdown((prev) => (prev === "alerts" ? null : "alerts"));
  };

  // Закриття будь-якого активного дропдауну при кліку поза ним
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      // Якщо будь-який дропдаун відкритий
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdown]); // Залежність від activeDropdown

  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/map" className="logo">
          UnitLink
        </Link>

        <nav className="main-nav">
          <NavLink to="/map" className="nav-link">
            Map
          </NavLink>
          <NavLink to="/logs" className="nav-link">
            Logs
          </NavLink>
          {currentUser?.role === "ADMIN" && (
            <>
              <NavLink to="/admin-requests" className="nav-link">
                Admin Requests
              </NavLink>
              <NavLink to="/admin-units" className="nav-link">
                Manage Units
              </NavLink>
              <NavLink to="/admin-users" className="nav-link">
                Manage Users
              </NavLink>
            </>
          )}
        </nav>

        {currentUser && (
          <div className="user-info" ref={userMenuRef}>
            <AlertsBell
              isOpen={activeDropdown === "alerts"}
              onToggle={handleAlertsToggle}
            />
            <button
              className="profile-icon-button"
              onClick={handleProfileToggle}
              aria-expanded={activeDropdown === "profile"} // Використовуємо activeDropdown
              aria-label="User menu"
            >
              <FaUserCircle />
            </button>
            {/* Умовний рендер дропдауна профілю */}
            {activeDropdown === "profile" && (
              <UserProfileDropdown onLogout={handleLogout} />
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
