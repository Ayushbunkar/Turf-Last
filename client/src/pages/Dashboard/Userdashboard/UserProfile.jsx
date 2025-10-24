import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Save, Calendar, MapPin, Phone } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import Sidebar from "../../../components/Sidebar/UserSidebar";
import toast from "react-hot-toast";
import api from '../../../config/Api.jsx';

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    dateOfBirth: ""
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [editOpen, setEditOpen] = useState(false);

  // Sync local form whenever `user` changes (but don't trigger side-effects here)
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : ""
      });
    }
  }, [user]);

  // Fetch latest profile once on mount and merge if server has more complete data.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/api/user/me');
        const serverUser = (res && res.data && (res.data.user || res.data)) || null;
        if (!mounted) return;
        if (serverUser) {
          // Only update context/form if server data is meaningfully different to avoid loops
          const shouldUpdateContext = !user || String(user._id) !== String(serverUser._id) || !user.email || !user.phone || !user.location;
          if (shouldUpdateContext) {
            updateUser(serverUser);
            setProfileForm({
              name: serverUser.name || "",
              email: serverUser.email || "",
              phone: serverUser.phone || "",
              location: serverUser.location || "",
              dateOfBirth: serverUser.dateOfBirth ? serverUser.dateOfBirth.split("T")[0] : ""
            });
          }
        }
      } catch (err) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (setter) => (e) => {
    // Debug: log field changes to help diagnose uneditable inputs
    try {
      // eslint-disable-next-line no-console
      console.debug('Profile input change', e.target.name, e.target.value);
    } catch (err) {}
    setter((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitForm = async (url, data, setter, successMsg) => {
    setter(true);
    try {
      // use shared api instance which injects token
      const res = await api.patch(url.replace('http://localhost:4500', ''), data);
      if (url.includes("/me") && res?.data?.user) {
        const updated = res.data.user;
        const prevEmail = user?.email;
        updateUser(updated);
        // also update localStorage to keep in sync
        localStorage.setItem('user', JSON.stringify(updated));
        if (data.email && prevEmail && data.email !== prevEmail) {
          setEmailChanged(true);
        }
      }
      toast.success(successMsg);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      toast.error(err.response?.data?.message || "Error occurred");
    }
    setter(false);
  };

  // Modal for editing profile (re-uses submitForm for saving)
  const EditProfileModal = ({ open, onClose, initial }) => {
    const [form, setForm] = useState({ ...initial });
    useEffect(() => setForm({ ...initial }), [initial]);

    const handleLocalChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSave = async () => {
      // call the shared submitForm which updates context/localStorage
      await submitForm('http://localhost:4500/api/user/me', form, setLoading, 'Profile updated!');
      onClose();
    };

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full mx-2 sm:mx-0 max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Edit Profile</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">X</button>
          </div>
          <div className="space-y-4">
            {inputField('Full Name', User, 'name', form.name ?? '', (e) => handleLocalChange(e))}
            {inputField('Email Address', Mail, 'email', form.email ?? '', (e) => handleLocalChange(e), 'email')}
            {inputField('Phone Number', Phone, 'phone', form.phone ?? '', (e) => handleLocalChange(e), 'tel')}
            {inputField('Date of Birth', Calendar, 'dateOfBirth', form.dateOfBirth ?? '', (e) => handleLocalChange(e), 'date')}
            {inputField('Location', MapPin, 'location', form.location ?? '', (e) => handleLocalChange(e))}
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
            <button onClick={onClose} className="w-full sm:w-auto px-4 py-2 border rounded">Cancel</button>
            <button onClick={handleSave} className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded">Save</button>
          </div>
        </div>
      </div>
    );
  };

  if (!user)
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Please log in to view your profile</div>
      </div>
    );

  const inputField = (label, IconComponent, name, value, onChange, type = "text") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {IconComponent && <IconComponent className="w-4 h-4 inline mr-2" />}
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
      />
    </div>
  );

  return (
    <div
      className={`${darkMode ? "dark" : ""} min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-gray-900 dark:to-gray-800 overflow-x-hidden`}
    >
      <div className="flex">
        <Sidebar user={user} onToggleDark={() => setDarkMode(!darkMode)} darkMode={darkMode} />
  <main className="flex-1 min-w-0 ml-0 lg:ml-64 p-4 lg:p-8  pb-8 min-h-screen">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile Settings</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage your account information and security settings</p>
            </div>

            {/* Profile Header (responsive) */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-500 text-white flex items-center justify-center text-3xl sm:text-4xl font-semibold">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">{user.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                <p className="text-sm text-green-600 dark:text-green-400 capitalize">{user.role} Account</p>
              </div>
              <div className="w-full sm:w-auto mt-2 sm:mt-0">
                <button onClick={() => setEditOpen(true)} className="w-full sm:w-auto px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-6 overflow-x-auto whitespace-nowrap">
                  {['profile', 'security'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 border-b-2 font-medium text-sm inline-flex items-center ${
                        activeTab === tab ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab === 'profile' ? <User className="w-4 h-4 inline mr-2" /> : <Lock className="w-4 h-4 inline mr-2" />}
                      {tab === 'profile' ? 'Profile Information' : 'Security Settings'}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'profile' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitForm('http://localhost:4500/api/user/me', profileForm, setLoading, 'Profile updated!');
                    }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {inputField('Full Name', User, 'name', profileForm.name, handleChange(setProfileForm))}
                      {inputField('Email Address', Mail, 'email', profileForm.email, handleChange(setProfileForm), 'email')}
                      {inputField('Phone Number', Phone, 'phone', profileForm.phone, handleChange(setProfileForm), 'tel')}
                      {inputField('Date of Birth', Calendar, 'dateOfBirth', profileForm.dateOfBirth, handleChange(setProfileForm), 'date')}
                      {inputField('Location', MapPin, 'location', profileForm.location, handleChange(setProfileForm))}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto flex items-center justify-center px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 mr-2" /> {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'security' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Passwords do not match');
                      if (passwordForm.newPassword.length < 6) return toast.error('Password too short');
                      submitForm('http://localhost:4500/api/user/change-password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }, setPasswordLoading, 'Password changed!');
                    }}
                    className="space-y-6"
                  >
                    {inputField('Current Password', Lock, 'currentPassword', passwordForm.currentPassword, handleChange(setPasswordForm), 'password')}
                    {inputField('New Password', Lock, 'newPassword', passwordForm.newPassword, handleChange(setPasswordForm), 'password')}
                    {inputField('Confirm New Password', Lock, 'confirmPassword', passwordForm.confirmPassword, handleChange(setPasswordForm), 'password')}
                    <div className="flex justify-end">
                      <button type="submit" disabled={passwordLoading} className="w-full sm:w-auto flex items-center justify-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
                        <Lock className="w-4 h-4 mr-2" /> {passwordLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Edit profile modal */}
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} initial={profileForm} />

      {/* Re-login modal when email changed */}
      {emailChanged && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Email changed</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">You've updated your email address. For security reasons please sign in again with your new email.</p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/login';
                }}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Re-login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
