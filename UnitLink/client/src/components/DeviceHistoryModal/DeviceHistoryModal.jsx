// client/src/components/DeviceHistoryModal/DeviceHistoryModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import unitService from "../../services/unitService";
import { FaUndo, FaTimes } from "react-icons/fa"; // Іконки для кнопок
import "./DeviceHistoryModal.scss";

// Визначимо кольори, що відповідають нашій палітрі в _variables.scss
// Ми не можемо імпортувати SCSS змінні в JS, тому дублюємо значення тут
const chartColors = {
  rssi: "#3498DB", // $accent-blue
  latency: "#E74C3C", // Близько до $status-danger
  loss: "#F39C12", // $status-warning
  grid: "#e9ecef", // $gray-background
  text: "#7f8c8d", // $text-muted
};

const DeviceHistoryModal = ({ isOpen, onClose, unit }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    if (isOpen && unit) {
      const fetchHistory = async () => {
        setIsLoading(true);
        setHistory([]); // Очищуємо попередні дані
        try {
          const data = await unitService.getUnitHistory(unit.id);
          setHistory(data);
        } catch (error) {
          console.error("Failed to fetch history", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen, unit]);

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  if (!isOpen) return null;

  // Готуємо дані для графіка
  const chartData = {
    labels: history.map((h) => new Date(h.timestamp)),
    datasets: [
      {
        label: "Рівень сигналу (RSSI)",
        data: history.map((h) => h.signal_rssi),
        borderColor: chartColors.rssi,
        backgroundColor: `${chartColors.rssi}33`, // той же колір з прозорістю
        tension: 0.1,
        yAxisID: "y_rssi",
      },
      {
        label: "Затримка (ms)",
        data: history.map((h) => h.latency_ms),
        borderColor: chartColors.latency,
        backgroundColor: `${chartColors.latency}33`,
        tension: 0.1,
        yAxisID: "y_latency",
      },
      {
        label: "Втрата пакетів (%)",
        data: history.map((h) => h.packet_loss_percent),
        borderColor: chartColors.loss,
        backgroundColor: `${chartColors.loss}33`,
        tension: 0.1,
        yAxisID: "y_loss",
      },
    ],
  };

  // Готуємо опції для графіка
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Дозволяє графіку заповнити контейнер по висоті
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: chartColors.text,
          font: { family: "'Roboto', sans-serif" },
        },
      },
      tooltip: {
        titleFont: { family: "'Roboto', sans-serif" },
        bodyFont: { family: "'Roboto', sans-serif" },
      },
      // Заголовок тепер буде в розмітці, а не в опціях
      title: { display: false },
      zoom: {
        pan: { enabled: true, mode: "x" },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
      },
    },
    scales: {
      x: {
        type: "time",
        time: { unit: "hour", tooltipFormat: "PP HH:mm:ss" },
        grid: { color: chartColors.grid },
        ticks: {
          color: chartColors.text,
          font: { family: "'Roboto', sans-serif" },
        },
      },
      y_rssi: {
        type: "linear",
        position: "left",
        title: { display: true, text: "RSSI (dBm)", color: chartColors.text },
        grid: { drawOnChartArea: false }, // Прибираємо сітку для цієї осі
        ticks: { color: chartColors.rssi },
      },
      y_latency: {
        type: "linear",
        position: "right",
        title: { display: true, text: "Latency (ms)", color: chartColors.text },
        ticks: { color: chartColors.latency },
      },
      y_loss: {
        type: "linear",
        position: "right",
        title: { display: true, text: "Loss (%)", color: chartColors.text },
        grid: { drawOnChartArea: false }, // Прибираємо сітку
        ticks: { color: chartColors.loss },
        // Розміщуємо цю вісь трохи далі праворуч
        afterFit: (scaleInstance) => {
          scaleInstance.width = 50;
        },
      },
    },
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Історія телеметрії: {unit?.name || "..."}</h2>
          <div className="modal-actions-header">
            <button
              onClick={handleResetZoom}
              className="btn btn-secondary btn-sm"
              title="Скинути масштаб"
            >
              <FaUndo />
            </button>
            <button onClick={onClose} className="close-btn" title="Закрити">
              <FaTimes />
            </button>
          </div>
        </div>
        <div className="chart-container">
          {isLoading ? (
            <p>Завантаження історії...</p>
          ) : (
            <Line ref={chartRef} options={chartOptions} data={chartData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceHistoryModal;
