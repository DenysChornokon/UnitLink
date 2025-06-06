// client/src/components/ConfirmModal/ConfirmModal.jsx
import React from "react";
import { FaExclamationTriangle } from "react-icons/fa"; // Іконка для попередження
import "./ConfirmModal.scss";

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;

  // Використовуємо stopPropagation, щоб клік по модальному вікну не закривав його
  const handleContentClick = (e) => e.stopPropagation();

  return (
    // Оверлей, клік по якому закриває вікно
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content confirm-modal" onClick={handleContentClick}>
        <div className="modal-header">
          <FaExclamationTriangle className="header-icon" />
          <h2>{title || "Підтвердження дії"}</h2>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn btn-danger">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
