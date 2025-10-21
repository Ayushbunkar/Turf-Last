import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  CreditCard,
  Banknote,
  Receipt,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  Building,
  Users,
  Clock,
  Star,
  Target,
  Percent
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminNavbar from './SuperAdminNavbar';
import superAdminService from '../../../services/superAdminService';
import toast from 'react-hot-toast';

const SuperAdminRevenue = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    dailyRevenue: 0,
    pendingPayments: 0,
    platformFee: 0,
    netRevenue: 0,
    growth: 0,
    transactionCount: 0
  });

  const [revenueChartData, setRevenueChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    fetchRevenueData();
  }, [timeFilter]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const [statsResponse, chartResponse, topResponse, transResponse] = await Promise.all([
        superAdminService.getRevenueStats(timeFilter),
        superAdminService.getRevenueChartData(timeFilter),
        superAdminService.getTopPerformingTurfs(timeFilter),
        superAdminService.getRecentTransactions(20)
      ]);

  setRevenueStats(statsResponse || revenueStats);
  setRevenueChartData(chartResponse?.revenueTrends || []);
  setTopPerformers(topResponse?.topTurfs || []);
  setRecentTransactions(transResponse?.transactions || []);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      // Set mock data on error
      setRevenueStats({
        totalRevenue: 12500000,
        monthlyRevenue: 1850000,
        dailyRevenue: 62000,
        pendingPayments: 145000,
        platformFee: 1250000,
        netRevenue: 11250000,
        growth: 18.5,
        transactionCount: 15600
      });

    } finally {
      setLoading(false);
    }
  };

  // Helper to format percent and avoid NaN
  const safePercent = (val, sign = '+') => {
    if (typeof val !== 'number' || isNaN(val)) return `${sign}0%`;
    const prefix = val > 0 ? '+' : val < 0 ? '-' : '';
    return `${prefix}${Math.abs(val)}%`;
  };

  // Calculate percent change for each stat (current vs previous)
  const percentChange = (current, prev) => {
    if (typeof current !== 'number' || typeof prev !== 'number' || isNaN(current) || isNaN(prev)) return 0;
    if (prev === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / Math.abs(prev)) * 100);
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: `₹${(revenueStats.totalRevenue / 100000).toFixed(1)}L`,
      change: safePercent(percentChange(revenueStats.totalRevenue, revenueStats.totalRevenuePrev)),
      changeType: percentChange(revenueStats.totalRevenue, revenueStats.totalRevenuePrev) < 0 ? "decrease" : "increase",
      icon: IndianRupee,
      color: "blue",
      description: "All-time earnings"
    },
    {
      title: "Monthly Revenue",
      value: `₹${(revenueStats.monthlyRevenue / 100000).toFixed(1)}L`,
      change: safePercent(percentChange(revenueStats.monthlyRevenue, revenueStats.monthlyRevenuePrev)),
      changeType: percentChange(revenueStats.monthlyRevenue, revenueStats.monthlyRevenuePrev) < 0 ? "decrease" : "increase",
      icon: TrendingUp,
      color: "green", 
      description: "This month"
    },
    {
      title: "Platform Fee",
      value: `₹${(revenueStats.platformFee / 100000).toFixed(1)}L`,
      change: safePercent(percentChange(revenueStats.platformFee, revenueStats.platformFeePrev)),
      changeType: percentChange(revenueStats.platformFee, revenueStats.platformFeePrev) < 0 ? "decrease" : "increase",
      icon: Percent,
      color: "purple",
      description: "Commission earned"
    },
    {
      title: "Pending Payments",
      value: `₹${(revenueStats.pendingPayments / 1000).toFixed(0)}k`,
      change: safePercent(percentChange(revenueStats.pendingPayments, revenueStats.pendingPaymentsPrev), '-'),
      changeType: percentChange(revenueStats.pendingPayments, revenueStats.pendingPaymentsPrev) < 0 ? "decrease" : "increase",
      icon: Clock,
      color: "orange",
      description: "Awaiting settlement"
    }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800' },
      pending: { color: 'bg-yellow-100 text-yellow-800' },
      failed: { color: 'bg-red-100 text-red-800' },
      refunded: { color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
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
          <main className="p-4 lg:p-8 pb-4 pt-48 min-h-screen">
            <div className="flex items-center justify-center h-96">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-lg text-gray-600">Loading revenue data...</span>
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
        
        <main className="p-4 lg:p-8 pb-4 pt-32 lg:pt-40 min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Revenue Management</h1>
              <p className="text-gray-600 mt-1">Track financial performance and revenue analytics</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 3 Months</option>
                <option value="1y">Last Year</option>
              </select>
              <button
                onClick={fetchRevenueData}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col justify-between bg-white rounded-xl shadow-sm p-6 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${card.color}-100`}>
                      <Icon className={`w-7 h-7 text-${card.color}-600`} />
                    </div>
                    <span className={`text-sm font-semibold ${card.changeType === "increase" ? "text-green-600" : "text-red-600"}`}>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 mb-6 lg:mb-8">
            {/* Revenue Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Revenue</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Bookings</span>
                  </div>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Bookings'
                    ]} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bookings" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Category Revenue Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Revenue by Category</h3>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      dataKey="value"
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}%`, 'Share']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {categoryData.map((category) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-sm text-gray-600">{category.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(category.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Top Performers & Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
            {/* Top Performing Turfs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Top Performing Turfs</h3>
                  <Target className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {topPerformers.map((turf, index) => (
                    <motion.div
                      key={turf.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{turf.name}</h4>
                          <p className="text-sm text-gray-600">{turf.location}</p>
                          <div className="flex items-center mt-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm font-medium">{turf.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(turf.revenue)}
                        </div>
                        <div className="flex items-center text-sm text-green-600">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          <span>+{turf.growth}%</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {turf.bookings} bookings
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                  <Receipt className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentTransactions.slice(0, 5).map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {transaction.paymentMethod === 'UPI' ? (
                            <IndianRupee className="w-4 h-4 text-blue-600" />
                          ) : (
                            <CreditCard className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{transaction.turf}</div>
                          <div className="text-sm text-gray-600">
                            {transaction.id} • {transaction.paymentMethod}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-sm">
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <button className="w-full mt-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  View All Transactions
                </button>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminRevenue;