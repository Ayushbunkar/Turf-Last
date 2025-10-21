import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Filter, Search, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import Sidebar from '../../../components/Sidebar/UserSidebar';
import api from '../../../config/Api.jsx';
import toast from 'react-hot-toast';

// ✅ Local Card component (no external import)
const Card = ({ children, className = '' }) => (
  <div className={`rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // ✅ Fetch bookings from updated backend API
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // api has an interceptor that adds the Authorization header from localStorage
      const response = await api.get('/api/bookings/my-bookings');
      const raw = Array.isArray(response.data) ? response.data : [];
      // normalize timeSlot for each booking so UI can render consistently
      const normalized = raw.map((b) => {
        // already present
        if (b.timeSlot) return b;
        // older API shape: single `slot` field
        if (b.slot) return { ...b, timeSlot: `${b.slot.startTime} - ${b.slot.endTime}` };
        // new shape: `slots` array (possibly multiple hours) -> join them
        if (Array.isArray(b.slots) && b.slots.length > 0) {
          const slotText = b.slots.map(s => `${s.startTime} - ${s.endTime}`).join(', ');
          return { ...b, timeSlot: slotText };
        }
        return { ...b, timeSlot: '' };
      });
      setBookings(normalized);
      setFetchError(null);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        // token expired or invalid - clear and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      setFetchError(error?.response?.data?.message || 'Failed to load bookings');
      toast.error('Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔎 Filter + Search logic
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.turf?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.turfName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // ❌ Cancel Booking
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    setCancelLoading(true);
    // Optimistic update: mark selected booking as cancelled locally immediately
    const originalBookings = bookings;
    setBookings((prev) => prev.map((b) => (b._id === selectedBooking._id ? { ...b, status: 'cancelled' } : b)));

    try {
      // Server expects PUT /api/bookings/:id/status with { status }
      const { data } = await api.put(`/api/bookings/${selectedBooking._id}/status`, { status: 'cancelled' });

      const updated = data?.booking;
      if (updated) setBookings((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));

      toast.success('Booking cancelled successfully');
      setShowCancelModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        // auth issue -> clear and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      // rollback optimistic update
      setBookings(originalBookings);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelLoading(false);
    }
  };

  const openCancelModal = (booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canCancelBooking = (booking) => {
    return booking.status === 'confirmed' || booking.status === 'pending';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Please log in to view your bookings</div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'dark' : ''} min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-gray-900 dark:to-gray-800`}>
      <div className="flex">
        <Sidebar user={user} onToggleDark={() => setDarkMode(!darkMode)} darkMode={darkMode} />
        <main className="flex-1 ml-0 lg:ml-64 p-4 lg:p-8 pt-48 pb-8 min-h-screen">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Bookings</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage your turf reservations and booking history</p>
            </div>

            {/* Search + Filter */}
            <Card className="p-6 bg-white dark:bg-gray-800 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by turf name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Booking Cards */}
            {fetchError ? (
              <Card className="p-8 text-center">
                <p className="text-red-600 mb-4">{fetchError}</p>
                <div className="flex justify-center gap-3">
                  <button onClick={fetchBookings} className="px-4 py-2 bg-green-600 text-white rounded">Retry</button>
                </div>
              </Card>
            ) : loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : filteredBookings.length > 0 ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="text-sm">Show:</label>
                    <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="px-2 py-1 border rounded">
                      <option value={6}>6</option>
                      <option value={9}>9</option>
                      <option value={12}>12</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-600">Page {page}</div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredBookings.slice((page - 1) * pageSize, page * pageSize).map((booking) => (
                  <motion.div
                    key={booking._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {booking.turf?.name || booking.turfName || 'Unknown Turf'}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="mr-2 h-4 w-4" />
                          {new Date(booking.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="mr-2 h-4 w-4" />
                          {booking.timeSlot}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <MapPin className="mr-2 h-4 w-4" />
                          {booking.turf?.location || 'Location not available'}
                        </div>
                      </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-center">
                        <div className="font-medium text-gray-900 dark:text-white">
                          ₹{booking.amount || booking.price}
                        </div>
                        <div className="flex space-x-2">
                          {canCancelBooking(booking) && (
                            <button
                              onClick={() => openCancelModal(booking)}
                              className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition"
                            >
                              Cancel
                            </button>
                          )}
                          <Link
                            to={`/booking/success?bookingId=${booking._id}`}
                            className="px-3 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition"
                          >
                            View Receipt
                          </Link>
                          <Link
                            to={`/turfs/${booking.turf?._id || booking.turfId}`}
                            className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition"
                          >
                            View Turf
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
                {/* Pagination controls */}
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-white border rounded disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    disabled={page * pageSize >= filteredBookings.length}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 bg-white border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <Card className="p-12 bg-white dark:bg-gray-800 text-center">
                <div className="text-gray-400 mb-4">
                  <Calendar className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No bookings found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : "You haven't made any bookings yet"}
                </p>
                <Link
                  to="/turfs"
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                >
                  Browse Turfs
                </Link>
              </Card>
            )}
          </motion.div>
        </main>
      </div>

      {/* ❗Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cancel Booking</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to cancel your booking for{' '}
              <strong>{selectedBooking?.turf?.name || selectedBooking?.turfName}</strong> on{' '}
              {new Date(selectedBooking?.date).toLocaleDateString()}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedBooking(null);
                }}
                disabled={cancelLoading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
