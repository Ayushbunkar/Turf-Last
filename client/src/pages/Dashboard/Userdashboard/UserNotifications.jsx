import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell, Check, Trash2, Calendar, CreditCard, AlertTriangle, Info
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import Sidebar from "../../../components/Sidebar/UserSidebar";
import api from "../../../config/Api.jsx";
import toast from "react-hot-toast";

// Local Card fallback (components/ui/Card not present)
function Card({ className = "", children }) {
  return (
    <div className={`rounded-xl shadow-lg bg-white dark:bg-gray-800 ${className}`}>
      {children}
    </div>
  );
}

const icons = {
  booking: { Icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
  payment: { Icon: CreditCard, color: "text-green-600", bg: "bg-green-100" },
  reminder: { Icon: Bell, color: "text-purple-600", bg: "bg-purple-100" },
  warning: { Icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
  info: { Icon: Info, color: "text-blue-600", bg: "bg-blue-100" },
  default: { Icon: Bell, color: "text-gray-600", bg: "bg-gray-100" },
};

export default function UserNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [darkMode, setDarkMode] = useState(false);
  const [selected, setSelected] = useState([]);

  // Fetch Notifications
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/notifications/user");
        setNotifications(res.data || []);
      } catch {
        toast.error("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = notifications.filter((n) =>
    filter === "all"
      ? true
      : filter === "unread"
      ? !n.read
      : n.type === filter
  );

  const updateNotif = (id, updates) =>
    setNotifications((n) => n.map((x) => (x._id === id ? { ...x, ...updates } : x)));

  const deleteNotif = async (id) => {
    await api.delete(`/notifications/${id}`).catch(() => {});
    setNotifications((n) => n.filter((x) => x._id !== id));
  };

  const markAsRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    updateNotif(id, { read: true });
  };

  const markAllAsRead = async () => {
    await api.patch("/notifications/mark-all-read").catch(() => {});
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    toast.success("All marked as read");
  };

  const deleteSelected = async () => {
    await api.delete("/notifications/bulk-delete", { data: { notificationIds: selected } }).catch(() => {});
    setNotifications((n) => n.filter((x) => !selected.includes(x._id)));
    setSelected([]);
  };

  const formatTime = (d) => {
    const diff = (Date.now() - new Date(d)) / (1000 * 60 * 60);
    if (diff < 1) return "Just now";
    if (diff < 24) return `${Math.floor(diff)}h ago`;
    const days = Math.floor(diff / 24);
    return days < 7 ? `${days}d ago` : new Date(d).toLocaleDateString();
  };

  if (!user)
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Please log in to view your notifications
      </div>
    );

  return (
    <div className={`${darkMode ? "dark" : ""} min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-gray-900 dark:to-gray-800`}>
      <div className="flex">
        <Sidebar user={user} onToggleDark={() => setDarkMode(!darkMode)} darkMode={darkMode} />
        <main className="flex-1 ml-0 lg:ml-64 p-6 ">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Notifications
                {!!notifications.filter((n) => !n.read).length && (
                  <span className="ml-3 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                    {notifications.filter((n) => !n.read).length} new
                  </span>
                )}
              </h1>
              {notifications.some((n) => !n.read) && (
                <button onClick={markAllAsRead} className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filters */}
            <Card className="p-3 mb-6 flex flex-wrap gap-2">
              {["all", "unread", "booking", "payment", "reminder", "info", "warning"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    filter === t
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
              {!!selected.length && (
                <button
                  onClick={deleteSelected}
                  className="ml-auto px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                >
                  Delete ({selected.length})
                </button>
              )}
            </Card>

            {/* Notification List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full" />
              </div>
            ) : filtered.length ? (
              <div className="space-y-4">
                {filtered.map((n) => {
                  const { Icon, color, bg } = icons[n.type] || icons.default;
                  return (
                    <Card key={n._id} className={`p-4 flex items-start gap-3 shadow-md ${!n.read ? "border-l-4 border-green-500" : ""}`}>
                      <input
                        type="checkbox"
                        checked={selected.includes(n._id)}
                        onChange={() =>
                          setSelected((s) =>
                            s.includes(n._id) ? s.filter((x) => x !== n._id) : [...s, n._id]
                          )
                        }
                        className="mt-1 h-4 w-4 text-green-600"
                      />
                      <div className={`p-2 rounded-full ${bg}`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${n.read ? "text-gray-500" : "text-gray-900"}`}>
                          {n.title}
                        </h3>
                        <p className={`text-sm ${n.read ? "text-gray-500" : "text-gray-700"}`}>{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                      </div>
                      <div className="flex gap-2">
                        {!n.read && (
                          <button onClick={() => markAsRead(n._id)} title="Mark as read">
                            <Check className="w-4 h-4 text-blue-600" />
                          </button>
                        )}
                        <button onClick={() => deleteNotif(n._id)} title="Delete">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-white mb-2">
                  No notifications
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {filter !== "all" ? `No ${filter} notifications found` : "You're all caught up!"}
                </p>
              </Card>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
