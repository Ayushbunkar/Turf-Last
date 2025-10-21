import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Shield, Building, UserCheck, BarChart3, IndianRupee, Activity, Bell, Database, Mail, HelpCircle, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Compact, scrollable sidebar for superadmin pages
const SuperAdminSidebar = ({ isMobileOpen = false }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/superadmin' },
    { title: 'Users', icon: Users, path: '/dashboard/superadmin/users' },
    { title: 'Turf Admins', icon: Shield, path: '/dashboard/superadmin/turf-admins' },
    { title: 'Turfs', icon: Building, path: '/dashboard/superadmin/turfs' },
    { title: 'Bookings', icon: UserCheck, path: '/dashboard/superadmin/bookings' },
    { title: 'Analytics', icon: BarChart3, path: '/dashboard/superadmin/analytics' },
  { title: 'Revenue', icon: IndianRupee, path: '/dashboard/superadmin/revenue' },
    { title: 'System Health', icon: Activity, path: '/dashboard/superadmin/system-health' },
    { title: 'Validate Razorpay', icon: Activity, path: '/admin/validate-razorpay' },
    { title: 'Notifications', icon: Bell, path: '/dashboard/superadmin/notifications' },
    { title: 'Database', icon: Database, path: '/dashboard/superadmin/database' },
    { title: 'Emails', icon: Mail, path: '/dashboard/superadmin/emails' },
    { title: 'Support', icon: HelpCircle, path: '/dashboard/superadmin/support' },
    { title: 'Settings', icon: Settings, path: '/dashboard/superadmin/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.25 }}
      className={`fixed left-0 top-20 z-40 bg-slate-900 text-white shadow-xl flex flex-col min-h-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} lg:block w-64`}
    >
      <div className="p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md flex items-center justify-center font-bold">S</div>
          {!collapsed && <div><div className="font-semibold">Super Admin</div><div className="text-xs text-slate-400">TurfOwn</div></div>}
        </div>
        <button onClick={() => setCollapsed(s => !s)} className="p-2 rounded hover:bg-slate-800">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 min-h-0">
        <ul className="space-y-1">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <li key={it.path}>
                <NavLink to={it.path} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                  <Icon className="w-5 h-5" />
                  {!collapsed && <span className="text-sm truncate">{it.title}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">{user?.name?.[0] || 'S'}</div>
          {!collapsed && <div className="flex-1"><div className="text-sm">{user?.name || 'Super Admin'}</div><div className="text-xs text-slate-400">Online</div></div>}
          <button onClick={handleLogout} className="p-2 rounded-md hover:bg-slate-800"><LogOut className="w-5 h-5 text-red-500" /></button>
        </div>
      </div>
    </motion.aside>
  );
};

export default SuperAdminSidebar;
