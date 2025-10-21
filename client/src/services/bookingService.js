import api from "../config/Api";

const bookingService = {
  async fetchBookings(query = '') {
    try {
      // Admin bookings endpoint
      const res = await api.get(`/api/bookings/admin${query ? `?${query}` : ''}`);
      return res.data;
    } catch (e) {
      // fallback to empty list for dev
      return [];
    }
  },

  // Public: fetch confirmed/paid bookings for a specific turf and optional date (YYYY-MM-DD)
  async fetchBookingsForTurf(turfId, date) {
    try {
      const q = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await api.get(`/api/bookings/turf/${turfId}${q}`);
  // server returns { bookings: [...] } (flattened per-slot entries)
  if (res.data && Array.isArray(res.data.bookings)) return res.data.bookings;
  return res.data;
    } catch (e) {
      // bubble up error to caller so UI can show it
      throw e;
    }
  },

  // Create a booking (user must be authenticated)
  // body: { turfId, slot: { startTime, endTime }, date }
  async createBooking(body) {
    try {
      const res = await api.post(`/api/bookings`, body);
      return res.data;
    } catch (e) {
      throw e;
    }
  },

  // Create multiple bookings in one request
  async createBatchBooking(body) {
    try {
      const res = await api.post(`/api/bookings/batch`, body);
      return res.data;
    } catch (e) {
      throw e;
    }
  },

  async updateBookingStatus(id, body) {
    try {
      // server expects PUT /api/bookings/:id/status for admin updates
      const res = await api.put(`/api/bookings/${id}/status`, body);
      return res.data;
    } catch (e) {
      throw e;
    }
  },

  async exportBookings(query = '') {
    try {
      // No dedicated export endpoint on server; fetch bookings and build CSV client-side
      const bookings = await this.fetchBookings(query);
      if (!bookings || bookings.length === 0) return new Blob([""], { type: 'text/csv' });
      // Build CSV with human-friendly columns (prefer turf.name over ids)
      const headers = [
        'BookingID', 'UserName', 'UserEmail', 'UserPhone', 'TurfName', 'TurfLocation',
        'BookingDate', 'TimeSlot', 'Duration', 'Amount', 'Status', 'PaymentStatus', 'PaymentMethod'
      ];

      const rows = bookings.map((b) => {
        const userName = b.user?.name || '';
        const userEmail = b.user?.email || '';
        const userPhone = b.user?.phone || '';
        const turfName = (b.turf && (typeof b.turf === 'string' ? b.turf : b.turf.name)) || b.turfName || '';
        const turfLocation = b.turf?.location || '';
        const bookingDate = b.bookingDate || b.date || '';
        const timeSlot = b.timeSlot || (b.slot ? `${b.slot.startTime} - ${b.slot.endTime}` : (Array.isArray(b.slots) && b.slots.length ? `${b.slots[0].startTime} - ${b.slots[0].endTime}` : ''));
        const duration = b.duration || (Array.isArray(b.slots) ? b.slots.length : 1);
        const amount = b.amount || b.price || 0;
        const status = b.status || '';
        const paymentStatus = b.paymentStatus || b.payment?.status || '';
        const paymentMethod = b.paymentMethod || b.payment?.method || '';

        return headers.map((h) => {
          switch (h) {
            case 'BookingID': return `"${String(b._id ?? '')}"`;
            case 'UserName': return `"${String(userName).replace(/"/g, '""')}"`;
            case 'UserEmail': return `"${String(userEmail).replace(/"/g, '""')}"`;
            case 'UserPhone': return `"${String(userPhone).replace(/"/g, '""')}"`;
            case 'TurfName': return `"${String(turfName).replace(/"/g, '""')}"`;
            case 'TurfLocation': return `"${String(turfLocation).replace(/"/g, '""')}"`;
            case 'BookingDate': return `"${String(bookingDate).replace(/"/g, '""')}"`;
            case 'TimeSlot': return `"${String(timeSlot).replace(/"/g, '""')}"`;
            case 'Duration': return `"${String(duration).replace(/"/g, '""')}"`;
            case 'Amount': return `"${String(amount).replace(/"/g, '""')}"`;
            case 'Status': return `"${String(status).replace(/"/g, '""')}"`;
            case 'PaymentStatus': return `"${String(paymentStatus).replace(/"/g, '""')}"`;
            case 'PaymentMethod': return `"${String(paymentMethod).replace(/"/g, '""')}"`;
            default: return '""';
          }
        }).join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');
      return new Blob([csv], { type: 'text/csv' });
    } catch (e) {
      throw e;
    }
  }
};

export const fetchBookings = bookingService.fetchBookings;
export const updateBookingStatus = bookingService.updateBookingStatus;
export const exportBookings = bookingService.exportBookings;
export const fetchBookingsForTurf = bookingService.fetchBookingsForTurf;
export const createBooking = bookingService.createBooking;
export const createBatchBooking = bookingService.createBatchBooking;
export default bookingService;
