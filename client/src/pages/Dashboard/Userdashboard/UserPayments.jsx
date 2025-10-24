// import React, { useEffect, useState } from "react";
// import { motion } from "framer-motion";
// import {
//   CreditCard,
//   Download,
//   Search,
//   CheckCircle,
//   XCircle,
//   Clock,
//   AlertCircle,
//   Calendar,
// } from "lucide-react";
// import { useAuth } from "../../../context/AuthContext.jsx";
// import Sidebar from "../../../components/Sidebar/UserSidebar";
// import api from "../../../config/Api.jsx";
// import toast from "react-hot-toast";

// // Local Card fallback
// function Card({ className = "", children }) {
//   return (
//     <div
//       className={`rounded-xl shadow-lg bg-white dark:bg-gray-800 ${className}`}
//     >
//       {children}
//     </div>
//   );
// }

// const UserPayments = () => {
//   const { user } = useAuth();
//   const [payments, setPayments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [darkMode, setDarkMode] = useState(false);
//   const [search, setSearch] = useState("");
//   const [status, setStatus] = useState("all");
//   const [range, setRange] = useState("all");

//   useEffect(() => {
//     (async () => {
//       try {
//         const { data } = await api.get("/api/payments/user");
//         setPayments(data || []);
//       } catch {
//         toast.error("Failed to fetch payments. Showing demo data.");
//         setPayments([
//           {
//             _id: 1,
//             amount: 1500,
//             status: "completed",
//             paymentMethod: "UPI",
//             transactionId: "TXN12345",
//             date: "2024-10-05",
//             booking: {
//               turfName: "Green Valley",
//               date: "2024-10-10",
//               timeSlot: "10:00 AM - 12:00 PM",
//             },
//           },
//         ]);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   const filters = (p) => {
//     const term = search.toLowerCase();
//     const matchSearch =
//       p.booking?.turfName?.toLowerCase().includes(term) ||
//       p.transactionId?.toLowerCase().includes(term);
//     const matchStatus = status === "all" || p.status === status;
//     const d = new Date(p.date),
//       n = new Date();
//     const diff = (n - d) / (1000 * 60 * 60 * 24);
//     const matchDate =
//       range === "all" ||
//       (range === "week" && diff <= 7) ||
//       (range === "month" && diff <= 30) ||
//       (range === "year" && diff <= 365);
//     return matchSearch && matchStatus && matchDate;
//   };

//   const stats = {
//     total: payments
//       .filter((p) => p.status === "completed")
//       .reduce((s, p) => s + p.amount, 0),
//     success: payments.filter((p) => p.status === "completed").length,
//     month: payments.filter(
//       (p) =>
//         new Date(p.date).getMonth() === new Date().getMonth() &&
//         p.status === "completed"
//     ).length,
//   };

//   const filteredPayments = payments.filter(filters || (() => true));

//   const icon = (s) =>
//     s === "completed"
//       ? [CheckCircle, "bg-green-100 text-green-600"]
//       : s === "failed"
//       ? [XCircle, "bg-red-100 text-red-600"]
//       : s === "pending"
//       ? [Clock, "bg-yellow-100 text-yellow-600"]
//       : [AlertCircle, "bg-gray-100 text-gray-600"];

//   const downloadReceipt = async (p) => {
//     try {
//       toast.loading("Preparing receipt...");
//       const bookingId =
//         p.booking?._id || p.booking?.bookingId || p.booking?.id || p._id;
//       if (!bookingId) {
//         toast.error("Booking ID not found for this payment.");
//         return;
//       }
//       const res = await api.get(`/api/bookings/${bookingId}/invoice`, {
//         responseType: "blob",
//       });
//       const url = window.URL.createObjectURL(
//         new Blob([res.data], { type: "application/pdf" })
//       );
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `receipt-${bookingId}.pdf`;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(url);
//       toast.success("Receipt downloaded!");
//     } catch (e) {
//       toast.error("Failed to download receipt.");
//     }
//   };

//   const refresh = async () => {
//     setLoading(true);
//     try {
//       const { data } = await api.get("/api/payments/user");
//       setPayments(data || []);
//     } catch (err) {
//       toast.error("Failed to refresh payments");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!user)
//     return (
//       <div className="flex items-center justify-center h-screen">
//         Please log in to view payments
//       </div>
//     );

//   return (
//     <div
//       className={`${darkMode ? "dark" : ""} min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-gray-900 dark:to-gray-800 overflow-x-hidden`}
//     >
//       <div className="flex">
//         <Sidebar user={user} darkMode={darkMode} />
//   <main className="flex-1 min-w-0 ml-0 lg:ml-64 p-6 ">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//           >
//             <div className="max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg mx-auto">
//               <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
//                 Payment History
//               </h1>
//               <p className="text-gray-600 dark:text-gray-400 mb-8">
//                 Track your payments and receipts
//               </p>

