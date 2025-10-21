// import React, { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import {
//   TrendingUp,
//   TrendingDown,
//   Users,
//   Calendar,
//   DollarSign,
//   BarChart3,
//   PieChart,
//   Activity,
//   Target,
//   Clock
// } from "lucide-react";
// import api from "../../../config/Api";
// import toast from "react-hot-toast";
// import { useOutletContext } from "react-router-dom";

// export default function TurfAdminAnalytics() {
//   // Local Card wrapper inlined to avoid cross-file dependency on components/ui
//   function CardInline({ children, className = "", ...props }) {
//     return (
//       <div className={className} {...props}>
//         {children}
//       </div>
//     );
//   }

//   const { darkMode } = useOutletContext() || {};
//   const [analytics, setAnalytics] = useState({});
//   const [chartData, setChartData] = useState({});
//   const [isLoading, setIsLoading] = useState(true);
//   const [selectedPeriod, setSelectedPeriod] = useState("thisMonth");

//   const periods = [
//     { value: "thisWeek", label: "This Week" },
//     { value: "thisMonth", label: "This Month" },
//     { value: "last3Months", label: "Last 3 Months" },
//     { value: "thisYear", label: "This Year" }
//   ];

//   useEffect(() => {
//     const fetchAnalytics = async () => {
//       setIsLoading(true);
//       try {
//         const res = await api.get(`/turfadmin/analytics?period=${selectedPeriod}`);
//         setAnalytics(res.data.analytics || {});
//         setChartData(res.data.charts || {});
//       } catch {
//         toast.error("Failed to fetch analytics data");
//         setAnalytics({
//           revenue: { thisMonth: 45000, lastMonth: 38000, growth: 18.4 },
//           bookings: { thisMonth: 156, lastMonth: 142, growth: 9.9 },
//           customers: { total: 87, newThisMonth: 23, returnRate: 68 },
//           turfs: { totalTurfs: 3, mostBooked: "Football Arena A", utilizationRate: 75 }
//         });
//         setChartData({
//           revenueChart: [
//             { name: "Week 1", revenue: 8500, bookings: 32 },
//             { name: "Week 2", revenue: 12300, bookings: 41 },
//             { name: "Week 3", revenue: 15200, bookings: 48 },
//             { name: "Week 4", revenue: 9000, bookings: 35 }
//           ],
//           turfPerformance: [
//             { name: "Football Arena A", bookings: 65, revenue: 19500 },
//             { name: "Cricket Ground B", bookings: 52, revenue: 15600 },
//             { name: "Basketball Court C", bookings: 39, revenue: 9900 }
//           ],
//           timeSlotAnalysis: [
//             { slot: "6:00-8:00 AM", bookings: 25, utilization: 85 },
//             { slot: "8:00-10:00 AM", bookings: 18, utilization: 60 },
//             { slot: "10:00-12:00 PM", bookings: 22, utilization: 75 },
//             { slot: "12:00-2:00 PM", bookings: 15, utilization: 50 },
//             { slot: "2:00-4:00 PM", bookings: 28, utilization: 95 },
//             { slot: "4:00-6:00 PM", bookings: 32, utilization: 100 },
//             { slot: "6:00-8:00 PM", bookings: 30, utilization: 100 },
//             { slot: "8:00-10:00 PM", bookings: 26, utilization: 87 }
//           ]
//         });
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchAnalytics();
//   }, [selectedPeriod]);

//   if (isLoading) return <div className="flex justify-center h-64"><div className="animate-spin h-12 w-12 border-4 border-green-500 rounded-full"></div></div>;

//   const renderMetric = (title, value, growth, icon, color) => {
//     // map simple color keywords to safe Tailwind classes
//     const colorMap = {
//       green: { lightBg: "bg-green-100", icon: "text-green-500", value: "text-green-400" },
//       blue: { lightBg: "bg-blue-100", icon: "text-blue-500", value: "text-blue-400" },
//       purple: { lightBg: "bg-purple-100", icon: "text-purple-500", value: "text-purple-400" },
//       orange: { lightBg: "bg-orange-100", icon: "text-orange-500", value: "text-orange-400" },
//       default: { lightBg: "bg-gray-100", icon: "text-gray-500", value: "text-gray-400" }
//     };
//     const token = colorMap[color] || colorMap.default;

