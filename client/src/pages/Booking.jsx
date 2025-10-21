import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../config/Api";
import { fetchBookingsForTurf, createBooking as svcCreateBooking, createBatchBooking } from '../services/bookingService';
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, X, CheckCircle, Lock } from 'lucide-react';

export default function Booking() {
  const { id } = useParams(); // turf id
  const navigate = useNavigate();
  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState(null);
  const [date, setDate] = useState("");
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [pendingExpires, setPendingExpires] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [monthStart, setMonthStart] = useState(null);
  const [showSuccess, setShowSuccess] = useState({ open: false, booking: null });

  useEffect(() => {
    let mounted = true;
    const fetchTurf = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/turfs/${id}`);
        if (!mounted) return;
        const found = res.data;
        if (!found) {
          setError("Turf not found");
          return;
        }
        setTurf(found);
        // preselect first available slot if exists
        if (found.availableSlots && found.availableSlots.length) setSlot(found.availableSlots[0]);
        // initialize monthStart to first day of current month
        const now = new Date();
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        setMonthStart(first.toISOString().slice(0,10));
      } catch (err) {
        console.error(err);
        setError("Failed to load turf");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTurf();
    return () => { mounted = false; };
  }, [id]);

  // Keyboard handlers and navigation (separate effect so it doesn't trigger refetch)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') {
        // navigate left in dates (don't go into past dates)
        if (date) {
          const d = new Date(date);
          d.setDate(d.getDate() - 1);
          const today = new Date(); today.setHours(0,0,0,0);
          if (d >= today) setDate(d.toISOString().slice(0,10));
        } else if (monthStart) {
          const prev = new Date(monthStart);
          prev.setMonth(prev.getMonth() - 1);
          setMonthStart(prev.toISOString().slice(0,10));
        }
      } else if (e.key === 'ArrowRight') {
        if (date) {
          const d = new Date(date);
          d.setDate(d.getDate() + 1);
          setDate(d.toISOString().slice(0,10));
        } else if (monthStart) {
          const next = new Date(monthStart);
          next.setMonth(next.getMonth() + 1);
          setMonthStart(next.toISOString().slice(0,10));
        }
      } else if (e.key === 'ArrowUp') {
        // move to previous slot index
        if (turf?.availableSlots?.length) {
          const idx = turf.availableSlots.findIndex(s => s === slot);
          const newIdx = Math.max(0, idx - 1);
          // skip booked slots
          let candidate = turf.availableSlots[newIdx];
          if (candidate?.isBooked) {
            // find nearest not-booked above
            let i = newIdx - 1; while (i >= 0 && turf.availableSlots[i]?.isBooked) i--;
            if (i >= 0) candidate = turf.availableSlots[i];
          }
          if (candidate && !candidate.isBooked) setSlot(candidate);
        }
      } else if (e.key === 'ArrowDown') {
        if (turf?.availableSlots?.length) {
          const idx = turf.availableSlots.findIndex(s => s === slot);
          let newIdx = Math.min(turf.availableSlots.length - 1, idx + 1);
          // skip booked slots
          let candidate = turf.availableSlots[newIdx];
          if (candidate?.isBooked) {
            let i = newIdx + 1; while (i < turf.availableSlots.length && turf.availableSlots[i]?.isBooked) i++;
            if (i < turf.availableSlots.length) { newIdx = i; candidate = turf.availableSlots[i]; }
            else candidate = null;
          }
          if (candidate && !candidate.isBooked) setSlot(candidate);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [date, slot, monthStart, turf]);

  // fetch bookings for selected date to mark booked slots
  useEffect(() => {
    if (!turf || !date) return;
    let mounted = true;
    const fetch = async () => {
      try {
        const booked = await fetchBookingsForTurf(turf._id, date) || [];
        if (!mounted) return;
        // update turf copy with booked flags
        setTurf((prev) => {
          if (!prev) return prev;
          const copy = { ...prev };
          copy.availableSlots = copy.availableSlots.map((s) => ({
            ...s,
            isBooked: booked.some(b => (b.slot && b.slot.startTime === s.startTime && b.slot.endTime === s.endTime) || (b.slots && b.slots.some(ss => ss.startTime === s.startTime && ss.endTime === s.endTime))),
          }));
          return copy;
        });
      } catch (e) {
        console.warn('Failed to fetch bookings for turf/date', e);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, [turf?._id, date]);

  // helper: build calendar days for month view (includes previous/next month padding)
  const getMonthGrid = (monthIso) => {
    if (!monthIso) return [];
    const first = new Date(monthIso);
    const year = first.getFullYear();
    const month = first.getMonth();
    const startDay = new Date(year, month, 1);
    const endDay = new Date(year, month + 1, 0);

    // determine pad start (Sunday-based)
    const padStart = startDay.getDay();
    const total = padStart + endDay.getDate();
    const rows = Math.ceil(total / 7);
    const days = [];

    // start from (1 - padStart)
    const startDate = new Date(year, month, 1 - padStart);
    for (let i = 0; i < rows * 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch(e){ return null }
  })();

  // Vite exposes env via import.meta.env in the browser — avoid using process.env here
  const pendingTTLSeconds = Number(import.meta.env.VITE_PENDING_BOOKING_TTL ?? import.meta.env.REACT_APP_PENDING_BOOKING_TTL) || 900;
  const pendingTTLMinutes = Math.floor(pendingTTLSeconds / 60);

  const createBooking = async () => {
    if (!slot || !date) return setError("Please select a date and slot");
    setProcessing(true);
    try {
      // 1) Create booking on server (status: confirmed by server logic)
      const bookingRes = await api.post(`/api/bookings`, { turfId: id, slot, date });
      const booking = bookingRes.data.booking;
      const expiresAt = bookingRes.data.expiresAt;
      if (expiresAt) {
        setPendingExpires(new Date(expiresAt));
      }

      // Instead of opening Razorpay inline, navigate to a dedicated Checkout page
      try {
        navigate(`/checkout?bookingId=${booking._id}`);
        return;
      } catch (navErr) {
        console.error('Failed to navigate to checkout', navErr);
      }
    } catch (err) {
      console.error(err);
      const resp = err?.response?.data;
      if (resp) {
        if (resp.reserver) {
          setError(`Slot already reserved by ${resp.reserver.name} (${resp.reserver.email}). Please choose another slot.`);
        } else if (resp.bookingId) {
          setError('Slot already reserved or booked. Please choose another slot.');
        } else {
          setError(resp.message || 'Booking failed');
        }
        // refresh bookings for date to update UI
        try { await api.get(`/api/bookings/turf/${id}?date=${date}`); } catch(e){ }
      } else {
        setError('Booking failed');
      }
    } finally {
      setProcessing(false);
    }
  };

  // countdown for pending booking expiry
  useEffect(() => {
    if (!pendingExpires) { setCountdown(null); return; }
    const tick = () => {
      const now = new Date();
      const diff = pendingExpires.getTime() - now.getTime();
      if (diff <= 0) { setCountdown('Expired'); setPendingExpires(null); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [pendingExpires]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Book: {turf.name}</h2>
        <p className="text-sm text-gray-600 mb-4">{turf.location}</p>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Choose date</label>
          <div className="flex items-center gap-3">
            <button onClick={() => {
              const m = new Date(monthStart); m.setMonth(m.getMonth() - 1); setMonthStart(m.toISOString().slice(0,10));
            }} className="p-2 rounded bg-gray-100"><ChevronLeft /></button>

            <div className="w-full">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium">{new Date(monthStart).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
                <div className="text-xs text-gray-500">Use ← → to change day, ↑ ↓ to change slot</div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=> <div key={d} className="text-xs text-center text-gray-500">{d}</div>)}
                {getMonthGrid(monthStart).map((d) => {
                  const iso = d.toISOString().slice(0,10);
                  const inMonth = d.getMonth() === new Date(monthStart).getMonth();
                  const selected = iso === date;
                  const today = new Date(); today.setHours(0,0,0,0);
                  const isPast = d < today;
                  return (
                    <motion.button key={iso}
                      onClick={() => { if (!isPast && inMonth) setDate(iso); }}
                      whileTap={{ scale: 0.98 }} whileHover={{ scale: isPast ? 1 : 1.03 }}
                      className={`py-2 rounded text-center ${selected ? 'bg-green-600 text-white' : inMonth ? 'bg-white' : 'bg-gray-50 text-gray-300'} ${isPast ? 'text-gray-300 cursor-not-allowed opacity-60' : ''}`}
                      disabled={isPast}
                    >{d.getDate()}</motion.button>
                  )
                })}
              </div>
            </div>

            <button onClick={() => { const m = new Date(monthStart); m.setMonth(m.getMonth() + 1); setMonthStart(m.toISOString().slice(0,10)); }} className="p-2 rounded bg-gray-100"><ChevronRight /></button>
          </div>
        </div>

        <div className="mb-4">
          {countdown && (
            <div className="mb-2 text-sm text-yellow-700 flex items-center gap-2">
              <div>Pending booking expires in <span className="font-medium">{countdown}</span></div>
              <div className="text-xs text-gray-500" title={`Pending reservations expire after ${pendingTTLMinutes} minutes`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-info">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
            </div>
          )}
          <label className="block text-sm font-medium mb-1">Choose slot</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {turf.availableSlots?.map((s, i) => {
              const active = slot === s;
              const isBooked = !!s.isBooked;
              return (
                <motion.button key={i}
                  onClick={() => { if (!isBooked) setSlot(s); }}
                  whileTap={{ scale: isBooked ? 1 : 0.98 }}
                  whileHover={{ scale: isBooked ? 1 : 1.02 }}
                  className={`px-3 py-2 rounded-lg text-left ${active ? 'bg-green-600 text-white' : isBooked ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-gray-100'} shadow-sm`}
                  disabled={isBooked}
                >
                  <div className="font-semibold flex items-center gap-2">{s.startTime} - {s.endTime} {isBooked && <Lock className="w-4 h-4 text-red-500" />}</div>
                  <div className="text-xs text-gray-500">{isBooked ? 'Unavailable' : 'Available'}</div>
                </motion.button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div>
            <div className="text-gray-500">Price</div>
            <div className="text-2xl font-bold text-green-600">₹{turf.pricePerHour}</div>
            <div className="text-xs text-gray-500">/ hour</div>
          </div>

          <div>
            <button onClick={createBooking} disabled={processing} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">
              {processing ? 'Processing...' : 'Book Now'}
            </button>
          </div>
        </div>
      </motion.div>
      {/* Success Modal */}
      {showSuccess.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-bold">Payment Successful</h3>
                  <p className="text-sm text-gray-600">Your booking is confirmed.</p>
                </div>
              </div>
              <button onClick={() => setShowSuccess({ open: false, booking: null })} className="p-2 rounded hover:bg-gray-100"><X /></button>
            </div>

            <div className="mt-4">
              <div className="text-sm">Turf: <span className="font-medium">{showSuccess.booking?.turf?.name}</span></div>
              <div className="text-sm">Date: <span className="font-medium">{showSuccess.booking?.date}</span></div>
              <div className="text-sm">Slot: <span className="font-medium">{(showSuccess.booking?.slots && showSuccess.booking.slots[0]) ? `${showSuccess.booking.slots[0].startTime} - ${showSuccess.booking.slots[0].endTime}` : (showSuccess.booking?.slot ? `${showSuccess.booking.slot.startTime} - ${showSuccess.booking.slot.endTime}` : '')}</span></div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => { setShowSuccess({ open: false, booking: null }); navigate('/dashboard/user/my-bookings'); }} className="px-4 py-2 bg-green-600 text-white rounded">Go to My Bookings</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
