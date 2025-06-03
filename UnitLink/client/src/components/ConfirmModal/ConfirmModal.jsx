// client/src/components/ConfirmModal/ConfirmModal.jsx
import React from "react";
// Ми можемо перевикористати стилі з UnitFormModal
import "../UnitFormModal/UnitFormModal.scss";

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{title || "Підтвердження дії"}</h2>
        <p>{children}</p>
        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">
            Скасувати
          </button>
          <button onClick={onConfirm} className="btn-danger">
            Підтвердити
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
