import React, { useState, useEffect } from "react";
import api from "../config/Api";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import TurfCard from "../components/TurfCard";

const Turfs = () => {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const loadTurfs = async () => {
      try {
        setLoading(true);
        const data = await import('../services/turfAdminService').then(mod => mod.fetchTurfs(showAll));
        if (!mounted) return;
        setTurfs(data || []);
      } catch (err) {
        console.error("Error fetching turfs:", err);
        setError("Failed to load turfs. Please try again later.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadTurfs();
    return () => { mounted = false; };
  }, [showAll]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const card = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
  };

  const getImageUrl = (turf) => {
    // turf.images may be array or field `image` depending on backend
    const src = turf.image || (Array.isArray(turf.images) && turf.images[0]) || null;
    if (!src) return null;
    // if already absolute, return
    if (src.startsWith("http")) return src;
    // If src is server-relative like '/uploads/xyz', prefix backend baseURL so browser requests backend, not Vite dev server
    if (src.startsWith("/")) return `${api.defaults.baseURL}${src}`;
    // otherwise assume it's a relative path and prefix with baseURL
    return `${api.defaults.baseURL}/${src}`;
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-center mb-8">Discover Turfs Near You</h1>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Showing: {showAll ? 'All Turfs' : 'Approved Turfs'}</h2>
        <div className="flex items-center gap-3">
          <label htmlFor="showAll" className="text-sm text-gray-600 select-none">Show all</label>
          <button
            id="showAll"
            aria-pressed={showAll}
            onClick={() => setShowAll((s) => !s)}
            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none ${showAll ? 'bg-green-600' : 'bg-gray-300'}`}
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full shadow transition-transform ${showAll ? 'translate-x-5' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg shadow p-4">
              <div className="h-44 bg-gray-200 rounded-md mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-1/3 mt-4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center text-red-600">{error}</div>
      ) : turfs.length === 0 ? (
        <div className="text-center text-lg text-gray-600">No turfs available at the moment.</div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
              {turfs.map((turf, idx) => (
            <motion.div
              key={turf._id}
              variants={card}
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
            >
              <TurfCard turf={turf} onBook={() => navigate(`/booking/summary/${turf._id}`)} index={idx} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Turfs;