//     const containerCls = darkMode ? "p-4 rounded shadow bg-gray-800 border border-gray-700" : "p-4 rounded shadow bg-white border border-gray-200";
//     const titleCls = darkMode ? "text-sm text-gray-300" : "text-sm text-gray-600";
//     const valueCls = darkMode ? "text-2xl font-bold text-gray-100" : "text-2xl font-bold text-gray-900";
//     const growthIcon = growth >= 0 ? <TrendingUp className={`w-4 h-4 ${darkMode ? "text-green-400" : token.value}`} /> : <TrendingDown className={`w-4 h-4 ${darkMode ? "text-red-400" : "text-red-400"}`} />;
//     const growthCls = growth >= 0 ? `${darkMode ? "text-green-400" : "text-green-500"} ml-1` : "text-red-400 ml-1";

//     // badge background for light mode uses mapped lightBg, dark mode uses a subtle gray to keep contrast
//     const badgeCls = darkMode ? "p-2 rounded bg-gray-700" : `p-2 rounded ${token.lightBg}`;

//     return (
//       <div className={containerCls}>
//         <div className="flex justify-between items-center">
//           <div>
//             <p className={titleCls}>{title}</p>
//             <p className={valueCls}>{value}</p>
//             {growth !== undefined && (
//               <div className="flex items-center mt-1 text-sm">
//                 {growthIcon}
//                 <span className={growthCls}>{Math.abs(growth)}%</span>
//               </div>
//             )}
//           </div>
//           <div className={badgeCls}>
//             {React.cloneElement(icon, { className: `w-6 h-6 ${darkMode ? token.icon : token.icon}` })}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className={`${darkMode ? "bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-gray-100 min-h-screen p-6" : "bg-transparent text-gray-900 p-6"} space-y-6`}>
//       {/* Header */}
//       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
//         <div>
//           <h1 className={`text-2xl font-bold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Analytics dfgd Dashboard</h1>
//           <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Track your turf performance</p>
//         </div>
//         <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className={`px-4 py-2 border rounded ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}>
//           {periods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
//         </select>
//       </motion.div>

//       {/* Metrics */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         {renderMetric("Total Revenue", `₹${analytics.revenue?.thisMonth?.toLocaleString()}`, analytics.revenue?.growth, <DollarSign className="w-6 h-6 text-green-500" />, "green")}
//         {renderMetric("Total Bookings", analytics.bookings?.thisMonth, analytics.bookings?.growth, <Calendar className="w-6 h-6 text-blue-500" />, "blue")}
//         {renderMetric("Total Customers", analytics.customers?.total, undefined, <Users className="w-6 h-6 text-purple-500" />, "purple")}
//         {renderMetric("Avg Utilization", `${analytics.turfs?.utilizationRate}%`, undefined, <Activity className="w-6 h-6 text-orange-500" />, "orange")}
//       </div>

//       {/* Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Revenue Chart */}
//         <div className={`p-4 rounded shadow ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
//           <h3 className={`font-semibold mb-2 flex items-center ${darkMode ? "text-gray-100" : "text-gray-900"}`}><BarChart3 className="mr-2" /> Revenue & Bookings Trend</h3>
//           {chartData.revenueChart?.map((item, i) => (
//             <div key={i} className={`flex justify-between p-2 ${darkMode ? "bg-gray-700" : "bg-gray-50"} rounded mb-1`}>
//               <span className={darkMode ? "text-gray-100" : "text-gray-900"}>{item.name}</span>
//               <span className={darkMode ? "text-gray-100" : "text-gray-900"}>₹{item.revenue.toLocaleString()}</span>
//             </div>
//           ))}
//         </div>

