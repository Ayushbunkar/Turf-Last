import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Check,
  Trash2,
  Filter,
  Clock,
  CheckCircle,
} from 'lucide-react';
import api from '../../../config/Api';
import { toast } from 'react-hot-toast';

const TurfAdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Update isMobile on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications'); // Adjust endpoint
      setNotifications(res.data);
      setFilteredNotifications(res.data);
    } catch (err) {
      toast.error('Failed to fetch notifications');
    }
  };

  // Update filtered notifications
  useEffect(() => {
    if (filter === 'all') {
      setFilteredNotifications(notifications);
    } else if (filter === 'unread') {
      setFilteredNotifications(notifications.filter((n) => !n.read));
    } else if (filter === 'read') {
      setFilteredNotifications(notifications.filter((n) => n.read));
    } else {
      setFilteredNotifications(notifications.filter((n) => n.type === filter));
    }
  }, [filter, notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Selection handlers
  const toggleSelect = (id) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(selectedNotifications.filter((nid) => nid !== id));
    } else {
      setSelectedNotifications([...selectedNotifications, id]);
    }
  };

  const selectAll = () => {
    setSelectedNotifications(filteredNotifications.map((n) => n._id));
  };

  const clearSelection = () => setSelectedNotifications([]);

  // Notification actions
  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success('Notification deleted');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const deleteSelected = async () => {
    try {
      await api.post('/notifications/delete-selected', { ids: selectedNotifications });
      setNotifications((prev) =>
        prev.filter((n) => !selectedNotifications.includes(n._id))
      );
      setSelectedNotifications([]);
      toast.success('Selected notifications deleted');
    } catch (err) {
      toast.error('Failed to delete selected notifications');
    }
  };

  // Helpers
  const formatTimeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'border-red-500';
    if (priority === 'medium') return 'border-yellow-500';
    return 'border-green-500';
  };

  const getNotificationIcon = (type, priority) => {
    // You can customize icons per type
    return <Bell className="w-4 h-4 text-gray-500 mr-1" />;
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className={isMobile ? 'mb-4' : 'mb-8'}>
        <div className={isMobile ? 'flex flex-col gap-2' : 'flex items-center justify-between'}>
          <div className="flex items-center">
            <Bell className={isMobile ? 'w-6 h-6 text-green-600 mr-2' : 'w-8 h-8 text-green-600 mr-3'} />
            <div>
              <h1 className={isMobile ? 'text-xl font-bold text-gray-900 dark:text-white' : 'text-3xl font-bold text-gray-900 dark:text-white'}>
                Notifications
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className={isMobile ? 'flex items-center px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs' : 'flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200'}
            >
              <CheckCircle className={isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'} />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={isMobile ? 'mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2' : 'mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4'}>
        <div className={isMobile ? 'flex flex-col gap-2' : 'flex flex-wrap items-center justify-between gap-4'}>
          <div className="flex items-center gap-2">
            <Filter className={isMobile ? 'w-3 h-3 text-gray-500' : 'w-4 h-4 text-gray-500'} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={isMobile ? 'px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs' : 'px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'}
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="booking">Bookings</option>
              <option value="payment">Payments</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          {selectedNotifications.length > 0 && (
            <div className="flex items-center gap-2">
              <span className={isMobile ? 'text-xs text-gray-600 dark:text-gray-400' : 'text-sm text-gray-600 dark:text-gray-400'}>
                {selectedNotifications.length} selected
              </span>
              <button
                onClick={deleteSelected}
                className={isMobile ? 'flex items-center px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs' : 'flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200'}
              >
                <Trash2 className={isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-1'} />
                Delete
              </button>
              <button
                onClick={() => setSelectedNotifications([])}
                className={isMobile ? 'px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs' : 'px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200'}
              >
                Clear
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className={isMobile ? 'text-xs text-green-600 hover:text-green-700' : 'text-sm text-green-600 hover:text-green-700 transition-colors duration-200'}
            >
              Select All
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className={isMobile ? 'text-center py-8 bg-white dark:bg-gray-800 rounded-lg' : 'text-center py-12 bg-white dark:bg-gray-800 rounded-xl'}>
            <Bell className={isMobile ? 'w-10 h-10 text-gray-400 mx-auto mb-2' : 'w-16 h-16 text-gray-400 mx-auto mb-4'} />
            <h3 className={isMobile ? 'text-base font-medium text-gray-900 dark:text-white mb-1' : 'text-lg font-medium text-gray-900 dark:text-white mb-2'}>
              No notifications found
            </h3>
            <p className={isMobile ? 'text-xs text-gray-600 dark:text-gray-400' : 'text-gray-600 dark:text-gray-400'}>
              {filter === 'all' ? "You're all caught up!" : `No ${filter} notifications`}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <motion.div
              key={notification._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className={`border-l-4 rounded-lg p-2 sm:p-4 bg-white dark:bg-gray-800 shadow-sm transition-all duration-200 ${getPriorityColor(notification.priority)} ${notification.read ? 'opacity-75' : ''}`}
            >
              <div className={isMobile ? 'flex flex-col gap-2' : 'flex items-start justify-between'}>
                <div className={isMobile ? 'flex items-center gap-2' : 'flex items-start space-x-3 flex-1'}>
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification._id)}
                    onChange={() => toggleSelect(notification._id)}
                    className={isMobile ? 'w-3 h-3 text-green-600 border-gray-300 rounded focus:ring-green-500' : 'mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500'}
                  />
                  <div className="flex-1">
                    <div className={isMobile ? 'flex flex-col gap-1' : 'flex items-start justify-between'}>
                      <div className={isMobile ? 'flex items-center gap-1' : 'flex items-center space-x-2'}>
                        {getNotificationIcon(notification.type, notification.priority)}
                        <h3 className={`font-medium ${notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'} ${isMobile ? 'text-sm' : ''}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && <span className={isMobile ? 'w-1.5 h-1.5 bg-green-500 rounded-full' : 'w-2 h-2 bg-green-500 rounded-full'}></span>}
                      </div>
                      <div className={isMobile ? 'flex items-center gap-1' : 'flex items-center space-x-2'}>
                        <span className={isMobile ? 'text-xs text-gray-500 dark:text-gray-400 flex items-center' : 'text-xs text-gray-500 dark:text-gray-400 flex items-center'}>
                          <Clock className={isMobile ? 'w-2 h-2 mr-1' : 'w-3 h-3 mr-1'} />
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        <div className={isMobile ? 'flex items-center gap-1' : 'flex items-center space-x-1'}>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className={isMobile ? 'p-0.5 text-gray-400 hover:text-green-600' : 'p-1 text-gray-400 hover:text-green-600 transition-colors duration-200'}
                              title="Mark as read"
                            >
                              <Check className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className={isMobile ? 'p-0.5 text-gray-400 hover:text-red-600' : 'p-1 text-gray-400 hover:text-red-600 transition-colors duration-200'}
                            title="Delete notification"
                          >
                            <Trash2 className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className={`mt-1 text-sm ${notification.read ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'} ${isMobile ? 'text-xs' : ''}`}>
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TurfAdminNotifications;
