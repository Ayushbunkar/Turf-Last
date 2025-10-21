import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, X, Eye, Trash2, Filter, Calendar, Clock, User, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../../config/Api';
import { toast } from 'react-hot-toast';

const TurfAdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
  const response = await api.get('/api/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Mock data for demo
      setNotifications([
        {
          _id: '1',
          type: 'booking',
          title: 'New Booking Received',
          message: 'John Doe has booked Green Field for today 6:00 PM - 7:00 PM',
          read: false,
          createdAt: new Date().toISOString(),
          priority: 'high',
          relatedId: 'booking123'
        },
        {
          _id: '2',
          type: 'payment',
          title: 'Payment Received',
          message: 'Payment of ₹500 received for booking #BK001',
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          priority: 'medium',
          relatedId: 'payment456'
        },
        {
          _id: '3',
          type: 'cancellation',
          title: 'Booking Cancelled',
          message: 'Sarah Smith cancelled booking for Blue Court tomorrow 4:00 PM',
          read: true,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          priority: 'medium',
          relatedId: 'booking789'
        },
        {
          _id: '4',
          type: 'system',
          title: 'Maintenance Reminder',
          message: 'Regular maintenance is due for Field A. Schedule maintenance to ensure quality.',
          read: false,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          priority: 'low',
          relatedId: 'maintenance001'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
  await api.patch(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Mock update for demo
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
    }
  };

  const markAllAsRead = async () => {
    try {
  await api.patch('/api/notifications/mark-all-read');
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      toast.success('All notifications marked as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
  await api.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      toast.success('Notification deleted');
    }
  };

  const deleteSelected = async () => {
    try {
      await Promise.all(selectedNotifications.map(id => 
        api.delete(`/api/notifications/${id}`)
      ));
      setNotifications(prev => prev.filter(notif => !selectedNotifications.includes(notif._id)));
      setSelectedNotifications([]);
      toast.success('Selected notifications deleted');
    } catch (error) {
      console.error('Error deleting selected notifications:', error);
      setNotifications(prev => prev.filter(notif => !selectedNotifications.includes(notif._id)));
      setSelectedNotifications([]);
      toast.success('Selected notifications deleted');
    }
  };

  const toggleSelect = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const selectAll = () => {
    const filteredNotifications = getFilteredNotifications();
    setSelectedNotifications(filteredNotifications.map(notif => notif._id));
  };

  const clearSelection = () => {
    setSelectedNotifications([]);
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(notif => !notif.read);
      case 'read':
        return notifications.filter(notif => notif.read);
      case 'booking':
        return notifications.filter(notif => notif.type === 'booking');
      case 'payment':
        return notifications.filter(notif => notif.type === 'payment');
      case 'high':
        return notifications.filter(notif => notif.priority === 'high');
      default:
        return notifications;
    }
  };

  const getNotificationIcon = (type, priority) => {
    const baseClass = "w-5 h-5";
    
    switch (type) {
      case 'booking':
        return <Calendar className={`${baseClass} text-blue-500`} />;
      case 'payment':
        return <CreditCard className={`${baseClass} text-green-500`} />;
      case 'cancellation':
        return <X className={`${baseClass} text-red-500`} />;
      case 'system':
        return priority === 'high' 
          ? <AlertCircle className={`${baseClass} text-orange-500`} />
          : <Bell className={`${baseClass} text-gray-500`} />;
      default:
        return <Bell className={`${baseClass} text-gray-500`} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      default:
        return 'border-l-gray-300 bg-gray-50 dark:bg-gray-800';
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedNotifications.length} selected
              </span>
              <button
                onClick={deleteSelected}
                className="flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                Clear
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="text-sm text-green-600 hover:text-green-700 transition-colors duration-200"
            >
              Select All
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No notifications found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
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
              className={`border-l-4 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm transition-all duration-200 hover:shadow-md ${
                getPriorityColor(notification.priority)
              } ${notification.read ? 'opacity-75' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification._id)}
                    onChange={() => toggleSelect(notification._id)}
                    className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getNotificationIcon(notification.type, notification.priority)}
                        <h3 className={`font-medium ${notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        
                        <div className="flex items-center space-x-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors duration-200"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <p className={`mt-1 text-sm ${notification.read ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
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
