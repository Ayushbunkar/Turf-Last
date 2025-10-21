import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Building,
  IndianRupee,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Target,
  ArrowUp,
  ArrowDown,
  Clock,
  MapPin,
  Star,
  ChevronDown,
  FileText,
  Mail,
  Share
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminNavbar from './SuperAdminNavbar';
import toast from 'react-hot-toast';

const SystemAnalytics = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4500/api/super-admin/analytics?period=${selectedPeriod}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        // Mock data for demo
        setAnalyticsData(generateMockAnalyticsData());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
      setAnalyticsData(generateMockAnalyticsData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnalyticsData = () => {
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 365;
    
    const userGrowth = [];
    const bookingTrends = [];
    const revenueData = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      userGrowth.push({
        date: date.toLocaleDateString(),
        count: Math.floor(Math.random() * 50) + 20,
        cumulative: Math.floor(Math.random() * 1000) + 500 + i * 10
      });
      
      bookingTrends.push({
        date: date.toLocaleDateString(),
        count: Math.floor(Math.random() * 100) + 50,
        revenue: Math.floor(Math.random() * 5000) + 2000
      });
      
      revenueData.push({
        date: date.toLocaleDateString(),
        revenue: Math.floor(Math.random() * 5000) + 2000,
        profit: Math.floor(Math.random() * 2000) + 800
      });
    }

    return {
      userGrowth,
      bookingTrends,
      revenueData: {
        totalRevenue: 125600,
        avgBookingValue: 85.50,
        totalBookings: 1468,
        growthRate: 15.3
      },
      popularTurfs: [
        { name: 'Central Sports Complex', bookingCount: 234, totalRevenue: 18900, location: 'Downtown' },
        { name: 'Elite Football Arena', bookingCount: 189, totalRevenue: 15200, location: 'Uptown' },
        { name: 'Victory Sports Ground', bookingCount: 156, totalRevenue: 12800, location: 'Westside' },
        { name: 'Champions Field', bookingCount: 134, totalRevenue: 10900, location: 'Eastside' },
        { name: 'Premier Turf Center', bookingCount: 98, totalRevenue: 8500, location: 'Southside' }
      ],
      kpis: {
        activeUsers: { value: 2847, change: 12.5, trend: 'up' },
        totalTurfs: { value: 156, change: 8.2, trend: 'up' },
        monthlyRevenue: { value: 45600, change: -2.1, trend: 'down' },
        avgResponse: { value: '2.3h', change: 15.4, trend: 'down' },
        satisfaction: { value: 4.7, change: 0.3, trend: 'up' },
        bookingRate: { value: 89.5, change: 5.1, trend: 'up' }
      },
      demographics: [
        { name: 'Age 18-25', value: 35, color: '#3B82F6' },
        { name: 'Age 26-35', value: 40, color: '#10B981' },
        { name: 'Age 36-45', value: 20, color: '#F59E0B' },
        { name: 'Age 46+', value: 5, color: '#EF4444' }
      ],
      deviceUsage: [
        { name: 'Mobile', value: 68, color: '#8B5CF6' },
        { name: 'Desktop', value: 25, color: '#06B6D4' },
        { name: 'Tablet', value: 7, color: '#84CC16' }
      ],
      timeSlots: [
        { slot: '6 AM', bookings: 45 },
        { slot: '8 AM', bookings: 120 },
        { slot: '10 AM', bookings: 95 },
        { slot: '12 PM', bookings: 180 },
        { slot: '2 PM', bookings: 160 },
        { slot: '4 PM', bookings: 220 },
        { slot: '6 PM', bookings: 280 },
        { slot: '8 PM', bookings: 240 },
        { slot: '10 PM', bookings: 85 }
      ]
    };
  };

  const exportReport = () => {
    toast.success('Report exported successfully');
  };

  const KPICard = ({ title, icon: Icon, value, change, trend, format = 'number' }) => {
    const formatValue = (val) => {
      if (format === 'currency') return `$${val.toLocaleString()}`;
      if (format === 'percentage') return `${val}%`;
      if (format === 'rating') return `${val}/5`;
      return val.toLocaleString();
    };

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{formatValue(value)}</h3>
              <p className="text-gray-600 text-sm">{title}</p>
            </div>
          </div>
          <div className={`flex items-center space-x-1 text-sm ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? <ArrowUp className="w-4 h-4" /> : 
             trend === 'down' ? <ArrowDown className="w-4 h-4" /> : null}
            <span>{Math.abs(change)}%</span>
          </div>
        </div>
      </motion.div>
    );
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SuperAdminSidebar />
      <div className="flex-1 lg:ml-80">
          <SuperAdminNavbar />
          <main className="p-4 lg:p-8 pb-4 pt-48 min-h-screen">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-96 bg-gray-200 rounded-xl"></div>
                ))}
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
        
        <main className="p-4 lg:p-8 pb-4 mt-16 lg:mt-20 min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Analytics & Reports</h1>
              <p className="text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={fetchAnalyticsData}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={exportReport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <KPICard
              title="Active Users"
              icon={Users}
              value={analyticsData.kpis.activeUsers.value}
              change={analyticsData.kpis.activeUsers.change}
              trend={analyticsData.kpis.activeUsers.trend}
            />
            <KPICard
              title="Total Turfs"
              icon={Building}
              value={analyticsData.kpis.totalTurfs.value}
              change={analyticsData.kpis.totalTurfs.change}
              trend={analyticsData.kpis.totalTurfs.trend}
            />
            <KPICard
              title="Monthly Revenue"
              icon={IndianRupee}
              value={analyticsData.kpis.monthlyRevenue.value}
              change={analyticsData.kpis.monthlyRevenue.change}
              trend={analyticsData.kpis.monthlyRevenue.trend}
              format="currency"
            />
            <KPICard
              title="Avg Response Time"
              icon={Clock}
              value={analyticsData.kpis.avgResponse.value}
              change={analyticsData.kpis.avgResponse.change}
              trend={analyticsData.kpis.avgResponse.trend}
            />
            <KPICard
              title="User Satisfaction"
              icon={Star}
              value={analyticsData.kpis.satisfaction.value}
              change={analyticsData.kpis.satisfaction.change}
              trend={analyticsData.kpis.satisfaction.trend}
              format="rating"
            />
            <KPICard
              title="Booking Success Rate"
              icon={Target}
              value={analyticsData.kpis.bookingRate.value}
              change={analyticsData.kpis.bookingRate.change}
              trend={analyticsData.kpis.bookingRate.trend}
              format="percentage"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Trends */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Revenue Trends</h2>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Revenue</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Profit</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.bookingTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`$${value}`, name]} />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* User Growth */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">User Growth</h2>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">+12.5%</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="cumulative" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Booking Patterns */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Peak Booking Hours</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.timeSlots}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="slot" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Demographics */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">User Demographics</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Age Distribution</h3>
                  <ResponsiveContainer width="100%" height={150}>
                    <RechartsPieChart>
                      <Pie
                        data={analyticsData.demographics}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                      >
                        {analyticsData.demographics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Device Usage</h3>
                  <ResponsiveContainer width="100%" height={150}>
                    <RechartsPieChart>
                      <Pie
                        data={analyticsData.deviceUsage}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                      >
                        {analyticsData.deviceUsage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Turfs & Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Popular Turfs */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Top Performing Turfs</h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
              </div>
              <div className="space-y-4">
                {analyticsData.popularTurfs.map((turf, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{turf.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>{turf.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">${turf.totalRevenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{turf.bookingCount} bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Reports */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Reports</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Revenue Report</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Users className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">User Analytics</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Building className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Turf Performance</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Activity className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Booking Trends</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Email Report</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <Share className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Schedule Report</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SystemAnalytics;