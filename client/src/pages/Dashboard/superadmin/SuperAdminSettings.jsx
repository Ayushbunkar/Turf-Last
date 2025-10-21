import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Lock,
  Bell,
  Globe,
  Shield,
  Database,
  Mail,
  Phone,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Settings as SettingsIcon,
  Palette,
  Server,
  Key,
  Users,
  Calendar,
  IndianRupee,
  FileText,
  Camera
} from "lucide-react";
import SuperAdminSidebar from '../../../components/Sidebar/SuperAdminSidebar';
import SuperAdminNavbar from './SuperAdminNavbar';
import toast from 'react-hot-toast';
import superAdminService from '../../../services/superAdminService';

const SuperAdminSettings = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: null,
    role: "superAdmin",
    lastLogin: "",
    createdAt: ""
  });

  const PROFILE_DEFAULTS = {
    name: "",
    email: "",
    phone: "",
    avatar: null,
    role: "superAdmin",
    lastLogin: "",
    createdAt: ""
  };
  
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [systemSettings, setSystemSettings] = useState({
    siteName: "TurfOwn",
    siteDescription: "Premium Turf Booking Platform",
    maintenanceMode: false,
    allowRegistrations: true,
    emailVerificationRequired: true,
    maxBookingsPerUser: 10,
    bookingCancellationHours: 24,
    defaultBookingDuration: 1,
    commissionRate: 15,
    supportEmail: "support@turfown.com",
    contactPhone: "+91 9876543210",
    privacyPolicyUrl: "",
    termsOfServiceUrl: ""
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    bookingConfirmations: true,
    paymentAlerts: true,
    systemAlerts: true,
    marketingEmails: false
  });
  const [savingNotifications, setSavingNotifications] = useState({});
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,
    ipWhitelisting: false,
    auditLogging: true
  });

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    setLoading(true);
    try {
      const [profileDataRaw, systemDataRaw, notificationDataRaw, securityDataRaw] = await Promise.all([
        superAdminService.getProfile(),
        superAdminService.getSystemSettings(),
        superAdminService.getNotificationSettings(),
        superAdminService.getSecuritySettings()
      ]);

      const profileData = profileDataRaw?.profile || profileDataRaw || {};
      const systemData = systemDataRaw?.settings || systemDataRaw || {};
      const notificationData = notificationDataRaw?.settings || notificationDataRaw || {};
      const securityData = securityDataRaw?.settings || securityDataRaw || {};

  setProfile({ ...PROFILE_DEFAULTS, ...(profileData || {}) });
      setSystemSettings(systemData);
      setNotificationSettings(notificationData);
      setSecuritySettings(securityData);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await superAdminService.updateProfile(profile);
      // service returns either { profile } or the profile object directly; ensure we update state
  const returnedProfile = updated?.profile || updated || profile;
  setProfile({ ...PROFILE_DEFAULTS, ...(returnedProfile || {}) });
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      const serverMsg = error?.response?.data?.error || error?.message || 'Failed to update profile';
      const fErrors = error?.response?.data?.fieldErrors;
      if (fErrors) {
        setFieldErrors(fErrors);
        Object.values(fErrors).forEach(msg => toast.error(msg));
      } else {
        toast.error(serverMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    
    setSaving(true);
    try {
      await superAdminService.changePassword(passwords);
      toast.success('Password changed successfully!');
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error('Error changing password:', error);
      const serverMsg = error?.response?.data?.error || error?.message || 'Failed to change password';
      toast.error(serverMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleSystemSettingsSave = async () => {
    setSaving(true);
    try {
      await superAdminService.updateSystemSettings(systemSettings);
      toast.success('System settings updated successfully!');
    } catch (error) {
      console.error('Error updating system settings:', error);
      toast.error('Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSettingsSave = async () => {
    setSaving(true);
    try {
      const res = await superAdminService.updateNotificationSettings(notificationSettings);
      // service returns the saved settings object
      const saved = res?.settings || res || {};
      setNotificationSettings(saved);
      toast.success('Notification settings updated successfully!');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  // Optimistic per-toggle save: toggles a single key and persists immediately
  const toggleNotification = async (key) => {
    const prev = notificationSettings[key];
    const next = !prev;
    // Optimistic UI update
    setNotificationSettings((p) => ({ ...p, [key]: next }));
    setSavingNotifications((s) => ({ ...s, [key]: true }));
    try {
      // send partial update (server merges)
      const res = await superAdminService.updateNotificationSettings({ [key]: next });
      const saved = res?.settings || res || {};
      // merge authoritative server settings
      setNotificationSettings((p) => ({ ...p, ...saved }));
      toast.success(`${key.replace(/([A-Z])/g, ' $1')} ${next ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Failed to save notification toggle', key, err);
      // rollback
      setNotificationSettings((p) => ({ ...p, [key]: prev }));
      const serverMsg = err?.response?.data?.error || err?.message || 'Failed to update notification';
      toast.error(serverMsg);
    } finally {
      setSavingNotifications((s) => { const copy = { ...s }; delete copy[key]; return copy; });
    }
  };

  const handleSecuritySettingsSave = async () => {
    setSaving(true);
    try {
      await superAdminService.updateSecuritySettings(securitySettings);
      toast.success('Security settings updated successfully!');
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast.error('Failed to update security settings');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'system', label: 'System', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SuperAdminSidebar />
      <div className="flex-1 lg:ml-80">
          <SuperAdminNavbar />
          <main className="p-4 lg:p-8 pb-4 pt-32 lg:pt-40 min-h-screen">
            <div className="flex items-center justify-center h-96">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-lg text-gray-600">Loading settings...</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <SuperAdminSidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onMobileClose={() => setIsMobileSidebarOpen(false)} 
      />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-80">
        <SuperAdminNavbar onMobileMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        
        <main className="p-4 lg:p-8 pb-4 pt-48 min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage platform settings and configurations</p>
            </div>
          </div>

          {/* Settings Navigation */}
          <div className="flex space-x-1 mb-8 bg-gray-200 p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Profile Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
                  <form onSubmit={handleProfileSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={profile.name ?? ''}
                          onChange={(e) => {
                            setProfile({ ...profile, name: e.target.value });
                            if (fieldErrors.name) setFieldErrors(prev => { const p = { ...prev }; delete p.name; return p; });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        {fieldErrors.name && <div className="text-sm text-red-600 mt-1">{fieldErrors.name}</div>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input
                          type="email"
                          value={profile.email ?? ''}
                          onChange={(e) => {
                            setProfile({ ...profile, email: e.target.value });
                            if (fieldErrors.email) setFieldErrors(prev => { const p = { ...prev }; delete p.email; return p; });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        {fieldErrors.email && <div className="text-sm text-red-600 mt-1">{fieldErrors.email}</div>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={profile.phone ?? ''}
                          onChange={(e) => {
                            setProfile({ ...profile, phone: e.target.value });
                            if (fieldErrors.phone) setFieldErrors(prev => { const p = { ...prev }; delete p.phone; return p; });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {fieldErrors.phone && <div className="text-sm text-red-600 mt-1">{fieldErrors.phone}</div>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <input
                          type="text"
                          value={profile.role ?? ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>

                    {profile.lastLogin && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Login</label>
                          <div className="text-sm text-gray-600">{formatDate(profile.lastLogin)}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Account Created</label>
                          <div className="text-sm text-gray-600">{formatDate(profile.createdAt)}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Change Password */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword.current ? "text" : "password"}
                          value={passwords.currentPassword}
                          onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword.new ? "text" : "password"}
                          value={passwords.newPassword}
                          onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword.confirm ? "text" : "password"}
                          value={passwords.confirmPassword}
                          onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        <span>{saving ? 'Changing...' : 'Change Password'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'system' && (
              <motion.div
                key="system"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
                  <button
                    onClick={handleSystemSettingsSave}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                    <input
                      type="text"
                      value={systemSettings.siteName}
                      onChange={(e) => setSystemSettings({ ...systemSettings, siteName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                    <input
                      type="email"
                      value={systemSettings.supportEmail}
                      onChange={(e) => setSystemSettings({ ...systemSettings, supportEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
                    <textarea
                      value={systemSettings.siteDescription}
                      onChange={(e) => setSystemSettings({ ...systemSettings, siteDescription: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={systemSettings.commissionRate}
                      onChange={(e) => setSystemSettings({ ...systemSettings, commissionRate: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Bookings Per User</label>
                    <input
                      type="number"
                      min="1"
                      value={systemSettings.maxBookingsPerUser}
                      onChange={(e) => setSystemSettings({ ...systemSettings, maxBookingsPerUser: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Maintenance Mode</h4>
                      <p className="text-sm text-gray-600">Enable to temporarily disable the platform for maintenance</p>
                    </div>
                    <button
                      onClick={() => setSystemSettings({ ...systemSettings, maintenanceMode: !systemSettings.maintenanceMode })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        systemSettings.maintenanceMode ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          systemSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Allow User Registrations</h4>
                      <p className="text-sm text-gray-600">Allow new users to register on the platform</p>
                    </div>
                    <button
                      onClick={() => setSystemSettings({ ...systemSettings, allowRegistrations: !systemSettings.allowRegistrations })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        systemSettings.allowRegistrations ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          systemSettings.allowRegistrations ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
                  <button
                    onClick={handleNotificationSettingsSave}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {key === 'emailNotifications' && 'Receive notifications via email'}
                          {key === 'smsNotifications' && 'Receive notifications via SMS'}
                          {key === 'pushNotifications' && 'Receive push notifications'}
                          {key === 'bookingConfirmations' && 'Get notified about booking confirmations'}
                          {key === 'paymentAlerts' && 'Get notified about payment transactions'}
                          {key === 'systemAlerts' && 'Receive system and security alerts'}
                          {key === 'marketingEmails' && 'Receive marketing and promotional emails'}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleNotification(key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          value ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                        disabled={!!savingNotifications[key]}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                        {savingNotifications[key] && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <RefreshCw className="w-3 h-3 animate-spin text-white" />
                          </div>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                  <button
                    onClick={handleSecuritySettingsSave}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={securitySettings.loginAttempts}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, loginAttempts: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-600">Enable 2FA for additional security</p>
                    </div>
                    <button
                      onClick={() => setSecuritySettings({ ...securitySettings, twoFactorAuth: !securitySettings.twoFactorAuth })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        securitySettings.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          securitySettings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Audit Logging</h4>
                      <p className="text-sm text-gray-600">Log all administrative actions</p>
                    </div>
                    <button
                      onClick={() => setSecuritySettings({ ...securitySettings, auditLogging: !securitySettings.auditLogging })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        securitySettings.auditLogging ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          securitySettings.auditLogging ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminSettings;
