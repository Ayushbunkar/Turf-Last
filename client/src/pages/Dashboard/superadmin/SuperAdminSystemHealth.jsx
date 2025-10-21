import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
  Monitor,
  Clock,
  Zap,
  BarChart3,
  Shield,
  Globe
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
  Bar
} from 'recharts';
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminNavbar from './SuperAdminNavbar';
import superAdminService from '../../../services/superAdminService';
import toast from 'react-hot-toast';

const SuperAdminSystemHealth = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [systemMetrics, setSystemMetrics] = useState({
    memoryUsage: 0,
    perCore: [],
    historicalCpu: [],
    diskUsage: 0,
    networkLatency: 0,
    activeConnections: 0,
    uptime: 0,
    responseTime: 0
  });

  const [performanceData, setPerformanceData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchSystemHealth = async () => {
    try {
      const [metricsResponse, alertsResponse, servicesResponse, performanceResponse] = await Promise.all([
        superAdminService.getSystemMetrics(),
        superAdminService.getSystemAlerts(),
        superAdminService.getSystemServices(),
        superAdminService.getPerformanceHistory('1h')
      ]);

      // Patch: Use correct keys from backend response
      setSystemMetrics({
        memoryUsage: metricsResponse?.memoryUsage ?? 0,
        perCore: metricsResponse?.perCore ?? [],
        historicalCpu: metricsResponse?.historicalCpu ?? [],
        diskUsage: metricsResponse?.diskUsage ?? 0,
        networkLatency: metricsResponse?.networkLatency ?? 0,
        activeConnections: metricsResponse?.activeConnections ?? 0,
        uptime: metricsResponse?.uptime ?? 0,
        responseTime: metricsResponse?.responseTime ?? 0
      });
      setAlerts(alertsResponse || []);
      setServices(servicesResponse?.services || []);
      setPerformanceData(performanceResponse?.data || []);
    } catch (error) {
      console.error("Error fetching system health:", error);
      // Set mock data on error
      setSystemMetrics({
        serverLoad: 65,
        memoryUsage: 78,
        cpuUsage: 42,
        diskUsage: 55,
        networkLatency: 25,
        activeConnections: 1247,
        uptime: 99.8,
        responseTime: 150
      });

      setPerformanceData([
        { time: '00:00', cpu: 45, memory: 72, network: 30 },
        { time: '00:15', cpu: 52, memory: 75, network: 28 },
        { time: '00:30', cpu: 38, memory: 70, network: 32 },
        { time: '00:45', cpu: 42, memory: 78, network: 25 }
      ]);

      setAlerts([
        {
          id: 1,
          type: 'warning',
          title: 'High Memory Usage',
          message: 'Memory usage has exceeded 75% threshold',
          severity: 'medium',
          timestamp: '2025-01-04T10:30:00Z'
        },
        {
          id: 2,
          type: 'info',
          title: 'Database Backup Complete',
          message: 'Daily database backup completed successfully',
          severity: 'low',
          timestamp: '2025-01-04T09:15:00Z'
        }
      ]);

      setServices([
        { name: 'Database', status: 'healthy', uptime: 99.9, responseTime: 45 },
        { name: 'API Server', status: 'healthy', uptime: 99.8, responseTime: 120 },
        { name: 'File Storage', status: 'warning', uptime: 98.5, responseTime: 200 },
        { name: 'Payment Gateway', status: 'healthy', uptime: 99.9, responseTime: 85 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (value, thresholds = { good: 70, warning: 85 }) => {
    if (value < thresholds.good) return 'text-green-600';
    if (value < thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBg = (value, thresholds = { good: 70, warning: 85 }) => {
    if (value < thresholds.good) return 'bg-green-500';
    if (value < thresholds.warning) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getServiceStatusBadge = (status) => {
    const statusConfig = {
      healthy: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      warning: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      error: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      offline: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle }
    };
    
    const config = statusConfig[status] || statusConfig.offline;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const metricCards = [
    {
      title: "Memory Usage", 
      value: `${systemMetrics.memoryUsage ?? 0} MB`,
      icon: HardDrive,
      color: getStatusColor(systemMetrics.memoryUsage ?? 0),
      bgColor: getStatusBg(systemMetrics.memoryUsage ?? 0),
      description: "RAM consumption"
    },
    {
      title: "CPU Usage (Avg)",
      value: `${systemMetrics.perCore && systemMetrics.perCore.length > 0 ? (systemMetrics.perCore.reduce((sum, c) => sum + c.usage, 0) / systemMetrics.perCore.length).toFixed(1) : 0}%`,
      icon: Cpu,
      color: getStatusColor(systemMetrics.perCore && systemMetrics.perCore.length > 0 ? (systemMetrics.perCore.reduce((sum, c) => sum + c.usage, 0) / systemMetrics.perCore.length) : 0),
      bgColor: getStatusBg(systemMetrics.perCore && systemMetrics.perCore.length > 0 ? (systemMetrics.perCore.reduce((sum, c) => sum + c.usage, 0) / systemMetrics.perCore.length) : 0),
      description: "Avg processor utilization"
    },
    {
      title: "Network Latency",
      value: `${systemMetrics.networkLatency ?? 0} ms`,
      icon: Wifi,
      color: getStatusColor(systemMetrics.networkLatency ?? 0, { good: 50, warning: 100 }),
      bgColor: getStatusBg(systemMetrics.networkLatency ?? 0, { good: 50, warning: 100 }),
      description: "Response time"
    },
    {
      title: "Disk Usage",
      value: `${systemMetrics.diskUsage ?? 0} GB`,
      icon: HardDrive,
      color: getStatusColor(systemMetrics.diskUsage ?? 0),
      bgColor: getStatusBg(systemMetrics.diskUsage ?? 0),
      description: "Disk consumption"
    }
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SuperAdminSidebar />
        <div className="flex-1 ml-0 lg:ml-80">
          <SuperAdminNavbar />
          <main className="p-4 lg:p-8 pb-4 pt-48 min-h-screen">
            <div className="flex items-center justify-center h-96">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-lg text-gray-600">Loading system health...</span>
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
              <h1 className="text-3xl font-bold text-gray-900">System Health Monitor</h1>
              <p className="text-gray-600 mt-1">Monitor server performance and system status</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>Refresh every 10s</option>
                <option value={30}>Refresh every 30s</option>
                <option value={60}>Refresh every 1min</option>
                <option value={300}>Refresh every 5min</option>
              </select>
              <button
                onClick={fetchSystemHealth}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Now</span>
              </button>
              <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* System Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metricCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-gray-100">
                      <Icon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="text-right">
                      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${card.bgColor} transition-all duration-300`}
                          style={{ width: `${Math.min(100, parseInt(card.value))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold mb-1 ${card.color}`}>{card.value}</h3>
                    <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                    <p className="text-gray-500 text-xs mt-1">{card.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* System Performance Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">System Performance</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">CPU</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Memory</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Network</span>
                  </div>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value, name) => [`${value}%`, name.toUpperCase()]} />
                    <Line 
                      type="monotone" 
                      dataKey="cpu" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="memory" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="network" 
                      stroke="#F97316" 
                      strokeWidth={2}
                      dot={{ fill: '#F97316', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* System Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">System Statistics</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">System Uptime</span>
                  </div>
                  <span className="text-lg font-semibold text-green-600">{systemMetrics.uptime}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700">Active Connections</span>
                  </div>
                  <span className="text-lg font-semibold text-blue-600">{systemMetrics.activeConnections}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <span className="text-gray-700">Response Time</span>
                  </div>
                  <span className="text-lg font-semibold text-orange-600">{systemMetrics.responseTime}ms</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <HardDrive className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700">Disk Usage</span>
                  </div>
                  <span className="text-lg font-semibold text-purple-600">{systemMetrics.diskUsage}%</span>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">System Health</div>
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-600 font-medium">Excellent</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Services Status & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Services Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Service Status</h3>
                  <Monitor className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {services.map((service, index) => (
                    <motion.div
                      key={service.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Globe className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{service.name}</h4>
                          <div className="text-sm text-gray-600">
                            Uptime: {service.uptime}% • Response: {service.responseTime}ms
                          </div>
                        </div>
                      </div>
                      <div>
                        {getServiceStatusBadge(service.status)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* System Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
                  <AlertTriangle className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {alerts.length > 0 ? alerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg"
                    >
                      <div className={`p-2 rounded-full ${
                        alert.type === 'error' ? 'bg-red-100' :
                        alert.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        <AlertTriangle className={`w-4 h-4 ${
                          alert.type === 'error' ? 'text-red-500' :
                          alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-gray-600">No active alerts</p>
                      <p className="text-sm text-gray-500">All systems are running normally</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminSystemHealth;