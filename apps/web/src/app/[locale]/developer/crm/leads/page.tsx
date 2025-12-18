'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Phone, Mail, DollarSign, Home, Plus, Search } from 'lucide-react';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  propertyType?: string;
  listingType?: string;
  budget?: number;
  budgetCurrency?: string;
  status: string;
  priority: string;
  source: string;
  createdAt: string;
}

export default function CrmLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const data = await api.get<{ leads: Lead[] }>('/agency-crm/leads');
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-800',
      CONTACTED: 'bg-purple-100 text-purple-800',
      QUALIFIED: 'bg-green-100 text-green-800',
      NEGOTIATING: 'bg-yellow-100 text-yellow-800',
      CLOSED_WON: 'bg-emerald-100 text-emerald-800',
      CLOSED_LOST: 'bg-red-100 text-red-800',
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

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'UZS') {
      return new Intl.NumberFormat('ru-RU').format(price) + ' сум';
    }
    return '$' + new Intl.NumberFormat('en-US').format(price);
  };

  const filteredLeads = leads.filter((lead) =>
    search === '' ||
    lead.firstName.toLowerCase().includes(search.toLowerCase()) ||
    lead.lastName.toLowerCase().includes(search.toLowerCase()) ||
    lead.phone.includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Лиды</h1>
            <p className="text-gray-500 mt-1">Управление потенциальными клиентами</p>
          </div>
          <button
            onClick={() => router.push('/developer/crm/leads/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Новый лид
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по имени, телефону..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Leads List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Загрузка...</div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">Лиды не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => router.push(`/developer/crm/leads/${lead.id}`)}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {lead.firstName} {lead.lastName}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {lead.phone}
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {lead.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(lead.priority)}`}>
                      {lead.priority}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {lead.propertyType && (
                    <div className="flex items-center gap-1">
                      <Home className="w-4 h-4" />
                      {lead.propertyType}
                    </div>
                  )}
                  {lead.budget && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {formatPrice(lead.budget, lead.budgetCurrency || 'UZS')}
                    </div>
                  )}
                  <div className="text-gray-400">
                    Создан: {new Date(lead.createdAt).toLocaleDateString('ru-RU')}
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
