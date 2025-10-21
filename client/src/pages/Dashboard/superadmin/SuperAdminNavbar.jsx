import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, Menu, Moon, Sun, LogOut } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import superAdminService from '../../../services/superAdminService';

// Lightweight, reusable navbar for superadmin pages.
const SuperAdminNavbar = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await superAdminService.getNotifications();
        if (mounted) setNotifications(data.notifications || []);
      } catch (e) {
        // ignore; service provides fallback
      }
    })();
    return () => (mounted = false);
  }, []);

  return (
    <motion.nav
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed top-16 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-b dark:border-slate-700 px-4 py-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onMobileMenuToggle} className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800">
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Super Admin</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input className="pl-10 pr-3 py-2 rounded-md border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm placeholder-gray-500" placeholder="Search..." />
            </div>
          </div>

          <button onClick={() => setShowNotif((s) => !s)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800">
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {notifications.length > 0 && <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full px-1">{notifications.length}</span>}
            </div>
          </button>

          <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800">
            <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Validate Razorpay Keys (admin utility) */}
          {/* Validate Razorpay Keys (admin utility) icon removed as ShieldCheck is not available */}
          <a href="/admin/validate-razorpay" className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 hidden sm:inline-flex items-center gap-2 text-sm bg-amber-50 text-amber-800 dark:bg-amber-900/10 dark:text-amber-300">
            <span className="text-xs">Validate Keys</span>
          </a>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">{user?.name?.[0] || 'S'}</div>
            <div className="hidden sm:block text-sm text-gray-700 dark:text-slate-300">{user?.name || 'Super Admin'}</div>
          </div>

          <button onClick={logout} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800">
            <LogOut className="w-5 h-5 text-red-600" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default SuperAdminNavbar;