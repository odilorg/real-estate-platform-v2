'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, Save, Loader2, Clock, Calendar, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
}

export default function NewTaskPage() {
  const router = useRouter();
  const locale = useLocale();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'FOLLOW_UP',
    priority: 'MEDIUM',
    assignedToId: '',
    leadId: '',
    dueDate: '',
    reminderMinutesBefore: 60, // Default: 1 hour before
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login`);
    }
  }, [authLoading, isAuthenticated, router, locale]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMembers();
      fetchLeads();
    }
  }, [isAuthenticated]);

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const data = await api.get<{ members: Member[] }>('/agency-crm/members');
      setMembers(data.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoadingLeads(true);
      const data = await api.get<{ leads: Lead[] }>('/agency-crm/leads');
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoadingLeads(false);
    }
  };

  // Quick date helpers
  const setQuickDate = (daysFromNow: number, hours: number = 10, minutes: number = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(hours, minutes, 0, 0);
    // Format for datetime-local input
    const formatted = date.toISOString().slice(0, 16);
    setFormData({ ...formData, dueDate: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/agency-crm/tasks', {
        ...formData,
        leadId: formData.leadId || undefined,
        reminderMinutesBefore: formData.reminderMinutesBefore || undefined,
      });

      // Show success message
      setSuccessMessage('Задача успешно создана!');

      // Redirect after short delay
      setTimeout(() => {
        router.push(`/${locale}/agency/crm/tasks`);
      }, 1500);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Ошибка при создании задачи', {
        description: 'Попробуйте еще раз',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 pb-28">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Назад
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Новая задача</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название задачи *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Например: Позвонить клиенту"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Детали задачи..."
            />
          </div>

          {/* Type and Priority - Stack on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип задачи *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CALL">Звонок</option>
                <option value="FOLLOW_UP">Напоминание</option>
                <option value="VIEWING">Показ объекта</option>
                <option value="SEND_LISTINGS">Отправить варианты</option>
                <option value="DOCUMENT">Документы</option>
                <option value="MEETING">Встреча</option>
                <option value="EMAIL">Email</option>
                <option value="OTHER">Другое</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Приоритет *
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="URGENT">Срочно</option>
                <option value="HIGH">Высокий</option>
                <option value="MEDIUM">Средний</option>
                <option value="LOW">Низкий</option>
              </select>
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Назначить сотруднику *
            </label>
            {loadingMembers ? (
              <div className="flex items-center gap-2 px-4 py-3 border rounded-lg bg-gray-50">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-gray-500">Загрузка...</span>
              </div>
            ) : (
              <select
                required
                value={formData.assignedToId}
                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите сотрудника</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.user.firstName} {member.user.lastName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Lead (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Связать с лидом (необязательно)
            </label>
            {loadingLeads ? (
              <div className="flex items-center gap-2 px-4 py-3 border rounded-lg bg-gray-50">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-gray-500">Загрузка...</span>
              </div>
            ) : (
              <select
                value={formData.leadId}
                onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Без лида</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.firstName} {lead.lastName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Due Date with Quick Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Срок выполнения *
            </label>

            {/* Quick Date Buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => setQuickDate(0, new Date().getHours() + 2)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                Сегодня
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(1, 10)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                Завтра
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(3, 10)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                Через 3 дня
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(7, 10)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                Через неделю
              </button>
            </div>

            <input
              type="datetime-local"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reminder Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Bell className="w-4 h-4 inline mr-1" />
              Напомнить за
            </label>
            <select
              value={formData.reminderMinutesBefore}
              onChange={(e) => setFormData({ ...formData, reminderMinutesBefore: Number(e.target.value) })}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Не напоминать</option>
              <option value={15}>15 минут</option>
              <option value={30}>30 минут</option>
              <option value={60}>1 час</option>
              <option value={180}>3 часа</option>
              <option value={1440}>1 день</option>
              <option value={4320}>3 дня</option>
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Создать задачу
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border rounded-lg hover:bg-gray-50 font-medium"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
