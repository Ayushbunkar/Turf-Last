import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle } from "lucide-react";

export default function BookingModal({ open, onClose, onConfirm, turfName, date, selectedSlots = [], loading }) {
  if (!open) return null;

  // Build a human-friendly label for selected slots (e.g., 09:00, 10:00, 11:00-13:00)
  const slots = Array.from(selectedSlots).sort();
  const label = slots.join(", ");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative bg-gradient-to-br from-white via-[#d1f9e0]/60 to-[#a7f0c0]/40 
                       rounded-2xl shadow-xl w-[90%] max-w-md p-6 border border-[#10b981]"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-green-800/70 hover:text-green-600 transition"
              disabled={loading}
            >
              <XCircle className="w-6 h-6" />
            </button>

            {/* Header */}
            <header className="text-center mb-4">
              <h3 className="text-xl font-semibold text-green-800">
                ⚽ Confirm Your Booking
              </h3>
            </header>

            {/* Body */}
            <div className="space-y-2 text-sm text-green-900/90">
              <p>
                Turf: <strong className="text-green-700">{turfName}</strong>
              </p>
              <p>
                Date: <strong className="text-green-700">{date}</strong>
              </p>
              <p>
                Time: <strong className="text-green-700">{label || "—"}</strong>
              </p>
            </div>

            {/* Footer */}
            <footer className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-green-800 border border-green-400/50 
                           hover:bg-green-50 transition font-medium"
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => onConfirm(slots)}
                disabled={loading || slots.length === 0}
                className={`px-5 py-2 rounded-lg text-white font-semibold shadow-md
                           ${loading ? "bg-green-500/70 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"} 
                           transition`}
              >
                {loading ? "Booking..." : `Confirm & Book (${slots.length})`}
              </motion.button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