//             {/* Summary */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//               {[
//                 ["Total Spent", `₹${stats.total.toLocaleString()}`, CreditCard, "green"],
//                 ["Completed", stats.success, CheckCircle, "blue"],
//                 ["This Month", stats.month, Calendar, "purple"],
//               ].map(([t, v, I, c]) => {
//                 const map = {
//                   green: { bg: "bg-green-100", icon: "text-green-600" },
//                   blue: { bg: "bg-blue-100", icon: "text-blue-600" },
//                   purple: { bg: "bg-purple-100", icon: "text-purple-600" },
//                   default: { bg: "bg-gray-100", icon: "text-gray-600" },
//                 };
//                 const token = map[c] || map.default;
//                 return (
//                   <Card key={t} className="p-4 sm:p-6 flex items-center shadow-lg rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 text-white">
//                     <div className={`p-3 rounded-full bg-white/10`}>
//                       <I className={`w-7 h-7 text-white`} />
//                     </div>
//                     <div className="ml-4 min-w-0">
//                       <p className="text-sm text-gray-200 truncate">{t}</p>
//                       <p className="text-xl sm:text-2xl font-bold text-white break-words">{v}</p>
//                     </div>
//                   </Card>
//                 );
//               })}
//             </div>

//             {/* Filters (mobile-first dark panel) */}
//             <Card className="p-0 mb-6 rounded-xl overflow-hidden shadow-lg">
//               <div className="bg-gray-900 p-4 sm:p-6 rounded-xl text-white">
//                 <div className="flex flex-col gap-3">
//                   <div className="relative">
//                     <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
//                     <input
//                       value={search}
//                       onChange={(e) => setSearch(e.target.value)}
//                       placeholder="Search by turf or transaction..."
//                       className="pl-10 pr-3 py-3 w-full rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-100"
//                     />
//                   </div>
//                   <button onClick={refresh} className="w-full px-4 py-2 bg-white text-gray-900 rounded-md">Refresh</button>
//                   <div className="grid grid-cols-2 gap-3">
//                     <select
//                       value={status}
//                       onChange={(e) => setStatus(e.target.value)}
//                       className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-100 w-full"
//                     >
//                       {["all", "completed", "pending", "failed", "refunded"].map((o) => (
//                         <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)}</option>
//                       ))}
//                     </select>
//                     <select
//                       value={range}
//                       onChange={(e) => setRange(e.target.value)}
//                       className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-100 w-full"
//                     >
//                       {["all", "week", "month", "year"].map((o) => (
//                         <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)}</option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>
//             </Card>

