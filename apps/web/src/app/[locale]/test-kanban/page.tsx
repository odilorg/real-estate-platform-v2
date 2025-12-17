'use client';

import { useState, useEffect } from 'react';
import KanbanBoard from '../developer/crm/leads/KanbanBoard';

// TEMPORARY TEST PAGE - REMOVE AFTER DEBUGGING

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
}

export default function TestKanbanPage() {
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: '1',
      firstName: 'Test',
      lastName: 'Lead 1',
      phone: '+998901234567',
      email: 'test1@example.com',
      status: 'NEW',
      priority: 'HIGH',
      source: 'WEBSITE',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      firstName: 'Test',
      lastName: 'Lead 2',
      phone: '+998901234568',
      status: 'CONTACTED',
      priority: 'MEDIUM',
      source: 'REFERRAL',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      firstName: 'Test',
      lastName: 'Lead 3',
      phone: '+998901234569',
      status: 'CONVERTED',
      priority: 'URGENT',
      source: 'WALK_IN',
      createdAt: new Date().toISOString(),
    },
  ]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    console.log('Status change:', leadId, newStatus);
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, status: newStatus as any } : lead
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Kanban Board Test (NO AUTH)</h1>
        <p className="text-gray-600">Temporary test page for debugging - URL: /test-kanban</p>
      </div>

      <KanbanBoard leads={leads} onStatusChange={handleStatusChange} />
    </div>
  );
}
