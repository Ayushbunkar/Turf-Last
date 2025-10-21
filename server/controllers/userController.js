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
