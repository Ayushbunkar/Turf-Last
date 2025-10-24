import React, { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { useOutletContext } from "react-router-dom";
import {
  Search,
  Calendar,
  Filter,
  DownloadCloud,
  AlertTriangle
} from "lucide-react";

// === MOCK DATA & SERVICES ===
import api from '../../../config/Api';
import { fetchBookings as fetchBookingsServiceFromClient, exportBookings as exportBookingsServiceFromClient, updateBookingStatus as updateBookingStatusService } from '../../../services/bookingService';

// Real API services
const fetchTurfsService = async () => {
  const res = await api.get('/api/turfs?all=true');
  return res.data;
};

  const fetchBookingsService = async (params) => {
    // Use centralized bookingService which knows the correct turfadmin endpoint
    try {
      // bookingService expects a query string WITHOUT leading '?'
      const q = params ? params : '';
      const data = await fetchBookingsServiceFromClient(q);
      return data;
    } catch (e) {
      throw e;
    }
  };

const updateBookingStatus = async (id, payload) => {
  // Prefer bookingService implementation which wraps API errors
  try {
    return await updateBookingStatusService(id, payload);
  } catch (e) {
    throw e;
  }
};

// Keep API endpoint call for server-side export if needed, but use client-side exporter by default
const exportBookingsService = async (params) => {
  // fall back to server export if desired: return await api.get(`/api/bookings/export?${params}`);
  return exportBookingsServiceFromClient(params);
};

// === HELPER FUNCTIONS ===
const getStatusClasses = status => {
  switch (status) {
    case "confirmed": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "paid": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
  }
};

// === BOOKING ROW COMPONENT ===
const BookingRow = React.memo(({ booking, handleStatusChange, releasePending, pendingTTL }) => {
  const { user, turf, date, timeSlot, duration, status, _id, createdAt } = booking;
  // amount may be stored as booking.price or booking.payment.amount depending on lifecycle
  const rawAmount = booking?.payment?.amount ?? booking?.price ?? booking?.amount ?? 0;
  const amount = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount || 0);
  const [pendingLeft, setPendingLeft] = React.useState(null);

  React.useEffect(() => {
    if (status !== 'pending' || !createdAt) { setPendingLeft(null); return; }
    let mounted = true;
    const update = () => {
      try {
        const created = new Date(createdAt);
        const expires = new Date(created.getTime() + (pendingTTL || 900) * 1000);
        const diff = expires.getTime() - Date.now();
        if (!mounted) return;
        if (diff > 0) {
          const mins = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          setPendingLeft(`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`);
        } else {
          setPendingLeft('Expired');
        }
      } catch (e) { setPendingLeft(null); }
    };
    update();
    const iv = setInterval(update, 1000);
    return () => { mounted = false; clearInterval(iv); };
  }, [status, createdAt, pendingTTL]);
  return (
    <tr className="bg-white dark:bg-gray-900 text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-700 flex items-center justify-center">
            <span className="text-green-700 dark:text-green-200 font-medium">
              {user?.name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-white">{user?.name || "Unknown"}</div>
            <div className="text-sm text-gray-300">{user?.email || "No email"}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
  <div className="text-sm font-medium text-white">{turf?.name}</div>
  <div className="text-sm text-gray-300 flex flex-col space-y-1 mt-1">
          <span className="flex items-center">
            <Calendar className="mr-1 h-3 w-3" />
            {new Date(date).toLocaleDateString()}
          </span>
          <span>{timeSlot} ({duration} hr)</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-white">{pendingLeft ?? '—'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
  <div className="text-sm font-medium text-white">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)}</div>
        <div className="text-sm text-gray-300">ID: {_id}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full capitalize ${getStatusClasses(status)}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          {status === "pending" && (
            <>
              <button onClick={() => handleStatusChange(_id, "confirmed")} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors">Confirm</button>
              <button onClick={() => handleStatusChange(_id, "cancelled")} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors">Cancel</button>
              <button onClick={() => releasePending && releasePending(_id)} className="text-gray-700 hover:text-gray-900 ml-2">Release</button>
            </>
          )}
          {status === "confirmed" && (
            <button onClick={() => handleStatusChange(_id, "completed")} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 transition-colors">Mark Completed</button>
          )}
          {(status === "completed" || status === "cancelled") && <span className="text-gray-400 dark:text-gray-500">No actions</span>}
        </div>
      </td>
    </tr>
  );
});

