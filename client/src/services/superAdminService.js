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
      const res = await api.patch(`/turfs/${turfId}/approve`);
      return res.data;
    }
    if (action === 'block') {
      // You may need to implement a block endpoint in backend
      const res = await api.patch(`/turfs/${turfId}/block`, { reason });
      return res.data;
    }
    throw new Error('Unknown action');
  },

  // Delete turf (superadmin)
  async deleteTurf(turfId) {
    const res = await api.delete(`/turfs/${turfId}`);
    return res.data;
  },
  // Fetch revenue statistics for superadmin dashboard
  async getRevenueStats(params = {}) {
    const res = await api.get('/superadmin/revenue/statistics', typeof params === 'object' ? { params } : {});
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
      const res = await api.get('/superadmin/revenue/chart', typeof params === 'object' ? { params } : {});
      return res.data;
    } catch (err) {
      // Fallback: use statistics endpoint and extract chart data
      const statsRes = await api.get('/superadmin/revenue/statistics', typeof params === 'object' ? { params } : {});
      return statsRes.data?.revenueTrends || [];
    }
  },

  // Fetch top performing turfs for superadmin dashboard
  async getTopPerformingTurfs(params = {}) {
    const res = await api.get('/superadmin/revenue/top-turfs', typeof params === 'object' ? { params } : {});
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
      const res = await api.get('/superadmin/turfadmins/statistics');
      return res.data;
    } catch (err) {
      return { totalTurfAdmins: 0, activeTurfAdmins: 0, pendingTurfAdmins: 0 };
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
      const body = { ...(payload || {}), role: 'Turfadmin' };
      const fallback = await api.post('/api/auth/register', body);
      return fallback.data;
    }
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
      const data = await safeFetch(`${API_BASE}/superadmin/notifications`);
      return data;
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
        return res.data;
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
