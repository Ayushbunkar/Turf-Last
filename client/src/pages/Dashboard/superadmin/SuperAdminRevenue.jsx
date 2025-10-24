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
  Percent,
  Menu,
  X
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
import SuperAdminPageTemplate from './SuperAdminPageTemplate';
import superAdminService from '../../../services/superAdminService';
import toast from 'react-hot-toast';

const SuperAdminRevenue = () => {
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [rawResponses, setRawResponses] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
      setError(null);
      if (!loading) setFetching(true); else setLoading(true);
      const [statsResponse, chartResponse, topResponse, transResponse] = await Promise.all([
        superAdminService.getRevenueStats(timeFilter),
        superAdminService.getRevenueChartData(timeFilter),
        superAdminService.getTopPerformingTurfs(timeFilter),
        superAdminService.getRecentTransactions(20)
      ]);

      // Store raw responses for debugging
      setRawResponses({ statsResponse, chartResponse, topResponse, transResponse });

      // Normalize stats data
      const stats = statsResponse || {};
      setRevenueStats(prev => ({
        totalRevenue: Number(stats.totalRevenue ?? stats.total ?? prev.totalRevenue ?? 0),
        totalRevenuePrev: Number(stats.totalRevenuePrev ?? stats.totalPrev ?? prev.totalRevenuePrev ?? 0),
        monthlyRevenue: Number(stats.monthlyRevenue ?? stats.monthly ?? prev.monthlyRevenue ?? 0),
        monthlyRevenuePrev: Number(stats.monthlyRevenuePrev ?? stats.monthlyPrev ?? prev.monthlyRevenuePrev ?? 0),
        platformFee: Number(stats.platformFee ?? prev.platformFee ?? 0),
        platformFeePrev: Number(stats.platformFeePrev ?? prev.platformFeePrev ?? 0),
        pendingPayments: Number(stats.pendingPayments ?? prev.pendingPayments ?? 0),
        pendingPaymentsPrev: Number(stats.pendingPaymentsPrev ?? prev.pendingPaymentsPrev ?? 0),
        netRevenue: Number(stats.netRevenue ?? prev.netRevenue ?? 0),
        growth: Number(stats.growth ?? prev.growth ?? 0),
        transactionCount: Number(stats.transactionCount ?? prev.transactionCount ?? 0)
      }));

      // Normalize chart data
      const rawTrends = (chartResponse && (chartResponse.revenueTrends || chartResponse)) || [];
      const normalizedTrends = (rawTrends || []).map(item => {
        const name = item.name || item.month || item._id || item.label || item.date || '';
        const revenue = Number(item.revenue ?? item.total ?? item.value ?? item.amount ?? 0);
        const bookings = Number(item.bookings ?? item.count ?? item.transactions ?? 0);
        return { name, revenue, bookings, raw: item };
      });
      setRevenueChartData(normalizedTrends);

      // Normalize top performers
      const rawTops = (topResponse && (topResponse.topTurfs || topResponse)) || [];
      const normalizedTops = (rawTops || []).map((t, i) => ({
        id: t._id || t.id || `${i}`,
        name: t.name || t.turfName || t.turf?.name || 'Unknown',
        location: t.location || t.turfLocation || (t.turf && t.turf.location) || '',
        revenue: Number(t.revenue ?? t.total ?? t.value ?? 0),
        bookings: Number(t.bookings ?? t.count ?? 0),
        rating: t.rating ?? 'N/A',
        growth: Number(t.growth ?? 0),
        raw: t
      }));
      setTopPerformers(normalizedTops);

      // Normalize recent transactions
      const rawTx = (transResponse && (transResponse.transactions || transResponse)) || [];
      const normalizedTx = (rawTx || []).map(tx => ({
        id: tx._id || tx.transactionId || tx.id || '',
        turf: (tx.turf && (typeof tx.turf === 'string' ? tx.turf : tx.turf.name)) || tx.turfName || '',
        user: (tx.user && (tx.user.name || tx.user.email)) || tx.userName || tx.customer || '',
        amount: Number(tx.amount ?? tx.price ?? tx.value ?? 0),
        status: tx.status || tx.paymentStatus || tx.payment?.status || '',
        paymentMethod: tx.paymentMethod || tx.payment?.method || 'N/A',
        createdAt: tx.createdAt || tx.date || '',
        raw: tx
      }));
      setRecentTransactions(normalizedTx);

      // Fallback for top performers
      if ((!normalizedTops || normalizedTops.length === 0) && normalizedTx && normalizedTx.length > 0) {
        const byTurf = {};
        normalizedTx.forEach(tx => {
          const turfKey = (tx.turf && tx.turf.trim()) || (tx.raw && (tx.raw.turfName || tx.raw.turf)) || 'Unknown';
          if (!byTurf[turfKey]) byTurf[turfKey] = { name: turfKey, revenue: 0, bookings: 0 };
          byTurf[turfKey].revenue += Number(tx.amount || 0);
          byTurf[turfKey].bookings += 1;
        });
        const computedTops = Object.values(byTurf)
          .sort((a,b) => b.revenue - a.revenue)
          .slice(0,5)
          .map((t, i) => ({ id: `${i}`, name: t.name, location: '', revenue: t.revenue, bookings: t.bookings, rating: 'N/A', growth: 0, raw: t }));
        if (computedTops.length > 0) setTopPerformers(computedTops);
      }

      // Fallback for category data
      const hasCategoryData = (chartResponse && (chartResponse.categories || chartResponse.categoryBreakdown)) || (categoryData && categoryData.length > 0);
      if (!hasCategoryData) {
        try {
          const turfsRes = await superAdminService.getAllTurfs({ limit: 1000 });
          const turfsList = turfsRes?.turfs || turfsRes || [];
          const turfById = {};
          turfsList.forEach(t => {
            const id = t._id || t.id || (t && t._id) || '';
            turfById[String(id)] = t;
          });

          const byCategory = {};
          (normalizedTx || []).forEach(tx => {
            const turfId = tx.turfId || tx.turfId || tx.raw?.turfId || tx.raw?.turf || '';
            const turfObj = turfById[String(turfId)];
            const category = turfObj?.category || turfObj?.sport || turfObj?.type || 'Unknown';
            byCategory[category] = (byCategory[category] || 0) + Number(tx.amount || 0);
          });

          const total = Object.values(byCategory).reduce((s, v) => s + v, 0) || 1;
          const colors = ['#60A5FA', '#34D399', '#F472B6', '#F59E0B', '#A78BFA', '#F87171'];
          const computed = Object.keys(byCategory).map((name, i) => ({
            name,
            value: Math.round((byCategory[name] / total) * 100),
            revenue: byCategory[name],
            color: colors[i % colors.length]
          }));
          if (computed.length > 0) setCategoryData(computed);
        } catch (e) {
          if (import.meta.env.DEV || import.meta.env.VITE_DEBUG) console.debug('category fallback failed', e);
        }
      }

      const noChart = (!normalizedTrends || normalizedTrends.length === 0);
      const noTops = (!normalizedTops || normalizedTops.length === 0);
      const noTx = (!normalizedTx || normalizedTx.length === 0);
      if (noChart && noTops && noTx) {
        toast('No revenue data available for the selected time range.', { icon: 'ℹ️' });
      }
    } catch (err) {
      console.error("Error fetching revenue data:", err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch revenue data';
      setError(msg);
      toast.error('Failed to load revenue data from server.');
    } finally {
      setFetching(false);
      setLoading(false);
    }
  };

  // Helper functions
  const safePercent = (val, sign = '+') => {
    if (typeof val !== 'number' || isNaN(val)) return `${sign}0%`;
    const prefix = val > 0 ? '+' : val < 0 ? '-' : '';
    return `${prefix}${Math.abs(val)}%`;
  };

  const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );

  const percentChange = (current, prev) => {
    if (typeof current !== 'number' || typeof prev !== 'number' || isNaN(current) || isNaN(prev)) return 0;
    if (prev === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / Math.abs(prev)) * 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const validateChartData = (data = [], numericKeys = ['revenue']) => {
    const problems = [];
    if (!Array.isArray(data)) return [{ message: 'Data is not an array', raw: data }];
    data.forEach((row, idx) => {
      numericKeys.forEach(key => {
        const v = row?.[key];
        if (v === undefined || v === null || isNaN(Number(v))) {
          problems.push({ index: idx, key, value: v, raw: row });
        }
      });
    });
    return problems;
  };

  const prepareChartDataForRender = (data = [], numericKey = 'revenue') => {
    if (!Array.isArray(data)) return [];
    if (data.length === 0) return [];
    if (data.length === 1) {
      const single = data[0];
      const left = { ...single, name: `${single.name || ''} ` };
      const center = { ...single, name: single.name || '' };
      const right = { ...single, name: ` ${single.name || ''}` };
      left[numericKey] = Number(left[numericKey] ?? 0);
      center[numericKey] = Number(center[numericKey] ?? 0);
      right[numericKey] = Number(right[numericKey] ?? 0);
      return [left, center, right];
    }
    return data.map(d => ({ ...d, [numericKey]: Number(d[numericKey] ?? 0) }));
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
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(revenueStats.totalRevenue),
      change: safePercent(percentChange(revenueStats.totalRevenue, revenueStats.totalRevenuePrev)),
      changeType: percentChange(revenueStats.totalRevenue, revenueStats.totalRevenuePrev) < 0 ? "decrease" : "increase",
      icon: IndianRupee,
      color: "blue",
      description: "All-time earnings"
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(revenueStats.monthlyRevenue),
      change: safePercent(percentChange(revenueStats.monthlyRevenue, revenueStats.monthlyRevenuePrev)),
      changeType: percentChange(revenueStats.monthlyRevenue, revenueStats.monthlyRevenuePrev) < 0 ? "decrease" : "increase",
      icon: TrendingUp,
      color: "green", 
      description: "This month"
    },
    {
      title: "Platform Fee",
      value: formatCurrency(revenueStats.platformFee),
      change: safePercent(percentChange(revenueStats.platformFee, revenueStats.platformFeePrev)),
      changeType: percentChange(revenueStats.platformFee, revenueStats.platformFeePrev) < 0 ? "decrease" : "increase",
      icon: Percent,
      color: "purple",
      description: "Commission earned"
    },
    {
      title: "Pending Payments",
      value: formatCurrency(revenueStats.pendingPayments),
      change: safePercent(percentChange(revenueStats.pendingPayments, revenueStats.pendingPaymentsPrev), '-'),
      changeType: percentChange(revenueStats.pendingPayments, revenueStats.pendingPaymentsPrev) < 0 ? "decrease" : "increase",
      icon: Clock,
      color: "orange",
      description: "Awaiting settlement"
    }
  ];

  if (loading) {
    return (
      <SuperAdminPageTemplate title="Revenue Management" subtitle="Track financial performance and revenue analytics">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Loading revenue data...</span>
          </div>
        </div>
      </SuperAdminPageTemplate>
    );
  }

  return (
    <SuperAdminPageTemplate title="Revenue Management" subtitle="Track financial performance and revenue analytics">
      <div className="w-full min-w-0 overflow-x-hidden pt-16 sm:pt-0">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div className="flex-1">
                  <strong className="font-semibold">Error:</strong>
                  <span className="ml-2">{error}</span>
                </div>
                <button 
                  onClick={fetchRevenueData} 
                  className="mt-2 sm:mt-0 sm:ml-4 px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          
          {/* Header - Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-extrabold text-gray-900">Revenue Management</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Track financial performance and revenue analytics</p>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="sm:hidden flex items-center justify-between">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg border border-gray-300 bg-white"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

            {/* Controls - Desktop */}
            <div className="hidden sm:flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 w-full sm:w-auto">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 3 Months</option>
                <option value="1y">Last Year</option>
              </select>
              <button
                onClick={fetchRevenueData}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button 
                onClick={async () => {
                  try {
                    toast.promise(superAdminService.exportRevenueReport(timeFilter), {
                      loading: 'Generating report...',
                      success: 'Report downloaded',
                      error: 'Failed to generate report'
                    });
                  } catch (err) {
                    console.error('export error', err);
                  }
                }} 
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button 
                onClick={() => setShowRaw(v => !v)} 
                className="w-full sm:w-auto px-3 py-2 border rounded bg-gray-50 text-sm hover:bg-gray-100 transition-colors"
              >
                {showRaw ? 'Hide Raw' : 'Show Raw'}
              </button>
            </div>
          </div>

          {/* Mobile Controls Dropdown */}
          {isMobileMenuOpen && (
            <div className="sm:hidden bg-gray-50 p-4 rounded-lg space-y-3">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 3 Months</option>
                <option value="1y">Last Year</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={fetchRevenueData}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
                <button 
                  onClick={async () => {
                    try {
                      toast.promise(superAdminService.exportRevenueReport(timeFilter), {
                        loading: 'Generating report...',
                        success: 'Report downloaded',
                        error: 'Failed to generate report'
                      });
                    } catch (err) {
                      console.error('export error', err);
                    }
                  }} 
                  className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
              <button 
                onClick={() => setShowRaw(v => !v)} 
                className="w-full px-3 py-2 border rounded bg-gray-50 text-sm hover:bg-gray-100 transition-colors"
              >
                {showRaw ? 'Hide Raw Data' : 'Show Raw Data'}
              </button>
            </div>
          )}

          {/* Raw Data Display */}
          {showRaw && rawResponses && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-sm">Raw API Responses (debug)</h4>
              <pre className="text-xs max-h-64 overflow-auto">{JSON.stringify(rawResponses, null, 2)}</pre>
            </div>
          )}

          {/* Stats Cards - Responsive Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col justify-between bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-${card.color}-100`}>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${card.color}-600`} />
                    </div>
                    <span className={`text-xs sm:text-sm font-semibold ${card.changeType === "increase" ? "text-green-600" : "text-red-600"}`}>
                      {card.change}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">{card.value}</h3>
                    <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">{card.title}</p>
                    <p className="text-gray-500 text-xs mt-1 truncate">{card.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Charts Section - Responsive Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Revenue Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Revenue Trend</h3>
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm text-gray-600">Revenue</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm text-gray-600">Bookings</span>
                  </div>
                </div>
              </div>
              <div className="h-48 sm:h-64 lg:h-80 min-w-0">
                {fetching && (
                  <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                    <div className="w-32 sm:w-40"><Skeleton className="h-3 sm:h-4" /></div>
                    <div className="w-48 sm:w-64"><Skeleton className="h-4 sm:h-6" /></div>
                    <div className="w-24 sm:w-32"><Skeleton className="h-3 sm:h-4" /></div>
                  </div>
                )}
                {!fetching && (!revenueChartData || revenueChartData.length === 0) && (
                  <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 space-y-3 p-4">
                    <div className="text-sm text-center">No revenue trend data for the selected time range.</div>
                  </div>
                )}
                {!fetching && revenueChartData && revenueChartData.length > 0 && (() => {
                  const problems = validateChartData(revenueChartData, ['revenue']);
                  const renderData = prepareChartDataForRender(revenueChartData, 'revenue');
                  const revenues = (renderData || []).map(d => Number(d.revenue || 0));
                  const minRevenue = revenues.length ? Math.min(...revenues) : 0;
                  const maxRevenue = revenues.length ? Math.max(...revenues) : 0;
                  let yMin = Math.min(0, Math.floor(minRevenue * 0.9));
                  let yMax = Math.ceil(maxRevenue * 1.1 || 1);
                  if (minRevenue === maxRevenue) {
                    const v = Math.max(1, Math.abs(maxRevenue));
                    yMin = Math.floor(maxRevenue - v * 0.2);
                    yMax = Math.ceil(maxRevenue + v * 0.2);
                  }
                  return (
                    <>
                      {problems && problems.length > 0 && (
                        <div className="text-xs sm:text-sm text-yellow-700 bg-yellow-50 p-2 rounded mb-2">
                          Warning: chart data contains invalid values.
                        </div>
                      )}
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={renderData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                          />
                          <YAxis 
                            domain={[yMin, yMax]} 
                            tickFormatter={(v) => formatCurrency(v)}
                            tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                          />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'revenue' ? formatCurrency(value) : value,
                              name === 'revenue' ? 'Revenue' : 'Bookings'
                            ]}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            dot={{ fill: '#3B82F6', strokeWidth: 2, r: window.innerWidth < 640 ? 2 : 4 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="bookings" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            dot={{ fill: '#10B981', strokeWidth: 2, r: window.innerWidth < 640 ? 2 : 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </>
                  );
                })()}
              </div>
            </motion.div>

            {/* Category Revenue Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Revenue by Category</h3>
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
              <div className="h-48 sm:h-64 lg:h-80 min-w-0">
                {fetching && (
                  <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                    <div className="w-32 sm:w-40"><Skeleton className="h-3 sm:h-4" /></div>
                    <div className="w-48 sm:w-64"><Skeleton className="h-4 sm:h-6" /></div>
                  </div>
                )}
                {!fetching && (!categoryData || categoryData.length === 0) && (
                  <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 p-4">
                    <div className="text-sm text-center">No category data available.</div>
                  </div>
                )}
                {!fetching && categoryData && categoryData.length > 0 && (() => {
                  const cats = categoryData.map(c => ({ ...c, value: Number(c.value ?? c.percentage ?? (c.revenue ? 0 : 0)) }));
                  const problems = validateChartData(cats, ['value']);
                  return (
                    <>
                      {problems && problems.length > 0 && (
                        <div className="text-xs sm:text-sm text-yellow-700 bg-yellow-50 p-2 rounded mb-2">
                          Warning: category data issues.
                        </div>
                      )}
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            dataKey="value"
                            data={cats}
                            cx="50%"
                            cy="50%"
                            outerRadius={window.innerWidth < 640 ? 60 : 80}
                            label={({ name, value }) => `${name}: ${value}%`}
                          >
                            {cats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value}%`, 'Share']} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </>
                  );
                })()}
              </div>
              <div className="mt-4 space-y-2">
                {categoryData.map((category) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div
                        className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-xs sm:text-sm text-gray-600 truncate">{category.name}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 ml-2 flex-shrink-0">
                      {formatCurrency(category.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Top Performers & Recent Transactions - Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Top Performing Turfs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Top Performing Turfs</h3>
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {fetching ? (
                    <div className="py-6 space-y-3">
                      <Skeleton className="h-12" />
                      <Skeleton className="h-12" />
                      <Skeleton className="h-12" />
                    </div>
                  ) : (!topPerformers || topPerformers.length === 0) ? (
                    <div className="text-center text-gray-500 py-6">
                      <div className="text-sm">No top performers available.</div>
                    </div>
                  ) : (
                    topPerformers.map((turf, index) => (
                      <motion.div
                        key={turf.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                            #{index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{turf.name}</h4>
                            <p className="text-gray-600 text-xs sm:text-sm truncate">{turf.location}</p>
                            <div className="flex items-center mt-1">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current mr-1" />
                              <span className="text-xs sm:text-sm font-medium">{turf.rating}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <div className="text-sm sm:text-base font-bold text-gray-900 whitespace-nowrap">
                            {formatCurrency(turf.revenue)}
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-green-600 justify-end">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span>+{turf.growth}%</span>
                          </div>
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            {turf.bookings} bookings
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
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
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Transactions</h3>
                  <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {fetching ? (
                    <div className="py-6 space-y-3">
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                    </div>
                  ) : (!recentTransactions || recentTransactions.length === 0) ? (
                    <div className="text-center text-gray-500 py-6">
                      <div className="text-sm">No recent transactions available.</div>
                    </div>
                  ) : (
                    recentTransactions.slice(0, 5).map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {transaction.paymentMethod === 'UPI' ? (
                              <IndianRupee className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                            ) : (
                              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{transaction.turf}</div>
                            <div className="text-gray-600 text-xs truncate">
                              {transaction.id.slice(0, 8)}... - {transaction.paymentMethod}
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <div className="font-medium text-gray-900 text-sm sm:text-base whitespace-nowrap">
                            {formatCurrency(transaction.amount)}
                          </div>
                          <div className="text-xs mt-1">
                            {getStatusBadge(transaction.status)}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
                <button className="w-full mt-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm sm:text-base">
                  View All Transactions
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </SuperAdminPageTemplate>
  );
};

export default SuperAdminRevenue;