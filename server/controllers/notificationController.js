import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';

// Create and optionally emit via io (if provided in req.app)
export async function createNotificationForUser(userId, payload = {}, options = {}) {
  try {
    if (!userId) throw new Error('userId required');
    const doc = await Notification.create({ user: userId, ...payload });
    // emit socket event if io available in options or via req.app
    try {
      const io = options.io || (options.req && options.req.app && options.req.app.get('io'));
      if (io) {
        io.to(String(userId)).emit('notification', doc);
      }
    } catch (e) {
      logger.warn('createNotificationForUser: socket emit failed', e?.message || e);
    }
    return doc;
  } catch (err) {
    logger.error('createNotificationForUser error', err?.message || err);
    throw err;
  }
}

// List notifications for current user with pagination and optional unread filter
export async function listNotifications(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const page = Math.max(1, parseInt(req.query.page || '1'));
    const limit = Math.min(200, Math.max(10, parseInt(req.query.limit || '50')));
    const skip = (page - 1) * limit;
    const filter = { user: req.user._id };
    if (req.query.unread === 'true') filter.read = false;

    const [items, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(filter),
    ]);

    res.json({ notifications: items, meta: { page, limit, total } });
  } catch (err) {
    logger.error('listNotifications error', err?.message || err);
    res.status(500).json({ message: 'Failed to list notifications' });
  }
}

export async function markNotificationRead(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const id = req.params.id;
    const doc = await Notification.findOneAndUpdate({ _id: id, user: req.user._id }, { read: true }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Notification not found' });
    res.json({ success: true });
  } catch (err) {
    logger.error('markNotificationRead error', err?.message || err);
    res.status(500).json({ message: 'Failed to mark read' });
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    logger.error('markAllNotificationsRead error', err?.message || err);
    res.status(500).json({ message: 'Failed to mark all read' });
  }
}

export async function deleteNotification(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const id = req.params.id;
    await Notification.deleteOne({ _id: id, user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    logger.error('deleteNotification error', err?.message || err);
    res.status(500).json({ message: 'Failed to delete' });
  }
}

export async function bulkDeleteNotifications(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const ids = req.body && req.body.notificationIds ? req.body.notificationIds : (req.query && req.query.notificationIds ? req.query.notificationIds : []);
    const arr = Array.isArray(ids) ? ids : typeof ids === 'string' ? [ids] : [];
    await Notification.deleteMany({ _id: { $in: arr }, user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    logger.error('bulkDeleteNotifications error', err?.message || err);
    res.status(500).json({ message: 'Failed to bulk delete' });
  }
}

export default {
  createNotificationForUser,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  bulkDeleteNotifications,
};
