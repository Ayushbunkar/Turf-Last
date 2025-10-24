import Booking from "../models/Booking.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import Turf from "../models/Turf.js";
import razorpay from "../config/razorpay.js";
import crypto from "crypto";
import { sendEmail } from "../utils/email.js";
import logger from "../utils/logger.js";
import PDFDocument from 'pdfkit';
import { recordEvent } from '../utils/analytics.js';
import { alertSyntheticOrder } from '../utils/alerts.js';
import { createNotificationForUser } from './notificationController.js';

// 🟢 USER: Create Booking
export const createBooking = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  let { turfId, turfName, slot, date } = req.body;
    // If turfName provided instead of turfId, try to resolve
    if (!turfId && turfName) {
      const found = await Turf.findOne({ name: turfName });
      if (found) turfId = found._id;
    }
    logger.info('createBooking request', { user: req.user?._id, turfId, slot, date });

    const turf = await Turf.findById(turfId);
    if (!turf || !turf.isApproved)
      return res.status(404).json({ message: "Turf not available" });

    // Check if slot is already booked or reserved (pending/confirmed/paid)
    const slotConflict = await Booking.findOne({
      turf: turfId,
      "slots.startTime": slot.startTime,
      "slots.endTime": slot.endTime,
      date,
      status: { $in: ["pending", "confirmed", "paid"] },
    });

    if (slotConflict) {
      logger.warn('Slot conflict detected', { turfId, date, slotStart: slot.startTime, conflictBookingId: slotConflict._id });
      const base = { message: "Slot already reserved or booked", bookingId: slotConflict._id };
  const isOwner = req.user ? String(slotConflict.user) === String(req.user?._id) : false;
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin';
      if (isAdmin || isOwner) {
        const reserver = await User.findById(slotConflict.user).select('name email').lean();
        return res.status(409).json({ ...base, reserver: reserver ? { name: reserver.name, email: reserver.email } : undefined });
      }
      return res.status(409).json(base);
    }

    const booking = await Booking.create({
      user: req.user?._id,
      turf: turfId,
      slots: [slot],
      date,
      price: turf.pricePerHour,
      // create booking as pending until payment verification
      status: "pending",
    });

  // respond with booking so frontend can create a payment order
  const pendingTTL = Number(process.env.PENDING_BOOKING_TTL) || 900;
  const expiresAt = new Date(booking.createdAt.getTime() + pendingTTL * 1000);
  logger.info('Booking created', { bookingId: booking._id, user: req.user?._id, turf: turfId, date });
  // Emit socket event to superadmin room
  try {
    const io = req.app && req.app.get('io');
    if (io) io.to('superadmin').emit('bookingCreated', { bookingId: booking._id, turf: turfId, date });
  } catch (e) { logger.warn('Socket emit failed for bookingCreated', e.message); }
  res.status(201).json({ message: "Booking created", booking, expiresAt: expiresAt.toISOString() });
    // Do NOT send confirmation email yet; confirmation should be sent only after payment is verified.
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// � USER: Create Batch Booking (multiple slots in one request)
export const createBatchBooking = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    let { turfId, turfName, slots, date } = req.body; // slots: [{ startTime, endTime }, ...]
    if (!turfId && turfName) {
      const found = await Turf.findOne({ name: turfName });
      if (found) turfId = found._id;
    }

    if (!Array.isArray(slots) || slots.length === 0) return res.status(400).json({ message: 'Slots required' });

    const turf = await Turf.findById(turfId);
    if (!turf || !turf.isApproved) return res.status(404).json({ message: 'Turf not available' });

    // Check conflicts for any of the requested slots
    const conflicts = [];
    for (const slot of slots) {
      const slotConflict = await Booking.findOne({
        turf: turfId,
        'slots.startTime': slot.startTime,
        'slots.endTime': slot.endTime,
        date,
        status: { $in: ['pending', 'confirmed', 'paid'] },
      });
      if (slotConflict) conflicts.push({ slot, bookingId: slotConflict._id, reserver: slotConflict.user });
    }

    if (conflicts.length > 0) {
      logger.warn('Batch booking conflicts', { turfId, date, conflicts });
      // return 409 and the conflicting information
      return res.status(409).json({ message: 'One or more slots already reserved/booked', conflicts });
    }

    // create a single booking document with slots array
    const bookingDoc = await Booking.create({
      user: req.user?._id,
      turf: turfId,
      slots,
      date,
      // total price = pricePerHour * number of slots (assumes 1 hour per slot)
      price: turf.pricePerHour * slots.length,
      status: 'pending',
    });

    const pendingTTL = Number(process.env.PENDING_BOOKING_TTL) || 900;
    const expiresAt = new Date(Date.now() + pendingTTL * 1000);

  logger.info('Batch booking created', { bookingId: bookingDoc._id, user: req.user?._id, turf: turfId, slotsCount: slots.length });
  res.status(201).json({ message: 'Batch booking created', booking: bookingDoc, expiresAt: expiresAt.toISOString() });

    // Do NOT send confirmation email yet; confirmation should be sent only after payment verification.
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// �🔵 USER: Get My Bookings
export const getMyBookings = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const bookings = await Booking.find({ user: req.user?._id })
      .populate("turf", "name location pricePerHour")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟣 ADMIN: Get Bookings for My Turfs
