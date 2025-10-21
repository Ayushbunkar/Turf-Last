// import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
// import api from "../config/Api";
// import { useEffect, useState } from "react";

// const TurfBookingChart = () => {
//   const [data, setData] = useState([]);
//   const [notAuthorized, setNotAuthorized] = useState(false);

//   useEffect(() => {
//     let mounted = true;
//     const fetchData = async () => {
//       try {
//         const res = await api.get("/api/analytics/turf-bookings");
//         if (!mounted) return;
//         setData(res.data || []);
//       } catch (err) {
//         // If server returns 403, it's superadmin-only — show safe fallback
//         if (err?.response?.status === 403) {
//           setNotAuthorized(true);
//           setData([]);
//           return;
//         }
//         // otherwise log and keep empty data
//         console.error("Failed to load turf bookings for chart:", err);
//         setData([]);
//       }
//     };

//     fetchData();
//     return () => { mounted = false; };
//   }, []);

//   if (notAuthorized) {
//     return (
//       <div className="w-full">
//         <div className="mb-2 text-sm text-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-200 p-2 rounded">
//           Turf bookings chart is restricted — system-wide analytics are available to Super Admins only.
//         </div>
//         <div className="flex items-center justify-center h-64 text-gray-500">
//           No chart data available
//         </div>
//       </div>
//     );
//   }

//   return (
//     <BarChart width={600} height={300} data={data}>
//       <XAxis dataKey="turf" />
//       <YAxis />
//       <Tooltip />
//       <CartesianGrid stroke="#ccc" />
//       <Bar dataKey="bookings" fill="#8884d8" />
//     </BarChart>
//   );
// };

// export default TurfBookingChart;

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import api from "../config/Api";

const TurfBookingChart = () => {
  const [data, setData] = useState([]);
  const [notAuthorized, setNotAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const res = await api.get("/api/analytics/turf-bookings");
        if (!mounted) return;
        setData(res.data || []);
      } catch (err) {
        if (err?.response?.status === 403) {
          setNotAuthorized(true);
          setData([]);
          return;
        }
        console.error("Failed to load turf bookings for chart:", err);
        setData([]);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, []);

  if (notAuthorized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="mb-3 text-sm text-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-200 p-3 rounded-lg shadow-sm">
          ⚠️ Turf bookings chart is restricted — system-wide analytics are available to Super Admins only.
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500 font-medium">
          No chart data available
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-gradient-to-br from-[#fff7ef] via-[#f5cbaa]/30 to-[#a3542d]/10 p-4 md:p-6 rounded-2xl shadow-md border border-[#fdeada]"
    >
      <h2 className="text-lg md:text-xl font-semibold text-[#7a1d1d] mb-4 text-center">
        ⚽ Turf Booking Trends
      </h2>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e8c4a1" />
          <XAxis
            dataKey="turf"
            tick={{ fill: "#7a1d1d", fontSize: 12 }}
            axisLine={{ stroke: "#a3542d" }}
          />
          <YAxis
            tick={{ fill: "#7a1d1d", fontSize: 12 }}
            axisLine={{ stroke: "#a3542d" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(245,203,170,0.2)" }}
            contentStyle={{
              backgroundColor: "#fff7ef",
              border: "1px solid #fdeada",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          />
          <Bar
            dataKey="bookings"
            radius={[10, 10, 0, 0]}
            fill="url(#colorBookings)"
            animationDuration={1000}
            animationBegin={300}
          />
          <defs>
            <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a3542d" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#fdeada" stopOpacity={0.8} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>

      <p className="text-xs text-center mt-3 text-[#7a1d1d]/70">
        Data represents the number of turf bookings across all venues.
      </p>
    </motion.div>
  );
};

export default TurfBookingChart;
