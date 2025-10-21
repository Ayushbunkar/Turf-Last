import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../config/Api";
import BookingCalendar from "./BookingCalendar";

export default function BookingSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchTurf() {
      try {
        const res = await api.get(`/api/turfs/${id}`);
        if (!mounted) return;
        setTurf(res.data);
      } catch (err) {
        console.error("Failed to load turf", err);
        setError("Turf not found");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchTurf();
    return () => (mounted = false);
  }, [id]);

  const onContinue = () => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate(`/booking/${id}`);
    } else {
      navigate(`/login?redirect=/booking/${id}`);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center p-10 text-green-800 font-medium">
        Loading turf details...
      </div>
    );

  if (error || !turf)
    return (
      <div className="flex items-center justify-center p-10 text-red-600 font-medium">
        {error || "Turf not found"}
      </div>
    );

  return (
    <motion.div
      className="max-w-4xl mx-auto p-4 md:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        className="bg-gradient-to-br from-white via-[#e6f9ed] to-[#d1f2df] 
                   rounded-2xl shadow-xl border border-[#10b981] p-6 md:p-8"
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {/* Turf Name + Location */}
        <div className="mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-[#065f46] mb-1">
            {turf.name}
          </h2>
          <p className="text-sm text-[#047857]/80">{turf.location}</p>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="text-sm text-[#065f46]/70">Price Per Hour</div>
          <div className="text-2xl font-extrabold text-green-600 mt-1">
            ₹{turf.pricePerHour}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-[#065f46]/80 mb-6 leading-relaxed">
          {turf.description}
        </p>

        {/* Availability Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h3 className="text-lg md:text-xl font-semibold text-[#047857] mb-3 flex items-center gap-2">
            🗓️ Availability
          </h3>
          <div className="rounded-xl border border-[#10b981]/60 bg-white/80 p-3 shadow-sm">
            <BookingCalendar
              turfId={turf._id}
              turfName={turf.name}
              initialDate={new Date().toISOString().slice(0, 10)}
              backendTimesUTC={true}
            />
          </div>
        </motion.div>

        {/* Continue Button removed per request */}
      </motion.div>
    </motion.div>
  );
}
