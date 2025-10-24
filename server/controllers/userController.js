import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

export async function getMe(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Map DB 'address' to frontend 'location' for compatibility
    const safeUser = user.toObject();
    safeUser.location = safeUser.address || '';
    delete safeUser.address; // keep frontend property consistent
    res.json({ user: safeUser });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Failed to fetch user', details: err.message });
  }
}

export async function updateMe(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const payload = req.body || {};
    const allowed = ['name', 'email', 'phone', 'location', 'dateOfBirth'];
    const updates = {};
    Object.keys(payload).forEach((k) => {
      if (allowed.includes(k) && payload[k] !== undefined) updates[k] = payload[k];
    });

    if (updates.email) updates.email = String(updates.email).trim().toLowerCase();

    // Map frontend 'location' to DB 'address'
    if (updates.location !== undefined) {
      updates.address = updates.location;
      delete updates.location;
    }

    // Normalize dateOfBirth if provided as string (YYYY-MM-DD from HTML date input)
    if (updates.dateOfBirth !== undefined && typeof updates.dateOfBirth === 'string') {
      const parsed = new Date(updates.dateOfBirth);
      if (!isNaN(parsed.getTime())) {
        updates.dateOfBirth = parsed;
      } else {
        // if parsing fails, remove it so we don't store invalid value
        delete updates.dateOfBirth;
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const safeUser = user.toObject();
    safeUser.location = safeUser.address || '';
    delete safeUser.address;
    res.json({ user: safeUser });
  } catch (err) {
    console.error('updateMe error:', err);
    res.status(500).json({ message: 'Failed to update user', details: err.message });
  }
}

export async function getSettings(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const user = await User.findById(req.user._id).select('settings');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.settings || {});
  } catch (err) {
    console.error('getSettings error:', err);
    res.status(500).json({ message: 'Failed to fetch settings', details: err.message });
  }
}

export async function updateSettings(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const payload = req.body || {};
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Whitelist and validators for allowed settings
    const validators = {
      emailNotifications: (v) => typeof v === 'boolean',
      smsNotifications: (v) => typeof v === 'boolean',
      pushNotifications: (v) => typeof v === 'boolean',
      bookingReminders: (v) => typeof v === 'boolean',
      paymentAlerts: (v) => typeof v === 'boolean',
      promotionalEmails: (v) => typeof v === 'boolean',
      profileVisibility: (v) => ['public', 'private', 'friends'].includes(v),
      shareBookingHistory: (v) => typeof v === 'boolean',
      allowDataCollection: (v) => typeof v === 'boolean',
      twoFactorAuth: (v) => typeof v === 'boolean',
      loginAlerts: (v) => typeof v === 'boolean',
      language: (v) => typeof v === 'string' && v.length <= 10,
      timezone: (v) => typeof v === 'string' && v.length <= 50,
      currency: (v) => typeof v === 'string' && v.length <= 5,
      theme: (v) => ['light', 'dark', 'system'].includes(v),
      sessionTimeout: (v) => typeof v === 'number' && v >= 0,
      // Additional payment/profile related validators
      defaultPaymentMethod: (v) => typeof v === 'string' && v.length <= 50,
      saveCards: (v) => typeof v === 'boolean',
      autoRenewBookings: (v) => typeof v === 'boolean',
      notificationSound: (v) => typeof v === 'string' && v.length <= 50,
    };

    const allowedKeys = Object.keys(validators);
    const invalidKeys = [];
    const invalidTypes = [];

    Object.keys(payload).forEach((k) => {
      if (!allowedKeys.includes(k)) {
        invalidKeys.push(k);
        return;
      }
      const validator = validators[k];
      if (!validator(payload[k])) invalidTypes.push(k);
    });

    if (invalidKeys.length) return res.status(400).json({ message: 'Unknown setting keys', keys: invalidKeys });
    if (invalidTypes.length) return res.status(400).json({ message: 'Invalid values for settings', keys: invalidTypes });

    // Determine sensitive keys to audit
    const sensitiveKeys = ['twoFactorAuth', 'emailNotifications', 'paymentAlerts', 'defaultPaymentMethod', 'saveCards'];
    const before = { ...(user.settings || {}) };

    // Merge allowed settings
    user.settings = { ...(user.settings || {}), ...payload };
    await user.save();

    // Create audit logs for sensitive changes
    const changedSensitive = sensitiveKeys.filter((k) => {
      const beforeVal = before[k];
      const afterVal = user.settings ? user.settings[k] : undefined;
      return typeof beforeVal !== 'undefined' || typeof afterVal !== 'undefined' ? String(beforeVal) !== String(afterVal) : false;
    });

    if (changedSensitive.length) {
      try {
        const meta = changedSensitive.reduce((acc, k) => {
          acc[k] = { before: before[k], after: user.settings[k] };
          return acc;
        }, {});
        await AuditLog.create({ action: 'user.settings.update', actor: req.user._id, meta });
      } catch (auditErr) {
        // Non-fatal: log and continue
        console.warn('Failed to write audit log for settings change', auditErr);
      }
    }

    res.json(user.settings || {});
  } catch (err) {
    console.error('updateSettings error:', err);
    res.status(500).json({ message: 'Failed to update settings', details: err.message });
  }
}

// --- USER NOTIFICATIONS (simple in-memory implementation for dev) ---
// Uses a global map by userId to hold an array of notifications.
function ensureUserNotificationsStore() {
  if (!global.__userNotifications) global.__userNotifications = new Map();
}

function seedNotificationsForUser(userId) {
  ensureUserNotificationsStore();
  const map = global.__userNotifications;
  if (!map.has(String(userId))) {
    const now = Date.now();
    const list = [
      { _id: `n_${now}_1`, title: 'Welcome!', message: 'Thanks for joining Turf app.', type: 'info', createdAt: new Date(now - 1000 * 60 * 60), read: false },
      { _id: `n_${now}_2`, title: 'Booking Reminder', message: 'Your booking tomorrow at 7:00 PM', type: 'reminder', createdAt: new Date(now - 1000 * 60 * 60 * 24), read: false },
    ];
    map.set(String(userId), list);
  }
}

export async function getUserNotifications(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    ensureUserNotificationsStore();
    seedNotificationsForUser(userId);
    const list = global.__userNotifications.get(String(userId)) || [];
    return res.json({ notifications: list });
  } catch (err) {
    console.error('getUserNotifications error:', err);
    return res.status(500).json({ notifications: [] });
  }
}

export async function deleteUserNotification(req, res) {
  try {
    const userId = req.user?._id;
    const id = req.params.id;
    ensureUserNotificationsStore();
    const list = global.__userNotifications.get(String(userId)) || [];
    const after = list.filter(n => String(n._id) !== String(id));
    global.__userNotifications.set(String(userId), after);
    return res.json({ success: true });
  } catch (err) {
    console.error('deleteUserNotification error:', err);
    return res.status(500).json({ error: 'Failed to delete' });
  }
}

export async function markUserNotificationRead(req, res) {
  try {
    const userId = req.user?._id;
    const id = req.params.id;
    ensureUserNotificationsStore();
    const list = global.__userNotifications.get(String(userId)) || [];
    const updated = list.map(n => (String(n._id) === String(id) ? { ...n, read: true } : n));
    global.__userNotifications.set(String(userId), updated);
    return res.json({ success: true });
  } catch (err) {
    console.error('markUserNotificationRead error:', err);
    return res.status(500).json({ error: 'Failed to mark read' });
  }
}

export async function markAllUserNotificationsRead(req, res) {
  try {
    const userId = req.user?._id;
    ensureUserNotificationsStore();
    const list = global.__userNotifications.get(String(userId)) || [];
    const updated = list.map(n => ({ ...n, read: true }));
    global.__userNotifications.set(String(userId), updated);
    return res.json({ success: true });
  } catch (err) {
    console.error('markAllUserNotificationsRead error:', err);
    return res.status(500).json({ error: 'Failed to mark all read' });
  }
}

export async function bulkDeleteUserNotifications(req, res) {
  try {
    const userId = req.user?._id;
    const ids = (req.body && req.body.notificationIds) || (req.query && req.query.notificationIds) || [];
    const idsSet = new Set((Array.isArray(ids) ? ids : typeof ids === 'string' ? [ids] : []).map(i => String(i)));
    ensureUserNotificationsStore();
    const list = global.__userNotifications.get(String(userId)) || [];
    const after = list.filter(n => !idsSet.has(String(n._id)));
    global.__userNotifications.set(String(userId), after);
    return res.json({ success: true });
  } catch (err) {
    console.error('bulkDeleteUserNotifications error:', err);
    return res.status(500).json({ error: 'Failed to bulk delete' });
  }
}
