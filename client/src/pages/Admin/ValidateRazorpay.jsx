// File: RazorpayKeyValidator.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from "lucide-react"; // ✅ Lucide icons
import SuperAdminSidebar from "../../components/Sidebar/SuperAdminSidebar";
import api from "../../config/Api";
import SuperAdminNavbar from "../../pages/Dashboard/superadmin/SuperAdminNavbar";

export default function RazorpayKeyValidator() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [detail, setDetail] = useState(null);
  const [percent, setPercent] = useState(null);

  const run = async () => {
    setLoading(true);
    setStatus(null);
    setDetail(null);
    try {
      // Use the configured api instance to call backend endpoint
      const res = await api.post("/api/payments/validate-keys");
      let isValid = false;
      let percentValue = null;
      if (res.data) {
        isValid = !!(res.data.success || res.data.valid || res.data.ok);
        percentValue = typeof res.data.percent === "number" ? res.data.percent : (isValid ? 100 : 0);
      }
      setPercent(percentValue);
      if (isValid) {
        setStatus("ok");
        setDetail(res.data);
      } else {
        setStatus("fail");
        setDetail(res.data);
      }
    } catch (err) {
      setStatus("fail");
      setDetail(err?.response?.data || { error: err.message });
      setPercent(0);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen  bg-gradient-to-br from-[#e8f5e9] to-[#d0f0d8] flex flex-col">
      <SuperAdminNavbar />
      <div className="flex mt-20 flex-1">
        <SuperAdminSidebar />
        <motion.div
          className="p-8 max-w-2xl mx-auto flex-1"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Heading */}
          <motion.h3
            className="text-2xl font-semibold mb-2 text-green-800"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Validate Razorpay Keys
          </motion.h3>

          <p className="mb-6 text-sm text-green-700">
            This tool makes a small Razorpay API call to ensure your keys are valid
            and active. <br /> (Admin access required)
          </p>

          {/* Run Button */}
          <motion.button
            onClick={run}
            disabled={loading}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-2xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-70"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Running...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" /> Run Validation
              </>
            )}
          </motion.button>

          {/* Result Section */}
          {status && (
            <motion.div
              className={`mt-6 p-4 rounded-2xl shadow-md border transition-all duration-500 ${
                status === "ok" && percent >= 80
                  ? "bg-green-50 border-green-400 text-green-800"
                  : "bg-red-50 border-red-400 text-red-800"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 font-semibold text-lg">
                {status === "ok" && percent >= 80 ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    Keys Valid ✅ ({percent !== null ? percent + '%' : '100%'})
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    Validation Failed ❌ ({percent !== null ? percent + '%' : '0%'})
                  </>
                )}
              </div>

              <pre className="mt-3 text-xs bg-white/70 p-3 rounded-lg overflow-auto text-gray-700">
                {JSON.stringify(detail, null, 2)}
              </pre>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
