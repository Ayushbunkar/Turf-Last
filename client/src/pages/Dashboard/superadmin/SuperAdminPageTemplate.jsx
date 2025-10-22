import React, { useState } from 'react';
import SuperAdminSidebar from '../../../components/Sidebar/SuperAdminSidebar';
import SuperAdminNavbar from './SuperAdminNavbar';

const SuperAdminPageTemplate = ({ children, title = "Dashboard", subtitle = "", fullWidth = false, invertColors = false }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // outerBg: normal is gray-50 / dark gray-900; innerContainer: white
  // when invertColors is true we swap them: outer becomes white, inner becomes gray
  const outerBg = invertColors ? (fullWidth ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white') : (fullWidth ? 'bg-white' : 'bg-gray-50 dark:bg-gray-900');
  const innerBase = fullWidth ? 'w-full p-4 sm:p-6 lg:p-8' : 'max-w-7xl mx-auto p-4 sm:p-6 lg:p-8';
  const innerBg = invertColors ? 'bg-gray-50 dark:bg-gray-900 shadow-none rounded-none' : 'bg-white dark:bg-gray-800 shadow-md rounded-xl';

  return (
    <div className={`min-h-screen lg:mt-11 ${outerBg}`}>
      {/* Sidebar */}
      <SuperAdminSidebar isMobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Navbar */}
        <SuperAdminNavbar onMobileMenuToggle={() => setMobileOpen(s => !s)} />
          
        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className={`${innerBase} ${innerBg}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminPageTemplate;
