'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ChevronLeft, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  dueDate: string;
  completedAt?: string;
  assignedTo: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [params.id]);

  const fetchTask = async () => {
    try {
      const data = await api.get<Task>(`/agency-crm/tasks/${params.id}`);
      setTask(data);
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      await api.patch(`/agency-crm/tasks/${params.id}`, { status });
      fetchTask();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Ошибка при обновлении статуса', { description: 'Попробуйте еще раз' });
    }
  };

  const deleteTask = async () => {
    if (!confirm('Удалить эту задачу?')) return;

    try {
      await api.delete(`/agency-crm/tasks/${params.id}`);
      router.push('/agency/crm/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Ошибка при удалении задачи', { description: 'Попробуйте еще раз' });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Задача не найдена</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Назад к задачам
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h1>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={deleteTask}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Удалить"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status Actions */}
            <div className="flex gap-2">
              {task.status !== 'IN_PROGRESS' && task.status !== 'COMPLETED' && (
                <button
                  onClick={() => updateStatus('IN_PROGRESS')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Clock className="w-4 h-4" />
                  Начать работу
                </button>
              )}
              {task.status !== 'COMPLETED' && (
                <button
                  onClick={() => updateStatus('COMPLETED')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Завершить
                </button>
              )}
              {task.status !== 'CANCELLED' && task.status !== 'COMPLETED' && (
                <button
                  onClick={() => updateStatus('CANCELLED')}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  <XCircle className="w-4 h-4" />
                  Отменить
                </button>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            {task.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Описание</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Тип задачи</h3>
                <p className="text-gray-900">{task.type}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Назначено</h3>
                <p className="text-gray-900">
                  {task.assignedTo.user.firstName} {task.assignedTo.user.lastName}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Срок выполнения</h3>
                <p className="text-gray-900">
                  {new Date(task.dueDate).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Создано</h3>
                <p className="text-gray-900">
                  {new Date(task.createdAt).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {task.lead && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Связанный лид</h3>
                <button
                  onClick={() => router.push(`/agency/crm/leads/${task.lead!.id}`)}
                  className="text-blue-600 hover:underline"
                >
                  {task.lead.firstName} {task.lead.lastName}
                </button>
              </div>
            )}

            {task.completedAt && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Завершено</h3>
                <p className="text-gray-900">
                  {new Date(task.completedAt).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
