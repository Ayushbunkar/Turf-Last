import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../config/Api.jsx";
import {
  Bell, Shield, Database, Key, Building2, Download, Trash2,
  Eye, EyeOff
} from "lucide-react";

// Local lightweight Card wrapper (avoids missing shared UI import)
// removed local Card wrapper — using plain divs instead

export default function TurfAdminSettings() {
  const { user } = useAuth();
  const { darkMode } = useOutletContext() || {};
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");

  const [settings, setSettings] = useState({
    notifications: {
      emailBookings: true,
      emailCancellations: true,
      emailPayments: true,
      smsReminders: false,
      pushNotifications: true,
    },
    business: {
      autoConfirmBookings: false,
      cancellationPolicy: "24",
      operatingHours: { start: "06:00", end: "23:00" },
    },
    security: { loginNotifications: true },
  });

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/settings");
        setSettings(res.data.settings || settings);
      } catch (err) {
        console.warn("Using default settings");
      }
    })();
  }, []);

  const updateSettings = async (section, updated) => {
    setLoading(true);
    try {
      await api.patch("/api/settings", { section, settings: updated });
      setSettings(prev => ({ ...prev, [section]: { ...prev[section], ...updated } }));
      toast.success("Updated!");
    } catch {
      toast.error("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm)
      return toast.error("Passwords do not match");
    if (passwordForm.new.length < 6)
      return toast.error("Password too short");

    setLoading(true);
    try {
      await api.patch("/api/change-password", {
        oldPassword: passwordForm.current,
        newPassword: passwordForm.new,
      });
      setPasswordForm({ current: "", new: "", confirm: "" });
      toast.success("Password changed!");
    } catch {
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const res = await api.get("/api/export-data");
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `turfadmin-data-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      toast.success("Data exported");
    } catch {
      toast.error("Export failed");
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Delete account permanently?")) return;
    try {
      await api.delete("/api/account");
      localStorage.clear();
      toast.success("Account deleted");
      window.location.href = "/login";
    } catch {
      toast.error("Failed to delete");
    }
  };

  // --- Section Renderers ---
  const renderNotifications = () => (
    <div>
      <h3 className="text-lg font-semibold mb-3">Notification Preferences</h3>
      {Object.entries(settings.notifications).map(([key, val]) => (
        <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
          <span className="capitalize text-gray-800 dark:text-gray-200">{key.replace(/([A-Z])/g, ' $1')}</span>
          <input
            type="checkbox"
            checked={val}
            onChange={e => updateSettings("notifications", { [key]: e.target.checked })}
            className="w-5 h-5 accent-green-600"
          />
        </div>
      ))}
    </div>
  );

  const renderBusiness = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Business Settings</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm mb-1">Auto Confirm Bookings</label>
          <input
            type="checkbox"
            checked={settings.business.autoConfirmBookings}
            onChange={e => updateSettings("business", { autoConfirmBookings: e.target.checked })}
            className="w-5 h-5 accent-green-600"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Cancellation Policy (hrs)</label>
          <select
            value={settings.business.cancellationPolicy}
            onChange={e => updateSettings("business", { cancellationPolicy: e.target.value })}
            className="w-full border rounded-lg px-2 py-1 dark:bg-gray-800"
          >
            {[1, 2, 6, 12, 24, 48].map(v => (
              <option key={v} value={v}>{v} hrs</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Start Time</label>
          <input
            type="time"
            value={settings.business.operatingHours.start}
            onChange={e => updateSettings("business", {
              operatingHours: { ...settings.business.operatingHours, start: e.target.value },
            })}
            className="w-full border rounded-lg px-2 py-1 dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">End Time</label>
          <input
            type="time"
            value={settings.business.operatingHours.end}
            onChange={e => updateSettings("business", {
              operatingHours: { ...settings.business.operatingHours, end: e.target.value },
            })}
            className="w-full border rounded-lg px-2 py-1 dark:bg-gray-800"
          />
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div>
      <h3 className="text-lg font-semibold mb-3">Security</h3>
      <form onSubmit={handlePasswordChange} className="space-y-3 mb-4">
        {["current", "new", "confirm"].map((field) => (
          <div key={field} className="relative">
            <input
              type={show[field] ? "text" : "password"}
              placeholder={`${field.charAt(0).toUpperCase() + field.slice(1)} Password`}
              value={passwordForm[field]}
              onChange={e => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800"
            />
            <button type="button" onClick={() => setShow({ ...show, [field]: !show[field] })} className="absolute right-3 top-2.5">
              {show[field] ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
            </button>
          </div>
        ))}
        <button type="submit" className="w-full py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">
          {loading ? "Changing..." : "Change Password"}
        </button>
      </form>

      <div className="flex items-center justify-between">
        <span>Login Notifications</span>
        <input
          type="checkbox"
          checked={settings.security.loginNotifications}
          onChange={e => updateSettings("security", { loginNotifications: e.target.checked })}
          className="w-5 h-5 accent-green-600"
        />
      </div>
    </div>
  );

  const renderData = () => (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h4 className="font-medium mb-2 text-blue-700 dark:text-blue-300">Export Data</h4>
        <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>
      <div>
        <h4 className="font-medium mb-2 text-red-700 dark:text-red-300">Delete Account</h4>
        <button onClick={deleteAccount} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>
    </div>
  );

  const tabs = [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "business", label: "Business", icon: Building2 },
    { id: "security", label: "Security", icon: Shield },
    { id: "data", label: "Data", icon: Database },
  ];

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your preferences</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === id
                ? "bg-green-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {activeTab === "notifications" && renderNotifications()}
          {activeTab === "business" && renderBusiness()}
          {activeTab === "security" && renderSecurity()}
          {activeTab === "data" && renderData()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
