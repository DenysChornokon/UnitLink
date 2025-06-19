// client/src/components/UnitFormModal/UnitFormModal.jsx
import React, { useState, useEffect } from "react";
import "./UnitFormModal.scss";

// Типи підрозділів (мають відповідати Enum'ам на бекенді)
const UNIT_TYPES = [
  "COMMAND_POST",
  "OBSERVATION_POST",
  "COMMUNICATION_HUB",
  "FIELD_UNIT",
  "LOGISTICS",
  "CHECKPOINT",
  "MEDICAL",
  "TECHNICAL",
  "OTHER",
];

const UnitFormModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    latitude: "",
    longitude: "",
    unit_type: "FIELD_UNIT",
  });
  const [error, setError] = useState("");

  const isEditing = !!initialData;

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        latitude: initialData.position ? initialData.position[0] : "",
        longitude: initialData.position ? initialData.position[1] : "",
        unit_type: initialData.unit_type || "FIELD_UNIT",
      });
    } else {
      // Скидаємо форму для створення нового
      setFormData({
        name: "",
        description: "",
        latitude: "",
        longitude: "",
        unit_type: "FIELD_UNIT",
      });
    }
    setError(""); // Очищуємо помилки при відкритті/зміні
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await onSave(formData, isEditing ? initialData.id : null);
      onClose();
    } catch (err) {
      setError(err.message || "Сталася помилка. Перевірте дані.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isEditing ? "Редагувати підрозділ" : "Створити підрозділ"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Опис</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Latitude</label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Unit type</label>
            <select
              name="unit_type"
              value={formData.unit_type}
              onChange={handleChange}
            >
              {UNIT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnitFormModal;