//         {/* Turf Performance */}
//         <div className={`p-4 rounded shadow ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
//           <h3 className={`font-semibold mb-2 flex items-center ${darkMode ? "text-gray-100" : "text-gray-900"}`}><PieChart className="mr-2" /> Turf Performance</h3>
//           {chartData.turfPerformance?.map((turf, i) => (
//             <div key={i} className={`flex justify-between p-2 ${darkMode ? "bg-gray-700" : "bg-gray-50"} rounded mb-1`}>
//               <span className={darkMode ? "text-gray-100" : "text-gray-900"}>{turf.name}</span>
//               <span className={darkMode ? "text-gray-100" : "text-gray-900"}>₹{turf.revenue.toLocaleString()}</span>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Time Slot Analysis */}
//       <div className={`p-4 rounded shadow ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
//         <h3 className={`font-semibold mb-2 flex items-center ${darkMode ? "text-gray-100" : "text-gray-900"}`}><Clock className="mr-2" /> Time Slot Analysis</h3>
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
//           {chartData.timeSlotAnalysis?.map((slot, i) => (
//             <div key={i} className={`${darkMode ? "p-2 bg-gray-700 text-gray-100 rounded" : "p-2 bg-gray-50 rounded"}`}>
//               <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{slot.slot}</p>
//               <p className={`text-lg font-bold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{slot.bookings} bookings</p>
//               <div className="w-full bg-gray-200 h-2 rounded">
//                 <div className={`h-2 rounded-full ${slot.utilization >= 90 ? "bg-green-500" : slot.utilization >= 70 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${slot.utilization}%` }}></div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//       <div className={`p-6 rounded-xl shadow-lg ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
//         <h3 className={`font-semibold mb-2 flex items-center ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Quick Insights</h3>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
//             <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Most Popular Turf</h4>
//             <p className="text-sm text-blue-700 dark:text-blue-400">{analytics.turfs.mostBooked || "No data available"}</p>
//           </div>
//           <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
//             <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">Customer Retention</h4>
//             <p className="text-sm text-green-700 dark:text-green-400">{analytics.customers.returnRate}% return rate</p>
//           </div>
//           <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
//             <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-2">Peak Hours</h4>
//             <p className="text-sm text-purple-700 dark:text-purple-400">4:00 PM - 8:00 PM</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  IndianRupee,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Clock
} from "lucide-react";

import api from "../../../config/Api.jsx";
import toast from "react-hot-toast";
import { useOutletContext } from "react-router-dom";

// removed local Card wrapper — using plain divs instead

