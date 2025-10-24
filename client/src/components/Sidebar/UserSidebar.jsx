import React, { useState, useRef, useEffect } from 'react';
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
  Menu
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({
  onToggleDark,
  darkMode = false,
  isMobileOpen = undefined,
  onMobileToggle = undefined
}) => {
  // support uncontrolled use: if parent doesn't provide isMobileOpen/onMobileToggle,
  // manage internal mobile open state here so the hamburger works on pages that don't pass control props.
  const [internalOpen, setInternalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false);
  const isControlled = typeof isMobileOpen === 'boolean' && typeof onMobileToggle === 'function';
  const mobileOpen = isControlled ? isMobileOpen : internalOpen;
  const toggleMobile = () => {
    if (isControlled) return onMobileToggle();
    setInternalOpen((v) => !v);
  };

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

  // Prompt logout (check saved preference first)
  const promptLogout = () => {
    try {
      const skip = localStorage.getItem('skipLogoutConfirm') === 'true';
      if (skip) return handleLogout();
    } catch (e) {}
    setConfirmOpen(true);
  };

  // refs for nav and fade indicators
  const navRef = useRef(null);
  const topFadeRef = useRef(null);
  const bottomFadeRef = useRef(null);

  // update fades based on scroll position
  useEffect(() => {
    const nav = navRef.current;
    const top = topFadeRef.current;
    const bottom = bottomFadeRef.current;
    if (!nav) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = nav;
      const atTop = scrollTop <= 4;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 4;
      if (top) top.classList.toggle('hidden', atTop);
      if (bottom) bottom.classList.toggle('hidden', atBottom);
    };

    // initial
    update();
    nav.addEventListener('scroll', update, { passive: true });
    // if window resizes content, re-evaluate
    window.addEventListener('resize', update);
    return () => {
      nav.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [menuItems, mobileOpen]);

  return (
    <>
      {/* Mobile hamburger - visible when sidebar is closed */}
      {!mobileOpen && (
        <button
          onClick={toggleMobile}
          className="fixed top-4 right-4 z-50 p-2 mt-15 rounded-md bg-white dark:bg-gray-800 shadow-lg lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        </button>
      )}
      {/* Backdrop for mobile when sidebar is open - click to close */}
      {mobileOpen && (
        <div onClick={toggleMobile} className="fixed inset-0 bg-black/30 z-30 lg:hidden" />
      )}
  <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed left-0 z-40 w-64 bg-white  dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 
     transform transition-transform duration-300 ease-in-out h-screen flex flex-col
   ${mobileOpen ? 'translate-x-0 mobile-open' : '-translate-x-full lg:translate-x-0'} lg:block`}
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
        {/* Mobile header logout removed; moved to bottom actions for consistency */}
      </div>

      {/* Navigation Menu — Scrollable (hidden scrollbar, subtle fade indicators) */}
      <div className="relative flex-1 min-h-0">
        <nav
          ref={navRef}
          className="user-sidebar-nav flex-1 p-4 space-y-2 overflow-y-auto min-h-0"
        >
          <style>{`
            /* hide native scrollbars on desktop but show a thin custom scrollbar on mobile when the sidebar is open */
            .user-sidebar-nav {
              -ms-overflow-style: none; /* IE and Edge */
              scrollbar-width: none; /* Firefox */
            }
            .user-sidebar-nav::-webkit-scrollbar { display: none; }

            /* Mobile: show thin scrollbar when sidebar is open (mobile-open class added to aside) */
            @media (max-width: 1023px) {
              .mobile-open .user-sidebar-nav { scrollbar-width: thin; -ms-overflow-style: auto; }
              .mobile-open .user-sidebar-nav::-webkit-scrollbar { display: block; width: 6px; }
              .mobile-open .user-sidebar-nav::-webkit-scrollbar-track { background: transparent; }
              .mobile-open .user-sidebar-nav::-webkit-scrollbar-thumb { background-color: rgba(156,163,175,0.6); border-radius: 3px; }
              .dark .mobile-open .user-sidebar-nav::-webkit-scrollbar-thumb { background-color: rgba(75,85,99,0.6); }
            }

            /* subtle fade overlays for top/bottom to indicate more content */
            .sidebar-fade {
              position: absolute;
              left: 0;
              right: 0;
              height: 28px;
              pointer-events: none;
              z-index: 30;
            }
            .sidebar-fade.top { top: 64px; /* below header */ background-image: linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0)); }
            .dark .sidebar-fade.top { background-image: linear-gradient(to bottom, rgba(17,24,39,0.95), rgba(17,24,39,0)); }
            .sidebar-fade.bottom { bottom: 88px; /* above bottom actions */ background-image: linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0)); }
            .dark .sidebar-fade.bottom { background-image: linear-gradient(to top, rgba(17,24,39,0.95), rgba(17,24,39,0)); }
            .sidebar-fade.hidden { display: none; }
          `}</style>

          {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={index}
              to={item.path}
              onClick={() => {
                if (mobileOpen) toggleMobile();
              }}
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

        {/* Top/Bottom fade indicators (show/hide via JS) */}
  <div ref={topFadeRef} id="sidebar-fade-top" className="sidebar-fade top hidden" />
  <div ref={bottomFadeRef} id="sidebar-fade-bottom" className="sidebar-fade bottom hidden" />
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
        {/* Mobile: icon-only logout (visible on mobile) */}
        <button
          onClick={promptLogout}
          className="flex lg:hidden items-center justify-center w-full p-2 rounded bg-red-50 dark:bg-red-900/10"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
        </button>

        {/* Desktop: icon+text logout (visible on lg+) */}
        <button
          onClick={promptLogout}
          className="hidden lg:flex items-center space-x-3 w-full px-4 py-3 mt-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* Logout confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setConfirmOpen(false)} />
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 z-60 w-11/12 max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm logout</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Are you sure you want to logout? You will need to login again to continue.</p>
            <label className="flex items-center gap-2 mt-3">
              <input type="checkbox" checked={rememberChoice} onChange={(e) => setRememberChoice(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Remember my choice (don't ask again)</span>
            </label>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Cancel</button>
              <button onClick={() => {
                try { if (rememberChoice) localStorage.setItem('skipLogoutConfirm', 'true'); } catch (e) {}
                setConfirmOpen(false);
                handleLogout();
              }} className="px-4 py-2 rounded bg-red-600 text-white">Logout</button>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
    </>
  );
};

export default Sidebar;
