// File: RazorpayKeyValidator.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from "lucide-react"; // ✅ Lucide icons
import SuperAdminSidebar from "../../../components/Sidebar/SuperAdminSidebar";
import api from "../../../config/Api";
import SuperAdminNavbar from "./SuperAdminNavbar";

export default function RazorpayKeyValidator() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [detail, setDetail] = useState(null);
  const [percent, setPercent] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [durationMs, setDurationMs] = useState(null);
  const [persist, setPersist] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const resultRef = useRef(null);

  const run = async () => {
    // Retry with exponential backoff
    setLoading(true);
    setStatus(null);
    setDetail(null);
    setPercent(null);
    setAttempts(0);
    setDurationMs(null);
    setShowConfetti(false);

    const maxRetries = 3; // try up to 4 attempts (0..3)
    let attempt = 0;
    let delay = 500; // ms
    const start = Date.now();

    while (attempt <= maxRetries) {
      try {
        setAttempts(attempt + 1);
        const res = await api.post("/api/payments/validate-keys");
        const duration = Date.now() - start;
        setDurationMs(duration);

        let isValid = false;
        let percentValue = null;
        if (res.data) {
          isValid = !!(res.data.success || res.data.valid || res.data.ok);
          percentValue = typeof res.data.percent === "number" ? res.data.percent : (isValid ? 100 : 0);
        }
        setPercent(percentValue);
        setDetail(res.data);

        if (isValid) {
          setStatus("ok");
          // high-confidence celebration
          if (percentValue >= 95) {
            setShowConfetti(true);
          }
          // persist if requested
          if (persist) {
            try {
              localStorage.setItem("razorpayLastSuccess", JSON.stringify({ when: new Date().toISOString(), percent: percentValue, detail: res.data }));
              setLastSaved({ when: new Date().toISOString(), percent: percentValue, detail: res.data });
            } catch (e) {
              // ignore storage errors
            }
          }
        } else {
          // treat as failure and allow retry
          if (attempt === maxRetries) {
            setStatus("fail");
          } else {
            await new Promise((r) => setTimeout(r, delay));
            delay *= 2;
            attempt++;
            continue;
          }
        }

        // scroll result into view
        setTimeout(() => {
          if (resultRef.current) resultRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 40);

        break;
      } catch (err) {
        const duration = Date.now() - start;
        setDurationMs(duration);
        setDetail(err?.response?.data || { error: err.message });
        setPercent(0);
        if (attempt === maxRetries) {
          setStatus("fail");
          break;
        }
        // wait then retry
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
        attempt++;
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("razorpayLastSuccess");
      if (raw) setLastSaved(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  const clearSaved = () => {
    localStorage.removeItem("razorpayLastSuccess");
    setLastSaved(null);
  };

  // Small confetti component (simple) and animated checkmark
  const ConfettiBurst = ({ show }) => {
    if (!show) return null;
    const colors = ["#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];
    return (
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center z-50 overflow-visible">
        <div className="relative w-0 h-0">
          {colors.map((c, i) => (
            <motion.span
              key={i}
              initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
              animate={{ y: -120 - i * 10, x: (i - 2) * 24, rotate: 360, opacity: 0 }}
              transition={{ duration: 0.9, ease: "anticipate" }}
              style={{ background: c }}
              className="block w-3 h-3 rounded-sm absolute"
            />
          ))}
        </div>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-linear-to-br from-[#e8f5e9] to-[#d0f0d8] flex flex-col overflow-x-hidden w-full">
      <SuperAdminNavbar onMobileMenuToggle={() => setMobileOpen(s => !s)} />
      <div className="flex mt-20 flex-1 overflow-x-hidden w-full min-w-0">
        <SuperAdminSidebar isMobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <motion.div
          className="p-8 max-w-2xl mx-auto flex-1 w-full min-w-0"
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

          {/* Controls: persist toggle, attempts, duration */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={persist}
                onChange={() => setPersist((s) => !s)}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Save successful result</span>
            </label>

            <div className="text-sm text-gray-600 ml-0 sm:ml-4">
              {loading && <span>Attempt {attempts}…</span>}
              {!loading && durationMs != null && <span>Duration: {durationMs} ms</span>}
            </div>
          </div>

          {/* Last saved successful result (if any) */}
          {lastSaved && (
            <div className="mt-3 p-3 bg-white/70 rounded-lg text-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Last saved</div>
                  <div className="font-medium">{new Date(lastSaved.when).toLocaleString()}</div>
                  <div className="text-sm text-gray-700">Confidence: {lastSaved.percent}%</div>
                </div>
                <div>
                  <button onClick={clearSaved} className="text-xs text-red-600">Clear</button>
                </div>
              </div>
            </div>
          )}

          {/* Result Section */}
          {status && (
            <motion.div
              ref={resultRef}
              className={`mt-6 p-4 rounded-2xl shadow-md border transition-all duration-500 ${
                status === "ok" && percent >= 80
                  ? "bg-green-50 border-green-400 text-green-800 relative"
                  : "bg-red-50 border-red-400 text-red-800 relative"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Confetti overlay when applicable */}
              <ConfettiBurst show={showConfetti} />

              <div className="flex items-center gap-2 font-semibold text-lg">
                {status === "ok" && percent >= 80 ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    <span>Keys Valid ✅ ({percent !== null ? percent + '%' : '100%'})</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    <span>Validation Failed ❌ ({percent !== null ? percent + '%' : '0%'})</span>
                  </>
                )}

                {/* Animated checkmark for very high confidence */}
                {status === 'ok' && percent >= 95 && (
                  <motion.svg width="28" height="28" viewBox="0 0 24 24" className="ml-2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}>
                    <motion.path d="M20 6L9 17l-5-5" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
                  </motion.svg>
                )}
              </div>

              {durationMs != null && (
                <div className="text-xs text-gray-600 mt-2">Request duration: {durationMs} ms</div>
              )}

              <pre className="mt-3 text-xs bg-white/70 p-3 rounded-lg overflow-auto text-gray-700">
                {JSON.stringify(detail, null, 2)}
              </pre>

              {/* Retry button when failed */}
              {status === 'fail' && !loading && (
                <div className="mt-3">
                  <button onClick={run} className="px-3 py-1 bg-yellow-500 text-white rounded">Retry</button>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
