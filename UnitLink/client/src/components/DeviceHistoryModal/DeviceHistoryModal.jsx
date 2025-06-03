// client/src/components/DeviceHistoryModal/DeviceHistoryModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import unitService from "../../services/unitService";
import "./DeviceHistoryModal.scss";

const DeviceHistoryModal = ({ isOpen, onClose, unit }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    if (isOpen && unit) {
      const fetchHistory = async () => {
        setIsLoading(true);
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

  if (!isOpen) return null;

  const chartData = {
    labels: history.map((h) => new Date(h.timestamp)),
    datasets: [
      // Графік для RSSI
      {
        label: "Рівень сигналу (RSSI)",
        data: history.map((h) => h.signal_rssi),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        yAxisID: "y_rssi",
      },
      // Графік для Затримки
      {
        label: "Затримка (ms)",
        data: history.map((h) => h.latency_ms),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        yAxisID: "y_latency",
      },
      // Графік для Втрати пакетів
      {
        label: "Втрата пакетів (%)",
        data: history.map((h) => h.packet_loss_percent),
        borderColor: "rgb(255, 206, 86)",
        backgroundColor: "rgba(255, 206, 86, 0.5)",
        yAxisID: "y_loss",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: `Історія телеметрії для: ${unit?.name || "N/A"}`,
      },
      zoom: {
        // <-- НАЛАШТУВАННЯ ДЛЯ chartjs-plugin-zoom
        pan: {
          enabled: true, 
          mode: "xy",
          // threshold: 5,
        },
        zoom: {
          wheel: {
            enabled: true, 
          },
          pinch: {
            enabled: true, 
          },
          mode: "xy",
        },
      },
    },
    scales: {
      x: { type: "time", time: { unit: "hour" } },
      y_rssi: {
        type: "linear",
        position: "left",
        title: { display: true, text: "RSSI (dBm)" },
      },
      y_latency: {
        type: "linear",
        position: "right",
        title: { display: true, text: "Latency (ms)" },
      },
      y_loss: { display: false }, // Можна приховати, якщо не потрібно
    },
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-btn">
          &times;
        </button>
        {isLoading ? (
          <p>Завантаження історії...</p>
        ) : (
          <Line options={chartOptions} data={chartData} />
        )}
      </div>
    </div>
  );
};

export default DeviceHistoryModal;
