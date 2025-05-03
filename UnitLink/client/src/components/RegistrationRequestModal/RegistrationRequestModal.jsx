import React, { useState } from "react";
import Modal from "react-modal"; // Імпорт бібліотеки
import authService from "../../services/authService";
import "./RegistrationRequestModal.scss"; // Стилі для модалки

// Важливо для доступності - вказуємо головний елемент додатку
Modal.setAppElement("#root"); // Або інший селектор вашого кореневого елемента

const RegistrationRequestModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    requested_username: "",
    email: "",
    full_name: "",
    rank: "",
    reason: "",
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage("");

    // Проста валідація на фронтенді
    if (
      !formData.requested_username ||
      !formData.email ||
      !formData.full_name
    ) {
      setError(
        "Please fill in all required fields (Username, Email, Full Name)."
      );
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.registerRequest(formData);
      setSuccessMessage(response.message || "Request submitted successfully!");
      // Очищаємо форму після успіху
      setFormData({
        requested_username: "",
        email: "",
        full_name: "",
        rank: "",
        reason: "",
      });
      // Можна автоматично закрити вікно через деякий час
      setTimeout(() => {
        handleClose();
      }, 3000); // Закрити через 3 секунди
    } catch (err) {
      setError(err.message || "Failed to submit request.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Скидаємо стан при закритті
    setError(null);
    setSuccessMessage("");
    setIsLoading(false);
    // Очищаємо форму (опціонально, можливо користувач захоче виправити дані)
    // setFormData({ requested_username: '', email: '', full_name: '', rank: '', reason: '' });
    onClose(); // Викликаємо функцію закриття, передану з батьківського компонента
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Registration Request Modal"
      className="modal-content" // Клас для стилізації контенту
      overlayClassName="modal-overlay" // Клас для стилізації фону
    >
      <h2>Registration Request</h2>
      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}

      {!successMessage && ( // Ховаємо форму після успіху
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="req_username">Desired Username *</label>
            <input
              type="text"
              id="req_username"
              name="requested_username"
              value={formData.requested_username}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="req_email">Email *</label>
            <input
              type="email"
              id="req_email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="req_fullname">Full Name *</label>
            <input
              type="text"
              id="req_fullname"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="req_rank">Rank (Optional)</label>
            <input
              type="text"
              id="req_rank"
              name="rank"
              value={formData.rank}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="req_reason">Reason for Request (Optional)</label>
            <textarea
              id="req_reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows="3"
              disabled={isLoading}
            ></textarea>
          </div>
          <div className="modal-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit Request"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {/* Якщо є повідомлення про успіх, показуємо тільки кнопку закриття */}
      {successMessage && (
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      )}
    </Modal>
  );
};

export default RegistrationRequestModal;
