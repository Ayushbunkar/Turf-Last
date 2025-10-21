import mongoose from 'mongoose';

const DEFAULTS = {
  system: {
    siteName: 'TurfOwn',
    siteDescription: 'Premium Turf Booking Platform',
    maintenanceMode: false,
    allowRegistrations: true,
    emailVerificationRequired: true,
    maxBookingsPerUser: 10,
    bookingCancellationHours: 24,
    defaultBookingDuration: 1,
    commissionRate: 15,
    supportEmail: 'support@turfown.com',
    contactPhone: '+91 9876543210',
    privacyPolicyUrl: '',
    termsOfServiceUrl: ''
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    bookingConfirmations: true,
    paymentAlerts: true,
    systemAlerts: true,
    marketingEmails: false
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,
    ipWhitelisting: false,
    auditLogging: true
  }
};

const SettingsSchema = new mongoose.Schema({
  system: { type: mongoose.Schema.Types.Mixed, default: DEFAULTS.system },
  notifications: { type: mongoose.Schema.Types.Mixed, default: DEFAULTS.notifications },
  security: { type: mongoose.Schema.Types.Mixed, default: DEFAULTS.security }
}, { timestamps: true });

SettingsSchema.statics.getDefaults = function() {
  return DEFAULTS;
};

const Settings = mongoose.model('Settings', SettingsSchema);
export default Settings;
