// client/src/contexts/AlertsContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import alertService from "../services/alertService";
import { useSocket } from "./SocketContext";

const AlertsContext = createContext();

export const useAlerts = () => useContext(AlertsContext);

export const AlertsProvider = ({ children }) => {
  const socket = useSocket();
  const [alerts, setAlerts] = useState([]);

  // Завантаження початкових сповіщень
  useEffect(() => {
    const fetchInitialAlerts = async () => {
      try {
        const initialAlerts = await alertService.getUnacknowledged();
        setAlerts(initialAlerts);
      } catch (error) {
        console.error("Could not fetch initial alerts.");
      }
    };
    fetchInitialAlerts();
  }, []);

  // Слухаємо нові сповіщення з WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleNewAlert = (newAlert) => {
      setAlerts((prevAlerts) => [newAlert, ...prevAlerts]);
      // Можна додати програвання звуку тут
      // const audio = new Audio('/path/to/alert.mp3');
      // audio.play();
    };

    socket.on("new_alert", handleNewAlert);
    return () => socket.off("new_alert", handleNewAlert);
  }, [socket]);

  const acknowledgeAlert = async (alertId) => {
    try {
      await alertService.acknowledge(alertId);
      setAlerts((prevAlerts) => prevAlerts.filter((a) => a.id !== alertId));
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  const value = {
    alerts,
    alertCount: alerts.length,
    acknowledgeAlert,
  };

  return (
    <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
  );
};
