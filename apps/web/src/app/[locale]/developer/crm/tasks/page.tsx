'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import {
  CheckCircle, Clock, AlertCircle, Plus, Filter,
  Calendar, User, Tag
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  dueDate: string;
  assignedTo: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  deal?: {
    id: string;
    dealValue: number;
    currency: string;
  };
  createdAt: string;
}

interface TaskStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export default function TasksPage() {
  const router = useRouter();
  const t = useTranslations('crm.tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [filterStatus, filterPriority]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterPriority) params.append('priority', filterPriority);

      const data = await api.get<Task[]>(`/agency-crm/tasks?${params.toString()}`);
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.get<TaskStats>('/agency-crm/tasks/stats');
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      URGENT: 'bg-red-100 text-red-800',
      HIGH: 'bg-orange-100 text-orange-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-gray-100 text-gray-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'COMPLETED' || status === 'CANCELLED') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-500 mt-1">{t('subtitle')}</p>
          </div>
          <button
            onClick={() => router.push('/developer/crm/tasks/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            {t('newTask')}
          </button>
        </div>

        {/* Stats - 2x3 grid on mobile, 5 columns on desktop */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-6">
            <div className="bg-white rounded-lg shadow p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-500">{t('stats.total')}</div>
              <div className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.totalTasks}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-500">{t('stats.pending')}</div>
              <div className="text-base sm:text-xl lg:text-2xl font-bold text-yellow-600">{stats.pendingTasks}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-500">{t('stats.inProgress')}</div>
              <div className="text-base sm:text-xl lg:text-2xl font-bold text-blue-600">{stats.inProgressTasks}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-500">{t('stats.completed')}</div>
              <div className="text-base sm:text-xl lg:text-2xl font-bold text-green-600">{stats.completedTasks}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 col-span-2 sm:col-span-1">
              <div className="text-xs sm:text-sm text-gray-500">{t('stats.overdue')}</div>
              <div className="text-base sm:text-xl lg:text-2xl font-bold text-red-600">{stats.overdueTasks}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('filters.allStatuses')}</option>
              <option value="PENDING">{t('status.PENDING')}</option>
              <option value="IN_PROGRESS">{t('status.IN_PROGRESS')}</option>
              <option value="COMPLETED">{t('status.COMPLETED')}</option>
              <option value="CANCELLED">{t('status.CANCELLED')}</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('filters.allPriorities')}</option>
              <option value="URGENT">{t('priority.URGENT')}</option>
              <option value="HIGH">{t('priority.HIGH')}</option>
              <option value="MEDIUM">{t('priority.MEDIUM')}</option>
              <option value="LOW">{t('priority.LOW')}</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">{t('loading')}</div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">{t('noTasks')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => router.push(`/developer/crm/tasks/${task.id}`)}
                className={`bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer ${
                  isOverdue(task.dueDate, task.status) ? 'border-l-4 border-red-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {t(`status.${task.status}` as any, { defaultValue: task.status })}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {t(`priority.${task.priority}` as any, { defaultValue: task.priority })}
                    </span>
                  </div>
                </div>

                {task.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span className={isOverdue(task.dueDate, task.status) ? 'text-red-600 font-medium' : ''}>
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {task.assignedTo.user.firstName} {task.assignedTo.user.lastName}
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {t(`type.${task.type}` as any, { defaultValue: task.type })}
                  </div>
                  {task.lead && (
                    <div className="text-blue-600">
                      {t('detail.lead')}: {task.lead.firstName} {task.lead.lastName}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