// === MAIN COMPONENT ===
export default function TurfAdminBookings() {
  const { darkMode } = useOutletContext() || {};
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const DEFAULT_FILTERS = { status: "all", search: "", from: "", to: "", turfId: "all" };
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [turfs, setTurfs] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 10;
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  const fetchBookings = useCallback(async (explicitFilters) => {
    setIsLoading(true);
    try {
      const used = explicitFilters || filters || DEFAULT_FILTERS;
      const params = new URLSearchParams();
      Object.entries(used).forEach(([key, value]) => {
        if (value !== "all" && value) params.append(key, value);
      });
      const data = await fetchBookingsService(params.toString());
      // Expecting an array from the server. If server returns an object (e.g. { bookings: [] }), normalize it.
      const normalized = Array.isArray(data) ? data : (Array.isArray(data?.bookings) ? data.bookings : []);
      setBookings(normalized);
    } catch (err) {
      console.error('fetchBookings error:', err);
      const serverMessage = err?.response?.data?.message || err?.message || 'Could not fetch bookings';
      toast.error(serverMessage);

      // Fallback: try fetching a sample of bookings from the dev-only debug endpoint so UI can show real data
      try {
        if (process.env.NODE_ENV !== 'production') {
          const dbg = await api.get('/api/debug/bookings-sample');
          if (Array.isArray(dbg.data)) {
            setBookings(dbg.data);
            toast.success('Loaded sample bookings from debug endpoint');
          }
        }
      } catch (dbgErr) {
        console.error('debug fallback failed', dbgErr);
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const fetchTurfData = async () => {
      try {
        const data = await fetchTurfsService();
        setTurfs(data);
      } catch {
        toast.error("Could not fetch turfs");
      }
    };
    fetchTurfData();
    fetchBookings();
  }, [fetchBookings]);

  const handleFilterChange = e => {
    const name = e.target.name;
    let value = e.target.value;
    // normalize search input by trimming whitespace
    if (name === 'search') value = String(value).trim();
    // date inputs are fine as-is (YYYY-MM-DD)
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  const applyFilters = () => {
    setCurrentPage(1);
    // use current filters state explicitly to avoid any race
    fetchBookings(filters);
  };
  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
    // immediately fetch using the reset values so we don't race with setState
    fetchBookings(DEFAULT_FILTERS);
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, { status: newStatus });
      setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b));
      toast.success("Booking status updated");
    } catch {
      toast.error("Failed to update booking status");
    }
  };

  // Release a pending booking (admin action)
  const releasePending = async (bookingId) => {
    try {
      // This function is now the performer called after admin confirms a reason.
      if (api) {
        await api.post(`/api/bookings/${bookingId}/release`, { reason: releaseReason });
      } else {
        // fallback to mock status update (reason is ignored in mock)
        await updateBookingStatus(bookingId, { status: 'cancelled' });
      }
      setBookings(prev => prev.filter(b => b._id !== bookingId));
      toast.success('Pending booking released');
    } catch (e) {
      toast.error('Failed to release pending booking');
    }
  };

  // Open release modal (admin must confirm and supply a reason)
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [releaseBookingId, setReleaseBookingId] = useState(null);
  const [releaseReason, setReleaseReason] = useState('');

  const openReleaseModal = (bookingId) => {
    setReleaseBookingId(bookingId);
    setReleaseReason('');
    setReleaseModalOpen(true);
  };

  const closeReleaseModal = () => {
    setReleaseModalOpen(false);
    setReleaseBookingId(null);
    setReleaseReason('');
  };

  const confirmRelease = async () => {
    if (!releaseBookingId) return;
    try {
      if (api) {
        await api.post(`/api/bookings/${releaseBookingId}/release`, { reason: releaseReason });
      } else {
        await updateBookingStatus(releaseBookingId, { status: 'cancelled' });
      }
      setBookings(prev => prev.filter(b => b._id !== releaseBookingId));
      toast.success('Pending booking released');
    } catch (e) {
      toast.error('Failed to release pending booking');
    } finally {
      closeReleaseModal();
    }
  };

  const exportBookings = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "all" && value) params.append(key, value);
      });
      const data = await exportBookingsService(params.toString());
      const blob = new Blob([data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `bookings-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Export successful");
    } catch {
      toast.error("Failed to export bookings");
    }
  };

  const { currentBookings, totalPages, indexOfFirstBooking, indexOfLastBooking } = useMemo(() => {
    const last = currentPage * bookingsPerPage;
    const first = last - bookingsPerPage;
    return { currentBookings: bookings.slice(first, last), totalPages: Math.ceil(bookings.length / bookingsPerPage), indexOfFirstBooking: first, indexOfLastBooking: last };
  }, [bookings, currentPage]);

  const paginate = pageNumber => setCurrentPage(pageNumber);

  // Use transparent backgrounds so page cards match other dashboard pages
  const themeClass = darkMode ? "dark bg-transparent text-white min-h-screen" : "bg-transparent text-gray-900";


  // ===== RENDER =====
  // compute TTL from env (client build-time) fallback to 900s
  const pendingTTL = Number(import.meta.env.VITE_PENDING_BOOKING_TTL) || 900;

  return (
    <div className={`p-4 sm:p-6 ${themeClass}`}>
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Manage Bookings</h1>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-2 bg-transparent border rounded-lg flex items-center space-x-2 hover:bg-gray-100/10 dark:hover:bg-gray-700/40 text-xs sm:text-sm">
              <Filter className="h-4 w-4" /> <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
            </button>
            <button onClick={async () => { setAuditOpen(true); try { const res = await api.get('/api/bookings/audit-logs'); setAuditLogs(res.data || []); } catch(e){ setAuditLogs([]); } }} className="px-3 py-2 bg-transparent border rounded-lg text-xs sm:text-sm">Audit Logs</button>
            <button onClick={exportBookings} className="px-3 py-2 bg-green-600 text-white rounded-lg flex items-center space-x-2 hover:bg-green-700 text-xs sm:text-sm">
              <DownloadCloud className="h-4 w-4" /> <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-transparent p-2 sm:p-4 rounded-lg mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm  mb-1">Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full  text-white rounded-lg p-2 dark:bg-gray-700">
                <option value="all" className="text-white">All Statuses</option>
                {["pending", "confirmed", "paid", "completed", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Turf */}
            <div>
              <label className="block text-sm mb-1">Turf</label>
              <select name="turfId" value={filters.turfId} onChange={handleFilterChange} className="w-full text-white bo rounded-lg p-2 dark:bg-gray-700">
                <option value="all" className="text-white">All Turfs</option>
                {turfs.map(t => <option key={t._id} value={t._id} className="text-white">{t.name}</option>)}
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-sm mb-1">From Date</label>
              <input type="date" name="from" value={filters.from} onChange={handleFilterChange} className="w-full text-white rounded-lg p-2 dark:bg-gray-700" />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm mb-1">To Date</label>
              <input type="date" name="to" value={filters.to} onChange={handleFilterChange} className="w-full  text-white rounded-lg p-2 dark:bg-gray-700" />
            </div>

            {/* Search */}
            <div className="col-span-full">
              <label className="block text-sm mb-1">Search</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400"><Search className="h-4 w-4" /></span>
                <input name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search by user or email" className="w-full pl-10 border rounded-lg p-2 dark:bg-gray-700" />
              </div>
            </div>

            <div className="col-span-full flex justify-end space-x-3">
              <button onClick={resetFilters} className="px-4 py-2 bg-gray-200/20 dark:bg-gray-700/40 rounded-lg" disabled={isLoading}>Reset</button>
              <button onClick={applyFilters} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center space-x-2" disabled={isLoading}>
                {isLoading ? <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg> : null}
                <span>Apply Filters</span>
              </button>
            </div>
          </div>
        )}

        {/* Bookings Table */}
        {isLoading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-500"></div></div>
        ) : (
          <div className="bg-transparent rounded-lg overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs sm:text-sm">
              <thead className="bg-transparent">
                <tr>
                  {["User", "Turf & Time", "Details", "Pending Left", "Status", "Actions"].map(h => (
                    <th key={h} className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentBookings.map(b => <BookingRow key={b._id} booking={b} handleStatusChange={handleStatusChange} releasePending={releasePending} pendingTTL={pendingTTL} />)}
              </tbody>
            </table>

            {/* Empty State */}
            {bookings.length === 0 && (
              <div className="p-4 sm:p-6 text-center text-gray-500 dark:text-gray-400">
                <AlertTriangle className="mx-auto h-6 w-6 mb-2" />
                No bookings found
              </div>
            )}
          </div>
        )}
      </div>
      {/* Audit Logs Modal */}
      {auditOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 px-2">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-2">
              <h3 className="text-lg font-bold">Audit Logs</h3>
              <button onClick={() => setAuditOpen(false)} className="px-3 py-1">Close</button>
            </div>
            <div className="max-h-96 overflow-auto text-xs sm:text-sm">
              {auditLogs.length === 0 ? <div className="text-gray-500">No logs</div> : (
                <ul className="space-y-2">
                  {auditLogs.map(log => (
                    <li key={log._id} className="border p-2 rounded">
                      <div className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</div>
                      <div className="font-medium">{log.action}</div>
                      <div className="text-xs sm:text-sm text-gray-700">Target Booking: {log.targetBooking}</div>
                      <div className="text-xs text-gray-500">Meta: {JSON.stringify(log.meta)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Release Reason Modal */}
      {releaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-2">
              <h3 className="text-lg font-bold">Release Pending Booking</h3>
              <button onClick={closeReleaseModal} className="px-2 py-1">X</button>
            </div>
            <div className="mb-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">Please provide a reason for releasing this pending booking. This will be recorded in the audit logs.</div>
            <textarea value={releaseReason} onChange={e => setReleaseReason(e.target.value)} placeholder="Reason (required)" className="w-full p-2 border rounded mb-3 dark:bg-gray-800 text-xs sm:text-sm" rows={4} />
            <div className="flex justify-end space-x-3">
              <button onClick={closeReleaseModal} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={confirmRelease} className="px-4 py-2 bg-red-600 text-white rounded">Release Booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
