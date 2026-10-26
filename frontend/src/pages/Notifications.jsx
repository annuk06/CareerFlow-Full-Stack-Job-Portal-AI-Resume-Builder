import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import NotificationItem from '../components/NotificationItem';
import EmptyState from '../components/EmptyState';
import { Bell, CheckSquare } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastText, setToastText] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      const res = await notificationAPI.markRead(id);
      setNotifications(notifications.map(n => n._id === id ? res.data : n));
      setToastText('Marked as read.');
      setTimeout(() => setToastText(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    
    try {
      for (const note of unread) {
        await notificationAPI.markRead(note._id);
      }
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setToastText('All notifications marked as read.');
      setTimeout(() => setToastText(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastText && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 animate-slide-in text-xs font-semibold">
          <span>{toastText}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell size={24} className="text-primary-500" />
            <span>Alerts & Notifications</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Receive updates regarding application status reviews, scheduled calls, and job offers</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4.5 py-2.5 text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
          >
            <CheckSquare size={14} />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : notifications.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Logs</span>
            {unreadCount > 0 && (
              <span className="bg-primary-100 text-primary-700 font-extrabold px-2 py-0.5 rounded-full text-[10px]">
                {unreadCount} UNREAD
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            {notifications.map((note) => (
              <NotificationItem
                key={note._id}
                notification={note}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="All caught up!"
          description="You don't have any notifications at the moment. We will notify you when job statuses update."
          icon={Bell}
        />
      )}
    </div>
  );
};

export default Notifications;
