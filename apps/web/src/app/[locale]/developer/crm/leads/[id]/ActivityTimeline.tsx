'use client';

import { useState } from 'react';
import { Phone, Mail, MessageSquare, Calendar, User, FileText, TrendingUp, Video, Plus, X, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';

interface Activity {
  id: string;
  type: 'CALL' | 'TELEGRAM' | 'WHATSAPP' | 'EMAIL' | 'MEETING' | 'VIEWING' | 'NOTE' | 'STATUS_CHANGE';
  title: string;
  description?: string;
  outcome?: string;
  createdAt: string;
  member: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface ActivityTimelineProps {
  leadId: string;
  activities: Activity[];
  onActivityAdded: () => void;
}

const activityIcons = {
  CALL: Phone,
  TELEGRAM: MessageSquare,
  WHATSAPP: MessageSquare,
  EMAIL: Mail,
  MEETING: Calendar,
  VIEWING: Video,
  NOTE: FileText,
  STATUS_CHANGE: TrendingUp,
};

const activityColors = {
  CALL: 'bg-blue-100 text-blue-600',
  TELEGRAM: 'bg-sky-100 text-sky-600',
  WHATSAPP: 'bg-green-100 text-green-600',
  EMAIL: 'bg-purple-100 text-purple-600',
  MEETING: 'bg-orange-100 text-orange-600',
  VIEWING: 'bg-pink-100 text-pink-600',
  NOTE: 'bg-gray-100 text-gray-600',
  STATUS_CHANGE: 'bg-yellow-100 text-yellow-600',
};

export default function ActivityTimeline({ leadId, activities, onActivityAdded }: ActivityTimelineProps) {
  const t = useTranslations('crm.leads.activities');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'NOTE' as Activity['type'],
    title: '',
    description: '',
    outcome: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/developer-crm/activities', {
        leadId,
        type: formData.type,
        title: formData.title,
        description: formData.description || undefined,
        outcome: formData.outcome || undefined,
      });

      setFormData({ type: 'NOTE', title: '', description: '', outcome: '' });
      setShowForm(false);
      onActivityAdded();
    } catch (error) {
      console.error('Error creating activity:', error);
      alert(t('createError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      await api.delete(`/developer-crm/activities/${activityId}`);
      onActivityAdded(); // Refresh activities
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert(t('deleteError'));
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.justNow');
    if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('time.daysAgo', { count: diffDays });

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {t('title')} ({activities.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              {t('cancel')}
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              {t('add')}
            </>
          )}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('activityType')} *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Activity['type'] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="CALL">📞 {t('types.call')}</option>
                <option value="EMAIL">📧 {t('types.email')}</option>
                <option value="TELEGRAM">💬 {t('types.telegram')}</option>
                <option value="WHATSAPP">📱 {t('types.whatsapp')}</option>
                <option value="MEETING">🤝 {t('types.meeting')}</option>
                <option value="VIEWING">🏠 {t('types.viewing')}</option>
                <option value="NOTE">📝 {t('types.note')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('titleLabel')} *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('titlePlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('descriptionPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {formData.type === 'CALL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('outcome')}</label>
                <select
                  value={formData.outcome}
                  onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('selectOutcome')}</option>
                  <option value="ANSWERED">{t('outcomes.answered')}</option>
                  <option value="NO_ANSWER">{t('outcomes.noAnswer')}</option>
                  <option value="VOICEMAIL">{t('outcomes.voicemail')}</option>
                  <option value="BUSY">{t('outcomes.busy')}</option>
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('saving') : t('save')}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </form>
      )}

      {activities.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p>{t('noActivities')}</p>
          <p className="text-sm mt-1">{t('startAdding')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];

            return (
              <div key={activity.id} className="flex gap-4 group">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${colorClass} flex items-center justify-center`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{activity.title}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${colorClass}`}>
                          {t(`types.${activity.type.toLowerCase()}` as any)}
                        </span>
                      </div>

                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      )}

                      {activity.outcome && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t('outcomeLabel')} <span className="font-medium">{activity.outcome}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {activity.member.user.firstName} {activity.member.user.lastName}
                        </div>
                        <span>•</span>
                        <span>{formatTime(activity.createdAt)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
                      title={t('delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
