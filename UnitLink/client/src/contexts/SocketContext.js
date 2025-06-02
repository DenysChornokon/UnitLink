// src/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = io(
      process.env.REACT_APP_API_BASE_URL || "http://localhost:5000"
    );

    socketInstance.on("connect", () => {
      console.log("Socket.IO Connected globally!");
      setSocket(socketInstance);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket.IO Disconnected globally!");
      setSocket(null);
    });

    // Запам'ятовуємо екземпляр сокета
    setSocket(socketInstance);

    return () => {
      console.log("Cleaning up global socket connection...");
      socketInstance.disconnect();
    };
  }, []); // Пустий масив гарантує, що ефект виконається один раз

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
