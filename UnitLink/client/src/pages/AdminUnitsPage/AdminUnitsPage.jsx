// client/src/pages/AdminUnitsPage/AdminUnitsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import unitService from "../../services/unitService";
import UnitFormModal from "../../components/UnitFormModal/UnitFormModal";
import "./AdminUnitsPage.scss";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import notify from "../../services/notificationService";

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
    if (unitId) {
      // Редагування
      await unitService.updateUnit(unitId, formData);
    } else {
      // Створення
      await unitService.addUnit(formData);
    }
    // Після збереження оновлюємо весь список
    await fetchUnits();
  };

  const handleOpenConfirmDeleteModal = (unit) => {
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

  const handleDeleteUnit = (unit) => {
    handleOpenConfirmDeleteModal(unit);
  };

  if (isLoading) return <p>Завантаження...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="admin-units-container">
      <div className="page-header">
        <h2>Управління підрозділами</h2>
        <button onClick={handleOpenAddModal} className="btn-primary">
          Додати підрозділ
        </button>
      </div>

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
              <td>{unit.name}</td>
              <td>{unit.unit_type}</td>
              <td>{unit.position?.join(", ")}</td>
              <td className="actions-cell">
                <button
                  onClick={() => handleOpenEditModal(unit)}
                  className="btn-secondary"
                >
                  Редагувати
                </button>
                <button
                  onClick={() => handleDeleteUnit(unit)}
                  className="btn-danger"
                >
                  Видалити
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
