import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  IndianRupee,
  Filter,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Building2,
  Phone,
  Mail,
  CreditCard,
  Star,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminNavbar from './SuperAdminNavbar';
import toast from 'react-hot-toast';
import superAdminService from '../../../services/superAdminService';

const SuperAdminBookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    confirmed: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    totalRevenue: 0
  });

  const bookingsPerPage = 10;

  useEffect(() => {
    fetchBookings();
    fetchStatistics();
  }, [currentPage, searchTerm, statusFilter, dateRange]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const filters = {
        page: currentPage,
        limit: bookingsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateRange !== 'all' && { dateRange })
      };

      const data = await superAdminService.getAllBookings(filters);
      setBookings(data.bookings);
      setTotalPages(data.pagination.totalPages);
      setTotalBookings(data.pagination.totalBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
      // Fallback to mock data for demo
      const mockBookings = [
        {
          _id: 'BK001',
          user: {
            name: 'Rahul Sharma',
            email: 'rahul.sharma@email.com',
            phone: '+91 9876543210'
          },
          turf: {
            name: 'Elite Sports Arena',
            location: 'Andheri West, Mumbai',
            admin: 'Amit Patel'
          },
          bookingDate: '2024-01-20',
          timeSlot: '06:00 - 07:00',
          duration: 1,
          amount: 1200,
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentMethod: 'UPI',
          createdAt: '2024-01-18T10:30:00Z',
          sport: 'Football',
          players: 12
        }
      ];
      setBookings(mockBookings);
      setTotalPages(1);
      setTotalBookings(mockBookings.length);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await superAdminService.getBookingStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching booking statistics:', error);
    }
  };

  const handleBookingStatusUpdate = async (bookingId, newStatus) => {
    try {
      await superAdminService.updateBookingStatus(bookingId, { status: newStatus });
      toast.success(`Booking ${newStatus} successfully`);
      fetchBookings();
      fetchStatistics();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBookings(), fetchStatistics()]);
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  const handleExportCSV = async () => {
    try {
      await superAdminService.exportBookingsCSV();
      toast.success('CSV export completed');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-3 h-3" />;
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      case 'pending': return <AlertTriangle className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'refunded': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex h-auto  bg-gray-50">
      <SuperAdminSidebar />
      
      <div className="flex-1 lg:ml-80">
        <SuperAdminNavbar />
        
        <main className="p-4 lg:p-8 pb-4 pt-40 lg:pt-40 min-h-screen">
          <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Monitor and manage all turf bookings</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-green-600 text-white px-3 sm:px-4 py-2 text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 sm:px-4 py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">Total Bookings</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{(statistics.total || 0).toLocaleString()}</p>
            </div>
            <Calendar className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">Confirmed</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{(statistics.confirmed || 0).toLocaleString()}</p>
            </div>
            <CheckCircle className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{(statistics.completed || 0).toLocaleString()}</p>
            </div>
            <Star className="w-6 sm:w-8 h-6 sm:h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">Pending</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600">{(statistics.pending || 0).toLocaleString()}</p>
            </div>
            <AlertTriangle className="w-6 sm:w-8 h-6 sm:h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">Cancelled</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">{(statistics.cancelled || 0).toLocaleString()}</p>
            </div>
            <XCircle className="w-6 sm:w-8 h-6 sm:h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">Revenue</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">₹{(statistics.totalRevenue / 1000).toFixed(0)}K</p>
            </div>
            <IndianRupee className="w-6 sm:w-8 h-6 sm:h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0 gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 flex-1">
            <div className="relative flex-1 sm:flex-initial sm:min-w-[200px]">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turf Details</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Calendar className="w-12 h-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                      <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {bookings.map((booking) => (
                    <motion.tr
                      key={booking._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{booking._id}</div>
                          <div className="text-sm text-gray-500">
                            {formatDate(booking.createdAt)}
                          </div>
                          <div className="text-xs text-blue-600">{booking.sport || 'Football'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              {getUserInitials(booking.user.name)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{booking.user.name}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {booking.user.email}
                            </div>
                            {booking.user.phone && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {booking.user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                            {booking.turf.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {booking.turf.location}
                          </div>
                          {booking.turf.admin && (
                            <div className="text-xs text-gray-500">
                              Admin: {booking.turf.admin}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {new Date(booking.bookingDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {booking.timeSlot}
                          </div>
                          <div className="text-xs text-gray-500">
                            {booking.duration}h • {booking.players || 10} players
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            <IndianRupee className="w-4 h-4 mr-1 text-green-600" />
                            ₹{booking.amount?.toLocaleString() || '0'}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <CreditCard className="w-3 h-3 mr-1" />
                            {booking.paymentMethod}
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                            {booking.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1">{booking.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowBookingModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleBookingStatusUpdate(booking._id, 'confirmed')}
                                className="text-green-600 hover:text-green-900 transition-colors"
                                title="Confirm Booking"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleBookingStatusUpdate(booking._id, 'cancelled')}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Cancel Booking"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-xl">
          <div className="text-xs sm:text-sm text-gray-700">
            Showing {((currentPage - 1) * bookingsPerPage) + 1} to {Math.min(currentPage * bookingsPerPage, totalBookings)} of {totalBookings} bookings
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="hidden sm:flex items-center space-x-2">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + Math.max(1, currentPage - 2);
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <div className="sm:hidden">
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                {currentPage} / {totalPages}
              </span>
            </div>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Booking Details Modal */}
    <AnimatePresence>
      {showBookingModal && selectedBooking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white rounded-xl p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Booking Details</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Booking Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">ID:</span> {selectedBooking._id}</p>
                    <p><span className="font-medium">Date:</span> {new Date(selectedBooking.bookingDate).toLocaleDateString()}</p>
                    <p><span className="font-medium">Time:</span> {selectedBooking.timeSlot}</p>
                    <p><span className="font-medium">Duration:</span> {selectedBooking.duration} hour(s)</p>
                    <p><span className="font-medium">Sport:</span> {selectedBooking.sport || 'Football'}</p>
                    <p><span className="font-medium">Players:</span> {selectedBooking.players || 10}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Amount:</span> ₹{selectedBooking.amount?.toLocaleString() || '0'}</p>
                    <p><span className="font-medium">Method:</span> {selectedBooking.paymentMethod}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}>
                        {selectedBooking.paymentStatus}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminBookingManagement;