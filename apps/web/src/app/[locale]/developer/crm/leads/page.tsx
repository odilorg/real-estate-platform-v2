'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { Search, Plus, Phone, Mail, User, Calendar, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'NEGOTIATING' | 'CONVERTED' | 'LOST';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  source: string;
  assignedTo?: {
    id: string;
    user: { firstName: string; lastName: string; };
  };
  createdAt: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
}

const statusColors = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  QUALIFIED: 'bg-green-100 text-green-800',
  NEGOTIATING: 'bg-purple-100 text-purple-800',
  CONVERTED: 'bg-green-600 text-white',
  LOST: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export default function AgencyCRMLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, priorityFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);

      const response = await api.get<any>(`/agency-crm/leads?${params}`);
      setLeads(response.leads || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дней назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Лиды</h1>
          <p className="mt-1 text-sm text-gray-500">Управление потенциальными клиентами</p>
        </div>
        <Link href="/developer/crm/leads/new">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Добавить лид
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Всего лидов', value: total },
          { label: 'Новые', value: leads.filter(l => l.status === 'NEW').length },
          { label: 'Квалифицированные', value: leads.filter(l => l.status === 'QUALIFIED').length },
          { label: 'Срочные', value: leads.filter(l => l.priority === 'URGENT').length, color: 'text-red-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600">{stat.label}</div>
            <div className={`text-2xl font-bold mt-2 ${stat.color || ''}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по имени, телефону, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Все статусы</option>
            <option value="NEW">Новый</option>
            <option value="CONTACTED">Связались</option>
            <option value="QUALIFIED">Квалифицирован</option>
            <option value="NEGOTIATING">Переговоры</option>
            <option value="CONVERTED">Конвертирован</option>
            <option value="LOST">Потерян</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Все приоритеты</option>
            <option value="LOW">Низкий</option>
            <option value="MEDIUM">Средний</option>
            <option value="HIGH">Высокий</option>
            <option value="URGENT">Срочный</option>
          </select>
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Лиды ({leads.length})</h2>
        </div>
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Нет лидов</h3>
              <p className="mt-1 text-sm text-gray-500">Начните с создания первого лида</p>
              <div className="mt-6">
                <Link href="/developer/crm/leads/new">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto">
                    <Plus className="h-4 w-4" />
                    Добавить лид
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {leads.map((lead) => (
                <Link key={lead.id} href={`/developer/crm/leads/${lead.id}`} className="block hover:bg-gray-50 transition-colors">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium text-gray-900">{lead.firstName} {lead.lastName}</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[lead.status]}`}>{lead.status}</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[lead.priority]}`}>{lead.priority}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {lead.phone}
                          </div>
                          {lead.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {lead.email}
                            </div>
                          )}
                          {lead.assignedTo && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {lead.assignedTo.user.firstName} {lead.assignedTo.user.lastName}
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Создан: {formatTime(lead.createdAt)}
                          </div>
                          {lead.lastContactedAt && <div>Последний контакт: {formatTime(lead.lastContactedAt)}</div>}
                          {lead.nextFollowUpAt && (
                            <div className="text-orange-600 font-medium">
                              Следующий звонок: {formatTime(lead.nextFollowUpAt)}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
