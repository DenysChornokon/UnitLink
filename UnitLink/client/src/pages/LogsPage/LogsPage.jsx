// client/src/pages/LogsPage/LogsPage.jsx
import React, { useState, useEffect } from "react";
import logService from "../../services/logService";
import "./LogsPage.scss";

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
  }, [currentPage]); // Перезавантажуємо дані при зміні сторінки

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

  if (isLoading) {
    return (
      <div className="logs-container">
        <p>Завантаження...</p>
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
              <th>Підрозділ</th>
              <th>Повідомлення</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>
                    <span
                      className={`event-type-badge event-${log.event_type.toLowerCase()}`}
                    >
                      {log.event_type.replace("_", " ")}
                    </span>
                  </td>
                  <td>{log.device_name}</td>
                  <td>{log.message}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">Немає записів у журналі.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total_pages > 1 && (
        <div className="pagination-controls">
          <button onClick={handlePrevPage} disabled={!pagination.has_prev}>
            Попередня
          </button>
          <span>
            Сторінка {pagination.current_page} з {pagination.total_pages}
          </span>
          <button onClick={handleNextPage} disabled={!pagination.has_next}>
            Наступна
          </button>
        </div>
      )}
    </div>
  );
};

export default LogsPage;
