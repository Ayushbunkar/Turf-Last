import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Download,
  Upload,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Server,
  Activity,
  BarChart3,
  FileText,
  Archive,
  Settings,
  Eye,
  Copy,
  Trash2
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import SuperAdminPageTemplate from "./SuperAdminPageTemplate";
import superAdminService from "../../../services/superAdminService";
import toast from "react-hot-toast";

/**
 * SuperAdminDatabase
 * - Fully responsive and optimized
 * - Debounced search, pagination, memoized lists
 * - AbortController for requests, caching between tabs
 * - Accessible modals and buttons
 */

const PAGE_SIZE = 12;

const StatCard = ({ icon: Icon, title, value, change, changeType, colorToken = {} }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`p-3 rounded-lg ${colorToken.bg} ${colorToken.icon}`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className={`text-sm font-medium ${changeType === "increase" ? "text-green-600" : changeType === "decrease" ? "text-red-600" : "text-gray-600"}`}>
        {change}
      </span>
    </div>
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1 truncate">{value}</h3>
      <p className="text-gray-600 text-sm font-medium truncate">{title}</p>
    </div>
  </motion.div>
);

const TabButton = ({ active, onClick, Icon, label }) => (
  <button
    onClick={onClick}
    className={`py-3 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
      active ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`}
    aria-pressed={active}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </button>
);

