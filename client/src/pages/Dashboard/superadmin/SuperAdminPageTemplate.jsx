import React, { useState } from 'react';
import SuperAdminSidebar from '../../../components/Sidebar/SuperAdminSidebar';
import SuperAdminNavbar from './SuperAdminNavbar';

const SuperAdminPageTemplate = ({ children, title = "Dashboard", subtitle = "" }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen 0  lg:mt-11  bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <SuperAdminSidebar isMobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Navbar */}
        <SuperAdminNavbar onMobileMenuToggle={() => setMobileOpen(s => !s)} />
          
        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminPageTemplate;
