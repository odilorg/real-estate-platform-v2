'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { Phone, Mail, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface KanbanBoardProps {
  leads: Lead[];
  onStatusChange: (leadId: string, newStatus: string) => Promise<void>;
}

const statusColumns = [
  { id: 'NEW', label: 'Новый', color: 'bg-blue-50 border-blue-200' },
  { id: 'CONTACTED', label: 'Связались', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'QUALIFIED', label: 'Квалифицирован', color: 'bg-green-50 border-green-200' },
  { id: 'NEGOTIATING', label: 'Переговоры', color: 'bg-purple-50 border-purple-200' },
  { id: 'CONVERTED', label: 'Конвертирован', color: 'bg-green-100 border-green-300' },
  { id: 'LOST', label: 'Потерян', color: 'bg-gray-50 border-gray-200' },
];

const priorityColors = {
  LOW: 'border-l-4 border-l-gray-400',
  MEDIUM: 'border-l-4 border-l-blue-400',
  HIGH: 'border-l-4 border-l-orange-400',
  URGENT: 'border-l-4 border-l-red-500',
};

export default function KanbanBoard({ leads, onStatusChange }: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setDraggedOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (status: string) => {
    setDraggedOverColumn(status);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedLead && draggedLead.status !== newStatus) {
      await onStatusChange(draggedLead.id, newStatus);
    }
    setDraggedLead(null);
    setDraggedOverColumn(null);
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays}д назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const scrollLeft = () => {
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: -282, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: 282, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      {/* Scroll hint - shows there are more columns */}
      <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
        <span>Прокрутите →</span>
        <span className="text-xs">6 статусов</span>
      </div>

      <div className="relative w-full max-w-[1200px] mx-auto">
        {/* Navigation arrows - positioned at kanban edges (desktop only) */}
        <button
          onClick={scrollLeft}
          className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-blue-600 cursor-pointer hover:bg-blue-700 text-white shadow-xl rounded-full p-2.5 transition-all items-center justify-center"
          aria-label="Scroll left"
          title="Прокрутить назад"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={scrollRight}
          className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-blue-600 cursor-pointer hover:bg-blue-700 text-white shadow-xl rounded-full p-2.5 transition-all items-center justify-center"
          aria-label="Scroll right"
          title="Прокрутить вперед"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Prominent Scroll Shadow Indicators */}
        <div className="absolute left-0 top-0 bottom-4 w-20 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent pointer-events-none z-10 hidden lg:block" />
        <div className="absolute right-0 top-0 bottom-4 w-20 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent pointer-events-none z-10 hidden lg:block" />

        {/* Kanban Columns - optimized widths for 5 columns visible */}
        <div
          ref={setScrollContainer}
          className="flex gap-3 overflow-x-auto pb-4 px-12 snap-x snap-proximity scroll-smooth"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#CBD5E1 #F1F5F9'
          }}
        >
          {statusColumns.map((column) => {
            const columnLeads = getLeadsByStatus(column.id);
            const isDraggedOver = draggedOverColumn === column.id;

            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-64 md:w-72 lg:w-[270px] snap-center"
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className={`rounded-lg border-2 ${column.color} ${isDraggedOver ? 'ring-2 ring-blue-500' : ''} transition-all`}>
                  <div className="p-3 border-b border-gray-200 bg-white rounded-t-lg">
                    <h3 className="font-semibold text-gray-900 text-sm">{column.label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{columnLeads.length} лид(ов)</p>
                  </div>

                  <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
                    {columnLeads.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-xs">
                        Перетащите сюда
                      </div>
                    ) : (
                      columnLeads.map((lead) => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white rounded-lg border shadow-sm p-2.5 cursor-move hover:shadow-md transition-shadow ${priorityColors[lead.priority]} ${draggedLead?.id === lead.id ? 'opacity-50' : ''}`}
                        >
                          <Link href={`/developer/crm/leads/${lead.id}`} className="block" onClick={(e) => e.currentTarget.draggable = false}>
                            <div className="font-medium text-gray-900 text-sm mb-1.5">
                              {lead.firstName} {lead.lastName}
                            </div>

                            <div className="space-y-0.5 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{lead.phone}</span>
                              </div>

                              {lead.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{lead.email}</span>
                                </div>
                              )}

                              {lead.assignedTo && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <User className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{lead.assignedTo.user.firstName}</span>
                                </div>
                              )}

                              {lead.nextFollowUpAt && (
                                <div className="flex items-center gap-1 text-orange-600 font-medium">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  <span>{formatTime(lead.nextFollowUpAt)}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-1.5 text-xs text-gray-400">
                              {formatTime(lead.createdAt)}
                            </div>
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
