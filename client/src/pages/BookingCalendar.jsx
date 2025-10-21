import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBookingsForTurf, createBooking, createBatchBooking } from '../services/bookingService';
import HourSlot from '../components/BookingCalendar/HourSlot';
import BookingModal from '../components/BookingCalendar/BookingModal';
import { formatDateYYYYMMDD, mapBookingsToSet, makeSlotDate, makeSlotDateFromUTC, SLOT_STATUS } from '../components/BookingCalendar/helpers';
import api from '../config/Api';
import { useToast } from '../components/Toast/ToastContext';
import '../components/BookingCalendar/styles.css';

export default function BookingCalendar({ turfId, turfName, initialDate, backendTimesUTC = false }) {
  // turfId: required prop (string)
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(() => initialDate ? new Date(initialDate) : new Date());
  const [bookings, setBookings] = useState([]);
  const [bookedSet, setBookedSet] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalHour, setModalHour] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [bookingLoading, setBookingLoading] = useState(false);

  // optimistic local map to mark slots temporarily booked
  const [optimisticBooked, setOptimisticBooked] = useState(new Set());

  const dateKey = formatDateYYYYMMDD(selectedDate);
  const toast = useToast();
  const navigate = useNavigate();

  // Return the date string param to send to backend, honoring backendTimesUTC
  function getDateParam(d = selectedDate) {
    if (backendTimesUTC) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return formatDateYYYYMMDD(d);
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // If backend stores times/dates in UTC, request using UTC date key
        const dateParam = getDateParam();
        const data = await fetchBookingsForTurf(turfId, dateParam);
        if (!mounted) return;
        setBookings(data || []);

        if (backendTimesUTC) {
          // Server returned bookings with UTC date/time. Convert each booking to local hour label
          const set = new Set();
          const localDateKey = dateKey; // selectedDate local YYYY-MM-DD
          for (const b of data || []) {
            const start = b?.slot?.startTime;
            const bdate = b?.date;
            if (!start || !bdate) continue;
            const [by, bm, bd] = bdate.split('-').map(Number);
            const [bh, bmin] = start.split(':').map(Number);
            // build UTC moment then convert to local Date
            const utcMoment = new Date(Date.UTC(by, bm - 1, bd, bh, bmin || 0, 0));
            const localKey = formatDateYYYYMMDD(utcMoment);
            if (localKey !== localDateKey) continue; // booking not on this local date
            const hourLabel = `${String(utcMoment.getHours()).padStart(2, '0')}:00`;
            set.add(hourLabel);
          }
          setBookedSet(set);
        } else {
          setBookedSet(mapBookingsToSet(data));
        }
      } catch (e) {
        setError(e?.response?.data?.message || e.message || 'Failed to load availability');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [turfId, dateKey, backendTimesUTC]);

  function hourStatus(hour) {
    const slotLabel = `${String(hour).padStart(2, '0')}:00`;
    if (bookedSet.has(slotLabel)) return SLOT_STATUS.BOOKED;
    if (optimisticBooked.has(slotLabel)) return SLOT_STATUS.BOOKED;
    // TODO: you can add business rules to mark some hours unavailable (maintenance)
    return SLOT_STATUS.AVAILABLE;
  }

  function isPastHour(hour) {
    const slotDate = makeSlotDate(dateKey, hour);
    return slotDate < new Date();
  }

  function toggleSelectHour(hour) {
    const label = `${String(hour).padStart(2, '0')}:00`;
    setSelectedSlots(prev => {
      const copy = new Set(prev);
      if (copy.has(label)) copy.delete(label); else copy.add(label);
      return copy;
    });
  }

  function openModalForSelected() {
    if (selectedSlots.size === 0) return toast.push('Select at least one slot', { type: 'error' });
    setModalOpen(true);
  }
  async function confirmBooking(slots) {
    // slots: array of 'HH:00' labels
    const toBook = slots || Array.from(selectedSlots);
    if (!toBook || toBook.length === 0) return;
    setBookingLoading(true);
    // optimistic: mark all selected as booked
    setOptimisticBooked(prev => new Set([...prev, ...toBook]));

    try {
      let bookingResp = null;
      if (toBook.length === 1) {
        // single slot: reuse existing endpoint
        const slotLabel = toBook[0];
        const hour = Number(slotLabel.split(':')[0]);
        const slot = { startTime: slotLabel, endTime: `${String(hour + 1).padStart(2, '0')}:00` };
        const body = { turfId, slot, date: getDateParam() };
        bookingResp = await createBooking(body);
      } else {
        // multiple slots: call batch endpoint
        const payloadSlots = toBook.map((slotLabel) => {
          const hour = Number(slotLabel.split(':')[0]);
          return { startTime: slotLabel, endTime: `${String(hour + 1).padStart(2, '0')}:00` };
        });
        bookingResp = await createBatchBooking({ turfId, slots: payloadSlots, date: getDateParam() });
      }

      // If booking created, attempt to start payment flow automatically
      const booking = bookingResp?.booking || bookingResp?.bookingId ? (bookingResp.booking || { _id: bookingResp.bookingId }) : null;
      if (booking && booking._id) {
        try {
          navigate(`/checkout?bookingId=${booking._id}`);
          return;
        } catch (navErr) {
          console.error('Failed to navigate to checkout', navErr);
          toast.push('Failed to start checkout. Please try again.', { type: 'error' });
        }
      }

      // refresh availability after attempting all
      await refreshAvailability();
      setModalOpen(false);
      setSelectedSlots(new Set());
      toast.push('Booking(s) created — complete payment to confirm', { type: 'success' });
    } catch (e) {
      // rollback optimistic changes for all toBook
      setOptimisticBooked(prev => {
        const copy = new Set(prev);
        for (const s of toBook) copy.delete(s);
        return copy;
      });
      toast.push(e?.response?.data?.message || e?.message || 'Booking failed', { type: 'error' });
    } finally {
      setBookingLoading(false);
    }
  }

  async function refreshAvailability() {
    setLoading(true);
    try {
      const data = await fetchBookingsForTurf(turfId, getDateParam());
      setBookings(data || []);
      setBookedSet(mapBookingsToSet(data));
      // clear optimistic map for this date
      setOptimisticBooked(new Set());
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to refresh availability');
    } finally {
      setLoading(false);
    }
  }

  function prevDay() {
    setSelectedDate(d => {
      const n = new Date(d);
      n.setDate(n.getDate() - 1);
      return n;
    });
  }

  function nextDay() {
    setSelectedDate(d => {
      const n = new Date(d);
      n.setDate(n.getDate() + 1);
      return n;
    });
  }

  return (
    <div className="booking-calendar">
      <div className="calendar-header">
        <div className="nav">
          <button onClick={prevDay} aria-label="Previous day">◀</button>
          <input
            type="date"
            value={formatDateYYYYMMDD(selectedDate)}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            aria-label="Select date"
          />
          <button onClick={nextDay} aria-label="Next day">▶</button>
        </div>
        <div className="status">
          {loading ? <span>Loading availability...</span> : error ? <span className="error">{error}</span> : <span>Showing availability for {formatDateYYYYMMDD(selectedDate)}</span>}
        </div>
      </div>

      <div className="calendar-grid">
        {Array.from({ length: 24 }).map((_, i) => {
          const status = hourStatus(i);
          const disabled = selectedDate.toDateString() === new Date().toDateString() && isPastHour(i);
          const label = `${String(i).padStart(2, '0')}:00`;
          const selected = selectedSlots.has(label);
          return (
            <HourSlot
              key={i}
              hour={i}
              status={status}
              disabled={disabled}
              onClick={(hour) => toggleSelectHour(hour)}
              className={selected ? 'selected' : ''}
            />
          );
        })}
      </div>

      <BookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmBooking}
        turfName={turfName || turfId}
        date={formatDateYYYYMMDD(selectedDate)}
        selectedSlots={Array.from(selectedSlots)}
        loading={bookingLoading}
      />

      {/* Selection footer */}
      {selectedSlots.size > 0 && (
        <div className="selection-footer">
          <div className="selected-list">Selected: {Array.from(selectedSlots).join(', ')}</div>
          <div>
            <button className="btn btn-ghost" onClick={() => setSelectedSlots(new Set())}>Clear</button>
            <button className="btn btn-primary" onClick={openModalForSelected}>Book {selectedSlots.size}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Minimal propTypes or defaultProps could be added; for integration, pass turfId prop from parent page
