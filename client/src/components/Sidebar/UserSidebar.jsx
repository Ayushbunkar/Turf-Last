import React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Calendar,
  LogOut,
  Home,
  CreditCard,
  Bell,
  Settings,
  HelpCircle,
  Moon,
  Sun
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({
  onToggleDark,
  darkMode = false,
  isMobileOpen = false,
  onMobileToggle = () => {}
}) => {

  const user = JSON.parse(localStorage.getItem('user')) || {
    name: 'User',
    email: 'user@example.com'
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard/user' },
    { icon: Calendar, label: 'My Bookings', path: '/dashboard/user/my-bookings' },
    { icon: User, label: 'Profile', path: '/dashboard/user/profile' },
    { icon: CreditCard, label: 'Payment History', path: '/dashboard/user/payments' },
    { icon: Bell, label: 'Notifications', path: '/dashboard/user/notifications' },
    { icon: Settings, label: 'Settings', path: '/dashboard/user/settings' },
    { icon: HelpCircle, label: 'Help & Support', path: '/dashboard/user/help' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed left-0 z-40 w-64 bg-white  dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 
                 transform transition-transform duration-300 ease-in-out h-screen flex flex-col
                 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} lg:block`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-7  border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-semibold">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {user?.name || 'User'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu — Scrollable */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto min-h-0 user-sidebar-nav">
        <style>{`
          .user-sidebar-nav::-webkit-scrollbar {
            width: 6px;
          }
          .user-sidebar-nav::-webkit-scrollbar-track {
            background: transparent;
          }
          .user-sidebar-nav::-webkit-scrollbar-thumb {
            background-color: #d1d5db;
            border-radius: 3px;
          }
          .user-sidebar-nav::-webkit-scrollbar-thumb:hover {
            background-color: #9ca3af;
          }
          .dark .user-sidebar-nav::-webkit-scrollbar-thumb {
            background-color: #4b5563;
          }
          .dark .user-sidebar-nav::-webkit-scrollbar-thumb:hover {
            background-color: #6b7280;
          }
        `}</style>

        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-r-2 border-green-500'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDark}
          className="flex items-center space-x-3 w-full px-4 py-3 mb-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
