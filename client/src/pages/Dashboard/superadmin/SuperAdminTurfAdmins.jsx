import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  Shield,
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Activity,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Star,
  Unlock,
  TrendingUp
} from "lucide-react";
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminNavbar from './SuperAdminNavbar';
import superAdminService from '../../../services/superAdminService';
import toast from 'react-hot-toast';

const SuperAdminTurfAdmins = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [turfAdmins, setTurfAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [unblockTarget, setUnblockTarget] = useState(null);
  const [unblockReason, setUnblockReason] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    blocked: 0,
    totalTurfs: 0,
    avgRating: 0
  });
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesFilter, setActivitiesFilter] = useState({ type: 'all', actor: '', from: '', to: '' });

  // Chart data for pie and bar charts
  const pieData = [
    { name: 'Active', value: stats.active },
    { name: 'Pending', value: stats.pending },
    { name: 'Blocked', value: stats.blocked }
  ];
  const COLORS = ['#34d399', '#fbbf24', '#ef4444'];
  const barData = [
    { name: 'Admins', value: stats.total },
    { name: 'Turfs Managed', value: stats.totalTurfs }
  ];

  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    experience: '',
    specialization: '',
    documents: []
  });

  useEffect(() => {
    fetchTurfAdmins();
    fetchStats();
    fetchRecentActivities();
    // auto-poll recent activities every 30s
    const interval = setInterval(() => fetchRecentActivities(), 30000);
    return () => clearInterval(interval);
  }, [currentPage, searchTerm, statusFilter, sortBy]);

  const fetchTurfAdmins = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy,
        sortOrder: 'desc'
      };

  const response = await superAdminService.getTurfAdmins(params);
  setTurfAdmins(response.turfAdmins || []);
  setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error("Error fetching turf admins:", error);
      toast.error("Failed to fetch turf admins");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await superAdminService.getTurfAdminStats();
      // Normalize API response into our stats shape and ensure numeric values
      const safeNum = (v) => {
        if (v === null || v === undefined) return 0;
        if (typeof v === 'number') return v;
        const n = Number(v);
        return Number.isNaN(n) ? 0 : n;
      };

      const normalized = {
        total: safeNum(response?.totalTurfAdmins ?? response?.total ?? 0),
        active: safeNum(response?.activeTurfAdmins ?? response?.active ?? 0),
        pending: safeNum(response?.pendingTurfAdmins ?? response?.pending ?? 0),
        blocked: safeNum(response?.blockedTurfAdmins ?? response?.blocked ?? 0),
        totalTurfs: safeNum(response?.totalTurfs ?? 0),
        avgRating: safeNum(response?.avgRating ?? 0),
        // optionally allow the backend to provide change metrics e.g. { totalChange: 12 }
        changes: response?.changes || response?.changeMetrics || {}
      };

      setStats(normalized);
    } catch (error) {
      console.error("Error fetching stats:", error);
      // On error, keep normalized zeros/defaults so UI shows 0s instead of mock values
      setStats(prev => ({ ...prev }));
    }
  };

  const handleCreateAdmin = async () => {
    // Client-side validation
    const validate = () => {
      const errors = [];
      if (!newAdmin.name || String(newAdmin.name).trim().length === 0) errors.push('Name is required');
      const email = String(newAdmin.email || '').trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) errors.push('Valid email is required');
      if (newAdmin.phone) {
        const digits = String(newAdmin.phone).replace(/[^0-9]/g, '');
        if (digits.length < 7 || digits.length > 15) errors.push('Phone number must be 7-15 digits');
      }
      if (newAdmin.password) {
        if (newAdmin.password.length < 8) errors.push('Password must be at least 8 characters');
        const pwRegex = /(?=.*[A-Za-z])(?=.*\d)/;
        if (!pwRegex.test(newAdmin.password)) errors.push('Password must include letters and numbers');
      }
      return errors;
    };

    const errs = validate();
    if (errs.length > 0) {
      toast.error(errs[0]);
      return;
    }

    try {
      await superAdminService.createTurfAdmin(newAdmin);
      toast.success("Turf admin created successfully");
      setShowCreateModal(false);
      setNewAdmin({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        experience: '',
        specialization: '',
        documents: []
      });
      fetchTurfAdmins();
      fetchStats();
    } catch (error) {
      toast.error("Failed to create turf admin");
    }
  };

  const handleStatusUpdate = async (adminId, status, reason = '') => {
    try {
      await superAdminService.updateTurfAdminStatus(adminId, status, reason);
      toast.success(`Admin status updated to ${status}`);
      fetchTurfAdmins();
      fetchStats();
      fetchRecentActivities();
    } catch (error) {
      toast.error("Failed to update admin status");
    }
  };

  const fetchRecentActivities = async (limit = 8) => {
    try {
      setActivitiesLoading(true);
      const res = await superAdminService.getRecentActivities(limit);
      const list = res?.activities || res?.data || [];
      setActivities(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch recent activities', err);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleDeleteAdmin = async () => {
    try {
      await superAdminService.deleteTurfAdmin(selectedAdmin.id);
      toast.success("Turf admin deleted successfully");
      setShowDeleteModal(false);
      setSelectedAdmin(null);
      fetchTurfAdmins();
      fetchStats();
    } catch (error) {
      toast.error("Failed to delete turf admin");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      blocked: { color: 'bg-red-100 text-red-800', icon: XCircle },
      suspended: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flexitems-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const statCards = [
    {
      title: "Total Turf Admins",
      value: stats.total,
      // prefer backend-provided change, fallback to 0
      change: (() => {
        const c = stats.changes?.total ?? stats.changes?.totalChange ?? 0;
        const pct = typeof c === 'number' ? c : Number(c) || 0;
        return `${pct >= 0 ? '+' : ''}${pct}%`;
      })(),
      changeType: (() => {
        const c = stats.changes?.total ?? stats.changes?.totalChange ?? 0;
        const pct = typeof c === 'number' ? c : Number(c) || 0;
        return pct >= 0 ? 'increase' : 'decrease';
      })(),
      icon: Shield,
      color: "blue",
      description: "Registered administrators"
    },
    {
      title: "Active Admins",
      value: stats.active,
      change: (() => {
        const c = stats.changes?.active ?? stats.changes?.activeChange ?? 0;
        const pct = typeof c === 'number' ? c : Number(c) || 0;
        return `${pct >= 0 ? '+' : ''}${pct}%`;
      })(),
      changeType: (() => {
        const c = stats.changes?.active ?? stats.changes?.activeChange ?? 0;
        const pct = typeof c === 'number' ? c : Number(c) || 0;
        return pct >= 0 ? 'increase' : 'decrease';
      })(),
      icon: CheckCircle,
      color: "green",
      description: "Currently active"
    },
    {
      title: "Pending Approvals",
      value: stats.pending,
      change: (() => {
        const c = stats.changes?.pending ?? stats.changes?.pendingChange ?? 0;
        const pct = typeof c === 'number' ? c : Number(c) || 0;
        return `${pct >= 0 ? '+' : ''}${pct}%`;
      })(),
      changeType: (() => {
        const c = stats.changes?.pending ?? stats.changes?.pendingChange ?? 0;
        const pct = typeof c === 'number' ? c : Number(c) || 0;
        return pct >= 0 ? 'increase' : 'decrease';
      })(),
      icon: Clock,
      color: "yellow",
      description: "Awaiting approval"
    },
    {
      title: "Total Turfs Managed",
      value: stats.totalTurfs,
      change: (() => {
        const c = stats.changes?.totalTurfs ?? stats.changes?.totalTurfsChange ?? 0;
        const pct = typeof c === 'number' ? c : Number(c) || 0;
        return `${pct >= 0 ? '+' : ''}${pct}%`;
      })(),
      changeType: (() => {
        const c = stats.changes?.totalTurfs ?? stats.changes?.totalTurfsChange ?? 0;
        const pct = typeof c === 'number' ? c : Number(c) || 0;
        return pct >= 0 ? 'increase' : 'decrease';
      })(),
      icon: Building,
      color: "purple",
      description: "Across all admins"
    }
  ];

  if (loading && turfAdmins.length === 0) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SuperAdminSidebar />
      <div className="flex-1 lg:ml-80">
          <SuperAdminNavbar />
          <main className="p-4 lg:p-8 pb-4 pt-32 lg:pt-40 min-h-screen">
            <div className="flex items-center justify-center h-96">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-lg text-gray-600">Loading turf admins...</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex  mt-20  min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <SuperAdminSidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onMobileClose={() => setIsMobileSidebarOpen(false)} 
      />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-80">
        <SuperAdminNavbar onMobileMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        
        <main className="p-4 lg:p-8 pb-4 pt-48 min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Turf Admin Management</h1>
              <p className="text-gray-600 mt-1">Manage turf administrators and their permissions</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchTurfAdmins}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add New Admin</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              const colorTokens = {
                blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
                green: { bg: 'bg-green-100', icon: 'text-green-600' },
                yellow: { bg: 'bg-yellow-100', icon: 'text-yellow-600' },
                purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
                orange: { bg: 'bg-orange-100', icon: 'text-orange-600' },
                default: { bg: 'bg-gray-100', icon: 'text-gray-600' }
              };
              const token = colorTokens[card.color] || colorTokens.default;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${token.bg} ${token.icon}`}> 
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-sm font-medium ${
                            card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                            {card.change}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
                    <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                    <p className="text-gray-500 text-xs mt-1">{card.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Pie Chart for Admin Status Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Admin Status Distribution</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart for Admins and Turfs Managed */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Admins & Turfs Managed</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activities Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2" />
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
                  <p className="text-xs text-gray-500">Audit logs for admin actions, status changes and system events</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <select
                      value={activitiesFilter.type}
                      onChange={(e) => setActivitiesFilter({ ...activitiesFilter, type: e.target.value })}
                      className="px-2 py-1 border border-gray-200 rounded text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="status_change">Status Changes</option>
                      <option value="user_action">User Actions</option>
                      <option value="system">System</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Actor name"
                      value={activitiesFilter.actor}
                      onChange={(e) => setActivitiesFilter({ ...activitiesFilter, actor: e.target.value })}
                      className="px-2 py-1 border border-gray-200 rounded text-sm"
                    />
                  </div>
                  <button
                    onClick={() => fetchRecentActivities()}
                    className="text-sm text-blue-600 hover:underline flex items-center"
                    disabled={activitiesLoading}
                  >
                    {activitiesLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                    Refresh
                  </button>
                </div>
              </div>
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-6">
                  <RefreshCw className="w-5 h-5 animate-spin text-gray-500 mr-2" />
                  <span className="text-sm text-gray-500">Loading activities...</span>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-sm text-gray-500">No recent activities.</div>
              ) : (
                <ul className="space-y-3">
                  {activities
                    .filter((act) => {
                      if (activitiesFilter.type && activitiesFilter.type !== 'all') {
                        if (activitiesFilter.type === 'status_change' && !(act.type === 'status' || act.action?.includes('status') || (act.title || '').toLowerCase().includes('status'))) return false;
                        if (activitiesFilter.type === 'user_action' && act.type === 'system') return false;
                        if (activitiesFilter.type === 'system' && act.type !== 'system') return false;
                      }
                      if (activitiesFilter.actor && activitiesFilter.actor.trim().length > 0) {
                        const name = (act.actor?.name || act.actor || '').toString().toLowerCase();
                        if (!name.includes(activitiesFilter.actor.trim().toLowerCase())) return false;
                      }
                      if (activitiesFilter.from) {
                        const from = new Date(activitiesFilter.from);
                        const when = new Date(act.createdAt || act.time || act.timestamp);
                        if (isNaN(from) || when < from) return false;
                      }
                      if (activitiesFilter.to) {
                        const to = new Date(activitiesFilter.to);
                        const when = new Date(act.createdAt || act.time || act.timestamp);
                        if (isNaN(to) || when > to) return false;
                      }
                      return true;
                    })
                    .map((act, i) => (
                      <li key={act._id || act.id || i} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm text-gray-600">
                            {act.actor?.name ? act.actor.name.charAt(0) : act.type?.charAt(0) || 'A'}
                          </div>
                        </div>
                        <div className="flex-1 text-sm">
                          <div className="text-gray-900 font-medium">{act.title || act.action || act.type}</div>
                          <div className="text-gray-500 text-xs">{act.message || act.detail || act.description}</div>
                          <div className="text-xs text-gray-400 mt-1">{new Date(act.createdAt || act.time || act.timestamp).toLocaleString()}</div>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search admins..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="blocked">Blocked</option>
                  <option value="suspended">Suspended</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="createdAt">Newest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="turfsCount">Most Turfs</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Import</span>
                </button>
              </div>
            </div>
          </div>

          {/* Turf Admins Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Turfs Managed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {turfAdmins.map((admin, index) => (
                    <motion.tr
                      key={admin.id || admin._id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {admin.name?.charAt(0) || 'A'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{admin.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">ID: {admin.id}</div>
                            <div className="text-xs text-gray-400">
                              Joined: {new Date(admin.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <Mail className="w-4 h-4 text-gray-400 mr-2" />
                            {admin.email || 'N/A'}
                          </div>
                          <div className="flex items-center mb-1">
                            <Phone className="w-4 h-4 text-gray-400 mr-2" />
                            {admin.phone || 'N/A'}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="truncate max-w-24">{admin.location || 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <Building className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="font-medium">{admin.turfsCount || 0} Turfs</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Revenue: ₹{admin.totalRevenue?.toLocaleString() || '0'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Bookings: {admin.totalBookings || 0}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(admin.status || 'pending')}
                        <div className="text-xs text-gray-500 mt-1">
                          Last active: {admin.lastActive || 'Never'}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            {admin.rating !== undefined ? admin.rating : 'N/A'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {(admin.reviewsCount !== undefined ? admin.reviewsCount : 0) + ' reviews'}
                        </div>
                        <div className="flex items-center mt-1">
                          <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                          <span className="text-xs text-green-600">+{admin.growth || 0}%</span>
                          <span className="text-xs text-green-600">+{admin.growth !== undefined ? admin.growth : 0}%</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={async () => {
                              try {
                                const data = await superAdminService.getUser(admin.id || admin._id);
                                setSelectedAdmin(data.user || data);
                                setShowViewModal(true);
                              } catch (err) {
                                console.error('failed to fetch user', err);
                                toast.error('Failed to load user details');
                              }
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {admin.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(admin.id, 'active')}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          
                          {admin.status === 'active' && (
                            <button
                              onClick={() => handleStatusUpdate(admin.id, 'blocked')}
                              className="text-red-600 hover:text-red-900"
                              title="Block"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {(admin.status === 'blocked' || admin.status === 'suspended') && (
                            <button
                              onClick={() => {
                                setUnblockTarget(admin);
                                setUnblockReason('');
                                setShowUnblockModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Unblock"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={async () => {
                              try {
                                const data = await superAdminService.getUser(admin.id || admin._id);
                                const u = data.user || data;
                                setSelectedAdmin(u);
                                setEditForm({
                                  name: u.name || '',
                                  email: u.email || '',
                                  phone: u.phone || '',
                                  address: u.address || u.location || ''
                                });
                                setShowEditModal(true);
                              } catch (err) {
                                console.error('failed to fetch user for edit', err);
                                toast.error('Failed to load user details');
                              }
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + Math.max(1, currentPage - 2);
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Turf Admin</h3>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                
                <input
                  type="password"
                  placeholder="Password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newAdmin.phone}
                  onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                
                <textarea
                  placeholder="Address"
                  value={newAdmin.address}
                  onChange={(e) => setNewAdmin({ ...newAdmin, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAdmin}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Admin
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Turf Admin</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete {selectedAdmin?.name}? This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAdmin}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Admin Modal */}
      <AnimatePresence>
        {showViewModal && selectedAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">View Turf Admin</h3>
              <div className="space-y-3">
                <div><strong>Name:</strong> {selectedAdmin.name}</div>
                <div><strong>Email:</strong> {selectedAdmin.email}</div>
                <div><strong>Phone:</strong> {selectedAdmin.phone || 'N/A'}</div>
                <div><strong>Address:</strong> {selectedAdmin.address || selectedAdmin.location || 'N/A'}</div>
                <div><strong>Status:</strong> {selectedAdmin.status}</div>
                <div><strong>Joined:</strong> {new Date(selectedAdmin.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => { setShowViewModal(false); setSelectedAdmin(null); }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unblock Modal */}
      <AnimatePresence>
        {showUnblockModal && unblockTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Unblock Turf Admin</h3>
              <p className="text-gray-700 mb-3">You're about to unblock <strong>{unblockTarget.name}</strong>. Optionally enter a reason below:</p>
              <textarea
                placeholder="Reason (optional)"
                value={unblockReason}
                onChange={(e) => setUnblockReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-28 resize-none"
              />
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => { setShowUnblockModal(false); setUnblockTarget(null); setUnblockReason(''); }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await handleStatusUpdate(unblockTarget.id || unblockTarget._id, 'active', unblockReason || '');
                      setShowUnblockModal(false);
                      setUnblockTarget(null);
                      setUnblockReason('');
                    } catch (err) {
                      console.error('unblock error', err);
                      toast.error('Failed to unblock');
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Unblock
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Admin Modal */}
      <AnimatePresence>
        {showEditModal && selectedAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Turf Admin</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Address"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => { setShowEditModal(false); setSelectedAdmin(null); }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    // validation
                    if (!editForm.name || String(editForm.name).trim().length === 0) {
                      toast.error('Name is required');
                      return;
                    }
                    const email = String(editForm.email || '').trim();
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!email || !emailRegex.test(email)) {
                      toast.error('Valid email is required');
                      return;
                    }
                    if (editForm.phone) {
                      const digits = String(editForm.phone).replace(/[^0-9]/g, '');
                      if (digits.length < 7 || digits.length > 15) {
                        toast.error('Phone number must be 7-15 digits');
                        return;
                      }
                    }

                    try {
                      await superAdminService.updateUser(selectedAdmin.id || selectedAdmin._id, editForm);
                      toast.success('Admin updated successfully');
                      setShowEditModal(false);
                      setSelectedAdmin(null);
                      fetchTurfAdmins();
                      fetchStats();
                    } catch (err) {
                      console.error('update user error', err);
                      toast.error('Failed to update admin');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* (generated password modal removed - server no longer returns password) */}
    </div>
  );
};

export default SuperAdminTurfAdmins;