import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, userId }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Use API base from env if available to avoid hard-coding host/port
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4500';
    const token = (() => {
      try { const raw = localStorage.getItem('token'); return raw || null; } catch (e) { return null; }
    })();

    const newSocket = io(API_BASE, {
      path: '/socket.io',
      transports: ['websocket', 'polling'], // prefer websocket but allow polling fallback
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: token ? { token } : undefined,
      withCredentials: true,
    });
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG) console.debug('Socket: attempting connection to', API_BASE);
    setSocket(newSocket);

    // Determine current user from localStorage if not passed
    let currentUser = null;
    try {
      const raw = localStorage.getItem('user');
      if (raw) currentUser = JSON.parse(raw);
    } catch (e) {
      currentUser = null;
    }
    // derive role from stored user if available
    const role = currentUser?.role || null;

    // Join a room for this user (personal room)
    const uid = userId || currentUser?._id;
    newSocket.on('connect', () => {
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG) console.debug('Socket connected:', newSocket.id);
      // Join personal room after connect
      if (uid) {
        newSocket.emit('joinRoom', uid);
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG) console.debug('Socket: join personal room', uid);
      }
      if (role === 'superadmin') {
        newSocket.emit('joinRoom', 'superadmin');
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG) console.debug('Socket: join superadmin room');
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connect_error', err && err.message ? err.message : err);
    });

    newSocket.on('reconnect_attempt', (attempt) => {
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG) console.debug('Socket reconnect attempt', attempt);
    });

    // role handling moved into connect handler above

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
