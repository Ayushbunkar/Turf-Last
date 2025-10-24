import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  CreditCard,
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
  Star,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSocket } from '../../../context/SocketContext';
import superAdminService from "../../../services/superAdminService";
import SuperAdminPageTemplate from "./SuperAdminPageTemplate";

const SuperAdminBookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  // Default to 'all' so superadmin sees all bookings on page load
  const [dateRange, setDateRange] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookings: 0,
  });
  const bookingsPerPage = 10;

  useEffect(() => {
    fetchAll();
  }, [pagination.currentPage, searchTerm, statusFilter, dateRange]);

  const fetchAll = async () => {
    await Promise.all([fetchBookings(), fetchStatistics()]);
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const filters = {
        page: pagination.currentPage,
        limit: bookingsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(dateRange !== "all" && { dateRange }),
      };
      const data = await superAdminService.getAllBookings(filters);
      // DEBUG: log the raw response for troubleshooting
      if (typeof window !== 'undefined' && window.console) {
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG) console.debug('DEBUG_BOOKINGS_RESPONSE', data);
      }
      setBookings(data.bookings);
      setPagination({
        currentPage: pagination.currentPage,
        totalPages: data.pagination.totalPages,
        totalBookings: data.pagination.totalBookings,
      });
    } catch {
      toast.error("Failed to fetch bookings");
      setBookings([
        {
          _id: "BK001",
          user: { name: "Rahul Sharma", email: "rahul.sharma@email.com", phone: "+91 9876543210" },
          turf: { name: "Elite Sports Arena", location: "Andheri West, Mumbai", admin: "Amit Patel" },
          bookingDate: "2024-01-20",
          timeSlot: "06:00 - 07:00",
          duration: 1,
          amount: 1200,
          status: "confirmed",
          paymentStatus: "paid",
          paymentMethod: "UPI",
          createdAt: "2024-01-18T10:30:00Z",
          sport: "Football",
          players: 12,
        },
      ]);
      setPagination({ currentPage: 1, totalPages: 1, totalBookings: 1 });
    } finally {
      setLoading(false);
    }
  };

  // Real-time socket updates (refresh when booking created/updated)
  const { socket } = useSocket() || {};
  useEffect(() => {
    if (!socket) return;
    const onCreated = (data) => {
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG) console.debug('socket bookingCreated', data);
      fetchAll();
    };
    const onUpdated = (data) => {
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG) console.debug('socket bookingUpdated', data);
      fetchAll();
    };
    socket.on('bookingCreated', onCreated);
    socket.on('bookingUpdated', onUpdated);
    // Also refresh statistics on booking changes
    const onStatsRefresh = () => fetchStatistics();
    socket.on('bookingCreated', onStatsRefresh);
    socket.on('bookingUpdated', onStatsRefresh);
    return () => {
      socket.off('bookingCreated', onCreated);
      socket.off('bookingUpdated', onUpdated);
      socket.off('bookingCreated', onStatsRefresh);
      socket.off('bookingUpdated', onStatsRefresh);
    };
  }, [socket]);

  const fetchStatistics = async () => {
    try {
      setStatistics(await superAdminService.getBookingStatistics());
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  const handleBookingStatusUpdate = async (id, status) => {
    try {
      await superAdminService.updateBookingStatus(id, { status });
      toast.success(`Booking ${status} successfully`);
      fetchAll();
    } catch {
      toast.error("Failed to update booking status");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
    toast.success("Data refreshed successfully");
  };

  const handleExportCSV = async () => {
    try {
      // Ask backend for bookings for superadmin; request a large limit to capture all
      const params = { page: 1, limit: 10000 };
      const data = await superAdminService.getAllBookings(params);
      const bookings = Array.isArray(data) ? data : (data.bookings || []);
      if (!bookings || bookings.length === 0) {
        toast('No bookings to export');
        return;
      }

      const headers = [
        'BookingID', 'UserName', 'UserEmail', 'UserPhone', 'TurfName', 'TurfLocation',
        'BookingDate', 'TimeSlot', 'Duration', 'Amount', 'Status', 'PaymentStatus', 'PaymentMethod'
      ];

      const rows = bookings.map((b) => {
        const userName = b.user?.name || '';
        const userEmail = b.user?.email || '';
        const userPhone = b.user?.phone || '';
        const turfName = (b.turf && (typeof b.turf === 'string' ? b.turf : b.turf.name)) || b.turfName || '';
        const turfLocation = b.turf?.location || '';
        const bookingDate = b.bookingDate || b.date || '';
        const timeSlot = b.timeSlot || (b.slot ? `${b.slot.startTime} - ${b.slot.endTime}` : (Array.isArray(b.slots) && b.slots.length ? `${b.slots[0].startTime} - ${b.slots[0].endTime}` : ''));
        const duration = b.duration || (Array.isArray(b.slots) ? b.slots.length : 1);
        const amount = b.amount || b.price || 0;
        const status = b.status || '';
        const paymentStatus = b.paymentStatus || b.payment?.status || '';
        const paymentMethod = b.paymentMethod || b.payment?.method || '';

        return headers.map((h) => {
          switch (h) {
            case 'BookingID': return `"${String(b._id ?? '')}"`;
            case 'UserName': return `"${String(userName).replace(/"/g, '""')}"`;
            case 'UserEmail': return `"${String(userEmail).replace(/"/g, '""')}"`;
            case 'UserPhone': return `"${String(userPhone).replace(/"/g, '""')}"`;
            case 'TurfName': return `"${String(turfName).replace(/"/g, '""')}"`;
            case 'TurfLocation': return `"${String(turfLocation).replace(/"/g, '""')}"`;
            case 'BookingDate': return `"${String(bookingDate).replace(/"/g, '""')}"`;
            case 'TimeSlot': return `"${String(timeSlot).replace(/"/g, '""')}"`;
            case 'Duration': return `"${String(duration).replace(/"/g, '""')}"`;
            case 'Amount': return `"${String(amount).replace(/"/g, '""')}"`;
            case 'Status': return `"${String(status).replace(/"/g, '""')}"`;
            case 'PaymentStatus': return `"${String(paymentStatus).replace(/"/g, '""')}"`;
            case 'PaymentMethod': return `"${String(paymentMethod).replace(/"/g, '""')}"`;
            default: return '""';
          }
        }).join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      if (typeof window !== 'undefined') {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('download', `bookings_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(a);
        a.click();
        a.parentNode.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      toast.success('CSV exported');
    } catch (e) {
      console.error('Export failed', e);
      toast.error('Export failed');
    }
  };

  const statusColor = {
    confirmed: "text-blue-600 bg-blue-100",
    completed: "text-green-600 bg-green-100",
    pending: "text-yellow-600 bg-yellow-100",
    cancelled: "text-red-600 bg-red-100",
  };
  const paymentColor = {
    paid: "text-green-600 bg-green-100",
    pending: "text-yellow-600 bg-yellow-100",
    refunded: "text-blue-600 bg-blue-100",
    failed: "text-red-600 bg-red-100",
  };
  const statusIcon = {
    confirmed: <CheckCircle className="w-3 h-3" />,
    completed: <CheckCircle className="w-3 h-3" />,
    pending: <AlertTriangle className="w-3 h-3" />,
    cancelled: <XCircle className="w-3 h-3" />,
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const initials = (name) => name?.split(" ").map((n) => n[0]).join("").toUpperCase();

  // Defensive fallback mapping for booking statistics
  const statTotal = statistics?.total ?? statistics?.totalBookings ?? statistics?.total_bookings ?? 0;
  const statConfirmed = statistics?.confirmed ?? statistics?.confirmedBookings ?? 0;
  const statCompleted = statistics?.completed ?? statistics?.paid ?? statistics?.completedBookings ?? 0;
  const statPending = statistics?.pending ?? statistics?.pendingBookings ?? 0;
  const statCancelled = statistics?.cancelled ?? statistics?.cancelledBookings ?? 0;
  let revenue = statistics?.totalRevenue ?? statistics?.revenue ?? statistics?.total_revenue ?? 0;
  // revenueDisplay: show in K (thousands) if large, otherwise show exact rupees
  const revenueDisplay = revenue >= 1000 ? `₹${(revenue / 1000).toFixed(0)}K` : `₹${revenue}`;

  return (
    <SuperAdminPageTemplate>
  <div className="bg-white pt-7 lg:mt-0 mt-16   p-4 sm:p-6 rounded-xl shadow-sm border space-y-6">
        {/* Header - force single-line layout */}
        <div className="flex  flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Booking Management</h1>
            <p className="text-sm mt-1 text-gray-600">Monitor and manage all turf bookings</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportCSV}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2 h-10 text-sm rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" /> <span className=" sm:inline">Export</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 h-10 text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> <span className="sm:inline">Refresh</span>
            </button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                id="import-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <button
                onClick={async () => {
                  // If no file selected, open file selector first
                  if (!importFile) {
                    const el = document.getElementById('import-file');
                    if (el) el.click();
                    return;
                  }
                  setImporting(true);
                  setImportResult(null);
                  const fd = new FormData();
                  fd.append('file', importFile);
                  try {
                    const res = await superAdminService.importBookingsCSV(fd, (evt) => {
                      // Could display progress if desired: evt.loaded/evt.total
                    });
                    setImportResult(res);
                    toast.success('Import completed');
                    // Refresh bookings after import
                    fetchAll();
                  } catch (err) {
                    console.error('Import error', err);
                    toast.error('Import failed');
                  } finally {
                    setImporting(false);
                  }
                }}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 h-10 text-sm rounded-lg ${importing ? 'bg-gray-400' : 'bg-yellow-600 text-white hover:bg-yellow-700'}`}
                disabled={importing}
              >
                <span>{importing ? 'Importing...' : 'Import CSV'}</span>
              </button>
              
            </div>
          </div>
        </div>

        {/* Stats */}
  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            ["Total", statTotal, <Calendar />, "text-gray-900"],
            ["Confirmed", statConfirmed, <CheckCircle />, "text-blue-600"],
            ["Completed", statCompleted, <Star />, "text-green-600"],
            ["Pending", statPending, <AlertTriangle />, "text-yellow-600"],
            ["Cancelled", statCancelled, <XCircle />, "text-red-600"],
            ["Revenue", revenueDisplay, <IndianRupee />, "text-green-600"],
          ].map(([label, value, Icon, color], i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition border">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value || 0}</p>
                </div>
                {React.cloneElement(Icon, { className: `w-6 h-6 ${color}` })}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bookings..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {[
            ["Status", statusFilter, setStatusFilter, ["all", "confirmed", "completed", "pending", "cancelled"]],
            ["Date", dateRange, setDateRange, ["today", "week", "month", "all"]],
          ].map(([label, val, setVal, opts], i) => (
            <select
              key={i}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {opts.map((o) => (
                <option key={o} value={o}>
                  {o[0].toUpperCase() + o.slice(1)}
                </option>
              ))}
            </select>
          ))}
        </div>

        {/* Table */}
        {/* Mobile friendly list view (cards) */}
        <div className="sm:hidden">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm mb-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            ))
          ) : bookings.length ? (
            bookings.map((b) => (
              <div key={b._id} className="bg-white p-4 rounded-lg shadow-sm mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium">{b._id}</div>
                    <div className="text-xs text-gray-500">{b.user?.name} • {b.user?.phone}</div>
                    <div className="text-xs text-gray-500 mt-1">{b.turf?.name}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">₹{b.amount}</div>
                    <div className="text-xs text-gray-500">{new Date(b.bookingDate).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs">
                    <div className="text-gray-500">{b.timeSlot}</div>
                    <div className="mt-1">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[b.status]}`}>{b.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => { setSelectedBooking(b); setShowBookingModal(true); }} className="text-blue-600 hover:text-blue-900"><Eye className="w-4 h-4"/></button>
                    {b.status === 'pending' && (
                      <>
                        <button onClick={() => handleBookingStatusUpdate(b._id, 'confirmed')} className="text-green-600 hover:text-green-900"><CheckCircle className="w-4 h-4"/></button>
                        <button onClick={() => handleBookingStatusUpdate(b._id, 'cancelled')} className="text-red-600 hover:text-red-900"><XCircle className="w-4 h-4"/></button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-6 rounded-lg text-center text-gray-500">No bookings found</div>
          )}
        </div>

        {/* Desktop / tablet table view */}
        <div className="hidden sm:block bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
              <tr>
                {["Booking", "Customer", "Turf", "Schedule", "Payment", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan="7" className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : bookings.length ? (
                <AnimatePresence>
                  {bookings.map((b) => (
                    <motion.tr
                      key={b._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm font-medium">{b._id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                            {initials(b.user.name)}
                          </div>
                          <div className="ml-3 text-sm">
                            <div className="font-medium">{b.user.name}</div>
                            <div className="text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {b.user.email}
                            </div>
                            <div className="text-gray-500 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {b.user.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium flex items-center">
                          <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                          {b.turf.name}
                        </div>
                        <div className="text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {b.turf.location}
                        </div>
                        <div className="text-xs text-gray-500">Turfadmin: {b.turf.admin}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {new Date(b.bookingDate).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500">{b.timeSlot}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">₹{b.amount}</div>
                        <div className="mt-1">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${paymentColor[b.paymentStatus]}`}>
                            {b.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[b.status]}`}
                        >
                          {statusIcon[b.status]}
                          <span className="ml-1">{b.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedBooking(b);
                            setShowBookingModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {b.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleBookingStatusUpdate(b._id, "confirmed")}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleBookingStatusUpdate(b._id, "cancelled")}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Import results */}
        {importResult && (
          <div className="bg-white p-4 rounded-xl shadow-sm border mt-4">
            <h3 className="font-semibold">Import Summary</h3>
            <div className="text-sm text-gray-600">Total: {importResult.results?.total ?? 0} • Created: {importResult.results?.created ?? 0} • Failed: {importResult.results?.failed ?? 0}</div>
            {importResult.results?.failures?.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium">Failures:</p>
                <ul className="list-disc list-inside text-sm text-red-600">
                  {importResult.results.failures.slice(0,5).map((f, idx) => (
                    <li key={idx}>{`Line ${f.line}: ${f.reason}`}</li>
                  ))}
                </ul>
                {importResult.results.failures.length > 5 && <p className="text-xs text-gray-500">And more...</p>}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => {
                        const rows = [['Line', 'Reason', 'TurfName', 'Date', 'StartTime', 'EndTime', 'UserEmail']];
                        importResult.results.failures.forEach(f => {
                          const r = f.row || {};
                          rows.push([f.line, f.reason, r.TurfName || '', r.Date || '', r.StartTime || '', r.EndTime || '', r.UserEmail || '']);
                        });
                        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url; a.download = `import_failures_${Date.now()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                      }}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg"
                    >
                      Download Failures
                    </button>
                  </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white mt-4 px-6 py-4 rounded-b-xl flex flex-col sm:flex-row justify-between items-center border-t">
            <div className="text-sm text-gray-700">
              Showing {((pagination.currentPage - 1) * bookingsPerPage) + 1}–
              {Math.min(pagination.currentPage * bookingsPerPage, pagination.totalBookings)} of{" "}
              {pagination.totalBookings}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPagination((p) => ({ ...p, currentPage: p.currentPage - 1 }))
                }
                disabled={pagination.currentPage === 1}
                className="p-2 border rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                const page = i + Math.max(1, pagination.currentPage - 2);
                return (
                  page <= pagination.totalPages && (
                    <button
                      key={page}
                      onClick={() =>
                        setPagination((p) => ({ ...p, currentPage: page }))
                      }
                      className={`px-3 py-2 rounded-lg text-sm ${
                        pagination.currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                );
              })}
              <button
                onClick={() =>
                  setPagination((p) => ({ ...p, currentPage: p.currentPage + 1 }))
                }
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2 border rounded-lg disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {showBookingModal && selectedBooking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-0"
              >
                <div className="flex justify-between mb-6">
                  <h2 className="text-xl font-bold">Booking Details</h2>
                  <button onClick={() => setShowBookingModal(false)}>
                    <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                  {[
                    ["Booking ID", selectedBooking._id],
                    ["Customer", selectedBooking.user.name],
                    ["Email", selectedBooking.user.email],
                    ["Phone", selectedBooking.user.phone],
                    ["Turf", selectedBooking.turf.name],
                    ["Location", selectedBooking.turf.location],
                    ["Admin", selectedBooking.turf.admin],
                    ["Date", new Date(selectedBooking.bookingDate).toLocaleDateString()],
                    ["Time", selectedBooking.timeSlot],
                    ["Duration", `${selectedBooking.duration}h`],
                    ["Players", selectedBooking.players],
                    ["Amount", `₹${selectedBooking.amount}`],
                    ["Payment Method", selectedBooking.paymentMethod],
                    ["Payment Status", selectedBooking.paymentStatus],
                    ["Status", selectedBooking.status],
                    ["Created", fmtDate(selectedBooking.createdAt)],
                  ].map(([label, value], i) => (
                    <div key={i}>
                      <p className="text-gray-500">{label}</p>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SuperAdminPageTemplate>
  );
};

export default SuperAdminBookingManagement;
