// client/src/components/Footer/Footer.jsx
import React from "react";
import "./Footer.scss";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <span className="copyright">
          &copy; {currentYear} UnitLink Monitoring System. All rights reserved.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
