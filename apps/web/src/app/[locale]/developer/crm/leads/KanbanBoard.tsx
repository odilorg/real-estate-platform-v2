'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { Phone, Mail, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';

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

// Lead Card Component (visual only, used in both draggable and overlay)
function LeadCard({ lead, formatTime }: { lead: Lead; formatTime: (date?: string) => string | null }) {
  return (
    <div className={`bg-white rounded-lg border shadow-sm p-2.5 hover:shadow-md transition-shadow ${priorityColors[lead.priority]}`}>
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
    </div>
  );
}

// Draggable Item Wrapper
function DraggableItem({ id, lead, formatTime }: { id: string; lead: Lead; formatTime: (date?: string) => string | null }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-move ${isDragging ? 'opacity-50' : ''}`}
    >
      <Link
        href={`/developer/crm/leads/${lead.id}`}
        className="block"
        onClick={(e) => {
          // Prevent navigation when dragging
          if (isDragging) {
            e.preventDefault();
          }
        }}
      >
        <LeadCard lead={lead} formatTime={formatTime} />
      </Link>
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({
  id,
  label,
  color,
  leads,
  formatTime,
}: {
  id: string;
  label: string;
  color: string;
  leads: Lead[];
  formatTime: (date?: string) => string | null;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className="flex-shrink-0 w-64 md:w-72 lg:w-[270px] snap-center">
      <div className={`rounded-lg border-2 ${color} ${isOver ? 'ring-2 ring-blue-500 ring-offset-2' : ''} transition-all`}>
        <div className="p-3 border-b border-gray-200 bg-white rounded-t-lg">
          <h3 className="font-semibold text-gray-900 text-sm">{label}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{leads.length} лид(ов)</p>
        </div>

        <div
          ref={setNodeRef}
          className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto"
        >
          {leads.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              Перетащите сюда
            </div>
          ) : (
            leads.map((lead) => (
              <DraggableItem key={lead.id} id={lead.id} lead={lead} formatTime={formatTime} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function KanbanBoard({ leads, onStatusChange }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);

  // Configure sensors for both mouse and touch (MOBILE SUPPORT!)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms press before drag on touch devices
        tolerance: 5, // 5px tolerance for movement
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const leadId = active.id as string;
      const newStatus = over.id as string;

      // Find the lead to check if status is different
      const lead = leads.find(l => l.id === leadId);
      if (lead && lead.status !== newStatus) {
        await onStatusChange(leadId, newStatus);
      }
    }

    setActiveId(null);
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

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="relative">
        {/* Scroll hint - shows there are more columns */}
        <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
          <span>📱 Нажмите и тяните для перемещения</span>
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

          {/* Kanban Columns */}
          <div
            ref={setScrollContainer}
            className="flex gap-3 overflow-x-auto pb-4 px-12 snap-x snap-proximity scroll-smooth"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E1 #F1F5F9',
              touchAction: 'pan-x pan-y', // Allow touch scrolling
            }}
          >
            {statusColumns.map((column) => {
              const columnLeads = getLeadsByStatus(column.id);

              return (
                <DroppableColumn
                  key={column.id}
                  id={column.id}
                  label={column.label}
                  color={column.color}
                  leads={columnLeads}
                  formatTime={formatTime}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Drag Overlay - shows the dragged item (MOBILE VISUAL FEEDBACK!) */}
      <DragOverlay dropAnimation={null}>
        {activeLead ? (
          <div className="opacity-90 rotate-3 scale-105">
            <LeadCard lead={activeLead} formatTime={formatTime} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
