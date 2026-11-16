
import React, { useCallback, useEffect, useState } from 'react';
import {
  Menu,
  Bell,
  User,
  LogOut,
  Check,
  X,
  RefreshCw
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Topbar({ toggleSidebar }) {
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState('');

  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      setNotificationError('');

      const response = await api.get('/notifications');
      const data = response.data;

      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      setNotificationError(
        error.response?.data?.message || 'Unable to load notifications'
      );
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      await fetchNotifications();
    } catch (error) {
      setNotificationError(
        error.response?.data?.message || 'Unable to update notification'
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      await fetchNotifications();
    } catch (error) {
      setNotificationError(
        error.response?.data?.message || 'Unable to mark notifications as read'
      );
    }
  };

  return (
    <header className="h-16 bg-dark-800/80 backdrop-blur-md border-b border-dark-700 flex items-center justify-between px-4 lg:px-8 shrink-0 z-20 sticky top-0">

      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="lg:hidden mr-4 text-slate-400 hover:text-white"
        >
          <Menu size={24} />
        </button>

        <h2 className="text-sm font-semibold text-slate-400 tracking-wider">
          SERVICE OPERATIONS PLATFORM
        </h2>
      </div>

      <div className="flex items-center space-x-4">

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) fetchNotifications();
            }}
            className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-dark-700"
            aria-label="Notifications"
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-[350px] sm:w-[420px] max-w-[90vw] bg-dark-800 border border-dark-600 rounded-xl shadow-2xl z-50 overflow-hidden">

              <div className="flex items-center justify-between px-4 py-3 border-b border-dark-600">
                <div>
                  <h3 className="text-white font-semibold">
                    Notifications
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {unreadCount} unread notifications
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Mark all read
                    </button>
                  )}

                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-white p-1"
                    aria-label="Close notifications"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="max-h-[420px] overflow-y-auto">

                {loadingNotifications && notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                    Loading notifications...
                  </div>
                ) : notificationError && notifications.length === 0 ? (
                  <div className="p-6 text-center text-red-400 text-sm">
                    {notificationError}
                    <button
                      onClick={fetchNotifications}
                      className="block mx-auto mt-3 text-blue-400"
                    >
                      Try again
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Bell size={28} className="mx-auto mb-2 opacity-40" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`px-4 py-4 border-b border-dark-700 hover:bg-dark-700/60 transition-colors ${
                        !notification.isRead ? 'bg-blue-500/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-400 rounded-full shrink-0" />
                            )}

                            <h4 className="text-sm font-semibold text-white">
                              {notification.title}
                            </h4>
                          </div>

                          <p className="text-sm text-slate-400 mt-2">
                            {notification.message}
                          </p>

                          <p className="text-xs text-slate-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>

                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="text-slate-400 hover:text-green-400 p-1"
                            title="Mark as read"
                          >
                            <Check size={17} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}

              </div>

              <div className="px-4 py-2 border-t border-dark-600 flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  Auto-refreshes every 30 seconds
                </span>

                <button
                  onClick={fetchNotifications}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  Refresh
                </button>
              </div>

            </div>
          )}
        </div>

        <div className="h-6 w-px bg-dark-700 mx-2"></div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-white leading-none">
              {user?.name || 'Authorized User'}
            </p>

            <p className="text-xs text-blue-400 mt-1 capitalize">
              {user?.role || 'Service Advisor'}
            </p>
          </div>

          <div className="w-9 h-9 rounded-full bg-dark-700 border border-dark-600 flex items-center justify-center text-slate-300">
            <User size={18} />
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors ml-2"
          >
            <LogOut size={18} />
          </button>
        </div>

      </div>
    </header>
  );
}
