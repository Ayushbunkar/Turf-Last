import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Download, Search, CheckCircle, XCircle, Clock, AlertCircle, Calendar } from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import Sidebar from "../../../components/Sidebar/UserSidebar";
import api from "../../../config/Api.jsx";
import toast from "react-hot-toast";

// Local Card fallback
function Card({ className = "", children }) {
  return (
    <div className={`rounded-xl shadow-lg bg-white dark:bg-gray-800 ${className}`}>
      {children}
    </div>
  );
}

const UserPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/payments/user");
        setPayments(data || []);
      } catch {
        toast.error("Failed to fetch payments. Showing demo data.");
        setPayments([
          {
            _id: 1,
            amount: 1500,
            status: "completed",
            paymentMethod: "UPI",
            transactionId: "TXN12345",
            date: "2024-10-05",
            booking: { turfName: "Green Valley", date: "2024-10-10", timeSlot: "10:00 AM - 12:00 PM" },
          },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filters = (p) => {
    const term = search.toLowerCase();
    const matchSearch = p.booking?.turfName?.toLowerCase().includes(term) || p.transactionId?.toLowerCase().includes(term);
    const matchStatus = status === "all" || p.status === status;
    const d = new Date(p.date), n = new Date();
    const diff = (n - d) / (1000 * 60 * 60 * 24);
    const matchDate =
      range === "all" ||
      (range === "week" && diff <= 7) ||
      (range === "month" && diff <= 30) ||
      (range === "year" && diff <= 365);
    return matchSearch && matchStatus && matchDate;
  };

  const stats = {
    total: payments.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0),
    success: payments.filter(p => p.status === "completed").length,
    month: payments.filter(p => new Date(p.date).getMonth() === new Date().getMonth() && p.status === "completed").length,
  };

  const icon = (s) =>
    s === "completed"
      ? [CheckCircle, "bg-green-100 text-green-600"]
      : s === "failed"
      ? [XCircle, "bg-red-100 text-red-600"]
      : s === "pending"
      ? [Clock, "bg-yellow-100 text-yellow-600"]
      : [AlertCircle, "bg-gray-100 text-gray-600"];

  const downloadReceipt = async (p) => {
    try {
      toast.loading("Preparing receipt...");
      // Assume p.booking._id is the booking ID
      const bookingId = p.booking?._id || p.booking?.bookingId || p.booking?.id || p._id;
      if (!bookingId) {
        toast.error("Booking ID not found for this payment.");
        return;
      }
      const res = await api.get(`/api/bookings/${bookingId}/invoice`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Receipt downloaded!");
    } catch (e) {
      toast.error("Failed to download receipt.");
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/payments/user');
      setPayments(data || []);
    } catch (err) {
      toast.error('Failed to refresh payments');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="flex items-center justify-center h-screen">Please log in to view payments</div>;

  return (
    <div className={`${darkMode ? "dark" : ""} min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-gray-900 dark:to-gray-800`}>
      <div className="flex">
        <Sidebar user={user} darkMode={darkMode} />
        <main className="flex-1 ml-0 lg:ml-64 p-6 ">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Payment History</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Track your payments and receipts</p>

            {/* Summary */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[["Total Spent", `₹${stats.total.toLocaleString()}`, CreditCard, "green"],
                ["Completed", stats.success, CheckCircle, "blue"],
                ["This Month", stats.month, Calendar, "purple"]].map(([t, v, I, c]) => {
                const map = {
                  green: { bg: 'bg-green-100', icon: 'text-green-600' },
                  blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
                  purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
                  default: { bg: 'bg-gray-100', icon: 'text-gray-600' }
                };
                const token = map[c] || map.default;
                return (
                <Card key={t} className="p-6 flex items-center bg-white dark:bg-gray-800 shadow-lg rounded-xl">
                  <div className={`${token.bg} p-3 rounded-full`}><I className={`${token.icon} w-8 h-8`} /></div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{v}</p>
                  </div>
                </Card>
                );
              })}
            </div>

            {/* Filters */}
            <Card className="p-4 bg-white dark:bg-gray-800 shadow-lg rounded-xl mb-6 flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by turf or transaction..."
                  className="pl-10 pr-3 py-2 w-full rounded-lg border dark:bg-gray-700 dark:text-white"
                />
              </div>
              {/** left controls */}
              <div className="flex items-center gap-2">
                <button onClick={refresh} className="px-3 py-2 bg-gray-100 rounded">Refresh</button>
              </div>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2 rounded-lg border dark:bg-gray-700 dark:text-white">
                {['all', 'completed', 'pending', 'failed', 'refunded'].map((o) => <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)}</option>)}
              </select>
              <select value={range} onChange={(e) => setRange(e.target.value)} className="px-4 py-2 rounded-lg border dark:bg-gray-700 dark:text-white">
                {['all', 'week', 'month', 'year'].map((o) => <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)}</option>)}
              </select>
            </Card>

            {/* Payments */}
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full"></div></div>
            ) : payments.filter(filters).length ? (
              <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 text-xs uppercase">
                    <tr>
                      {["Transaction", "Booking", "Amount", "Status", "Date", "Actions"].map(h => (
                        <th key={h} className="px-6 py-3 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.filter(filters).map((p) => {
                      const [Icon, cls] = icon(p.status);
                      return (
                        <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                          <td className="px-6 py-3">{p.transactionId}<div className="text-gray-500 text-sm">{p.paymentMethod}</div></td>
                          <td className="px-6 py-3">{p.booking?.turfName}<div className="text-gray-500 text-sm">{p.booking?.date} • {p.booking?.timeSlot}</div></td>
                          <td className="px-6 py-3 font-semibold">₹{p.amount}</td>
                          <td className="px-6 py-3"><span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cls}`}><Icon className="w-4 h-4 mr-1" />{p.status}</span></td>
                          <td className="px-6 py-3">{new Date(p.date).toLocaleDateString()}</td>
                          <td className="px-6 py-3">{p.status === "completed" && <button onClick={() => downloadReceipt(p)} className="text-blue-600 hover:underline flex items-center"><Download className="w-4 h-4 mr-1" />Receipt</button>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            ) : (
              <Card className="p-12 text-center bg-white dark:bg-gray-800 shadow-lg rounded-xl">
                <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">No payments found</p>
              </Card>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default UserPayments;
