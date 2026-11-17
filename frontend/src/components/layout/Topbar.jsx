
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
    <header className="h-16 bg-[#111827]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 lg:px-8 shrink-0 z-20 sticky top-0">

      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Service Operations
          </h2>
          <p className="hidden sm:block text-[11px] text-slate-500 mt-0.5">
            Intelligent dealership management
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) fetchNotifications();
            }}
            className="relative p-2.5 text-slate-400 hover:text-[#00C3B4] transition-colors rounded-xl hover:bg-[#00C3B4]/10"
            aria-label="Notifications"
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-[#111827]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-[350px] sm:w-[420px] max-w-[90vw] bg-[#1F2937] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">

              <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
                <div>
                  <h3 className="text-white font-semibold">
                    Notifications
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {unreadCount} unread notifications
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-[#00C3B4] hover:text-[#5CE1D6] font-medium"
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
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#00C3B4]" />
                    Loading notifications...
                  </div>
                ) : notificationError && notifications.length === 0 ? (
                  <div className="p-6 text-center text-red-400 text-sm">
                    {notificationError}
                    <button
                      onClick={fetchNotifications}
                      className="block mx-auto mt-3 text-[#00C3B4] hover:text-[#5CE1D6]"
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
                      className={`px-4 py-4 border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
                        !notification.isRead ? 'bg-[#00C3B4]/[0.04]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-[#00C3B4] rounded-full shrink-0" />
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
                            className="text-slate-400 hover:text-[#00C3B4] p-1 transition-colors"
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

              <div className="px-4 py-3 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  Auto-refreshes every 30 seconds
                </span>

                <button
                  onClick={fetchNotifications}
                  className="text-xs text-[#00C3B4] hover:text-[#5CE1D6] flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  Refresh
                </button>
              </div>

            </div>
          )}
        </div>

        <div className="h-7 w-px bg-white/10"></div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-white leading-tight">
              {user?.name || 'Authorized User'}
            </p>

            <p className="text-xs text-[#00C3B4] mt-1">
              {user?.role || 'Service Advisor'}
            </p>
          </div>

          <div className="w-9 h-9 rounded-full bg-[#00C3B4]/10 border border-[#00C3B4]/30 flex items-center justify-center text-[#00C3B4]">
            <User size={18} />
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>

      </div>
    </header>
  );
}
