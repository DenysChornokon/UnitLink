// client/src/pages/AdminUnitsPage/AdminUnitsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import unitService from "../../services/unitService";
import UnitFormModal from "../../components/UnitFormModal/UnitFormModal";
import "./AdminUnitsPage.scss";
import notify from "../../services/notificationService";

const AdminUnitsPage = () => {
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

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

  const handleDeleteUnit = async (unitId) => {
    if (window.confirm("Ви впевнені, що хочете видалити цей підрозділ?")) {
      try {
        await unitService.deleteUnit(unitId);
        // Оновлюємо список, видаливши елемент
        setUnits((prev) => prev.filter((u) => u.id !== unitId));
      } catch (err) {
        notify.error(err.message || "Помилка видалення.");
      }
    }
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
                  onClick={() => handleDeleteUnit(unit.id)}
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
    </div>
  );
};

export default AdminUnitsPage;
