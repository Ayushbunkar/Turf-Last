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

    // Determine current user from localStorage if not passed
    let currentUser = null;
    try {
      const raw = localStorage.getItem('user');
      if (raw) currentUser = JSON.parse(raw);
    } catch (e) {
      currentUser = null;
    }

    // Join a room for this user (personal room)
    const uid = userId || currentUser?._id;
    if (uid) {
      newSocket.emit('joinRoom', uid);
      console.debug('Socket: join personal room', uid);
    }

    // If user is a superadmin, also join the shared 'superadmin' room
    const role = currentUser?.role;
    if (role === 'superadmin') {
      newSocket.emit('joinRoom', 'superadmin');
      console.debug('Socket: join superadmin room');
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
