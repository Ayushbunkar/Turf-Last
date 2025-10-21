// Helper utilities for BookingCalendar

// Format date as YYYY-MM-DD
export function formatDateYYYYMMDD(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// Format hour number (0-23) to 'HH:00' display
export function formatHourLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

// Map confirmed bookings array (from server) to a Set of startTime strings (HH:MM)
export function mapBookingsToSet(bookings) {
  // bookings expected shape: [{ slot: { startTime: '09:00', endTime: '10:00' }, date: 'YYYY-MM-DD', status: 'confirmed' }]
  const set = new Set();
  if (!bookings || !Array.isArray(bookings)) return set;
  for (const b of bookings) {
    // support multiple shapes: flattened per-slot entries { slot: {...} } OR full booking with slots: [{..},..]
    if (b?.slot?.startTime) set.add(b.slot.startTime);
    else if (b?.slots && Array.isArray(b.slots)) {
      for (const s of b.slots) if (s?.startTime) set.add(s.startTime);
    }
  }
  return set;
}

// Get local hour for a given date-hour in string form considering possible UTC storage
export function makeSlotDate(dateYYYYMMDD, hour) {
  // Build a Date object in local timezone at the given hour
  const [y, m, d] = dateYYYYMMDD.split('-').map(Number);
  return new Date(y, m - 1, d, hour, 0, 0, 0);
}

// If backend uses UTC-based times (date in YYYY-MM-DD and slot.startTime in HH:MM UTC),
// convert to local Date. Pass utc=true when backend values are in UTC.
export function makeSlotDateFromUTC(dateYYYYMMDD, hour) {
  const [y, m, d] = dateYYYYMMDD.split('-').map(Number);
  // build date as UTC then convert to local by creating Date using Date.UTC
  return new Date(Date.UTC(y, m - 1, d, hour, 0, 0));
}

export const SLOT_STATUS = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  UNAVAILABLE: 'unavailable',
};
