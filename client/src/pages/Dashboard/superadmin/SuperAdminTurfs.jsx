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
  const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='300'>
      <rect width='100%' height='100%' fill='#f3f4f6'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-family='Arial, Helvetica, sans-serif' font-size='28'>No Image</text>
    </svg>`
  );
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
  const rawTurfs = response?.turfs || [];
  const normalized = rawTurfs.map((t) => ({
    id: t.id || t._id || (t._id && t._id.toString()),
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
    images: t.images || [],
    createdAt: t.createdAt,
    lastBooking: t.lastBooking || null
  }));
  setTurfs(normalized);
  setTotalPages(response.pagination?.totalPages || response.pagination?.total || 1);
    } catch (error) {
      console.error("Error fetching turfs:", error);
      // Set mock data on error
      setTurfs([
        {
          id: 1,
          name: "Elite Sports Arena",
          location: "Sector 18, Gurgaon",
          category: "Football",
          status: "active",
          rating: 4.8,
          reviewsCount: 124,
          pricePerHour: 2500,
          amenities: ["Parking", "Changing Room", "Lighting"],
          owner: { name: "Rahul Sharma", email: "rahul@example.com" },
          totalBookings: 1250,
          revenue: 312500,
          images: ["turf1.jpg"],
          createdAt: "2024-01-15",
          lastBooking: "2025-01-03"
        },
        {
          id: 2,
          name: "Champions Ground",
          location: "CP, New Delhi",
          category: "Cricket",
          status: "pending",
          rating: 4.5,
          reviewsCount: 89,
          pricePerHour: 3000,
          amenities: ["Parking", "Cafeteria", "Equipment"],
          owner: { name: "Amit Kumar", email: "amit@example.com" },
          totalBookings: 890,
          revenue: 267000,
          images: ["turf2.jpg"],
          createdAt: "2024-02-20",
          lastBooking: "2025-01-02"
        }
      ]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await superAdminService.getTurfStats();
      const mapped = {
        total: response?.totalTurfs ?? response?.total ?? stats.total,
        active: response?.activeTurfs ?? response?.active ?? stats.active,
        pending: response?.pendingTurfs ?? response?.pending ?? stats.pending,
        blocked: response?.blockedTurfs ?? stats.blocked ?? 0,
        totalRevenue: response?.totalRevenue ?? stats.totalRevenue ?? 0,
        avgRating: response?.avgRating ?? stats.avgRating ?? 0,
        totalBookings: response?.totalBookings ?? stats.totalBookings ?? 0
      };
      setStats(mapped);
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Use mock data on error
      setStats({
        total: 127,
        active: 98,
        pending: 15,
        blocked: 14,
        totalRevenue: 12500000,
        avgRating: 4.3,
        totalBookings: 15600
      });
    }
  };

  const handleStatusUpdate = async (turfId, status, reason = '') => {
    try {
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
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Active' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      blocked: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Blocked' },
      maintenance: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, label: 'Maintenance' }
    };

    const safeStatus = typeof status === 'string' && status in statusConfig ? status : 'pending';
    const config = statusConfig[safeStatus];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const statCards = [
    {
      title: "Total Turfs",
      value: isNaN(stats.total) ? 0 : stats.total,
      change: "+15%",
      changeType: "increase",
      icon: Building,
      color: "blue",
      description: "Across all locations"
    },
    {
      title: "Active Turfs",
      value: isNaN(stats.active) ? 0 : stats.active,
      change: "+8%",
      changeType: "increase", 
      icon: CheckCircle,
      color: "green",
      description: "Currently operational"
    },
    {
      title: "Pending Approvals",
      value: isNaN(stats.pending) ? 0 : stats.pending,
      change: "-5",
      changeType: "decrease",
      icon: Clock,
      color: "yellow",
      description: "Awaiting approval"
    },
    {
      title: "Total Revenue",
      value: `₹${isNaN(stats.totalRevenue) ? 0 : (stats.totalRevenue / 100000).toFixed(1)}L`,
      change: "+22%",
      changeType: "increase",
  icon: IndianRupee,
      color: "purple",
      description: "Monthly earnings"
    }
  ];

  const categories = [
    "Football", "Cricket", "Basketball", "Tennis", "Badminton", "Hockey"
  ];

  if (loading && turfs.length === 0) {
    return (
      <div className="flex min-h-screen bg-gray-50">
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
      <div className="flex-1 lg:ml-80">
        <SuperAdminNavbar onMobileMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        
        <main className="p-4 lg:p-8 pb-4 pt-48 min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Turfs & Venues Management</h1>
              <p className="text-gray-600 mt-1">Manage all turfs, venues and their operations</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchTurfs}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                <span>Add New Turf</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          {/* Filters and Search */}
          <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search turfs..."
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
                  <option value="maintenance">Maintenance</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="createdAt">Newest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="rating">Highest Rated</option>
                  <option value="revenue">Top Revenue</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Bulk Import</span>
                </button>
              </div>
            </div>
          </div>

          {/* Turfs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {turfs.map((turf, index) => (
              <motion.div
                key={turf._id || turf.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden"
              >
                {/* Turf Image */}
                <div className="relative h-48 bg-gradient-to-r from-blue-400 to-purple-500">
                  {/* Turf Image */}
                  <img
                    src={
                      (Array.isArray(turf.images) && turf.images[0]) ? turf.images[0] : PLACEHOLDER
                    }
                    alt={turf.name}
                    onError={e => { e.target.onerror = null; e.target.src = PLACEHOLDER; }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
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
                      <span className="text-lg font-bold text-blue-600 flex items-center">
                        <span className="mr-1">₹</span>{turf.pricePerHour}/hr
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
                        {/* Rupee icon instead of DollarSign */}
                        <span className="text-xl text-green-600 font-bold mr-1">₹</span>
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
                      {!turf.isApproved && (
                        <button
                          onClick={() => handleStatusUpdate(turf._id || turf.id, 'approve')}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                        >
                          Approve
                        </button>
                      )}
                      {turf.isApproved && (
                        <button
                          onClick={() => handleStatusUpdate(turf._id || turf.id, 'block')}
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
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + Math.max(1, currentPage - 2);
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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