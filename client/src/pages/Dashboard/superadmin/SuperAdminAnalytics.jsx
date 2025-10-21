import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  IndianRupee,
  MapPin,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  RefreshCw,
  Download,
  Filter,
  Eye
} from "lucide-react";
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminNavbar from './SuperAdminNavbar';
import toast from 'react-hot-toast';
import superAdminService from '../../../services/superAdminService';

const SuperAdminAnalytics = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalBookings: 0,
      totalRevenue: 0,
      totalUsers: 0,
      totalTurfs: 0,
      growthMetrics: {
        bookingsGrowth: 0,
        revenueGrowth: 0,
        usersGrowth: 0,
        turfsGrowth: 0
      }
    },
    bookingTrends: [],
    revenueTrends: [],
    userRegistrations: [],
    turfPerformance: [],
    geographicDistribution: [],
    paymentMethods: [],
    popularSports: [],
    peakHours: []
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const data = await superAdminService.getAnalyticsData({
        timeRange,
        includeComparisons: true
      });
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
    toast.success('Analytics data refreshed');
  };

  const handleExport = async () => {
    try {
      await superAdminService.exportAnalyticsReport(timeRange);
      toast.success('Analytics report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    const isPositive = value >= 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SuperAdminSidebar />
        <div className="flex-1 lg:ml-80">
          <SuperAdminNavbar />
          <main className="p-4 lg:p-8 pb-4 pt-32 lg:pt-40 min-h-screen">
            <div className="flex items-center justify-center h-96">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-lg text-gray-600">Loading analytics...</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
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

        <main className="p-4 lg:p-8 pb-4 pt-48 lg:pt-40 min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Comprehensive platform insights and metrics</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Overview Cards */}
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData.overview?.totalBookings?.toLocaleString() || '0'}</p>
                  {formatPercentage(analyticsData.overview?.growthMetrics?.bookingsGrowth || 0)}
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(analyticsData.overview?.totalRevenue || 0)}</p>
                  {formatPercentage(analyticsData.overview?.growthMetrics?.revenueGrowth || 0)}
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <IndianRupee className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData.overview?.totalUsers?.toLocaleString() || '0'}</p>
                  {formatPercentage(analyticsData.overview?.growthMetrics?.usersGrowth || 0)}
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Turfs</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData.overview?.totalTurfs?.toLocaleString() || '0'}</p>
                  {formatPercentage(analyticsData.overview?.growthMetrics?.turfsGrowth || 0)}
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <MapPin className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Booking Trends */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Booking Trends</h3>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analyticsData.bookingTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="bookings" orientation="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="revenue" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'bookings' ? value : formatCurrency(value),
                      name === 'bookings' ? 'Bookings' : 'Revenue'
                    ]}
                  />
                  <Bar yAxisId="bookings" dataKey="bookings" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                  <Line yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} />
                </ComposedChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Revenue Growth */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Revenue Growth</h3>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.revenueTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* User Registrations */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">User Registrations</h3>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.userRegistrations || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [value, 'New Users']} />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Payment Methods Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                <PieChartIcon className="w-5 h-5 text-gray-400" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.paymentMethods || []}
                    dataKey="count"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={40}
                    paddingAngle={2}
                  >
                    {(analyticsData.paymentMethods || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} (${(analyticsData.paymentMethods || []).find(p => p.method === name)?.percentage || 0}%)`, 'Transactions']} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Performance Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Performing Turfs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Turfs</h3>
              <div className="space-y-4">
                {(analyticsData.turfPerformance || []).map((turf, index) => (
                  <div key={turf.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{turf.name}</p>
                        <p className="text-sm text-gray-600">{turf.bookings} bookings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(turf.revenue)}</p>
                      <p className="text-xs text-gray-500">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Geographic Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
              <div className="space-y-4">
                {(analyticsData.geographicDistribution || []).map((location, index) => (
                  <div key={location.city} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{location.city}</p>
                        <p className="text-sm text-gray-600">{location.users} users</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${location.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">{location.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Additional Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
            {/* Popular Sports */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Sports</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analyticsData.popularSports || []} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="sport" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip formatter={(value) => [value, 'Bookings']} />
                  <Bar dataKey="bookings" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Peak Hours */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={analyticsData.peakHours || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [value, 'Bookings']} />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke="#EC4899"
                    fill="url(#peakGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminAnalytics;
