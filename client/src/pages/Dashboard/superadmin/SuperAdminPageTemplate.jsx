// Template for SuperAdmin page responsive layout
import React, { useState } from 'react';
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminNavbar from './SuperAdminNavbar';

const SuperAdminPageTemplate = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <SuperAdminSidebar isMobileOpen={mobileOpen} />

      {/* Content area */}
      <div className="lg:pl-64">
        <SuperAdminNavbar onMobileMenuToggle={() => setMobileOpen(s => !s)} />
        <main className="pt-28 px-4 lg:px-8 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminPageTemplate;