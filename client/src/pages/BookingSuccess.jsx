import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../config/Api";

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!bookingId) { setLoading(false); return; }
      try {
        const res = await api.get(`/api/bookings/${bookingId}`);
        if (!mounted) return;
        setBooking(res.data.booking || res.data);
      } catch (e) {
        console.warn("Failed to load booking", e);
      } finally { if (mounted) setLoading(false); }
    })();
    return () => mounted = false;
  }, [bookingId]);

  if (loading) return <div className="flex items-center justify-center h-screen text-green-700 font-semibold">Loading booking...</div>;
  if (!booking) return <div className="flex items-center justify-center h-screen text-red-600 font-medium">Booking not found.</div>;

  const slotText = (booking.slots || []).map(s => `${s.startTime} - ${s.endTime}`).join(", ");
  const paid = booking.status === "paid" || (booking.payment && booking.payment.status === "completed");

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const newWin = window.open("", "_blank", "width=800,height=800");
    newWin.document.write('<html><head><title>Booking Receipt</title><style>body{font-family:Arial;padding:20px;} .header{margin-bottom:20px;} .section{margin-bottom:12px;}</style></head><body>');
    newWin.document.write(printContent.innerHTML);
    newWin.document.write('</body></html>');
    newWin.document.close();
    newWin.focus();
    newWin.print();
    newWin.close();
  };

  const handleViewPdf = async () => {
    try {
      const res = await api.get(`/api/bookings/${booking._id}/invoice?inline=true`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      console.error("Failed to open PDF invoice", e);
      alert("Failed to load PDF invoice.");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await api.get(`/api/bookings/${booking._id}/invoice`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${booking._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      console.error("Failed to download PDF invoice", e);
      alert("Failed to download PDF invoice.");
    }
  };

  return (
    <div className="flex justify-center py-10 px-4 bg-green-50 min-h-screen">
      <motion.div
        ref={printRef}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 border border-green-200"
        initial={{ y: 30, opacity: 0, rotateX: 10 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 120 }}
        whileHover={{ rotateY: 2, rotateX: 2, scale: 1.02 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <motion.h2
            className="text-2xl font-bold text-green-800"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Booking Receipt
          </motion.h2>
          <div className="text-right">
            <div className="text-sm text-green-500">Booking ID</div>
            <div className="font-mono text-green-700">{booking._id}</div>
          </div>
        </div>

        {/* Turf Info */}
        <motion.div
          className="mb-4 space-y-1"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="font-semibold text-green-700">Turf</div>
          <div className="text-green-900">{booking.turf?.name || booking.turf}</div>
          <div className="text-sm text-green-600">{booking.turf?.location || ""}</div>
        </motion.div>

        {/* Date & Time */}
        <motion.div
          className="mb-4"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <div className="font-semibold text-green-700">Date & Time</div>
          <div className="text-green-900">{booking.date} — {slotText}</div>
        </motion.div>

        {/* Amount */}
        <motion.div
          className="mb-4"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="font-semibold text-green-700">Amount</div>
          <div className="text-green-900 font-semibold text-lg">₹{booking.price}</div>
        </motion.div>

        {/* Payment Status */}
        <motion.div
          className="mb-4"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <div className="font-semibold text-green-700">Payment Status</div>
          <div className={`font-medium ${paid ? "text-green-800" : "text-red-600"}`}>{paid ? "Paid" : (booking.status || "Pending")}</div>
          {booking.payment && (
            <div className="text-sm text-green-600">
              Transaction: {booking.payment.transactionId || booking.payment.providerPaymentId} — {booking.payment.method}
            </div>
          )}
        </motion.div>

        {/* Booked By */}
        <motion.div
          className="mb-6"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="font-semibold text-green-700">Booked By</div>
          <div className="text-green-900">{booking.user?.name || "User"} {booking.user?.email && <span className="text-sm text-green-600">({booking.user.email})</span>}</div>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex flex-wrap gap-3"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <button onClick={handlePrint} className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition">Print</button>
          <button onClick={handleViewPdf} className="px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition">View PDF</button>
          <button onClick={handleDownloadPdf} className="px-4 py-2 bg-green-50 text-green-800 border border-green-300 rounded-lg hover:bg-green-100 transition">Download PDF</button>
          <a href="/" className="px-4 py-2 bg-green-50 text-green-800 border border-green-300 rounded-lg hover:bg-green-100 transition">Back to Home</a>
        </motion.div>
      </motion.div>
    </div>
  );
}
