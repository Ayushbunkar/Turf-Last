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
      // clear previous error when user retries
      setError(null);
      // If this is the initial load, use the global loading state which shows the full-page loader.
      // For subsequent refreshes, use `fetching` to show inline spinners inside charts.
      if (!loading) setFetching(true); else setLoading(true);
      const [statsResponse, chartResponse, topResponse, transResponse] = await Promise.all([
        superAdminService.getRevenueStats(timeFilter),
        superAdminService.getRevenueChartData(timeFilter),
        superAdminService.getTopPerformingTurfs(timeFilter),
        superAdminService.getRecentTransactions(20)
      ]);

      // Debugging: print raw responses so dev console shows what backend returned
      try {
        if (import.meta.env.DEV || import.meta.env.VITE_DEBUG) {
          console.debug('revenue stats response:', statsResponse);
          console.debug('revenue chart response:', chartResponse);
          console.debug('top turfs response:', topResponse);
          console.debug('recent transactions response:', transResponse);
        }
      } catch (e) {}
      // Store raw responses for in-UI debugging and no-data snippets
      setRawResponses({ statsResponse, chartResponse, topResponse, transResponse });

      // Normalize stats (use what backend returned or keep defaults)
      // Defensive: copy only known numeric fields and coerce to numbers
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

      // Normalize chart data: backend may return objects like { _id, total } or { month, revenue }
      const rawTrends = (chartResponse && (chartResponse.revenueTrends || chartResponse)) || [];
      const normalizedTrends = (rawTrends || []).map(item => {
        const name = item.name || item.month || item._id || item.label || item.date || '';
        const revenue = Number(item.revenue ?? item.total ?? item.value ?? item.amount ?? 0);
        const bookings = Number(item.bookings ?? item.count ?? item.transactions ?? 0);
        return { name, revenue, bookings, raw: item };
      });
      setRevenueChartData(normalizedTrends);

      // Normalize top performers: backend returns topTurfs array with name, bookings, revenue
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

  // Normalize recent transactions: backend may return { transactions: [...] } with price, createdAt
      const rawTx = (transResponse && (transResponse.transactions || transResponse)) || [];
      const normalizedTx = (rawTx || []).map(tx => ({
        id: tx._id || tx.id || tx.transactionId || tx.id || '',
        turf: (tx.turf && (typeof tx.turf === 'string' ? tx.turf : tx.turf.name)) || tx.turfName || '',
        user: (tx.user && (tx.user.name || tx.user.email)) || tx.userName || tx.customer || '',
        amount: Number(tx.amount ?? tx.price ?? tx.value ?? 0),
        status: tx.status || tx.paymentStatus || tx.payment?.status || '',
        paymentMethod: tx.paymentMethod || tx.payment?.method || 'N/A',
        createdAt: tx.createdAt || tx.date || '',
        raw: tx
      }));
      setRecentTransactions(normalizedTx);

      // If backend didn't return top performers, compute a fallback from recentTransactions
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

      // Build fallback category data from recent transactions if backend didn't provide categories
      const hasCategoryData = (chartResponse && (chartResponse.categories || chartResponse.categoryBreakdown)) || (categoryData && categoryData.length > 0);
      if (!hasCategoryData) {
        try {
          // Fetch turfs to map turfId -> category (getAllTurfs returns { turfs })
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
          // ignore fallback errors
          if (import.meta.env.DEV || import.meta.env.VITE_DEBUG) console.debug('category fallback failed', e);
        }
      }

      // If after fetching there is no data at all for the selected range, inform the user.
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
      // Inform the user; do NOT populate mock data so UI reflects backend state.
      toast.error('Failed to load revenue data from server.');
    } finally {
      // clear fetching/loading flags
      setFetching(false);
      setLoading(false);
    }
  };

  // Helper to format percent and avoid NaN
  const safePercent = (val, sign = '+') => {
    if (typeof val !== 'number' || isNaN(val)) return `${sign}0%`;
    const prefix = val > 0 ? '+' : val < 0 ? '-' : '';
    return `${prefix}${Math.abs(val)}%`;
  };

  // Simple skeleton placeholder component
  const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );

  // Calculate percent change for each stat (current vs previous)
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

  // Validation helpers for Recharts data
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

  // Prepare chart data: when there's only a single point, pad it so axes/ticks render
  const prepareChartDataForRender = (data = [], numericKey = 'revenue') => {
    if (!Array.isArray(data)) return [];
    if (data.length === 0) return [];
    if (data.length === 1) {
      const single = data[0];
      // create two padding points around the single point to give chart an X span
      const left = { ...single, name: `${single.name || ''} ` };
      const center = { ...single, name: single.name || '' };
      const right = { ...single, name: ` ${single.name || ''}` };
      // ensure numericKey is numeric
      left[numericKey] = Number(left[numericKey] ?? 0);
      center[numericKey] = Number(center[numericKey] ?? 0);
      right[numericKey] = Number(right[numericKey] ?? 0);
      return [left, center, right];
    }
    return data.map(d => ({ ...d, [numericKey]: Number(d[numericKey] ?? 0) }));
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
      <SuperAdminPageTemplate title="Revenue Management" subtitle="Track financial performance and revenue analytics">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Loading revenue data...</span>
          </div>
        </div>

        {/* Quick fetched-data summary for debugging/visibility */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="p-4 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Total Revenue (raw)</div>
            <div className="text-lg font-semibold text-gray-900">{formatCurrency(revenueStats.totalRevenue || 0)}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Monthly Revenue</div>
            <div className="text-lg font-semibold text-gray-900">{formatCurrency(revenueStats.monthlyRevenue || 0)}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Recent Transactions (fetched)</div>
            <div className="text-lg font-semibold text-gray-900">{(recentTransactions || []).length}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Top Turfs (fetched)</div>
            <div className="text-lg font-semibold text-gray-900">{(topPerformers || []).length}</div>
          </div>
        </div>
      </SuperAdminPageTemplate>
    );
  }

  return (
    <SuperAdminPageTemplate title="Revenue Management" subtitle="Track financial performance and revenue analytics">
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            <strong className="font-semibold">Error:</strong>
            <span className="ml-2">{error}</span>
            <button onClick={fetchRevenueData} className="ml-4 px-3 py-1 bg-red-100 text-red-800 rounded">Retry</button>
          </div>
        )}
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
            <button onClick={async () => {
              try {
                toast.promise(superAdminService.exportRevenueReport(timeFilter), {
                  loading: 'Generating report...',
                  success: 'Report downloaded',
                  error: 'Failed to generate report'
                });
              } catch (err) {
                console.error('export error', err);
              }
            }} className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
            <button onClick={() => setShowRaw(v => !v)} className="ml-2 px-3 py-2 border rounded bg-gray-50 text-sm">
              {showRaw ? 'Hide' : 'Show'} raw responses
            </button>
          </div>
        </div>

        {showRaw && rawResponses && (
          <div className="bg-gray-100 p-4 rounded mb-4">
            <h4 className="font-medium mb-2">Raw API Responses (debug)</h4>
            <pre className="text-xs max-h-64 overflow-auto">{JSON.stringify(rawResponses, null, 2)}</pre>
          </div>
        )}

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
              {fetching && (
                <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                  <div className="w-40"><Skeleton className="h-4" /></div>
                  <div className="w-64"><Skeleton className="h-6" /></div>
                  <div className="w-32"><Skeleton className="h-4" /></div>
                </div>
              )}
              {!fetching && (!revenueChartData || revenueChartData.length === 0) && (
                <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                  <div>No revenue trend data for the selected time range.</div>
                  <div className="text-xs text-left max-w-full overflow-auto bg-gray-50 p-2 rounded border text-gray-700">
                    <strong>Server response snippet:</strong>
                    <pre className="text-xs mt-1">{JSON.stringify(rawResponses?.chartResponse || rawResponses?.statsResponse || {}, null, 2)}</pre>
                  </div>
                </div>
              )}
              {!fetching && revenueChartData && revenueChartData.length > 0 && (() => {
                const problems = validateChartData(revenueChartData, ['revenue']);
                const renderData = prepareChartDataForRender(revenueChartData, 'revenue');
                // compute Y axis domain with padding
                const revenues = (renderData || []).map(d => Number(d.revenue || 0));
                const minRevenue = revenues.length ? Math.min(...revenues) : 0;
                const maxRevenue = revenues.length ? Math.max(...revenues) : 0;
                let yMin = Math.min(0, Math.floor(minRevenue * 0.9));
                let yMax = Math.ceil(maxRevenue * 1.1 || 1);
                if (minRevenue === maxRevenue) {
                  // single-value series - provide a small range around the value
                  const v = Math.max(1, Math.abs(maxRevenue));
                  yMin = Math.floor(maxRevenue - v * 0.2);
                  yMax = Math.ceil(maxRevenue + v * 0.2);
                }
                return (
                  <>
                    {problems && problems.length > 0 && (
                      <div className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded mb-2">Warning: chart data contains invalid or missing numeric values. See raw snippet below for problematic rows.
                        <pre className="text-xs mt-2 max-h-40 overflow-auto">{JSON.stringify(problems.slice(0,5), null, 2)}</pre>
                      </div>
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={renderData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[yMin, yMax]} tickFormatter={(v) => formatCurrency(v)} />
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
                  </>
                );
              })()}
              {/* Debug fallback table so the processed chart data is always visible */}
              {!fetching && revenueChartData && revenueChartData.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm text-gray-600 mb-2">Revenue data (processed):</div>
                  <div className="overflow-auto">
                    <table className="text-xs w-full border-collapse">
                      <thead>
                        <tr className="text-left"><th className="pr-4">Label</th><th className="pr-4">Revenue</th><th>Bookings</th></tr>
                      </thead>
                      <tbody>
                        {revenueChartData.map((r, i) => (
                          <tr key={i} className="border-t"><td className="py-1 pr-4">{r.name}</td><td className="py-1 pr-4">{formatCurrency(r.revenue)}</td><td className="py-1">{r.bookings}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
                {fetching && (
                  <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                    <div className="w-40"><Skeleton className="h-4" /></div>
                    <div className="w-64"><Skeleton className="h-6" /></div>
                  </div>
                )}
                {!fetching && (!categoryData || categoryData.length === 0) && (
                  <div className="h-full w-full flex flex-col items-center justify-center text-gray-500">
                    <div>No category data available.</div>
                    <div className="text-xs text-left max-w-full overflow-auto bg-gray-50 p-2 rounded border text-gray-700 mt-2">
                      <strong>Server response snippet:</strong>
                      <pre className="text-xs mt-1">{JSON.stringify(rawResponses?.chartResponse || {}, null, 2)}</pre>
                    </div>
                  </div>
                )}
                {!fetching && categoryData && categoryData.length > 0 && (() => {
                  // ensure numeric 'value' exists; fallback to revenue -> percentage
                  const cats = categoryData.map(c => ({ ...c, value: Number(c.value ?? c.percentage ?? (c.revenue ? 0 : 0)) }));
                  const problems = validateChartData(cats, ['value']);
                  return (
                    <>
                      {problems && problems.length > 0 && (
                        <div className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded mb-2">Warning: category data missing numeric 'value' fields.
                          <pre className="text-xs mt-2 max-h-40 overflow-auto">{JSON.stringify(problems.slice(0,5), null, 2)}</pre>
                        </div>
                      )}
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            dataKey="value"
                            data={cats}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
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
              {(() => {
                const topProblems = validateChartData(topPerformers, ['revenue']);
                if (topProblems && topProblems.length > 0) {
                  return (
                    <div className="mb-3 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                      Warning: top performers contain invalid revenue values.
                      <pre className="text-xs mt-2 max-h-40 overflow-auto">{JSON.stringify(topProblems.slice(0,5), null, 2)}</pre>
                    </div>
                  );
                }
                return null;
              })()}
              <div className="space-y-4">
                {fetching ? (
                  <div className="py-8">
                    <Skeleton className="h-8 mb-2" />
                    <Skeleton className="h-8 mb-2" />
                    <Skeleton className="h-8" />
                  </div>
                ) : (!topPerformers || topPerformers.length === 0) ? (
                  <div className="text-center text-gray-500 py-4">
                    <div>No top performers available for the selected range.</div>
                    <div className="text-xs mt-2 text-left max-w-full overflow-auto bg-gray-50 p-2 rounded border text-gray-700">
                      <strong>Server response snippet:</strong>
                      <pre className="text-xs mt-1">{JSON.stringify(rawResponses?.topResponse || {}, null, 2)}</pre>
                    </div>
                  </div>
                ) : (
                  <>
                    {topPerformers.map((turf, index) => (
                      <motion.div
                        key={turf.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-linear-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
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
                    {/* Debug table for top performers (processed) */}
                    {topPerformers && topPerformers.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm text-gray-600 mb-2">Top performers (processed):</div>
                        <div className="overflow-auto">
                          <table className="text-xs w-full border-collapse">
                            <thead>
                              <tr className="text-left"><th className="pr-4">Name</th><th className="pr-4">Revenue</th><th>Bookings</th></tr>
                            </thead>
                            <tbody>
                              {topPerformers.map((t,i) => (
                                <tr key={t.id || i} className="border-t"><td className="py-1 pr-4">{t.name}</td><td className="py-1 pr-4">{formatCurrency(t.revenue)}</td><td className="py-1">{t.bookings}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
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
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                <Receipt className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="p-6">
              {(() => {
                const txProblems = validateChartData(recentTransactions, ['amount']);
                if (txProblems && txProblems.length > 0) {
                  return (
                    <div className="mb-3 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                      Warning: recent transactions contain invalid amount values.
                      <pre className="text-xs mt-2 max-h-40 overflow-auto">{JSON.stringify(txProblems.slice(0,5), null, 2)}</pre>
                    </div>
                  );
                }
                return null;
              })()}
              <div className="space-y-4">
                {fetching ? (
                  <div className="py-6">
                    <Skeleton className="h-12 mb-2" />
                    <Skeleton className="h-12 mb-2" />
                    <Skeleton className="h-12" />
                  </div>
                ) : (!recentTransactions || recentTransactions.length === 0) ? (
                  <div className="text-center text-gray-500 py-4">
                    <div>No recent transactions available.</div>
                    <div className="text-xs mt-2 text-left max-w-full overflow-auto bg-gray-50 p-2 rounded border text-gray-700">
                      <strong>Server response snippet:</strong>
                      <pre className="text-xs mt-1">{JSON.stringify(rawResponses?.transResponse || {}, null, 2)}</pre>
                    </div>
                  </div>
                ) : (
                  <>
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
                              {transaction.id}   {transaction.paymentMethod}
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
                  </>
                )}
              </div>
              <button className="w-full mt-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                View All Transactions
              </button>
                  {/* Debug table for recent transactions (processed) */}
                  {recentTransactions && recentTransactions.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm text-gray-600 mb-2">Recent transactions (processed):</div>
                      <div className="overflow-auto">
                        <table className="text-xs w-full border-collapse">
                          <thead>
                            <tr className="text-left"><th className="pr-4">Txn ID</th><th className="pr-4">Turf</th><th className="pr-4">User</th><th>Amount</th></tr>
                          </thead>
                          <tbody>
                            {recentTransactions.map((tx) => (
                              <tr key={tx.id} className="border-t"><td className="py-1 pr-4">{tx.id}</td><td className="py-1 pr-4">{tx.turf}</td><td className="py-1 pr-4">{tx.user}</td><td className="py-1">{formatCurrency(tx.amount)}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
            </div>
          </motion.div>
        </div>
      </div>
    </SuperAdminPageTemplate>
  );
};

export default SuperAdminRevenue;