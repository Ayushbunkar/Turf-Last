import api from "../config/Api";

const API_BASE = import.meta.env.VITE_API_BASE || '';

async function safeFetch(url) {
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    throw err;
  }
}

const superAdminService = {
  // Update a turf admin's details (used by edit modal)
  async updateTurfAdmin(adminId, payload) {
    const res = await api.patch(`/superadmin/turfadmins/${adminId}`, payload);
    return res.data;
  },
  // Fetch database tables (collections) for SuperAdminDatabase.jsx
  async getDatabaseTables() {
    try {
      const res = await this.getDatabaseStats();
      return res.collections || [];
    } catch (err) {
      return [];
    }
  },
  // Fetch database stats for SuperAdminDatabase.jsx
  async getDatabaseStats() {
    try {
      const res = await api.get('/superadmin/database/stats');
      return res.data;
    } catch (err) {
      return { collections: [], stats: {} };
    }
  },
  // Fetch all bookings for superadmin dashboard
  async getAllBookings(filters = {}) {
    try {
      const res = await api.get('/superadmin/bookings', { params: filters });
      // Normalize response: controller may return array or { bookings, pagination }
      if (Array.isArray(res.data)) {
        return { bookings: res.data, pagination: { totalPages: 1, totalBookings: res.data.length } };
      }
      return res.data;
    } catch (err) {
      return { bookings: [], pagination: { totalPages: 1, totalBookings: 0 } };
    }
  },

  // Fetch booking statistics for superadmin dashboard
  async getBookingStatistics() {
    try {
      const res = await api.get('/superadmin/bookings/statistics');
      return res.data;
    } catch (err) {
      return { totalBookings: 0, totalRevenue: 0 };
    }
  },
  // Update turf status (approve/block)
  async updateTurfStatus(turfId, action, reason = '') {
    if (action === 'approve') {
      const res = await api.patch(`/api/turfs/${turfId}/approve`);
      return res.data;
    }
    if (action === 'block') {
      // Pass reason in body to backend block endpoint
      const res = await api.patch(`/api/turfs/${turfId}/block`, { reason });
      return res.data;
    }
    throw new Error('Unknown action');
  },

  // Set turf status (approve | block | pending | active)
  // - approve/active will call approve endpoint
  // - block will call block endpoint
  // - pending will update the turf to isApproved=false and status='pending'
  async setTurfStatus(turfId, status, opts = {}) {
    const s = String(status || '').toLowerCase();
    if (s === 'approve' || s === 'active') {
      return this.updateTurfStatus(turfId, 'approve');
    }
    if (s === 'block' || s === 'blocked') {
      return this.updateTurfStatus(turfId, 'block', opts.reason || '');
    }
    if (s === 'pending') {
      // use update endpoint to set status/isApproved
      const payload = { status: 'pending', isApproved: false };
      const res = await api.put(`/api/turfs/${turfId}`, payload);
      return res.data;
    }
    // fallback - try to update status field
    const res = await api.put(`/api/turfs/${turfId}`, { status });
    return res.data;
  },

  // Batch update turfs status (superadmin)
  async batchSetTurfStatus(turfIds = [], status, reason = '') {
    const res = await api.patch('/superadmin/turfs/batch-status', { turfIds, status, reason });
    return res.data;
  },

  // Delete turf (superadmin)
  async deleteTurf(turfId) {
    try {
      const res = await api.delete(`/superadmin/turfs/${turfId}`);
      return res.data;
    } catch (err) {
      // Extract meaningful message for UI
      const msg = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Failed to delete turf';
      const status = err?.response?.status;
      const e = new Error(msg);
      e.status = status;
      throw e;
    }
  },
  // Fetch revenue statistics for superadmin dashboard
  async getRevenueStats(params = {}) {
    // Accept either an object of params or a short string like '30d' which we'll map to timeRange
    const buildParams = (p) => (typeof p === 'string' ? { timeRange: p } : (typeof p === 'object' ? p : {}));
    const res = await api.get('/superadmin/revenue/statistics', { params: buildParams(params) });
    return res.data;
  },


  // Fetch database backups from backend
  async getDatabaseBackups() {
    try {
      const res = await api.get('/superadmin/database/backups');
      return res.data.backups || [];
    } catch (err) {
      return [];
    }
  },

  // Create a new database backup (manual trigger)
  async createDatabaseBackup(payload = {}) {
    try {
      const res = await api.post('/superadmin/database/backups', payload);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // Restore a backup by id
  async restoreDatabaseBackup(id) {
    try {
      const res = await api.post(`/superadmin/database/backups/${id}/restore`);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // Download a backup file by id
  async downloadBackup(id) {
    try {
      const res = await api.get(`/superadmin/database/backups/${id}/download`, { responseType: 'blob' });
      if (typeof window !== 'undefined' && res && res.data) {
        const contentDisposition = res.headers && res.headers['content-disposition'];
        let filename = `backup_${id}.bin`;
        if (contentDisposition) {
          const match = /filename="?([^\"]+)"?/.exec(contentDisposition);
          if (match) filename = match[1];
        }
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        a.parentNode.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      return true;
    } catch (err) {
      throw err;
    }
  },

  // Delete a backup by id
  async deleteBackup(id) {
    try {
      const res = await api.delete(`/superadmin/database/backups/${id}`);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // Fetch database queries from backend
  async getDatabaseQueries() {
    try {
      const res = await api.get('/superadmin/database/queries');
      return res.data.queries || [];
    } catch (err) {
      return [];
    }
  },

  // Fetch database performance from backend
  async getDatabasePerformance() {
    try {
      const res = await api.get('/superadmin/database/performance');
      return res.data.performance || [];
    } catch (err) {
      return [];
    }
  },

  // Fetch revenue chart data for superadmin dashboard
  async getRevenueChartData(params = {}) {
    try {
      // Try to fetch from dedicated chart endpoint
      const buildParams = (p) => (typeof p === 'string' ? { timeRange: p } : (typeof p === 'object' ? p : {}));
      const res = await api.get('/superadmin/revenue/chart', { params: buildParams(params) });
      return res.data;
    } catch (err) {
      // Fallback: use statistics endpoint and extract chart data
      const buildParams = (p) => (typeof p === 'string' ? { timeRange: p } : (typeof p === 'object' ? p : {}));
      const statsRes = await api.get('/superadmin/revenue/statistics', { params: buildParams(params) });
      return statsRes.data?.revenueTrends || [];
    }
  },

  // Fetch top performing turfs for superadmin dashboard
  async getTopPerformingTurfs(params = {}) {
    const buildParams = (p) => (typeof p === 'string' ? { timeRange: p } : (typeof p === 'object' ? p : {}));
    const res = await api.get('/superadmin/revenue/top-turfs', { params: buildParams(params) });
    return res.data;
  },

  // Fetch recent transactions for superadmin dashboard
  async getRecentTransactions(limit = 20) {
    const res = await api.get('/superadmin/revenue/recent-transactions', { params: { limit } });
    return res.data;
  },
  // Fetch all turfs for superadmin dashboard
  async getAllTurfs(filters = {}) {
    try {
      const res = await api.get('/superadmin/turfs', { params: filters });
      return res.data;
    } catch (err) {
      return { turfs: [], pagination: { totalPages: 1, totalTurfs: 0 } };
    }
  },

  // Fetch turf statistics for superadmin dashboard
  async getTurfStats() {
    try {
      const res = await api.get('/superadmin/turfs/statistics');
      return res.data;
    } catch (err) {
      return { totalTurfs: 0, activeTurfs: 0, pendingTurfs: 0 };
    }
  },
  // Fetch all turf admins for superadmin dashboard
  async getTurfAdmins(filters = {}) {
    try {
      const res = await api.get('/superadmin/turfadmins', { params: filters });
      return res.data;
    } catch (err) {
      return { turfAdmins: [], pagination: { totalPages: 1, totalTurfAdmins: 0 } };
    }
  },

  // Fetch turf admin statistics for superadmin dashboard
  async getTurfAdminStats() {
    try {
      // Fetch turf-admin specific stats and overall turf stats, then merge.
      const [resAdmins, resTurfs] = await Promise.all([
        api.get('/superadmin/turfadmins/statistics'),
        api.get('/superadmin/turfs/statistics')
      ]);
      const adminStats = resAdmins?.data || {};
      const turfStats = resTurfs?.data || {};
      return {
        // turf-admin counts
        totalTurfAdmins: adminStats.totalTurfAdmins ?? adminStats.total ?? 0,
        activeTurfAdmins: adminStats.activeTurfAdmins ?? adminStats.active ?? 0,
        pendingTurfAdmins: adminStats.pendingTurfAdmins ?? adminStats.pending ?? 0,
        // merge overall turf counts so UI can show "Total Turfs Managed" etc.
        totalTurfs: turfStats.totalTurfs ?? turfStats.total ?? 0,
        activeTurfs: turfStats.activeTurfs ?? turfStats.active ?? 0,
        pendingTurfs: turfStats.pendingTurfs ?? turfStats.pending ?? 0,
        // keep any other fields returned by adminStats
        ...adminStats
      };
    } catch (err) {
      return { totalTurfAdmins: 0, activeTurfAdmins: 0, pendingTurfAdmins: 0, totalTurfs: 0 };
    }
  },

  // Create a new turf admin by using the public auth register endpoint and setting role to Turfadmin
  async createTurfAdmin(payload) {
    // Prefer superadmin-created endpoint which can generate and email a password
    try {
      const res = await api.post('/superadmin/turfadmins', payload || {});
      return res.data;
    } catch (err) {
  // Fallback to public register (requires password in payload)
  const body = { ...(payload || {}), role: 'turfadmin' };
  const fallback = await api.post('/api/auth/register', body);
  return fallback.data;
    }
  },


  // Update a turf admin's details (used by edit modal)
  async updateTurfAdmin(adminId, payload) {
    const res = await api.patch(`/superadmin/turfadmins/${adminId}`, payload);
    return res.data;
  },
  // Update a turf admin's status (if backend exposes such endpoint). This is a best-effort wrapper.
  async updateTurfAdminStatus(adminId, status, reason = '') {
    const res = await api.patch(`/superadmin/users/${adminId}`, { status, reason });
    return res.data;
  },

  // Delete a turf admin (superadmin)
  async deleteTurfAdmin(userId) {
    const res = await api.delete(`/superadmin/users/${userId}`);
    return res.data;
  },
  // Fetch all users with filters/pagination
  async getAllUsers(filters = {}) {
    try {
      const res = await api.get('/superadmin/users', { params: filters });
      return res.data;
    } catch (err) {
      return { users: [], pagination: { totalPages: 1, totalUsers: 0 } };
    }
  },

  // Update a user's status (approve/block/suspend) - wrapper used by UI
  async updateUserStatus(userId, payload) {
    const res = await api.patch(`/superadmin/users/${userId}`, payload);
    return res.data;
  },

  // Delete a user (superadmin)
  async deleteUser(userId) {
    const res = await api.delete(`/superadmin/users/${userId}`);
    return res.data;
  },

  // Update a user (fields like name, email, phone, address, status)
  async updateUser(userId, payload) {
    const res = await api.patch(`/superadmin/users/${userId}`, payload);
    return res.data;
  },

  // Fetch a user by id
  async getUser(userId) {
    const res = await api.get(`/superadmin/users/${userId}`);
    return res.data?.user || res.data;
  },

  // Export users to CSV (downloads file in browser)
  async exportUsersCSV(params = {}) {
    try {
      const res = await api.get('/superadmin/users/export', { params, responseType: 'blob' });
      if (typeof window !== 'undefined' && res && res.data) {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('download', `users_export_${Date.now()}.csv`);
        document.body.appendChild(a);
        a.click();
        a.parentNode.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // Create a new user
  async createUser(userData) {
    const res = await api.post('/superadmin/users', userData);
    return res.data;
  },

  // Fetch user statistics for SuperAdminUsers.jsx
  async getUserStatistics() {
    try {
      const res = await api.get('/superadmin/users/statistics');
      return res.data;
    } catch (err) {
      return { totalUsers: 0, activeUsers: 0, pendingUsers: 0, turfAdmins: 0 };
    }
  },
    // Fetch support tickets for SuperAdminSupport.jsx
    async getSupportTickets(params = {}) {
      try {
        const res = await api.get('/superadmin/support/tickets', { params });
        return res.data;
      } catch (err) {
        return [];
      }
    },
  async getDashboardStats() {
    try {
      const res = await api.get('/superadmin/dashboard-stats');
      return res.data;
    } catch (err) {
      return {
        totalUsers: 0,
        totalTurfs: 0,
        totalBookings: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        activeUsers: 0,
        turfAdmins: 0,
        pendingApprovals: 0,
        systemHealth: 100
      };
    }
  },
  async getRecentActivities(limit = 10) {
    try {
      const res = await api.get(`/superadmin/recent-activities?limit=${limit}`);
      return res.data;
    } catch (err) {
      return { activities: [] };
    }
  },
  async fetchOverview() {
    try {
      const res = await api.get('/superadmin/overview');
      return res.data;
    } catch (e) {
      return {};
    }
  },

  async fetchTurfAdmins() {
    try {
      const res = await api.get('/superadmin/turfadmins');
      return res.data;
    } catch (e) {
      return [];
    }
  },

  async getNotifications() {
    try {
      // Prefer axios instance for cookies and auth headers
      const res = await api.get('/superadmin/notifications');
      return res.data || { notifications: [] };
    } catch (err) {
      return {
        notifications: [
          { id: 1, type: 'warning', title: 'High Server Load', message: 'CPU at 85%', time: '2 mins ago', read: false },
          { id: 2, type: 'success', title: 'New Turf Admin', message: 'John Doe registered', time: '15 mins ago', read: false },
          { id: 3, type: 'info', title: 'Daily Report', message: 'Analytics ready', time: '1 hour ago', read: true }
        ]
      };
    }
  },

  async markAllNotificationsRead() {
    try {
      const res = await api.patch('/superadmin/notifications/mark-all-read');
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // Email management functions for SuperAdminEmails.jsx
  async getEmailCampaigns(params = {}) {
    const res = await api.get('/superadmin/emails/campaigns', { params });
    return res.data;
  },
  async getEmailTemplates(params = {}) {
    const res = await api.get('/superadmin/emails/templates', { params });
    return res.data;
  },
  async getEmailAnalytics(params = {}) {
    const res = await api.get('/superadmin/emails/analytics', { params });
    return res.data;
  },
  async getEmailStats() {
    const res = await api.get('/superadmin/emails/stats');
    return res.data;
  },
  async createEmailCampaign(data) {
    const res = await api.post('/superadmin/emails/campaigns', data);
    return res.data;
  },
  async createEmailTemplate(data) {
    const res = await api.post('/superadmin/emails/templates', data);
    return res.data;
  },
  async sendEmailCampaign(id) {
    const res = await api.post(`/superadmin/emails/campaigns/${id}/send`);
    return res.data;
  },
  async deleteEmailCampaign(id) {
    const res = await api.delete(`/superadmin/emails/campaigns/${id}`);
    return res.data;
  },
  async deleteEmailTemplate(id) {
    const res = await api.delete(`/superadmin/emails/templates/${id}`);
    return res.data;
  },

  async getSystemAlerts() {
    try {
      const data = await safeFetch(`${API_BASE}/superadmin/alerts`);
      return data;
    } catch (err) {
      return {
        alerts: [
          { id: 1, type: 'warning', message: 'Database backup overdue', severity: 'medium' },
          { id: 2, type: 'success', message: 'All services operational', severity: 'low' }
        ]
      };
    }
  },

  // --- Profile & Settings methods used by SuperAdminSettings.jsx ---
  async getProfile() {
      try {
        const res = await api.get('/superadmin/profile');
        // some controllers return { profile } while others return object directly
        return res.data?.profile || res.data || {};
      } catch (err) {
        return {};
      }
    },

    async updateProfile(payload) {
      const res = await api.put('/superadmin/profile', payload);
      return res.data?.profile || res.data;
    },

    async changePassword({ currentPassword, newPassword }) {
      const res = await api.post('/superadmin/profile/change-password', { currentPassword, newPassword });
      return res.data;
    },

    async getSystemSettings() {
      try {
        const res = await api.get('/superadmin/settings/system');
        return res.data?.settings || res.data || {};
      } catch (err) {
        return {};
      }
    },

    async updateSystemSettings(payload) {
      const res = await api.put('/superadmin/settings/system', payload);
      return res.data?.settings || res.data;
    },

    async getNotificationSettings() {
      try {
        const res = await api.get('/superadmin/settings/notifications');
        return res.data?.settings || res.data || {};
      } catch (err) {
        return {};
      }
    },

    async updateNotificationSettings(payload) {
      const res = await api.put('/superadmin/settings/notifications', payload);
      return res.data?.settings || res.data;
    },

    async getSecuritySettings() {
      try {
        const res = await api.get('/superadmin/settings/security');
        return res.data?.settings || res.data || {};
      } catch (err) {
        return {};
      }
    },

    async updateSecuritySettings(payload) {
      const res = await api.put('/superadmin/settings/security', payload);
      return res.data?.settings || res.data;
    },

  // Notification helpers used by the UI pages
  async getNotificationStats() {
    try {
      const res = await api.get('/superadmin/notifications/stats');
      return res.data;
    } catch (err) {
      return { total: 0, sent: 0, draft: 0, scheduled: 0, delivered: 0, opened: 0 };
    }
  },

  async createNotification(payload) {
    try {
      const res = await api.post('/superadmin/notifications', payload);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  async sendNotification(id) {
    try {
      const res = await api.post(`/superadmin/notifications/${id}/send`);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  async deleteNotification(id) {
    try {
      const res = await api.delete(`/superadmin/notifications/${id}`);
      return res.data;
    } catch (err) {
      throw err;
    }
  },


  // System health helpers
  async getSystemMetrics() {
    try {
      const res = await api.get('/superadmin/system/metrics');
      return res.data;
    } catch (err) {
      return null;
    }
  },

  // Import bookings via CSV (superadmin). Accepts FormData with 'file'
  async importBookingsCSV(formData, onUploadProgress) {
    try {
      const res = await api.post('/superadmin/bookings/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      });
      return res.data;
    } catch (err) {
      throw err;
    }
  },

    // Fetch support analytics for stat card change indicators
    async getSupportAnalytics() {
      try {
        const res = await api.get('/superadmin/support/analytics');
        return res.data?.stats || {};
      } catch (err) {
        return {
          totalCurrent: 0,
          totalPrev: 0,
          resolvedCurrent: 0,
          resolvedPrev: 0,
          pendingCurrent: 0,
          pendingPrev: 0,
          urgentCurrent: 0,
          urgentPrev: 0
        };
      }
    },

  async getSystemServices() {
    try {
      const res = await api.get('/superadmin/system/services');
      return res.data;
    } catch (err) {
      return [];
    }
  },

  async getPerformanceHistory(range = '1h') {
    try {
      const res = await api.get(`/superadmin/system/performance?range=${range}`);
      return res.data;
    } catch (err) {
      return [];
    }
  }
    ,
    // Analytics data for SuperAdminAnalytics.jsx
    async getAnalyticsData(params = {}) {
      try {
        // Connect to backend analytics API (corrected endpoint)
        const res = await api.get('/api/superadmin/analytics', { params: typeof params === 'object' ? params : {} });
        // Normalize: server may return data directly or inside a 'data' key
        return res.data || res;
      } catch (err) {
        throw err;
      }
    },

    // Export analytics report as CSV (client-side export)
    async exportAnalyticsReport(timeRange = '7d') {
      const safe = (v) => {
        const s = v === null || v === undefined ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
        return '"' + s.replace(/"/g, '""') + '"';
      };
      try {
        const data = await this.getAnalyticsData({ timeRange, includeComparisons: true });
        const lines = [];
        // Overview section (single-column section header)
        lines.push([safe(`Section: Overview`)].join(','));
        lines.push([safe('Metric'), safe('Value')].join(','));
        const overview = data?.overview || {};
        Object.entries(overview).forEach(([k, v]) => {
          lines.push([safe(k), safe(v)].join(','));
        });
        lines.push('');

        // Booking trends
        lines.push([safe('Section: Booking Trends')].join(','));
        lines.push([safe('Date'), safe('Bookings'), safe('Revenue')].join(','));
        (data?.bookingTrends || []).forEach(row => {
          const date = row.date || row.label || '';
          const bookings = row.bookings ?? row.count ?? '';
          const revenue = row.revenue ?? '';
          lines.push([safe(date), safe(bookings), safe(revenue)].join(','));
        });

        // Use CRLF for compatibility with Excel on Windows
        const csv = lines.join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        if (typeof window !== 'undefined') {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.setAttribute('download', `analytics_report_${timeRange}_${new Date().toISOString().slice(0,10)}.csv`);
          document.body.appendChild(a);
          a.click();
          a.parentNode.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
        return true;
      } catch (err) {
        throw err;
      }
    },

    // Export revenue report as CSV (client-side)
    async exportRevenueReport(timeFilter = '30d') {
      const safe = (v) => {
        const s = v === null || v === undefined ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
        return '"' + s.replace(/"/g, '""') + '"';
      };
      try {
        const [statsResponse, chartResponse, topResponse, transResponse] = await Promise.all([
          this.getRevenueStats(timeFilter),
          this.getRevenueChartData(timeFilter),
          this.getTopPerformingTurfs(timeFilter),
          this.getRecentTransactions(100)
        ]);

        const lines = [];
        // Overview
        lines.push([safe('Section: Overview')].join(','));
        lines.push([safe('Metric'), safe('Value')].join(','));
        const stats = statsResponse || {};
        Object.entries(stats).forEach(([k, v]) => {
          lines.push([safe(k), safe(v)].join(','));
        });
        lines.push('');

        // Revenue Trends
        lines.push([safe('Section: Revenue Trends')].join(','));
        lines.push([safe('Label'), safe('Revenue'), safe('Bookings')].join(','));
        const trends = chartResponse?.revenueTrends || [];
        trends.forEach(r => {
          const label = r.month || r.date || r.label || '';
          const revenue = r.revenue ?? r.value ?? '';
          const bookings = r.bookings ?? r.count ?? '';
          lines.push([safe(label), safe(revenue), safe(bookings)].join(','));
        });
        lines.push('');

        // Top performers
        lines.push([safe('Section: Top Performing Turfs')].join(','));
        lines.push([safe('Rank'), safe('Name'), safe('Location'), safe('Revenue')].join(','));
        const tops = topResponse?.topTurfs || topResponse || [];
        tops.forEach((t, i) => {
          lines.push([safe(i+1), safe(t.name || ''), safe(t.location || ''), safe(t.revenue ?? t.value ?? '')].join(','));
        });
        lines.push('');

        // Recent transactions
        lines.push([safe('Section: Recent Transactions')].join(','));
        lines.push([safe('TransactionID'), safe('User'), safe('Amount'), safe('Status'), safe('Date')].join(','));
        const txs = transResponse?.transactions || transResponse || [];
        txs.forEach(tx => {
          const id = tx._id || tx.id || '';
          const user = tx.user?.name || tx.userName || tx.customer || '';
          const amount = tx.amount ?? tx.price ?? '';
          const status = tx.status || tx.paymentStatus || '';
          const date = tx.createdAt || tx.date || '';
          lines.push([safe(id), safe(user), safe(amount), safe(status), safe(date)].join(','));
        });

        const csv = lines.join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        if (typeof window !== 'undefined') {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.setAttribute('download', `revenue_report_${timeFilter}_${new Date().toISOString().slice(0,10)}.csv`);
          document.body.appendChild(a);
          a.click();
          a.parentNode.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
        return true;
      } catch (err) {
        throw err;
      }
    },

    formatCurrency(amount) {
      if (typeof amount !== "number") return "-";
      return amount.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
    },

    formatDate(date, opts = {}) {
      if (!date) return "-";
      const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
      if (isNaN(d)) return "-";
      const options = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", ...opts };
      return d.toLocaleString("en-IN", options);
    },
};

export default superAdminService;
