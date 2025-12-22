'use client';
// TEMPORARY NO-AUTH VERSION FOR TESTING - REMOVE AFTER TESTING

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { Search, Plus, Phone, Mail, User, Calendar, ChevronRight, AlertCircle, Loader2, UserPlus, X, LayoutList, LayoutGrid } from 'lucide-react';
import KanbanBoard from './KanbanBoard';

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

const MOCK_LEADS: Lead[] = [
  {
    id: '1',
    firstName: 'Алишер',
    lastName: 'Каримов',
    phone: '+998901234567',
    email: 'alisher@example.com',
    status: 'NEW',
    priority: 'HIGH',
    source: 'WEBSITE',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    firstName: 'Дилноза',
    lastName: 'Рахимова',
    phone: '+998901234568',
    status: 'CONTACTED',
    priority: 'MEDIUM',
    source: 'REFERRAL',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    firstName: 'Бехзод',
    lastName: 'Усманов',
    phone: '+998901234569',
    email: 'behzod@example.com',
    status: 'QUALIFIED',
    priority: 'URGENT',
    source: 'WALK_IN',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    firstName: 'Малика',
    lastName: 'Турсунова',
    phone: '+998901234570',
    status: 'NEGOTIATING',
    priority: 'HIGH',
    source: 'PHONE',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    firstName: 'Санжар',
    lastName: 'Абдуллаев',
    phone: '+998901234571',
    email: 'sanjar@example.com',
    status: 'CONVERTED',
    priority: 'MEDIUM',
    source: 'WEBSITE',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    firstName: 'Нигора',
    lastName: 'Исмаилова',
    phone: '+998901234572',
    status: 'LOST',
    priority: 'LOW',
    source: 'REFERRAL',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function DeveloperCRMLeadsPageNoAuth() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban'); // Default to kanban for testing

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    console.log('Status change (mock):', leadId, newStatus);
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, status: newStatus as any } : lead
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Developer CRM Leads (NO AUTH - TESTING)</h1>
        <p className="text-gray-600">Mock data for testing kanban board</p>
        
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            <LayoutList className="inline w-4 h-4 mr-2" />
            List View
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 rounded ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            <LayoutGrid className="inline w-4 h-4 mr-2" />
            Kanban View
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <KanbanBoard leads={leads} onStatusChange={handleStatusChange} />
      ) : (
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500">List view not implemented in no-auth version</p>
        </div>
      )}
    </div>
  );
}
