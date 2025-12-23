'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from '@/i18n/routing';
import { ArrowLeft, Edit, Trash2, Phone, Mail, MessageSquare, Calendar, User, Building, DollarSign, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';
import ActivityTimeline from './ActivityTimeline';
import { toast } from 'sonner';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  telegram?: string;
  whatsapp?: string;
  propertyType?: string;
  listingType?: string;
  budget?: number;
  bedrooms?: number;
  requirements?: string;
  source: string;
  status: string;
  priority: string;
  assignedTo?: {
    user: { firstName: string; lastName: string; phone?: string; };
  };
  notes?: string;
  createdAt: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  activities: any[];
  tasks: any[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LeadDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLead(resolvedParams.id);
  }, [resolvedParams.id]);

  const fetchLead = async (id: string) => {
    try {
      const [leadData, activitiesData] = await Promise.all([
        api.get<Lead>(`/agency-crm/leads/${id}`),
        api.get<any[]>(`/agency-crm/activities/lead/${id}`),
      ]);
      setLead({ ...leadData, activities: activitiesData || [] });
    } catch (error) {
      console.error('Error fetching lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!lead || !confirm('Вы уверены, что хотите удалить этот лид?')) return;

    try {
      await api.delete(`/agency-crm/leads/${lead.id}`);
      router.push('/agency/crm/leads');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Ошибка при удалении лида', { description: 'Попробуйте еще раз' });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Лид не найден</h2>
          <Link href="/agency/crm/leads">
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Вернуться к списку
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/agency/crm/leads">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{lead.firstName} {lead.lastName}</h1>
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">{lead.status}</span>
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-orange-100 text-orange-800">{lead.priority}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Создан {formatDate(lead.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDelete} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Удалить
          </button>
          <Link href={`/agency/crm/leads/${lead.id}/edit`}>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Редактировать
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Контактная информация</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="h-5 w-5 text-gray-400" />
                <a href={`tel:${lead.phone}`} className="hover:text-blue-600">{lead.phone}</a>
              </div>
              {lead.email && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <a href={`mailto:${lead.email}`} className="hover:text-blue-600">{lead.email}</a>
                </div>
              )}
              {lead.telegram && (
                <div className="flex items-center gap-3 text-gray-700">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                  <span>{lead.telegram}</span>
                </div>
              )}
              {lead.whatsapp && (
                <div className="flex items-center gap-3 text-gray-700">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                  <span>{lead.whatsapp}</span>
                </div>
              )}
            </div>
          </div>

          {/* Property Requirements */}
          {(lead.propertyType || lead.listingType || lead.budget || lead.bedrooms || lead.requirements) && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Требования к недвижимости</h2>
              <div className="space-y-3">
                {lead.propertyType && (
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">Тип: {lead.propertyType}</span>
                  </div>
                )}
                {lead.listingType && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700">Сделка: {lead.listingType}</span>
                  </div>
                )}
                {lead.budget && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">Бюджет: {lead.budget.toLocaleString()} YE</span>
                  </div>
                )}
                {lead.bedrooms !== undefined && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700">Комнат: {lead.bedrooms}</span>
                  </div>
                )}
                {lead.requirements && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Дополнительные требования</h4>
                    <p className="text-gray-700">{lead.requirements}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {lead.notes && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Заметки</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Lead Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Информация о лиде</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Источник:</span>
                <p className="font-medium">{lead.source}</p>
              </div>
              {lead.assignedTo && (
                <div>
                  <span className="text-gray-500">Ответственный:</span>
                  <p className="font-medium">
                    {lead.assignedTo.user.firstName} {lead.assignedTo.user.lastName}
                  </p>
                  {lead.assignedTo.user.phone && (
                    <p className="text-gray-600">{lead.assignedTo.user.phone}</p>
                  )}
                </div>
              )}
              {lead.lastContactedAt && (
                <div>
                  <span className="text-gray-500">Последний контакт:</span>
                  <p className="font-medium">{formatDate(lead.lastContactedAt)}</p>
                </div>
              )}
              {lead.nextFollowUpAt && (
                <div>
                  <span className="text-gray-500">Следующий звонок:</span>
                  <p className="font-medium text-orange-600">{formatDate(lead.nextFollowUpAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activities Timeline */}
      <ActivityTimeline
        leadId={lead.id}
        activities={lead.activities}
        onActivityAdded={() => fetchLead(resolvedParams.id)}
      />
    </div>
  );
}