//             {/* Payments */}
//             {loading ? (
//               <div className="flex justify-center py-12">
//                 <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
//               </div>
//             ) : filteredPayments.length ? (
//               <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
//                 {/* Desktop/table view */}
//                 <div className="hidden lg:block">
//                   <table className="w-full table-auto">
//                     <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 text-xs uppercase">
//                       <tr>
//                         {[
//                           "Transaction",
//                           "Booking",
//                           "Amount",
//                           "Status",
//                           "Date",
//                           "Actions",
//                         ].map((h) => (
//                           <th key={h} className="px-4 py-2 text-left font-semibold">
//                             {h}
//                           </th>
//                         ))}
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {filteredPayments.map((p) => {
//                         const [Icon, cls] = icon(p.status);
//                         return (
//                           <tr
//                             key={p._id}
//                             className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
//                           >
//                             <td className="px-4 py-2 align-top break-words whitespace-normal">
//                               {p.transactionId}
//                               <div className="text-gray-500 text-sm">
//                                 {p.paymentMethod}
//                               </div>
//                             </td>
//                             <td className="px-4 py-2 align-top break-words whitespace-normal">
//                               {p.booking?.turfName}
//                               <div className="text-gray-500 text-sm">
//                                 {p.booking?.date} • {p.booking?.timeSlot}
//                               </div>
//                             </td>
//                             <td className="px-4 py-2 font-semibold align-top">₹{p.amount}</td>
//                             <td className="px-4 py-2 align-top">
//                               <span
//                                 className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cls}`}
//                               >
//                                 <Icon className="w-4 h-4 mr-1" />
//                                 {p.status}
//                               </span>
//                             </td>
//                             <td className="px-4 py-2 align-top">{new Date(p.date).toLocaleDateString()}</td>
//                             <td className="px-4 py-2 align-top">
//                               {p.status === "completed" && (
//                                 <button
//                                   onClick={() => downloadReceipt(p)}
//                                   className="text-blue-600 hover:underline flex items-center"
//                                 >
//                                   <Download className="w-4 h-4 mr-1" />
//                                   Receipt
//                                 </button>
//                               )}
//                             </td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                 </div>

//                 {/* Mobile/card view */}
//                 <div className="lg:hidden p-4 space-y-4">
//                   {filteredPayments.map((p) => {
//                     const [Icon, cls] = icon(p.status);
//                     return (
//                       <div key={p._id} className="relative p-4 pr-12 bg-white dark:bg-gray-800 rounded-lg shadow min-w-0 overflow-hidden">
//                         {/* date badge in top-right inside the card */}
//                         <div className="absolute top-5 right-3 text-xs rounded px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-white z-10">
//                           {new Date(p.date).toLocaleDateString()}
//                         </div>

//                         <div className="flex flex-col sm:flex-row items-start justify-between">
//                           <div className="min-w-0">
//                             <div className="font-semibold truncate text-gray-900 dark:text-white">{p.transactionId}</div>
//                             <div className="text-sm text-gray-600 dark:text-gray-300 truncate">{p.booking?.turfName}</div>
//                           </div>
//                           <div className="mt-3 sm:mt-0 text-right sm:ml-4 sm:shrink-0">
//                             <div className="font-semibold text-lg text-gray-900 dark:text-white">₹{p.amount}</div>
//                           </div>
//                         </div>

//                         <div className="mt-3 flex items-center justify-between">
//                           <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cls}`}>
//                             <Icon className="w-4 h-4 mr-1" />
//                             {p.status}
//                           </div>
//                           <div>
//                             {p.status === "completed" && (
//                               <button onClick={() => downloadReceipt(p)} className="text-blue-600 hover:underline flex items-center">
//                                 <Download className="w-4 h-4 mr-1" />
//                                 Receipt
//                               </button>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </Card>
//             ) : (
//               <Card className="p-12 text-center bg-white dark:bg-gray-800 shadow-lg rounded-xl">
//                 <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-3" />
//                 <p className="text-gray-500">No payments found</p>
//               </Card>
//             )}
//             </div>
//           </motion.div>
//         </main>
//       </div>
//     </div>
//   );
// };

// export default UserPayments;

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import Sidebar from "../../../components/Sidebar/UserSidebar";
import api from "../../../config/Api.jsx";
import toast from "react-hot-toast";

// Local Card fallback
function Card({ className = "", children }) {
  return (
    <div className={`rounded-xl shadow-lg bg-gray-900 text-white ${className}`}>
      {children}
    </div>
  );
}

const UserPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
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
            booking: {
              turfName: "Green Valley",
              date: "2024-10-10",
              timeSlot: "10:00 AM - 12:00 PM",
            },
          },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filters = (p) => {
    const term = search.toLowerCase();
    const matchSearch =
      p.booking?.turfName?.toLowerCase().includes(term) ||
      p.transactionId?.toLowerCase().includes(term);
    const matchStatus = status === "all" || p.status === status;
    const d = new Date(p.date),
      n = new Date();
    const diff = (n - d) / (1000 * 60 * 60 * 24);
    const matchDate =
      range === "all" ||
      (range === "week" && diff <= 7) ||
      (range === "month" && diff <= 30) ||
      (range === "year" && diff <= 365);
    return matchSearch && matchStatus && matchDate;
  };

  const stats = {
    total: payments
      .filter((p) => p.status === "completed")
      .reduce((s, p) => s + p.amount, 0),
    success: payments.filter((p) => p.status === "completed").length,
    month: payments.filter(
      (p) =>
        new Date(p.date).getMonth() === new Date().getMonth() &&
        p.status === "completed"
    ).length,
  };

  const filteredPayments = payments.filter(filters || (() => true));

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
      const bookingId =
        p.booking?._id || p.booking?.bookingId || p.booking?.id || p._id;
      if (!bookingId) {
        toast.error("Booking ID not found for this payment.");
        return;
      }
      const res = await api.get(`/api/bookings/${bookingId}/invoice`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
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
      const { data } = await api.get("/api/payments/user");
      setPayments(data || []);
    } catch (err) {
      toast.error("Failed to refresh payments");
    } finally {
      setLoading(false);
    }
  };

  if (!user)
    return (
      <div className="flex items-center justify-center h-screen text-white bg-gray-900">
        Please log in to view payments
      </div>
    );

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-x-hidden`}
    >
      <div className="flex">
        <Sidebar user={user} darkMode={darkMode} />
        <main className="flex-1 min-w-0 ml-0 lg:ml-64 p-6 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-screen-lg mx-auto">
              <h1 className="text-3xl font-bold mb-2 text-white">
                Payment History
              </h1>
              <p className="text-gray-300 mb-8">
                Track your payments and receipts
              </p>

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  ["Total Spent", `₹${stats.total.toLocaleString()}`, CreditCard],
                  ["Completed", stats.success, CheckCircle],
                  ["This Month", stats.month, Calendar],
                ].map(([t, v, I]) => (
                  <Card
                    key={t}
                    className="p-4 sm:p-6 flex items-center shadow-lg rounded-xl bg-gray-800"
                  >
                    <div className="p-3 rounded-full bg-white/10">
                      <I className="w-7 h-7 text-white" />
                    </div>
                    <div className="ml-4 min-w-0">
                      <p className="text-sm text-gray-300 truncate">{t}</p>
                      <p className="text-xl sm:text-2xl font-bold text-white break-words">
                        {v}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Filters */}
              <Card className="p-0 mb-6 rounded-xl overflow-hidden shadow-lg bg-gray-800">
                <div className="p-6 rounded-xl text-white">
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by turf or transaction..."
                        className="pl-10 pr-3 py-3 w-full rounded-lg bg-gray-700 border border-gray-600 text-sm text-white placeholder-gray-400"
                      />
                    </div>
                    <button
                      onClick={refresh}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md"
                    >
                      Refresh
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-600 bg-gray-700 text-sm text-white w-full"
                      >
                        {["all", "completed", "pending", "failed", "refunded"].map(
                          (o) => (
                            <option key={o} value={o}>
                              {o[0].toUpperCase() + o.slice(1)}
                            </option>
                          )
                        )}
                      </select>
                      <select
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-600 bg-gray-700 text-sm text-white w-full"
                      >
                        {["all", "week", "month", "year"].map((o) => (
                          <option key={o} value={o}>
                            {o[0].toUpperCase() + o.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Payments */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
                </div>
              ) : filteredPayments.length ? (
                <Card className="bg-gray-800 shadow-lg rounded-xl overflow-hidden">
                  {/* Desktop View */}
                  <div className="hidden lg:block">
                    <table className="w-full table-auto text-white">
                      <thead className="bg-gray-700 text-gray-300 text-xs uppercase">
                        <tr>
                          {[
                            "Transaction",
                            "Booking",
                            "Amount",
                            "Status",
                            "Date",
                            "Actions",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-2 text-left font-semibold"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.map((p) => {
                          const [Icon, cls] = icon(p.status);
                          return (
                            <tr
                              key={p._id}
                              className="hover:bg-gray-700 transition"
                            >
                              <td className="px-4 py-2 align-top">
                                {p.transactionId}
                                <div className="text-gray-400 text-sm">
                                  {p.paymentMethod}
                                </div>
                              </td>
                              <td className="px-4 py-2 align-top">
                                {p.booking?.turfName}
                                <div className="text-gray-400 text-sm">
                                  {p.booking?.date} • {p.booking?.timeSlot}
                                </div>
                              </td>
                              <td className="px-4 py-2 font-semibold align-top">
                                ₹{p.amount}
                              </td>
                              <td className="px-4 py-2 align-top">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cls}`}
                                >
                                  <Icon className="w-4 h-4 mr-1" />
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 align-top">
                                {new Date(p.date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2 align-top">
                                {p.status === "completed" && (
                                  <button
                                    onClick={() => downloadReceipt(p)}
                                    className="text-blue-400 hover:underline flex items-center"
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Receipt
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View */}
                  <div className="lg:hidden p-4 space-y-4">
                    {filteredPayments.map((p) => {
                      const [Icon, cls] = icon(p.status);
                      return (
                        <div
                          key={p._id}
                          className="relative p-4 pr-12 bg-gray-800 rounded-lg shadow"
                        >
                          <div className="absolute top-15 right-3 text-xs rounded px-2 py-0.5 bg-gray-700 text-white">
                            {new Date(p.date).toLocaleDateString()}
                          </div>

                          <div className="flex flex-col sm:flex-row items-start justify-between">
                            <div className="min-w-0">
                              <div className="font-semibold truncate text-white">
                                {p.transactionId}
                              </div>
                              <div className="text-sm text-gray-300 truncate">
                                {p.booking?.turfName}
                              </div>
                            </div>
                            <div className="mt-3 sm:mt-0 text-right">
                              <div className="font-semibold text-lg text-white">
                                ₹{p.amount}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cls}`}
                            >
                              <Icon className="w-4 h-4 mr-1" />
                              {p.status}
                            </div>
                            {p.status === "completed" && (
                              <button
                                onClick={() => downloadReceipt(p)}
                                className="text-blue-400 hover:underline flex items-center"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Receipt
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ) : (
                <Card className="p-12 text-center bg-gray-800 shadow-lg rounded-xl">
                  <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-300">No payments found</p>
                </Card>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default UserPayments;
