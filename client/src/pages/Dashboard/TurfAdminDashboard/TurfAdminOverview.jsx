import React from 'react';
import { Link } from 'react-router-dom';
import { Flag, Calendar, BarChart3 } from 'lucide-react';

export default function TurfAdminOverview() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Turf Admin Overview</h1>
      <p className="text-sm text-gray-600 mb-6">Quick links and summary for your turfs.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/dashboard/admin/turfs" className="p-4 rounded-lg border hover:shadow-sm bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <Flag className="w-6 h-6 text-green-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-300">Manage Turfs</p>
              <p className="font-semibold">View & edit your listings</p>
            </div>
          </div>
        </Link>

        <Link to="/dashboard/admin/my-bookings" className="p-4 rounded-lg border hover:shadow-sm bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-300">Bookings</p>
              <p className="font-semibold">Manage incoming bookings</p>
            </div>
          </div>
        </Link>

        <Link to="/dashboard/admin/analytics" className="p-4 rounded-lg border hover:shadow-sm bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-300">Analytics</p>
              <p className="font-semibold">View revenue & bookings</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
