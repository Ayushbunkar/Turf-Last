import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, userId }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
  const newSocket = io("http://localhost:4500"); // Port now matches backend
    setSocket(newSocket);

    // Join a room for this user
    if (userId) {
      newSocket.emit("joinRoom", userId);
    }

    // Listen for notifications
    newSocket.on("receiveNotification", (data) => {
      console.log("Notification received:", data);
      setNotifications((prev) => [...prev, data]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, notifications }}>
      {children}
    </SocketContext.Provider>
  );
};
