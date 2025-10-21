import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  MapPin,
  Star,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  IndianRupee,
  Calendar,
  Camera,
  Upload,
  Download,
  RefreshCw,
  Activity,
  TrendingUp,
  Award,
  PhoneCall,
  Mail,
  Shield
} from "lucide-react";
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminNavbar from './SuperAdminNavbar';
import superAdminService from '../../../services/superAdminService';
import toast from 'react-hot-toast';

const SuperAdminTurfs = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTurf, setSelectedTurf] = useState(null);
  
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    blocked: 0,
    totalRevenue: 0,
    avgRating: 0,
    totalBookings: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [prevStats, setPrevStats] = useState(null);

  useEffect(() => {
    fetchTurfs();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter, categoryFilter, sortBy]);

  const fetchTurfs = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        sortBy,
        sortOrder: 'desc'
      };

      const response = await superAdminService.getAllTurfs(params);
      // Debug: log response to verify fields
      console.log('Turfs API response:', response);
      const rawTurfs = response?.turfs || [];
      // Normalize backend shape to what the UI expects
      const normalized = rawTurfs.map((t) => ({
        id: t.id || t._id || t._id?.toString(),
        name: t.name || '',
        location: t.location || t.address || (t.admin && t.admin.location) || '',
        category: t.category || t.sport || 'general',
        pricePerHour: t.pricePerHour ?? t.price ?? 0,
        status: t.status || (t.isApproved ? 'active' : 'pending') || 'pending',
        rating: t.rating ?? 0,
        totalBookings: t.totalBookings ?? t.bookingsCount ?? 0,
        revenue: t.revenue ?? t.totalRevenue ?? 0,
        owner: t.owner || (t.admin ? { name: t.admin.name, email: t.admin.email, phone: t.admin.phone } : {}),
        amenities: t.amenities || [],
        createdAt: t.createdAt,
        lastBooking: t.lastBooking || null
      }));

      setTurfs(normalized);
      setTotalPages(response.pagination?.totalPages || response.pagination?.total || 1);
    } catch (error) {
      console.error("Error fetching turfs:", error);
      setTurfs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (opts = { retryOnFail: true }) => {
    setStatsLoading(true);
    try {
      const response = await superAdminService.getTurfStats();
      // Map backend stats shape to UI expected keys
      const mapped = {
        total: response?.totalTurfs ?? response?.total ?? 0,
        active: response?.activeTurfs ?? response?.active ?? 0,
        pending: response?.pendingTurfs ?? response?.pending ?? 0,
        blocked: response?.blockedTurfs ?? response?.blocked ?? 0,
        totalRevenue: response?.totalRevenue ?? 0,
        avgRating: response?.avgRating ?? 0,
        totalBookings: response?.totalBookings ?? 0
      };
      // keep previous snapshot for change calculation
      setPrevStats((prev) => (prev === null ? { ...stats } : { ...stats }));
      setStats(mapped);
    } catch (error) {
      console.error("Error fetching stats:", error);
      // On error: set safe zeroed stats and optionally retry once after a delay
      setStats({
        total: 0,
        active: 0,
        pending: 0,
        blocked: 0,
        totalRevenue: 0,
        avgRating: 0,
        totalBookings: 0
      });

      if (opts.retryOnFail) {
        // retry once after 5 seconds to attempt getting real stats
        setTimeout(() => fetchStats({ retryOnFail: false }), 5000);
      }
    }
    finally {
      setStatsLoading(false);
    }
  };

  const handleStatusUpdate = async (turfId, status, reason = '') => {
    try {
      // Service expects action names: 'approve'|'block'
      const action = status === 'active' ? 'approve' : status === 'blocked' ? 'block' : status;
      await superAdminService.updateTurfStatus(turfId, action, reason);
      toast.success(`Turf status updated to ${status}`);
      fetchTurfs();
      fetchStats();
    } catch (error) {
      toast.error("Failed to update turf status");
    }
  };

  const handleDeleteTurf = async () => {
    try {
      await superAdminService.deleteTurf(selectedTurf.id);
      toast.success("Turf deleted successfully");
      setShowDeleteModal(false);
      setSelectedTurf(null);
      fetchTurfs();
      fetchStats();
    } catch (error) {
      toast.error("Failed to delete turf");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      blocked: { color: 'bg-red-100 text-red-800', icon: XCircle },
      maintenance: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // compute dynamic change and color based on previous snapshot
  const computeChange = (current, previous) => {
    if (previous == null) return { change: '—', changeType: 'neutral' };
    const diff = current - previous;
    if (previous === 0) {
      if (diff === 0) return { change: '0%', changeType: 'neutral' };
      return { change: (diff > 0 ? '+100%' : '-100%'), changeType: diff > 0 ? 'increase' : 'decrease' };
    }
    const percent = Math.round((diff / Math.abs(previous)) * 100);
    if (diff > 0) return { change: `+${percent}%`, changeType: 'increase' };
    if (diff < 0) return { change: `${percent}%`, changeType: 'decrease' };
    return { change: '0%', changeType: 'neutral' };
  };

  const statCards = [
    (() => {
      const { change, changeType } = computeChange(stats.total, prevStats?.total);
      return {
        title: 'Total Turfs',
        value: stats.total,
        change,
        changeType,
        icon: Building,
        color: 'blue',
        description: 'Across all locations'
      };
    })(),
    (() => {
      const { change, changeType } = computeChange(stats.active, prevStats?.active);
      return {
        title: 'Active Turfs',
        value: stats.active,
        change,
        changeType,
        icon: CheckCircle,
        color: 'green',
        description: 'Currently operational'
      };
    })(),
    (() => {
      const { change, changeType } = computeChange(stats.pending, prevStats?.pending);
      return {
        title: 'Pending Approvals',
        value: stats.pending,
        change,
        changeType,
        icon: Clock,
        color: 'yellow',
        description: 'Awaiting approval'
      };
    })(),
    (() => {
      const { change, changeType } = computeChange(stats.totalRevenue, prevStats?.totalRevenue);
      return {
        title: 'Total Revenue',
        value: `₹${(stats.totalRevenue / 100000).toFixed(1)}L`,
        numericValue: stats.totalRevenue,
        change,
        changeType,
  icon: IndianRupee,
        color: 'purple',
        description: 'Monthly earnings'
      };
    })()
  ];

  const categories = [
    "Football", "Cricket", "Basketball", "Tennis", "Badminton", "Hockey"
  ];

  if (loading && turfs.length === 0) {
    return (
      <div className="flex   min-h-screen bg-gray-50">
        <SuperAdminSidebar />
        <div className="flex-1 lg:ml-80">
          <SuperAdminNavbar />
          <main className="p-4 lg:p-8 pb-4 pt-32 lg:pt-40 min-h-screen">
            <div className="flex items-center justify-center h-96">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-lg text-gray-600">Loading turfs...</span>
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
      <div className="flex-1  lg:ml-80">
        <SuperAdminNavbar onMobileMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        
        <main className="p-4 lg:p-8 pb-4 pt-48 lg:pt-40 min-h-screen">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Turfs & Venues Management</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage all turfs, venues and their operations</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  fetchTurfs();
                  fetchStats();
                }}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button className="flex items-center space-x-2 bg-blue-600 text-white px-3 sm:px-4 py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                <span>Add Turf</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {statCards.map((card, index) => {
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
                    {(() => {
                      const mapping = {
                        blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
                        green: { bg: 'bg-green-100', icon: 'text-green-600' },
                        yellow: { bg: 'bg-yellow-100', icon: 'text-yellow-600' },
                        purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
                        default: { bg: 'bg-gray-100', icon: 'text-gray-600' }
                      };
                      const token = mapping[card.color] || mapping.default;
                      return (
                        <div className={`${token.bg} p-3 rounded-lg ${token.icon}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                      );
                    })()}
                    {statsLoading ? (
                      <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                    ) : (
                      <span className={`text-sm font-medium ${
                        card.changeType === 'increase'
                          ? 'text-green-600'
                          : card.changeType === 'decrease'
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        {card.change}
                      </span>
                    )}
                  </div>
                  <div>
                    {statsLoading ? (
                      <div className="h-8 w-24 bg-gray-100 rounded animate-pulse mb-2" />
                    ) : (
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
                    )}
                    <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                    <p className="text-gray-500 text-xs mt-1">{card.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Filters and Search */}
          <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1">
                <div className="relative w-full sm:w-auto sm:min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search turfs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="blocked">Blocked</option>
                  <option value="maintenance">Maintenance</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Sports</option>
                  {categories.map(category => (
                    <option key={category} value={category.toLowerCase()}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="createdAt">Newest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="rating">Highest Rated</option>
                  <option value="revenue">Top Revenue</option>
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Import</span>
                </button>
              </div>
            </div>
          </div>

          {/* Turfs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {turfs.map((turf, index) => (
              <motion.div
                key={turf.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden"
              >
                {/* Turf Image */}
                <div className="relative h-48 bg-gradient-to-r from-blue-400 to-purple-500">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-white opacity-50" />
                  </div>
                  <div className="absolute top-4 left-4">
                    {getStatusBadge(turf.status)}
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center space-x-1 bg-white bg-opacity-90 rounded-full px-2 py-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{turf.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Turf Details */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{turf.name}</h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">{turf.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{turf.category}</span>
                      <span className="text-lg font-bold text-blue-600">
                        ₹{turf.pricePerHour}/hr
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Calendar className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {turf.totalBookings || 0}
                      </div>
                      <div className="text-xs text-gray-500">Bookings</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <IndianRupee className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        ₹{((turf.revenue || 0) / 1000).toFixed(0)}k
                      </div>
                      <div className="text-xs text-gray-500">Revenue</div>
                    </div>
                  </div>

                  {/* Owner Info */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Shield className="w-4 h-4 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-900">Owner</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center mb-1">
                        <Users className="w-3 h-3 mr-2" />
                        {turf.owner?.name || 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-3 h-3 mr-2" />
                        {turf.owner?.email || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {(turf.amenities || []).slice(0, 3).map((amenity, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                      {(turf.amenities || []).length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{(turf.amenities || []).length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTurf(turf);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Edit Turf"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedTurf(turf);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Turf"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      {turf.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(turf.id, 'active')}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                        >
                          Approve
                        </button>
                      )}
                      
                      {turf.status === 'active' && (
                        <button
                          onClick={() => handleStatusUpdate(turf.id, 'blocked')}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700"
                        >
                          Block
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 sm:px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + Math.max(1, currentPage - 2);
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 sm:px-4 py-2 text-sm rounded-lg ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 sm:px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Turf Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedTurf && (
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
              className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">{selectedTurf.name}</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{selectedTurf.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{selectedTurf.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price/Hour:</span>
                        <span className="font-medium">₹{selectedTurf.pricePerHour}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        {getStatusBadge(selectedTurf.status)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Bookings:</span>
                        <span className="font-medium">{selectedTurf.totalBookings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Revenue:</span>
                        <span className="font-medium">₹{selectedTurf.revenue?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rating:</span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          <span className="font-medium">{selectedTurf.rating}</span>
                          <span className="text-gray-500 ml-1">({selectedTurf.reviewsCount} reviews)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Owner & Contact */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Owner Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedTurf.owner?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedTurf.owner?.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedTurf.owner?.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedTurf.amenities || []).map((amenity, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Activity</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">
                          {new Date(selectedTurf.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Booking:</span>
                        <span className="font-medium">{selectedTurf.lastBooking || 'Never'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Edit Turf
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
                <h3 className="text-lg font-semibold text-gray-900">Delete Turf</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{selectedTurf?.name}"? This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTurf}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdminTurfs;