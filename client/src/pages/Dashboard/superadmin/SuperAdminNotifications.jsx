import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SuperAdminPageTemplate from './SuperAdminPageTemplate';
import superAdminService from '../../../services/superAdminService';
import { useToast } from '../../../components/Toast/ToastContext';

export default function SuperAdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await superAdminService.getNotifications();
        if (mounted) setNotifications(res.notifications || []);
      } catch (err) {
        toast.push('Failed to load notifications', { type: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [toast]);

  function dismissNotification(id) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  async function markAllRead() {
    // optimistic UI: mark locally first
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await superAdminService.markAllNotificationsRead();
      toast.push('All notifications marked read', { type: 'success' });
    } catch (err) {
      toast.push('Failed to mark notifications read', { type: 'error' });
      // revert optimistic update if desired (simple approach: refetch)
      try {
        const res = await superAdminService.getNotifications();
        setNotifications(res.notifications || []);
      } catch (e) {
        // keep current state
      }
    }
  }

  const filtered = notifications.filter((n) => (filter === 'all' ? true : filter === 'ai' ? n.ai : !n.ai));

  return (
  <SuperAdminPageTemplate title="Notifications" subtitle="System alerts & AI insights" fullWidth={true} invertColors={true}>
      <div className="p-6 bg-white rounded-xl shadow-sm border">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-gray-500">Real-time system alerts and AI-suggested insights.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm">
              <button
                onClick={() => setFilter('all')}
                className={`px-2 py-1 rounded ${filter === 'all' ? 'bg-white shadow' : ''}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('ai')}
                className={`px-2 py-1 rounded ${filter === 'ai' ? 'bg-white shadow' : ''}`}
              >
                AI
              </button>
              <button
                onClick={() => setFilter('manual')}
                className={`px-2 py-1 rounded ${filter === 'manual' ? 'bg-white shadow' : ''}`}
              >
                Manual
              </button>
            </div>

            <button
              onClick={markAllRead}
              disabled={loading || notifications.length === 0}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-500 text-sm disabled:opacity-60"
            >
              Mark all read
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full p-6 bg-white border rounded-xl text-center text-gray-400">
                Loading...
              </motion.div>
            )}

            {!loading && filtered.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="col-span-full p-6 bg-white border rounded-xl text-center text-gray-500"
              >
                No notifications
              </motion.div>
            )}

            {filtered.map((n) => (
              <motion.article
                key={n.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
                className="relative p-4 bg-white border rounded-xl shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-indigo-600">
                          <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7v3H3l4 5h10l4-5h-2V9a7 7 0 0 0-7-7z" />
                        </svg>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold">{n.title}</h3>
                      <p className="text-sm text-gray-500">{n.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{n.time}</span>

                    {n.ai && (
                      <motion.span
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-50 to-rose-50 text-rose-600 rounded-full text-xs font-medium"
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        title="AI insight"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2a7 7 0 0 0-7 7v3H3l4 5h10l4-5h-2V9a7 7 0 0 0-7-7z" />
                        </svg>
                        AI
                      </motion.span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">Type: {n.ai ? 'AI recommended' : 'System'}</div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => dismissNotification(n.id)}
                      className="text-sm text-red-500 hover:text-red-600 px-2 py-1 rounded"
                      aria-label="Dismiss"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </SuperAdminPageTemplate>
  );
}