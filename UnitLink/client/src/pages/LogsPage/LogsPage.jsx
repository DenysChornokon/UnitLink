// client/src/pages/LogsPage/LogsPage.jsx
import React, { useState, useEffect } from "react";
import logService from "../../services/logService";
import {
  FaLink,
  FaUnlink,
  FaRandom,
  FaUserCog,
  FaCogs,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa"; // Імпортуємо іконки
import "./LogsPage.scss";

// Мапінг типів подій на відповідні іконки та текст
const eventTypeDetails = {
  CONNECTED: { icon: FaLink, text: "Connected" },
  DISCONNECTED: { icon: FaUnlink, text: "Disconnected" },
  STATUS_CHANGE: { icon: FaRandom, text: "Status Change" },
  USER_ACTION: { icon: FaUserCog, text: "User Action" },
  CONFIG_UPDATE: { icon: FaCogs, text: "Config Update" },
  PARAMETER_THRESHOLD: { icon: FaExclamationTriangle, text: "Threshold Alert" },
  DEFAULT: { icon: FaExclamationTriangle, text: "Unknown Event" },
};

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await logService.getLogs({
          page: currentPage,
          perPage: 20,
        });
        setLogs(data.logs);
        setPagination(data.pagination);
      } catch (err) {
        setError(err.message || "Не вдалося завантажити журнал подій.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [currentPage]);

  const handlePrevPage = () => {
    if (pagination?.has_prev) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination?.has_next) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const renderEmptyState = () => (
    <tr className="empty-row">
      <td colSpan="4">
        <div className="empty-state-content">
          <h4>Журнал подій порожній</h4>
          <p>Наразі не зафіксовано жодних значущих подій у системі.</p>
        </div>
      </td>
    </tr>
  );

  const renderLogs = () => {
    return logs.map((log) => {
      const details =
        eventTypeDetails[log.event_type] || eventTypeDetails.DEFAULT;
      const EventIcon = details.icon;

      return (
        <tr key={log.id}>
          <td>
            {log.timestamp
              ? new Date(log.timestamp).toLocaleString("uk-UA")
              : "-"}
          </td>
          <td>
            <span
              className={`event-type-badge event-${log.event_type.toLowerCase()}`}
            >
              <EventIcon className="event-icon" />
              <span>{details.text}</span>
            </span>
          </td>
          <td>{log.device_name || "N/A"}</td>
          <td>{log.message}</td>
        </tr>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="logs-container">
        <p>Завантаження...</p> {/* TODO: Замінити на гарний спіннер */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="logs-container error-message">
        <p>Помилка: {error}</p>
      </div>
    );
  }

  return (
    <div className="logs-container">
      <h2>Журнал Подій</h2>
      <div className="logs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Час</th>
              <th>Тип Події</th>
              <th>Підрозділ / Джерело</th>
              <th>Повідомлення</th>
            </tr>
          </thead>
          <tbody>{logs.length > 0 ? renderLogs() : renderEmptyState()}</tbody>
        </table>
      </div>

      {pagination && pagination.total_pages > 1 && (
        <div className="pagination-controls">
          <button onClick={handlePrevPage} disabled={!pagination.has_prev}>
            <FaChevronLeft />
            <span>Попередня</span>
          </button>
          <span>
            Сторінка {pagination.current_page} з {pagination.total_pages}
          </span>
          <button onClick={handleNextPage} disabled={!pagination.has_next}>
            <span>Наступна</span>
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default LogsPage;
