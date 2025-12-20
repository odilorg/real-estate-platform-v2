'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  task?: {
    id: string;
    title: string;
  };
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function NotificationsPage() {
  const t = useTranslations('crm.notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'unread') {
        params.append('isRead', 'false');
      }

      const data = await api.get<{ notifications: Notification[] }>(
        `/agency-crm/notifications?${params.toString()}`,
      );
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/agency-crm/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/agency-crm/notifications/mark-all-read', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/agency-crm/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.task) {
      return `/developer/crm/tasks/${notification.task.id}`;
    }
    if (notification.lead) {
      return `/developer/crm/leads/${notification.lead.id}`;
    }
    return '#';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      TASK_ASSIGNED: 'bg-blue-100 text-blue-800',
      TASK_DUE_SOON: 'bg-yellow-100 text-yellow-800',
      TASK_OVERDUE: 'bg-red-100 text-red-800',
      TASK_COMPLETED: 'bg-green-100 text-green-800',
      LEAD_ASSIGNED: 'bg-purple-100 text-purple-800',
      LEAD_STATUS_CHANGE: 'bg-indigo-100 text-indigo-800',
      DEAL_STATUS_CHANGE: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string) => {
    const key = `types.${type}` as any;
    const translated = t(key);
    return translated !== key ? translated : type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.justNow');
    if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
    if (diffDays === 0) return t('time.today');
    if (diffDays === 1) return t('time.yesterday');
    if (diffDays < 7) return t('time.daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 text-gray-500">{t('loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="w-8 h-8" />
                {t('title')}
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {unreadCount === 1
                    ? t('unreadCountOne', { count: unreadCount })
                    : t('unreadCount', { count: unreadCount })}
                </p>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <CheckCheck className="w-5 h-5" />
                {t('markAllAsRead')}
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              {t('filters.all')} ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              {t('filters.unread')} ({unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">
              {filter === 'unread' ? t('empty.unread') : t('empty.all')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow p-4 ${
                  !notification.isRead ? 'border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(notification.type)}`}
                    >
                      <Bell className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTypeColor(notification.type)}`}
                        >
                          {getTypeLabel(notification.type)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-gray-700 mb-3">{notification.message}</p>

                    <div className="flex items-center gap-2">
                      {getNotificationLink(notification) !== '#' && (
                        <Link
                          href={getNotificationLink(notification)}
                          className="text-sm text-blue-600 hover:underline"
                          onClick={() => {
                            if (!notification.isRead) {
                              markAsRead(notification.id);
                            }
                          }}
                        >
                          {t('actions.goTo')}
                        </Link>
                      )}

                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                        >
                          <Check className="w-4 h-4" />
                          {t('actions.markAsRead')}
                        </button>
                      )}

                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('actions.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
