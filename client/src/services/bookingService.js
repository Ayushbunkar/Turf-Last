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

      const headers = Object.keys(bookings[0]).filter(k => typeof bookings[0][k] !== 'object');
      const rows = bookings.map(b => headers.map(h => `"${String(b[h] ?? '').replace(/"/g, '""')}"`).join(','));
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