export default function TurfAdminAnalytics() {
  const { darkMode } = useOutletContext() || {};
  const [analytics, setAnalytics] = useState({
    revenue: {
      thisMonth: 0,
      lastMonth: 0,
      growth: 0
    },
    bookings: {
      thisMonth: 0,
      lastMonth: 0,
      growth: 0
    },
    customers: {
      total: 0,
      newThisMonth: 0,
      returnRate: 0
    },
    turfs: {
      totalTurfs: 0,
      mostBooked: null,
      utilizationRate: 0
    }
  });
  const [chartData, setChartData] = useState({
    revenueChart: [],
    bookingChart: [],
    turfPerformance: [],
    timeSlotAnalysis: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("thisMonth");
  const [notAuthorized, setNotAuthorized] = useState(false);

  const periods = [
    { value: "thisWeek", label: "This Week" },
    { value: "thisMonth", label: "This Month" },
    { value: "last3Months", label: "Last 3 Months" },
    { value: "thisYear", label: "This Year" }
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Try to compose analytics from available server endpoints
      const [revRes, bookingsRes, turfRes, dailyRes] = await Promise.allSettled([
        api.get('/api/analytics/total-revenue'),
        api.get('/api/analytics/total-bookings'),
        api.get('/api/analytics/turf-bookings'),
        api.get('/api/analytics/daily-revenue'),
      ]);

      const analyticsObj = {};
      const charts = {};

      // If any call was rejected with 403, user is not authorized to access these endpoints
      const any403 = [revRes, bookingsRes, turfRes, dailyRes].some(r => r.status === 'rejected' && r.reason?.response?.status === 403);
      if (any403) {
        setNotAuthorized(true);
        // Provide a limited/mock fallback for turf-admins instead of failing
        setAnalytics({
          revenue: { thisMonth: 0, lastMonth: 0, growth: 0 },
          bookings: { thisMonth: 0, lastMonth: 0, growth: 0 },
          customers: { total: 0, newThisMonth: 0, returnRate: 0 },
          turfs: { totalTurfs: 0, mostBooked: null, utilizationRate: 0 }
        });
        setChartData({
          revenueChart: [], turfPerformance: [], timeSlotAnalysis: []
        });
        return;
      }

      if (revRes.status === 'fulfilled') analyticsObj.revenue = { thisMonth: revRes.value.data.totalRevenue || 0, lastMonth: 0, growth: 0 };
      if (bookingsRes.status === 'fulfilled') analyticsObj.bookings = { thisMonth: bookingsRes.value.data.totalBookings || 0, lastMonth: 0, growth: 0 };
      if (turfRes.status === 'fulfilled') charts.turfPerformance = turfRes.value.data || [];
      if (dailyRes.status === 'fulfilled') charts.revenueChart = dailyRes.value.data || [];

      // If any critical piece missing, fall back to mock/demo data
      if (!analyticsObj.revenue || !analyticsObj.bookings) {
        console.warn('Incomplete analytics from server, falling back to mock data');
        setAnalytics({
          revenue: {
            thisMonth: 45000,
            lastMonth: 38000,
            growth: 18.4
          },
          bookings: {
            thisMonth: 156,
            lastMonth: 142,
            growth: 9.9
          },
          customers: {
            total: 87,
            newThisMonth: 23,
            returnRate: 68
          },
          turfs: {
            totalTurfs: 3,
            mostBooked: "Football Arena A",
            utilizationRate: 75
          }
        });
        setChartData({
          revenueChart: [
            { name: "Week 1", revenue: 8500, bookings: 32 },
            { name: "Week 2", revenue: 12300, bookings: 41 },
            { name: "Week 3", revenue: 15200, bookings: 48 },
            { name: "Week 4", revenue: 9000, bookings: 35 }
          ],
          turfPerformance: [
            { name: "Football Arena A", bookings: 65, revenue: 19500 },
            { name: "Cricket Ground B", bookings: 52, revenue: 15600 },
            { name: "Basketball Court C", bookings: 39, revenue: 9900 }
          ],
          timeSlotAnalysis: [
            { slot: "6:00-8:00 AM", bookings: 25, utilization: 85 },
            { slot: "8:00-10:00 AM", bookings: 18, utilization: 60 },
            { slot: "10:00-12:00 PM", bookings: 22, utilization: 75 },
            { slot: "12:00-2:00 PM", bookings: 15, utilization: 50 },
            { slot: "2:00-4:00 PM", bookings: 28, utilization: 95 },
            { slot: "4:00-6:00 PM", bookings: 32, utilization: 100 },
            { slot: "6:00-8:00 PM", bookings: 30, utilization: 100 },
            { slot: "8:00-10:00 PM", bookings: 26, utilization: 87 }
          ]
        });
      } else {
        setAnalytics(analyticsObj);
        setChartData(charts);
      }
      setChartData(charts);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      if (error.response?.status !== 401) {
        toast.error("Failed to fetch analytics data");
      }
      // Mock data for demo
      setAnalytics({
        revenue: {
          thisMonth: 45000,
          lastMonth: 38000,
          growth: 18.4
        },
        bookings: {
          thisMonth: 156,
          lastMonth: 142,
          growth: 9.9
        },
        customers: {
          total: 87,
          newThisMonth: 23,
          returnRate: 68
        },
        turfs: {
          totalTurfs: 3,
          mostBooked: "Football Arena A",
          utilizationRate: 75
        }
      });
      setChartData({
        revenueChart: [
          { name: "Week 1", revenue: 8500, bookings: 32 },
          { name: "Week 2", revenue: 12300, bookings: 41 },
          { name: "Week 3", revenue: 15200, bookings: 48 },
          { name: "Week 4", revenue: 9000, bookings: 35 }
        ],
        turfPerformance: [
          { name: "Football Arena A", bookings: 65, revenue: 19500 },
          { name: "Cricket Ground B", bookings: 52, revenue: 15600 },
          { name: "Basketball Court C", bookings: 39, revenue: 9900 }
        ],
        timeSlotAnalysis: [
          { slot: "6:00-8:00 AM", bookings: 25, utilization: 85 },
          { slot: "8:00-10:00 AM", bookings: 18, utilization: 60 },
          { slot: "10:00-12:00 PM", bookings: 22, utilization: 75 },
          { slot: "12:00-2:00 PM", bookings: 15, utilization: 50 },
          { slot: "2:00-4:00 PM", bookings: 28, utilization: 95 },
          { slot: "4:00-6:00 PM", bookings: 32, utilization: 100 },
          { slot: "6:00-8:00 PM", bookings: 30, utilization: 100 },
          { slot: "8:00-10:00 PM", bookings: 26, utilization: 87 }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track your turf performance and business insights
          </p>
          {notAuthorized && (
            <div className="mt-3 p-3 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm">
              System-wide analytics are available to Super Admins only. Showing limited data for your turf.
            </div>
          )}
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="mt-4 sm:mt-0 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {periods.map(period => (
            <option key={period.value} value={period.value}>{period.label}</option>
          ))}
        </select>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
  {/* Revenue Card */}
  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{analytics.revenue.thisMonth.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                {analytics.revenue.growth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ml-1 ${analytics.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(analytics.revenue.growth)}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
  </div>

  {/* Bookings Card */}
  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.bookings.thisMonth}</p>
              <div className="flex items-center mt-2">
                {analytics.bookings.growth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ml-1 ${analytics.bookings.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(analytics.bookings.growth)}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
  </div>

  {/* Customers Card */}
  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.customers.total}</p>
              <div className="flex items-center mt-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-600 ml-1">
                  {analytics.customers.newThisMonth} new
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">this period</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
  </div>

  {/* Utilization Card */}
  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Utilization</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.turfs.utilizationRate}%</p>
              <div className="flex items-center mt-2">
                <Target className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-600 ml-1">
                  {analytics.turfs.totalTurfs} turfs
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">active</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
  </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Bookings Trend */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue & Bookings Trend</h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {chartData.revenueChart && chartData.revenueChart.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.bookings} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">₹{item.revenue.toLocaleString()}</p>
                    <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(item.revenue / Math.max(...chartData.revenueChart.map(d => d.revenue))) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Turf Performance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Turf Performance</h3>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {chartData.turfPerformance && chartData.turfPerformance.map((turf, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-green-500' : 
                      index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{turf.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{turf.bookings} bookings</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">₹{turf.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Time Slot Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Time Slot Analysis</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {chartData.timeSlotAnalysis && chartData.timeSlotAnalysis.map((slot, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{slot.slot}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    slot.utilization >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    slot.utilization >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {slot.utilization}%
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{slot.bookings}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">bookings</p>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      slot.utilization >= 90 ? 'bg-green-500' :
                      slot.utilization >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${slot.utilization}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
  </div>
      </motion.div>

      {/* Quick Insights */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Most Popular Turf</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">{analytics.turfs.mostBooked || "No data available"}</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">Customer Retention</h4>
              <p className="text-sm text-green-700 dark:text-green-400">{analytics.customers.returnRate}% return rate</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-2">Peak Hours</h4>
              <p className="text-sm text-purple-700 dark:text-purple-400">4:00 PM - 8:00 PM</p>
            </div>
          </div>
  </div>
      </motion.div>
    </div>
  );
}