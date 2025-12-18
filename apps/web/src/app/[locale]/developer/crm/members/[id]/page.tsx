'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from '@/i18n/routing';
import { ArrowLeft, Edit, Trash2, Phone, Mail, MessageSquare, User, Shield, Loader2, Calendar } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';

interface Member {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'SENIOR_AGENT' | 'AGENT' | 'COORDINATOR';
  agentType?: 'BUYER_AGENT' | 'SELLER_AGENT' | 'DUAL_AGENT';
  isActive: boolean;
  phone?: string;
  telegram?: string;
  whatsapp?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  specializations?: string[];
  districts?: string[];
  languages?: string[];
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    createdAt: string;
  };
  assignedLeads: Array<{
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
  _count: {
    assignedLeads: number;
    deals: number;
    commissions: number;
    activities: number;
  };
  createdAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const roleLabels = {
  OWNER: 'Владелец',
  ADMIN: 'Администратор',
  SENIOR_AGENT: 'Старший агент',
  AGENT: 'Агент',
  COORDINATOR: 'Координатор',
};

const roleColors = {
  OWNER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  SENIOR_AGENT: 'bg-green-100 text-green-800',
  AGENT: 'bg-yellow-100 text-yellow-800',
  COORDINATOR: 'bg-gray-100 text-gray-800',
};

const agentTypeLabels = {
  BUYER_AGENT: 'Агент покупателя',
  SELLER_AGENT: 'Агент продавца',
  DUAL_AGENT: 'Двойной агент',
};

export default function MemberDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMember(resolvedParams.id);
  }, [resolvedParams.id]);

  const fetchMember = async (id: string) => {
    try {
      const data = await api.get<Member>(`/agency-crm/members/${id}`);
      setMember(data);
    } catch (error) {
      console.error('Error fetching member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!member || !confirm('Вы уверены, что хотите деактивировать этого сотрудника?')) return;

    try {
      await api.delete(`/agency-crm/members/${member.id}`);
      router.push('/developer/crm/members');
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Ошибка при деактивации сотрудника');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Сотрудник не найден</h2>
          <Link href="/developer/crm/members">
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
          <Link href="/developer/crm/members">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {member.user.firstName} {member.user.lastName}
              </h1>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${roleColors[member.role]}`}>
                {roleLabels[member.role]}
              </span>
              {!member.isActive && (
                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                  Неактивен
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">Добавлен {formatDate(member.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDelete} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Деактивировать
          </button>
          <Link href={`/developer/crm/members/${member.id}/edit`}>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Редактировать
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Лиды</p>
          <p className="text-2xl font-bold text-gray-900">{member._count.assignedLeads}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Сделки</p>
          <p className="text-2xl font-bold text-gray-900">{member._count.deals}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Комиссии</p>
          <p className="text-2xl font-bold text-gray-900">{member._count.commissions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Активности</p>
          <p className="text-2xl font-bold text-gray-900">{member._count.activities}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Контактная информация</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="h-5 w-5 text-gray-400" />
                <a href={`mailto:${member.user.email}`} className="hover:text-blue-600">{member.user.email}</a>
              </div>
              {member.phone && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <a href={`tel:${member.phone}`} className="hover:text-blue-600">{member.phone}</a>
                </div>
              )}
              {member.user.phone && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <a href={`tel:${member.user.phone}`} className="hover:text-blue-600">{member.user.phone}</a>
                </div>
              )}
              {member.telegram && (
                <div className="flex items-center gap-3 text-gray-700">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                  <span>Telegram: {member.telegram}</span>
                </div>
              )}
              {member.whatsapp && (
                <div className="flex items-center gap-3 text-gray-700">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                  <span>WhatsApp: {member.whatsapp}</span>
                </div>
              )}
            </div>
          </div>

          {/* Professional Info */}
          {(member.agentType || member.specializations || member.districts || member.languages) && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Профессиональная информация</h2>
              <div className="space-y-3">
                {member.agentType && (
                  <div>
                    <span className="text-sm text-gray-500">Тип агента:</span>
                    <p className="font-medium">{agentTypeLabels[member.agentType]}</p>
                  </div>
                )}
                {member.specializations && member.specializations.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Специализация:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {member.specializations.map((spec, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {member.districts && member.districts.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Районы работы:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {member.districts.map((district, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {district}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {member.languages && member.languages.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Языки:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {member.languages.map((lang, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {member.licenseNumber && (
                  <div>
                    <span className="text-sm text-gray-500">Номер лицензии:</span>
                    <p className="font-medium">{member.licenseNumber}</p>
                  </div>
                )}
                {member.licenseExpiry && (
                  <div>
                    <span className="text-sm text-gray-500">Срок действия лицензии:</span>
                    <p className="font-medium">{formatDate(member.licenseExpiry)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assigned Leads */}
          {member.assignedLeads && member.assignedLeads.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Текущие лиды ({member.assignedLeads.length})</h2>
              <div className="space-y-3">
                {member.assignedLeads.map((lead) => (
                  <Link key={lead.id} href={`/developer/crm/leads/${lead.id}`}>
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {lead.firstName} {lead.lastName}
                          </h4>
                          <p className="text-sm text-gray-500">{lead.phone}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {lead.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(lead.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Member Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Информация о сотруднике</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Дата регистрации:</span>
                <p className="font-medium">{formatDate(member.user.createdAt)}</p>
              </div>
              <div>
                <span className="text-gray-500">Добавлен в команду:</span>
                <p className="font-medium">{formatDate(member.createdAt)}</p>
              </div>
              <div>
                <span className="text-gray-500">Роль:</span>
                <p className="font-medium">{roleLabels[member.role]}</p>
              </div>
              <div>
                <span className="text-gray-500">Статус:</span>
                <p className={`font-medium ${member.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {member.isActive ? 'Активен' : 'Неактивен'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