export const getAdminBookings = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  const turfs = await Turf.find({ admin: req.user?._id });
    const turfIds = turfs.map((t) => t._id);

    const bookings = await Booking.find({ turf: { $in: turfIds } })
      .populate("user", "name email")
      .populate("turf", "name location")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔴 ADMIN/SUPERADMIN: Update Booking Status
export const updateBookingStatus = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { status } = req.body; // confirmed/cancelled
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Admin can update only their turf bookings
    if (req.user?.role === "admin") {
      const turf = await Turf.findById(booking.turf);
      if (turf.admin.toString() !== req.user?._id.toString())
        return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = status;
    await booking.save();
    // Emit socket update for booking status update
    try {
      const io = req.app && req.app.get('io');
      if (io) io.to('superadmin').emit('bookingUpdated', { bookingId: booking._id, status });
    } catch (e) { logger.warn('Socket emit failed for bookingUpdated', e.message); }
    res.json({ message: "Booking updated", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟡 SUPERADMIN: Get All Bookings
export const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 100, status = '', turf = '' } = req.query;
    const query = {};
    if (status) query.status = status;
    if (turf) {
      if (/^[0-9a-fA-F]{24}$/.test(turf)) {
        query.turf = turf;
      } else {
        const found = await Turf.findOne({ name: turf });
        if (found) query.turf = found._id;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bookingsRaw = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "name email")
      .populate("turf", "name location");

    res.json(bookingsRaw);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Public: get bookings for a specific turf, optional ?date=YYYY-MM-DD
export const getBookingsForTurf = async (req, res) => {
  try {
    let { turfId } = req.params;
    // If turfId does not look like an ObjectId, try resolve by name
    if (turfId && !/^[0-9a-fA-F]{24}$/.test(turfId)) {
      const maybe = await Turf.findOne({ name: turfId });
      if (maybe) turfId = maybe._id;
    }
    const { date } = req.query;
    const filter = { turf: turfId };
    if (date) filter.date = date;
    // only return confirmed/paid bookings that block slots
    filter.status = { $in: ["confirmed", "paid"] };

    const bookings = await Booking.find(filter)
      .select('slots date status user turf')
      .populate('turf', 'name location')
      .lean();

    // flatten slots so each returned item has a single `slot` field for backwards compatibility
    const flattened = [];
    bookings.forEach((b) => {
      const base = {
        bookingId: b._id,
        date: b.date,
        status: b.status,
        turf: b.turf, // may be populated object or id
        turfName: b.turf ? (b.turf.name || (typeof b.turf === 'string' ? b.turf : '')) : '',
        user: b.user,
      };
      (b.slots || []).forEach((s) => {
        flattened.push({ ...base, slot: s });
      });
    });

  logger.debug('getBookingsForTurf', { turfId, date, count: flattened.length });
  res.json({ bookings: flattened });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET: booking by id (owner/admin/superadmin)
export const getBookingById = async (req, res) => {
  try {
    const id = req.params.id;
    const booking = await Booking.findById(id).populate('turf').populate('user', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // If user is not admin/superadmin, ensure they own the booking
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const isOwner = String(booking.user?._id || booking.user) === String(req.user?._id);
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorized to view this booking' });

    res.json({ booking });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Stream PDF invoice for a booking (owner or admin/superadmin)
export const streamInvoice = async (req, res) => {
  try {
    const id = req.params.id;
    const booking = await Booking.findById(id).populate('turf').populate('user', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // auth: owner or admin/superadmin
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const isOwner = String(booking.user?._id || booking.user) === String(req.user?._id);
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorized to view this booking' });

    // Generate PDF stream
    const doc = new PDFDocument({ margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  const inline = String(req.query.inline || '').toLowerCase() === 'true';
  const disposition = inline ? 'inline' : 'attachment';
  res.setHeader('Content-Disposition', `${disposition}; filename=invoice-${booking._id}.pdf`);
    doc.fontSize(18).text('Booking Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Booking ID: ${booking._id}`);
    doc.text(`Turf: ${booking.turf?.name || ''}`);
    doc.text(`Date: ${booking.date}`);
    const slotText = (booking.slots || []).map(s => `${s.startTime}-${s.endTime}`).join(', ');
    doc.text(`Slots: ${slotText}`);
    doc.text(`Amount: ₹${booking.price}`);
    if (booking.payment) doc.text(`Payment Txn: ${booking.payment.transactionId || booking.payment.providerPaymentId}`);
    doc.end();
    doc.pipe(res);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


// Create Razorpay Order
export const createPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    logger.info('createPaymentOrder requested', { bookingId, user: req.user?._id });

    const booking = await Booking.findById(bookingId).populate("turf");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const amount = booking.price * 100; // Amount in paise
    const options = {
      amount,
      currency: "INR",
      receipt: booking._id.toString(),
    };

    // If Razorpay keys are missing, return a synthetic order for local testing
    const hasKeys = !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;
    const mask = (k) => {
      if (!k) return null;
      if (k.length <= 10) return k[0] + '***' + k.slice(-1);
      return `${k.slice(0,6)}...${k.slice(-4)}`;
    };
    logger.info('createPaymentOrder - keys present?', { hasKeys, keyId: mask(process.env.RAZORPAY_KEY_ID) });
    if (!hasKeys) {
      // synthetic order object used for local testing
      const order = {
        id: `dev_order_${booking._id}`,
        amount: amount,
        currency: 'INR',
        receipt: booking._id.toString(),
        __dev: true,
      };
  logger.info('createPaymentOrder -> returning synthetic dev order', { bookingId: booking._id });
  alertSyntheticOrder({ bookingId: booking._id, reason: 'missing_keys' });
  return res.json({ order, keyId: process.env.RAZORPAY_KEY_ID || null });
    }

    // create a real Razorpay order
    const order = await razorpay.orders.create(options);
    logger.info('createPaymentOrder -> created real razorpay order', { bookingId: booking._id, orderId: order.id, keyId: mask(process.env.RAZORPAY_KEY_ID) });
    // return both order and key id so client can open checkout without relying solely on client env
    res.json({ order, keyId: process.env.RAZORPAY_KEY_ID || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/payments/validate-keys - attempt a harmless Razorpay call to validate configured keys
export const validateRazorpayKeys = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(400).json({ ok: false, message: 'Razorpay keys are not configured' });
    }
    // attempt to create a tiny order (amount in paise)
    try {
      const testOrder = await razorpay.orders.create({ amount: 100, currency: 'INR', receipt: 'key_check' });
      return res.json({ ok: true, message: 'Razorpay keys appear valid', testOrderId: testOrder.id });
    } catch (e) {
      // surface error details but avoid printing secret
      return res.status(502).json({ ok: false, message: 'Razorpay API call failed', detail: e?.message || String(e) });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify Payment
export const verifyPayment = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } =
      req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (process.env.NODE_ENV !== 'production') {
      // development: log expected vs received for easier debugging
      logger.debug('verifyPayment debug - expectedSignature:', expectedSignature);
      logger.debug('verifyPayment debug - received signature:', razorpay_signature);
    }

    if (expectedSignature === razorpay_signature) {
      const booking = await Booking.findById(bookingId).populate('turf');
      if (!booking) return res.status(404).json({ message: 'Booking not found' });

      // persist payment details inside booking
      booking.payment = {
        amount: booking.price,
        method: 'Razorpay',
        transactionId: razorpay_payment_id,
        providerOrderId: razorpay_order_id,
        providerPaymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: 'completed',
        date: new Date()
      };

      booking.status = "paid"; // mark as paid
      await booking.save();
      // Create a DB-backed notification for the user (if possible)
      try {
        const userIdForNotif = booking.user ? String(booking.user) : (req.user?._id ? String(req.user._id) : null);
        if (userIdForNotif) {
          await createNotificationForUser(userIdForNotif, {
            title: 'Booking Confirmed',
            message: `Your booking ${booking._id} for ${booking.turf?.name || 'the turf'} on ${booking.date} is confirmed.`,
            type: 'booking',
            meta: { bookingId: booking._id, turfId: booking.turf },
          }, { req });
        }
      } catch (e) {
        logger.warn('verifyPayment: failed to create DB-backed notification', e?.message || e);
      }
      // Emit socket update: booking paid
      try {
        const io = req.app && req.app.get('io');
        if (io) io.to('superadmin').emit('bookingUpdated', { bookingId: booking._id, status: 'paid' });
      } catch (e) { logger.warn('Socket emit failed for bookingUpdated (payment)', e.message); }

      // send confirmation email (respecting user preferences)
      // compose human-friendly slot/time text from slots array
      const slotText = (booking.slots || []).map(s => `${s.startTime}-${s.endTime}`).join(', ');
      // resolve recipient and user preferences
      let recipient = req.user?.email;
      let recipientName = req.user?.name;
      let targetUser = null;
      if (booking.user) {
        try {
          targetUser = await User.findById(booking.user).select('email name settings').lean();
        } catch (e) {
          logger.warn('verifyPayment: failed to load user for preferences/email fallback', e.message);
          targetUser = null;
        }
      }
      if (!recipient && targetUser) {
        recipient = targetUser.email;
        recipientName = targetUser.name;
      }

      // Determine preferences (default: enabled unless explicitly false)
      const prefs = (targetUser && targetUser.settings) || (req.user && req.user.settings) || {};
      const allowEmail = prefs.emailNotifications !== false && prefs.paymentAlerts !== false;
      const allowPush = prefs.pushNotifications !== false && prefs.paymentAlerts !== false;

      if (recipient && allowEmail) {
        const plain = `Hi ${recipientName || 'User'},\n\nYour payment of ₹${booking.price} for turf ${booking.turf?.name || 'the turf'} was successful.\n\nBooking ID: ${booking._id}\nDate: ${booking.date}\nSlots: ${slotText}\n\nThank you for booking with us.`;
        const html = `
          <div style="font-family:Arial,Helvetica,sans-serif;color:#111">
            <h2>Payment Successful — Booking Confirmed</h2>
            <p>Hi ${recipientName || 'User'},</p>
            <p>Your payment of <strong>₹${booking.price}</strong> for <strong>${booking.turf?.name || 'the turf'}</strong> was successful.</p>
            <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;margin-top:10px;font-size:14px">
              <tr><td style="font-weight:600">Booking ID</td><td>${booking._id}</td></tr>
              <tr><td style="font-weight:600">Date</td><td>${booking.date}</td></tr>
              <tr><td style="font-weight:600">Slots</td><td>${slotText}</td></tr>
              <tr><td style="font-weight:600">Amount</td><td>₹${booking.price}</td></tr>
              <tr><td style="font-weight:600">Payment Txn</td><td>${razorpay_payment_id}</td></tr>
            </table>
            <p style="margin-top:14px">You can view your booking details in your account. Thank you for choosing us.</p>
          </div>
        `;
          try {
            // generate a small PDF invoice buffer
            const doc = new PDFDocument({ margin: 40 });
            const buffers = [];
            doc.on('data', (b) => buffers.push(b));
            doc.on('end', async () => {
              const pdfBuffer = Buffer.concat(buffers);
              try {
                await sendEmail({
                  to: recipient,
                  subject: 'Payment Successful',
                  text: plain,
                  html,
                  attachments: [
                    { filename: `invoice-${booking._id}.pdf`, content: pdfBuffer }
                  ]
                });
                await recordEvent('email_sent', { bookingId: booking._id, to: recipient });
              } catch (e) {
                logger.warn('verifyPayment: sendEmail with attachment failed', e?.message || e);
              }
            });

            // PDF content
            doc.fontSize(18).text('Booking Invoice', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Booking ID: ${booking._id}`);
            doc.text(`Turf: ${booking.turf?.name || ''}`);
            doc.text(`Date: ${booking.date}`);
            doc.text(`Slots: ${slotText}`);
            doc.text(`Amount: ₹${booking.price}`);
            doc.text(`Payment Txn: ${razorpay_payment_id}`);
            doc.end();
          } catch (e) {
            logger.warn('verifyPayment: failed to generate/send invoice PDF', e?.message || e);
          }
      } else if (!allowEmail) {
        logger.info('verifyPayment: user disabled email notifications, skipping email', { bookingId: booking._id, user: booking.user });
      } else {
        logger.warn('verifyPayment: no recipient email available, skipping confirmation email', { bookingId: booking._id });
      }
      // record payment success analytics
      try { await recordEvent('payment_success', { bookingId: booking._id, amount: booking.price, user: req.user?._id }); } catch (e) { /* non-fatal */ }

      // (push notifications handled by createNotificationForUser which emits via socket)
      logger.info('Payment verified and booking confirmed', { bookingId: booking._id, user: req.user?._id, amount: booking.price });
      res.json({ message: "Payment verified & booking confirmed", booking });
    } else {
      logger.warn('Payment verification failed', { bookingId, expectedSignature, receivedSignature: razorpay_signature });
      res.status(400).json({ message: "Payment verification failed" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/payments/user - return payment history for the logged-in user
export const getUserPayments = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    // find bookings that have payment info or status paid
    const bookings = await Booking.find({ user: req.user?._id, $or: [{ status: 'paid' }, { 'payment.status': 'completed' }] })
      .populate('turf', 'name')
      .sort({ 'payment.date': -1, createdAt: -1 })
      .lean();

    // shape the data for client
    const payments = bookings.map((b) => ({
      _id: b._id,
      amount: b.payment?.amount || b.price,
      status: b.payment?.status === 'completed' || b.status === 'paid' ? 'completed' : (b.payment?.status || 'pending'),
      paymentMethod: b.payment?.method || 'Unknown',
      transactionId: b.payment?.transactionId || b._id,
      date: b.payment?.date || b.updatedAt || b.createdAt,
      booking: {
        turfName: b.turf?.name,
        date: b.date,
        timeSlot: (b.slots && b.slots[0]) ? `${b.slots[0].startTime} - ${b.slots[0].endTime}` : (b.slot?.startTime ? `${b.slot.startTime} - ${b.slot.endTime}` : '')
      }
    }));

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟠 ADMIN: Release a pending booking (mark as cancelled/released)
export const releasePendingBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body; // optional reason provided by admin
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Only admins or superadmins can release pending bookings
    if (!req.user || (req.user?.role !== 'admin' && req.user?.role !== 'superadmin')) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Only pending bookings should be released through this endpoint
    if (booking.status !== 'pending') return res.status(400).json({ message: 'Only pending bookings can be released' });

    booking.status = "cancelled"; // mark cancelled/released
    await booking.save();

    // record an audit log for admin action
    try {
      await AuditLog.create({ action: 'release_pending_booking', actor: req.user?._id, targetBooking: booking._id, meta: { reason: reason || 'admin_release' } });
    } catch (e) {
      // non-fatal
      console.warn('Failed to write audit log', e.message);
    }

    res.json({ message: "Pending booking released", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cleanupPendingBookings = async (req, res) => {
  try {
    // only allow superadmin for cleanup
    if (!req.user || req.user?.role !== 'superadmin') return res.status(403).json({ message: 'Not authorized' });
    const pendingTTL = Number(process.env.PENDING_BOOKING_TTL) || 900;
    const cutoff = new Date(Date.now() - pendingTTL * 1000);
    const result = await Booking.deleteMany({ status: 'pending', createdAt: { $lt: cutoff } });
    res.json({ message: 'Cleanup done', deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: fetch recent audit logs (admin/superadmin)
export const getAuditLogs = async (req, res) => {
  try {
    // only admin/superadmin
    if (!req.user || (req.user?.role !== 'admin' && req.user?.role !== 'superadmin')) return res.status(403).json({ message: 'Not authorized' });
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200).lean();
    res.json(logs);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
