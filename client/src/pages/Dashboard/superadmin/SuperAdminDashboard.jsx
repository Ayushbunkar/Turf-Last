// SuperAdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Building,
  IndianRupee,
  Activity,
  Calendar,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from "lucide-react";
import SuperAdminPageTemplate from "./SuperAdminPageTemplate";
import superAdminService from "../../../services/superAdminService";
import toast from "react-hot-toast";

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsData = await superAdminService.getDashboardStats();
      if (statsData) setStats(statsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const formatCurrency = (amount) => superAdminService.formatCurrency(amount);

  const percentChange = (current, prev) => {
    if (typeof current !== "number" || typeof prev !== "number") return "0%";
    if (prev === 0) return current === 0 ? "0%" : "+100%";
    const diff = ((current - prev) / prev) * 100;
    const sign = diff > 0 ? "+" : "";
    return `${sign}${diff.toFixed(1)}%`;
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers?.toLocaleString() || "0",
      change: percentChange(stats.totalUsers, stats.totalUsersPrev),
      changeType: stats.totalUsers >= stats.totalUsersPrev ? "increase" : "decrease",
      icon: Users,
      color: stats.totalUsers >= stats.totalUsersPrev ? "green" : "red",
      description: `${stats.activeUsers || 0} active today`
    },
    {
      title: "Total Turfs",
      value: stats.totalTurfs?.toLocaleString() || "0",
      change: percentChange(stats.totalTurfs, stats.totalTurfsPrev),
      changeType: stats.totalTurfs >= stats.totalTurfsPrev ? "increase" : "decrease",
      icon: Building,
      color: stats.totalTurfs >= stats.totalTurfsPrev ? "green" : "red",
      description: "Across all locations"
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings?.toLocaleString() || "0",
      change: percentChange(stats.totalBookings, stats.totalBookingsPrev),
      changeType: stats.totalBookings >= stats.totalBookingsPrev ? "increase" : "decrease",
      icon: Calendar,
      color: stats.totalBookings >= stats.totalBookingsPrev ? "green" : "red",
      description: "This month"
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue || 0),
      change: percentChange(stats.totalRevenue, stats.totalRevenuePrev),
      changeType: stats.totalRevenue >= stats.totalRevenuePrev ? "increase" : "decrease",
      icon: IndianRupee,
      color: stats.totalRevenue >= stats.totalRevenuePrev ? "green" : "red",
      description: `${formatCurrency(stats.monthlyRevenue || 0)} this month`
    },
    {
      title: "Turf Admins",
      value: stats.turfAdmins?.toLocaleString() || "0",
      change: percentChange(stats.turfAdmins, stats.turfAdminsPrev),
      changeType: stats.turfAdmins >= stats.turfAdminsPrev ? "increase" : "decrease",
      icon: Shield,
      color: stats.turfAdmins >= stats.turfAdminsPrev ? "green" : "red",
      description: `${stats.pendingApprovals || 0} pending approval`
    },
    {
      title: "System Health",
      value: `${stats.systemHealth || 100}%`,
      change: percentChange(stats.systemHealth, stats.systemHealthPrev),
      changeType: stats.systemHealth >= stats.systemHealthPrev ? "increase" : "decrease",
      icon: Activity,
      color: stats.systemHealth >= stats.systemHealthPrev ? "green" : "red",
      description:
        stats.systemHealth >= 80
          ? "All systems operational"
          : stats.systemHealth >= 50
          ? "Some issues detected"
          : "Critical issues!"
    }
  ];

  const getIconColor = (color) => {
    const colors = {
      green: "text-green-600 bg-green-100",
      red: "text-red-600 bg-red-100",
      blue: "text-blue-600 bg-blue-100"
    };
    return colors[color] || colors.blue;
  };

  return (
    <SuperAdminPageTemplate className="bg-gray-100">
      {/* Big card container */}
      <div className="bg-white rounded-3xl shadow-xl p-8 min-h-screen">
        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Last updated: {superAdminService.formatDate(lastUpdated, { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading dashboard...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${getIconColor(card.color)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center space-x-1 text-sm">
                      {card.changeType === "increase" ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`font-medium ${card.changeType === "increase" ? "text-green-600" : "text-red-600"}`}>
                        {card.change}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
                  <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                  <p className="text-gray-500 text-xs mt-1">{card.description}</p>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>
    </SuperAdminPageTemplate>
  );
};

export default SuperAdminDashboard;
