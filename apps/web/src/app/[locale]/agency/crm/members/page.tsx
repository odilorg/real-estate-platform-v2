'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { Search, Plus, User, Mail, Phone, Shield, Loader2, UserCheck, UserX } from 'lucide-react';
import { api } from '@/lib/api';

interface Member {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'SENIOR_AGENT' | 'AGENT' | 'COORDINATOR';
  agentType?: 'BUYER_AGENT' | 'SELLER_AGENT' | 'DUAL_AGENT';
  isActive: boolean;
  phone?: string;
  telegram?: string;
  whatsapp?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  _count: {
    assignedLeads: number;
    deals: number;
  };
  createdAt: string;
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

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchMembers();
  }, [search, roleFilter, statusFilter]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('isActive', statusFilter);

      const response = await api.get<any>(`/agency-crm/members?${params}`);
      setMembers(response.members || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = members.filter(m => m.isActive).length;
  const inactiveCount = members.filter(m => !m.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Команда</h1>
          <p className="mt-1 text-sm text-gray-500">Управление сотрудниками агентства</p>
        </div>
        <Link href="/agency/crm/members/new">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Добавить сотрудника
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Всего сотрудников</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Активные</p>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <UserX className="h-8 w-8 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Неактивные</p>
              <p className="text-2xl font-bold text-gray-900">{inactiveCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Владельцы</p>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter(m => m.role === 'OWNER').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Поиск по имени или email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Все роли</option>
            <option value="OWNER">Владелец</option>
            <option value="ADMIN">Администратор</option>
            <option value="SENIOR_AGENT">Старший агент</option>
            <option value="AGENT">Агент</option>
            <option value="COORDINATOR">Координатор</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Все статусы</option>
            <option value="true">Активные</option>
            <option value="false">Неактивные</option>
          </select>
        </div>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Нет сотрудников</h3>
          <p className="mt-1 text-sm text-gray-500">Начните с добавления первого сотрудника в команду</p>
          <div className="mt-6">
            <Link href="/agency/crm/members/new">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Добавить сотрудника
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Link key={member.id} href={`/agency/crm/members/${member.id}`}>
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {member.user.firstName} {member.user.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  {!member.isActive && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      Неактивен
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${roleColors[member.role]}`}>
                      {roleLabels[member.role]}
                    </span>
                    {member.agentType && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                        {agentTypeLabels[member.agentType]}
                      </span>
                    )}
                  </div>

                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{member.phone}</span>
                    </div>
                  )}

                  {member.user.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{member.user.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{member._count.assignedLeads}</p>
                    <p className="text-gray-500">Лиды</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{member._count.deals}</p>
                    <p className="text-gray-500">Сделки</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
