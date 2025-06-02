// src/contexts/UnitContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import unitService from "../services/unitService";
import { useSocket } from "./SocketContext"; // Імпортуємо хук сокета

const UnitContext = createContext({
  units: [],
  isLoading: false,
  error: null,
});

export const useUnits = () => {
  return useContext(UnitContext);
};

export const UnitProvider = ({ children }) => {
  const socket = useSocket(); // Отримуємо доступ до сокета
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Початкове завантаження даних
  useEffect(() => {
    const fetchInitialUnits = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedUnits = await unitService.getUnits();
        setUnits(fetchedUnits || []);
      } catch (err) {
        setError(err.message || "Failed to fetch units");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialUnits();
  }, []);

  // 2. Обробка оновлень через WebSocket
  useEffect(() => {
    if (!socket) {
      return; // Якщо сокет ще не підключено, нічого не робимо
    }

    const handleUnitUpdate = (updatedUnitData) => {
      console.log("UnitContext received update:", updatedUnitData);
      setUnits((prevUnits) =>
        prevUnits.map((unit) =>
          unit.id === updatedUnitData.id
            ? { ...unit, ...updatedUnitData }
            : unit
        )
      );
    };

    socket.on("unit_status_update", handleUnitUpdate);

    return () => {
      socket.off("unit_status_update", handleUnitUpdate);
    };
  }, [socket]); // Цей ефект залежить від сокета

  const value = { units, isLoading, error };

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
};
