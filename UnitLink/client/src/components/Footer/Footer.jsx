import React from "react";
import "./Footer.scss";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <p>
        &copy; {currentYear} UnitLink Monitoring System. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