const ConfirmModal = ({ open, title, description, onCancel, onConfirm, confirmText = "Confirm", danger = false }) => (
  <AnimatePresence>
    {open && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          className="bg-white rounded-xl p-6 w-full max-w-lg"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6">{description}</p>
          <div className="flex justify-end space-x-3">
            <button onClick={onCancel} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}>
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const SuperAdminDatabase = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDatabase, setSelectedDatabase] = useState("all");

  const [databaseStats, setDatabaseStats] = useState({
    totalSize: "0 MB",
    totalTables: 0,
    totalRecords: 0,
    lastBackup: "",
    connectionPool: 0,
    connectionPoolPercent: 0,
    queryPerformance: "Unknown"
  });

  const [tables, setTables] = useState([]);
  const [backups, setBackups] = useState([]);
  const [queries, setQueries] = useState([]);
  const [performance, setPerformance] = useState([]);

  // UI state
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);

  // pagination
  const [tablePage, setTablePage] = useState(1);

  // request refs
  const abortRef = useRef(null);

  // simple in-memory cache to avoid refetch on tab switches if within TTL
  const cacheRef = useRef({
    ts: 0,
    ttl: 30 * 1000, // 30s cache
    data: {}
  });

  // Debounce searchTerm -> debouncedSearch
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // unified fetch - optimized with Promise.allSettled, abort support, and caching
  const fetchDatabaseInfo = useCallback(
    async ({ force = false } = {}) => {
      // cancel previous
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {}
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);

      // simple cache key depends on selectedDatabase
      const cacheKey = `${selectedDatabase}`;

      const now = Date.now();
      const isCached = !force && cacheRef.current.data[cacheKey] && now - cacheRef.current.ts < cacheRef.current.ttl;
      if (isCached) {
        const cached = cacheRef.current.data[cacheKey];
        setDatabaseStats(cached.databaseStats);
        setTables(cached.tables);
        setBackups(cached.backups);
        setQueries(cached.queries);
        setPerformance(cached.performance);
        setLoading(false);
        return;
      }

      try {
        const [
          statsResponse,
          tablesResponse,
          backupsResponse,
          queriesResponse,
          performanceResponse
        ] = await Promise.allSettled([
          superAdminService.getDatabaseStats({ db: selectedDatabase, signal: controller.signal }),
          superAdminService.getDatabaseTables({ db: selectedDatabase, signal: controller.signal }),
          superAdminService.getDatabaseBackups({ db: selectedDatabase, signal: controller.signal }),
          superAdminService.getDatabaseQueries({ db: selectedDatabase, signal: controller.signal }),
          superAdminService.getDatabasePerformance({ db: selectedDatabase, signal: controller.signal })
        ]);

        if (statsResponse.status === "fulfilled" && statsResponse.value) {
          const result = statsResponse.value;
          const stats = result.stats || {};
          const collections = result.collections || [];
          const totalTables = collections.length;
          const totalRecords = collections.reduce((s, c) => s + (c.count || 0), 0);

          setDatabaseStats({
            totalSize: stats.dataSize ? `${(stats.dataSize / (1024 * 1024)).toFixed(2)} MB` : "0 MB",
            totalTables,
            totalRecords,
            lastBackup: result.lastBackup || "",
            connectionPool: (stats.connections && stats.connections.current) || 0,
            connectionPoolPercent: typeof result.connectionPoolPercent === "number" ? result.connectionPoolPercent : 0,
            queryPerformance: stats.ok ? "Healthy" : "Error"
          });
        } else {
          console.error("Failed to load database stats:", statsResponse.reason);
          toast.error("Failed to load database statistics");
        }

        if (tablesResponse.status === "fulfilled" && tablesResponse.value) {
          setTables(tablesResponse.value.tables || []);
        } else {
          console.error("Failed to load tables:", tablesResponse.reason);
          setTables([]);
        }

        if (backupsResponse.status === "fulfilled" && backupsResponse.value) {
          setBackups(backupsResponse.value.backups || []);
        } else {
          console.error("Failed to load backups:", backupsResponse.reason);
          setBackups([]);
        }

        if (queriesResponse.status === "fulfilled" && queriesResponse.value) {
          setQueries(queriesResponse.value.queries || []);
        } else {
          console.error("Failed to load queries:", queriesResponse.reason);
          setQueries([]);
        }

        if (performanceResponse.status === "fulfilled" && performanceResponse.value) {
          setPerformance(performanceResponse.value.performance || []);
        } else {
          console.error("Failed to load performance:", performanceResponse.reason);
          setPerformance([]);
        }

        // cache
        cacheRef.current.data[cacheKey] = {
          databaseStats,
          tables: tablesResponse.status === "fulfilled" ? tablesResponse.value.tables || [] : [],
          backups: backupsResponse.status === "fulfilled" ? backupsResponse.value.backups || [] : [],
          queries: queriesResponse.status === "fulfilled" ? queriesResponse.value.queries || [] : [],
          performance: performanceResponse.status === "fulfilled" ? performanceResponse.value.performance || [] : []
        };
        cacheRef.current.ts = Date.now();
      } catch (err) {
        if (err?.name === "AbortError") {
          // ignore abort
          return;
        }
        console.error("Error fetching database info:", err);
        toast.error("Failed to load database information");
        setTables([]);
        setBackups([]);
        setQueries([]);
        setPerformance([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedDatabase]
  );

  // initial fetch + whenever selectedDatabase changes
  useEffect(() => {
    fetchDatabaseInfo();
    // reset pagination/search when db changes
    setTablePage(1);
    setSearchTerm("");
    // cleanup on unmount
    return () => {
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {}
      }
    };
  }, [selectedDatabase, fetchDatabaseInfo]);

  // helper: create backup
  const handleCreateBackup = async (backupType) => {
    try {
      setShowBackupModal(false);
      toast.promise(superAdminService.createDatabaseBackup({ type: backupType, db: selectedDatabase }), {
        loading: "Initiating backup...",
        success: "Backup initiated successfully",
        error: "Failed to create backup"
      });
      // refresh after short delay to allow backend to start
      setTimeout(() => fetchDatabaseInfo({ force: true }), 1200);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create backup");
    }
  };

  // restore backup
  const handleRestoreBackup = async () => {
    try {
      if (!selectedBackup?.id) {
        toast.error("No backup selected");
        return;
      }
      setShowRestoreModal(false);
      toast.promise(superAdminService.restoreDatabaseBackup(selectedBackup.id), {
        loading: "Restoring database...",
        success: "Database restore initiated",
        error: "Failed to restore backup"
      });
      setSelectedBackup(null);
      // refetch after some time (restore might take a bit)
      setTimeout(() => fetchDatabaseInfo({ force: true }), 2000);
    } catch (error) {
      console.error(error);
      toast.error("Failed to restore backup");
    }
  };

  // download backup
  const handleDownloadBackup = async (backupId) => {
    try {
      toast.promise(superAdminService.downloadBackup(backupId), {
        loading: "Preparing download...",
        success: "Download started",
        error: "Failed to download backup"
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to download backup");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      healthy: "text-green-600 bg-green-100",
      warning: "text-yellow-600 bg-yellow-100",
      error: "text-red-600 bg-red-100"
    };
    return colors[status] || colors.healthy;
  };

  const getStatusIcon = (status) => {
    const icons = {
      healthy: <CheckCircle className="w-4 h-4" />,
      warning: <AlertTriangle className="w-4 h-4" />,
      error: <AlertTriangle className="w-4 h-4" />
    };
    return icons[status] || icons.healthy;
  };

  // derived stat cards
  const statCards = [
    {
      title: "Database Size",
      value: databaseStats.totalSize,
      change: "",
      changeType: "neutral",
      icon: HardDrive,
      color: "blue"
    },
    {
      title: "Total Tables",
      value: databaseStats.totalTables,
      change: "",
      changeType: "neutral",
      icon: Database,
      color: "green"
    },
    {
      title: "Total Records",
      value: databaseStats.totalRecords?.toLocaleString() || "0",
      change: "",
      changeType: "neutral",
      icon: FileText,
      color: "purple"
    },
    {
      title: "Connection Pool",
      value: `${databaseStats.connectionPool} (${databaseStats.connectionPoolPercent}%)`,
      change: databaseStats.connectionPoolPercent >= 70 ? `${databaseStats.connectionPoolPercent}%` : "",
      changeType: databaseStats.connectionPoolPercent >= 70 ? "increase" : "neutral",
      icon: Server,
      color: databaseStats.connectionPoolPercent >= 70 ? "green" : "orange"
    },
    {
      title: "Last Backup",
      value: databaseStats.lastBackup ? new Date(databaseStats.lastBackup).toLocaleString() : "N/A",
      change: "",
      changeType: "neutral",
      icon: Archive,
      color: "gray"
    }
  ];

  // color tokens helper
  const colorTokensMap = {
    blue: { bg: "bg-blue-100", icon: "text-blue-600" },
    green: { bg: "bg-green-100", icon: "text-green-600" },
    yellow: { bg: "bg-yellow-100", icon: "text-yellow-600" },
    purple: { bg: "bg-purple-100", icon: "text-purple-600" },
    gray: { bg: "bg-gray-100", icon: "text-gray-600" },
    orange: { bg: "bg-orange-100", icon: "text-orange-600" }
  };

  // filter & pagination for tables
  const filteredTables = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    const list = tables.filter((t) => t.name.toLowerCase().includes(term));
    return list;
  }, [tables, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredTables.length / PAGE_SIZE));
  useEffect(() => {
    if (tablePage > totalPages) setTablePage(totalPages);
  }, [totalPages, tablePage]);

  const pagedTables = useMemo(() => {
    const start = (tablePage - 1) * PAGE_SIZE;
    return filteredTables.slice(start, start + PAGE_SIZE);
  }, [filteredTables, tablePage]);

  // utility: format number safely
  const formatNumber = (num) => {
    if (typeof num !== "number") return num ?? "0";
    return num.toLocaleString();
  };

  // small responsive loading skeleton
  if (loading && tables.length === 0) {
    return (
      <SuperAdminPageTemplate title="Database Management" subtitle="Monitor and manage database operations">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Loading database information...</span>
          </div>
        </div>
      </SuperAdminPageTemplate>
    );
  }

  return (
    <SuperAdminPageTemplate title="Database Management" subtitle="Monitor and manage database operations">
      {/* Header */}
      <div className="flex flex-col md:flex-row bg-white p-6 rounded-xl shadow-sm items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Database Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage database operations</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedDatabase}
            onChange={(e) => setSelectedDatabase(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white"
            aria-label="Select database"
          >
            <option value="all">All Databases</option>
            <option value="main">Main</option>
            <option value="analytics">Analytics</option>
            <option value="archive">Archive</option>
          </select>

          <button
            onClick={() => fetchDatabaseInfo({ force: true })}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Refresh database info"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowBackupModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            aria-haspopup="dialog"
          >
            <Download className="w-4 h-4" />
            <span>Create Backup</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          const token = colorTokensMap[card.color] || colorTokensMap.gray;
          return (
            <StatCard
              key={card.title}
              icon={Icon}
              title={card.title}
              value={card.value}
              change={card.change}
              changeType={card.changeType}
              colorToken={token}
            />
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="border-b border-gray-200 px-4">
          <nav className="-mb-px flex flex-wrap md:flex-nowrap gap-2">
            <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} Icon={Database} label="Overview" />
            <TabButton active={activeTab === "tables"} onClick={() => setActiveTab("tables")} Icon={FileText} label="Tables" />
            <TabButton active={activeTab === "backups"} onClick={() => setActiveTab("backups")} Icon={Archive} label="Backups" />
            <TabButton active={activeTab === "performance"} onClick={() => setActiveTab("performance")} Icon={Activity} label="Performance" />
            <TabButton active={activeTab === "queries"} onClick={() => setActiveTab("queries")} Icon={Search} label="Queries" />
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Charts grid responsive */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Size Trend</h3>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[{ time: "Now", size: parseFloat(databaseStats.totalSize) || 0 }]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="size" stroke="#6366F1" fill="#A5B4FC" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Table Distribution</h3>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tables.map((t) => ({ name: t.name, value: t.count || 0 }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label
                        >
                          {tables.map((_, idx) => (
                            <Cell key={`cell-${idx}`} fill={["#3B82F6", "#10B981", "#F59E0B", "#6366F1", "#EF4444"][idx % 5]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Growth</h3>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{ time: "Now", records: databaseStats.totalRecords }]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="records" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Connection gauge & quick stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg flex flex-col items-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Pool Usage</h3>
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg width="160" height="160" viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r="70" fill="#F3F4F6" />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="16"
                        strokeDasharray={2 * Math.PI * 70}
                        strokeDashoffset={2 * Math.PI * 70 * (1 - (databaseStats.connectionPoolPercent || 0) / 100)}
                        strokeLinecap="round"
                      />
                      <text x="50%" y="54%" textAnchor="middle" fontSize="2em" fill="#10B981" fontWeight="bold">
                        {databaseStats.connectionPoolPercent || 0}%
                      </text>
                    </svg>
                    <span className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-600 text-sm">Current Usage</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Last Backup</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        {databaseStats.lastBackup ? `${new Date(databaseStats.lastBackup).toLocaleDateString()} at ${new Date(databaseStats.lastBackup).toLocaleTimeString()}` : "No backups yet"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Daily automated backup</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Query Performance</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{databaseStats.queryPerformance}</p>
                      <p className="text-xs text-gray-500 mt-1">Average response time: 32ms</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tables" && (
            <div className="space-y-6">
              {/* Search + Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="relative w-full sm:w-1/2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search tables..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setTablePage(1);
                    }}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                    aria-label="Search tables"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setDebouncedSearch("");
                      setTablePage(1);
                    }}
                    className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                  <div className="text-sm text-gray-500">Showing {filteredTables.length} tables</div>
                </div>
              </div>

              {/* Table list */}
              {filteredTables.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tables Found</h3>
                  <p className="text-gray-600 mb-4">{debouncedSearch ? "No tables match your search criteria." : "No database tables available."}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pagedTables.map((table, index) => (
                        <motion.tr key={table.name || index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Database className="w-5 h-5 text-gray-400 mr-3" />
                              <div className="text-sm font-medium text-gray-900">{table.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatNumber(table.records || table.count || 0)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{table.size || "—"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
                              {getStatusIcon(table.status)}
                              <span className="ml-1 capitalize">{table.status || "healthy"}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.lastUpdated ? new Date(table.lastUpdated).toLocaleString() : "—"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-600 hover:text-blue-900" title="Preview table">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900" title="Table settings">
                                <Settings className="w-4 h-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-900" title="Truncate table">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <div className="flex items-center justify-between py-4 px-2">
                    <div className="text-sm text-gray-600">Page {tablePage} of {totalPages}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setTablePage((p) => Math.max(1, p - 1))} disabled={tablePage === 1} className="px-3 py-1 border rounded disabled:opacity-50">
                        Prev
                      </button>
                      <button onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))} disabled={tablePage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "backups" && (
            <div className="space-y-6">
              {backups.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Backups</h3>
                  <p className="text-gray-600 mb-4">You don't have any backups yet. Create one manually or enable scheduled backups.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Backup Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {backups.map((backup, index) => (
                        <motion.tr key={backup.id || index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Archive className="w-5 h-5 text-gray-400 mr-3" />
                              <div className="text-sm font-medium text-gray-900">{backup.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{backup.size || "—"}</div></td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              backup.type === "full" ? "bg-blue-100 text-blue-800" : backup.type === "incremental" ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"
                            }`}>
                              {backup.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.date ? new Date(backup.date).toLocaleString() : "—"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {backup.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button onClick={() => handleDownloadBackup(backup.id)} className="text-blue-600 hover:text-blue-900" title="Download">
                                <Download className="w-4 h-4" />
                              </button>
                              <button onClick={() => { setSelectedBackup(backup); setShowRestoreModal(true); }} className="text-green-600 hover:text-green-900" title="Restore">
                                <Upload className="w-4 h-4" />
                              </button>
                              <button onClick={() => toast.promise(superAdminService.deleteBackup(backup.id), { loading: "Deleting...", success: "Deleted", error: "Failed to delete" })} className="text-red-600 hover:text-red-900" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "performance" && (
            <div className="space-y-6">
              {performance.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Performance Data</h3>
                  <p className="text-gray-600 mb-4">Performance metrics are not available at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Pool Usage</h3>
                    <div style={{ height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="connections" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Query Response Time</h3>
                    <div style={{ height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="responseTime" fill="#10B981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "queries" && (
            <div className="space-y-6">
              {queries.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Query Data</h3>
                  <p className="text-gray-600 mb-4">No database queries have been recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Executions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Time (ms)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Duration (ms)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {queries.map((query, index) => (
                        <motion.tr key={query.id || index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-mono text-gray-900 max-w-md truncate">{query.query}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{formatNumber(query.executions || 0)}</div></td>
                          <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{(Number(query.avgTime || 0) * 1000).toFixed(2)}</div></td>
                          <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{(Number(query.duration || 0) * 1000).toFixed(2)}</div></td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-600 hover:text-blue-900" title="View details"><Eye className="w-4 h-4" /></button>
                              <button onClick={() => { navigator.clipboard?.writeText(query.query); toast.success("Query copied"); }} className="text-gray-600 hover:text-gray-900" title="Copy query"><Copy className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Backup Modal */}
      <AnimatePresence>
        {showBackupModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Database Backup</h3>
              <div className="space-y-4">
                <p className="text-gray-600 mb-2">Choose the type of backup you want to create:</p>
                <div className="space-y-3">
                  <button onClick={() => handleCreateBackup("full")} className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="font-medium text-gray-900">Full Backup</div>
                    <div className="text-sm text-gray-600">Complete database backup (recommended)</div>
                  </button>
                  <button onClick={() => handleCreateBackup("incremental")} className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="font-medium text-gray-900">Incremental Backup</div>
                    <div className="text-sm text-gray-600">Only changes since last backup</div>
                  </button>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowBackupModal(false)} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restore Backup Modal (uses ConfirmModal wrapper for accessibility) */}
      <ConfirmModal
        open={showRestoreModal}
        title="Restore Database"
        description={`Are you sure you want to restore from backup "${selectedBackup?.name}"? This will overwrite the current database and cannot be undone.`}
        onCancel={() => setShowRestoreModal(false)}
        onConfirm={handleRestoreBackup}
        confirmText="Restore Database"
        danger={true}
      />
    </SuperAdminPageTemplate>
  );
};

export default SuperAdminDatabase;
