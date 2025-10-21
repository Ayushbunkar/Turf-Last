// src/pages/TurfAdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../../../components/Sidebar/TurfAdminSidebar";
import api from "../../../config/Api";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";

export default function TurfAdminDashboard() {
  const { token, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  console.log("User:", user);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/turfs/my-turfs");
      setDashboardData(res.data);
    } catch (err) {
      console.error("API error:", err);
      setDashboardData(null);
      const status = err.response?.status;
      if (status === 403) {
        toast.error("Access denied. Please contact administrator.");
      } else if (status && status !== 401) {
        const msg = err.response?.data?.message || "Failed to load dashboard";
        if (!msg.includes("role")) toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${darkMode ? "dark" : ""} min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-gray-900 dark:to-gray-800`}>
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      <div className="flex">
        <AdminSidebar darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} isMobileOpen={isMobileSidebarOpen} />

        <main className="flex-1 ml-0 lg:ml-64 p-4 lg:p-8 pt-8 min-h-screen">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <Outlet context={{ refreshData: fetchDashboardData, dashboardData, darkMode }} />
          )}
        </main>
      </div>
    </div>
  );
}
