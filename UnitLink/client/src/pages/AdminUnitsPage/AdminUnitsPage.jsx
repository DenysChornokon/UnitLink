// client/src/pages/AdminUnitsPage/AdminUnitsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import unitService from "../../services/unitService";
import UnitFormModal from "../../components/UnitFormModal/UnitFormModal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import notify from "../../services/notificationService";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa"; // Імпортуємо іконки
import "./AdminUnitsPage.scss";

const AdminUnitsPage = () => {
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);

  const fetchUnits = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedUnits = await unitService.getUnits();
      setUnits(fetchedUnits);
    } catch (err) {
      setError(err.message || "Не вдалося завантажити підрозділи.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleOpenAddModal = () => {
    setEditingUnit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (unit) => {
    setEditingUnit(unit);
    setIsModalOpen(true);
  };

  const handleSaveUnit = async (formData, unitId) => {
    const action = unitId ? "оновлено" : "створено";
    try {
      if (unitId) {
        await unitService.updateUnit(unitId, formData);
      } else {
        await unitService.addUnit(formData);
      }
      notify.success(`Підрозділ успішно ${action}!`);
      await fetchUnits();
    } catch (error) {
      notify.error(error.message || `Помилка: не вдалося ${action} підрозділ.`);
      throw error; // Перекидаємо помилку, щоб модальне вікно не закрилося
    }
  };

  const handleDeleteUnit = (unit) => {
    setUnitToDelete(unit);
    setIsConfirmModalOpen(true);
  };

  const performDeleteUnit = async () => {
    if (!unitToDelete) return;

    try {
      await unitService.deleteUnit(unitToDelete.id);
      setUnits((prevUnits) =>
        prevUnits.filter((u) => u.id !== unitToDelete.id)
      );
      notify.success(`Підрозділ "${unitToDelete.name}" успішно видалено!`);
    } catch (err) {
      notify.error(err.message || "Помилка видалення підрозділу.");
    } finally {
      setIsConfirmModalOpen(false);
      setUnitToDelete(null);
    }
  };

  if (isLoading) return <p>Завантаження...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="admin-units-container">
      <div className="page-header">
        <h2>Управління підрозділами</h2>
        <button onClick={handleOpenAddModal} className="btn-primary">
          <FaPlus />
          <span>Додати підрозділ</span>
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Назва (Позивний)</th>
              <th>Тип</th>
              <th>Координати</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit.id}>
                <td data-label="Назва (Позивний)">{unit.name}</td>
                <td data-label="Тип">{unit.unit_type}</td>
                <td data-label="Координати">{unit.position?.join(", ")}</td>
                <td data-label="Дії" className="actions-cell">
                  <button
                    onClick={() => handleOpenEditModal(unit)}
                    className="btn-action btn-edit"
                  >
                    <FaEdit />
                    <span>Редагувати</span>
                  </button>
                  <button
                    onClick={() => handleDeleteUnit(unit)}
                    className="btn-action btn-danger"
                  >
                    <FaTrash />
                    <span>Видалити</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UnitFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUnit}
        initialData={editingUnit}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={performDeleteUnit}
        title="Підтвердження видалення"
      >
        {unitToDelete && (
          <p>
            Ви впевнені, що хочете видалити підрозділ{" "}
            <strong>"{unitToDelete.name}"</strong>?
          </p>
        )}
      </ConfirmModal>
    </div>
  );
};

export default AdminUnitsPage;
