// client/src/components/DeviceHistoryModal/DeviceHistoryModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import unitService from "../../services/unitService";
import { FaUndo, FaTimes } from "react-icons/fa";
import "./DeviceHistoryModal.scss";

// Кольори для графіків, що відповідають нашій палітрі
const chartColors = {
  rssi: "#3498DB",
  latency: "#E74C3C",
  loss: "#F39C12",
  grid: "#e9ecef",
  text: "#7f8c8d",
};

// Базові опції, спільні для всіх графіків
const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: { display: false }, // Легенда не потрібна для графіка з однією лінією
    tooltip: {
      titleFont: { family: "'Roboto', sans-serif" },
      bodyFont: { family: "'Roboto', sans-serif" },
    },
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
  },
};

const DeviceHistoryModal = ({ isOpen, onClose, unit }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chartsRef = useRef([]); // Використовуємо масив ref-ів для всіх графіків

  useEffect(() => {
    if (isOpen && unit) {
      const fetchHistory = async () => {
        setIsLoading(true);
        setHistory([]);
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
    chartsRef.current.forEach((chartInstance) => {
      if (chartInstance) {
        chartInstance.resetZoom();
      }
    });
  };

  if (!isOpen) return null;

  // Готуємо дані та опції для кожного графіка окремо
  const labels = history.map((h) => new Date(h.timestamp));

  const rssiChart = {
    options: {
      ...baseChartOptions,
      plugins: {
        ...baseChartOptions.plugins,
        title: {
          display: true,
          text: "Рівень сигналу (RSSI)",
          color: chartColors.text,
        },
      },
      scales: {
        ...baseChartOptions.scales,
        y: {
          title: { display: true, text: "dBm" },
          ticks: { color: chartColors.rssi },
        },
      },
    },
    data: {
      labels,
      datasets: [
        {
          label: "RSSI",
          data: history.map((h) => h.signal_rssi),
          borderColor: chartColors.rssi,
          backgroundColor: `${chartColors.rssi}33`,
          tension: 0.1,
        },
      ],
    },
  };

  const latencyChart = {
    options: {
      ...baseChartOptions,
      plugins: {
        ...baseChartOptions.plugins,
        title: {
          display: true,
          text: "Затримка (ms)",
          color: chartColors.text,
        },
      },
      scales: {
        ...baseChartOptions.scales,
        y: {
          title: { display: true, text: "ms" },
          ticks: { color: chartColors.latency },
        },
      },
    },
    data: {
      labels,
      datasets: [
        {
          label: "Latency",
          data: history.map((h) => h.latency_ms),
          borderColor: chartColors.latency,
          backgroundColor: `${chartColors.latency}33`,
          tension: 0.1,
        },
      ],
    },
  };

  const lossChart = {
    options: {
      ...baseChartOptions,
      plugins: {
        ...baseChartOptions.plugins,
        title: {
          display: true,
          text: "Втрата пакетів (%)",
          color: chartColors.text,
        },
      },
      scales: {
        ...baseChartOptions.scales,
        y: {
          title: { display: true, text: "%" },
          ticks: { color: chartColors.loss, stepSize: 1 },
        },
      },
    },
    data: {
      labels,
      datasets: [
        {
          label: "Packet Loss",
          data: history.map((h) => h.packet_loss_percent),
          borderColor: chartColors.loss,
          backgroundColor: `${chartColors.loss}33`,
          tension: 0.1,
        },
      ],
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
        <div className="charts-grid-container">
          {isLoading ? (
            <p>Завантаження історії...</p>
          ) : (
            <>
              <div className="chart-item">
                <Line
                  ref={(el) => (chartsRef.current[0] = el)}
                  options={rssiChart.options}
                  data={rssiChart.data}
                />
              </div>
              <div className="chart-item">
                <Line
                  ref={(el) => (chartsRef.current[1] = el)}
                  options={latencyChart.options}
                  data={latencyChart.data}
                />
              </div>
              <div className="chart-item">
                <Line
                  ref={(el) => (chartsRef.current[2] = el)}
                  options={lossChart.options}
                  data={lossChart.data}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceHistoryModal;
