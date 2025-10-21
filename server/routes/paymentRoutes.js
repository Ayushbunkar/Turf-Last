import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { createPaymentOrder, verifyPayment, getUserPayments, validateRazorpayKeys } from "../controllers/bookingController.js";

const router = express.Router();

// Create Razorpay order
router.post("/create-order", protect, authorize("user"), createPaymentOrder);

// Get user's payment history
router.get('/user', protect, authorize('user'), getUserPayments);

// Validate Razorpay keys (protected)
router.post('/validate-keys', protect, authorize('superadmin','admin'), validateRazorpayKeys);

// Dev-only helper: complete a payment without Razorpay (for local testing)
if (process.env.NODE_ENV !== 'production') {
	router.post('/dev/complete', protect, authorize('user'), async (req, res) => {
		try {
			const { bookingId } = req.body;
			const booking = await (await import('../models/Booking.js')).default.findById(bookingId).populate('turf');
			if (!booking) return res.status(404).json({ message: 'Booking not found' });
			const logger = (await import('../utils/logger.js')).default;
			logger.info('Dev complete: marking booking as paid', { bookingId });
			booking.payment = { amount: booking.price, method: 'Dev', transactionId: `dev_txn_${booking._id}`, providerOrderId: `dev_order_${booking._id}`, providerPaymentId: `dev_pay_${booking._id}`, signature: 'devsig', status: 'completed', date: new Date() };
			booking.status = 'paid';
			await booking.save();

			// send confirmation email after marking as paid
			try {
				const { sendEmail } = await import('../utils/email.js');
				const slotText = (booking.slots || []).map(s => `${s.startTime}-${s.endTime}`).join(', ');
				// booking.user might be an ObjectId string; try to resolve a real email
				let recipient = null;
				if (booking.user && typeof booking.user === 'object') recipient = booking.user.email;
				if (!recipient && booking.user) {
					// attempt to load user document
					try {
						const User = (await import('../models/User.js')).default;
						const userDoc = await User.findById(booking.user).select('email name').lean();
						if (userDoc) recipient = userDoc.email;
					} catch (e) {
						// ignore, recipient will remain null and sendEmail will skip
					}
				}
				await sendEmail({
					to: recipient,
					subject: 'Payment Successful - Booking Confirmed',
					text: `Hi, your payment for booking ${booking._id} has been received. Your booking for ${booking.date} ${slotText} is confirmed.`,
				});
			} catch (e) { logger.warn('Dev complete: failed to send confirmation email', e.message); }

			return res.json({ message: 'Dev payment completed', booking });
		} catch (e) { return res.status(500).json({ message: e.message }); }
	});
}

// Verify payment
router.post("/verify", protect, authorize("user"), verifyPayment);

export default router;
