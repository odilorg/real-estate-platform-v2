'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Search, Filter, DollarSign, User, Calendar, Building } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';

interface Deal {
  id: string;
  leadId: string;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  owner: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  property?: {
    id: string;
    title: string;
    price: number;
  };
  dealValue: number;
  currency: string;
  stage: string;
  status: string;
  probability: number;
  expectedCloseDate?: string;
  createdAt: string;
}

interface Pipeline {
  [stage: string]: {
    count: number;
    totalValue: number;
    deals: Deal[];
  };
}

const stages = [
  { key: 'QUALIFIED', label: 'Квалифицирован', color: 'bg-gray-100' },
  { key: 'VIEWING_SCHEDULED', label: 'Просмотр назначен', color: 'bg-blue-100' },
  { key: 'VIEWING_COMPLETED', label: 'Просмотр завершен', color: 'bg-purple-100' },
  { key: 'OFFER_MADE', label: 'Предложение сделано', color: 'bg-yellow-100' },
  { key: 'NEGOTIATION', label: 'Переговоры', color: 'bg-orange-100' },
  { key: 'AGREEMENT_REACHED', label: 'Соглашение достигнуто', color: 'bg-green-100' },
  { key: 'NOTARY_SCHEDULED', label: 'Нотариус назначен', color: 'bg-teal-100' },
  { key: 'DOCUMENTS_PENDING', label: 'Ожидание документов', color: 'bg-indigo-100' },
  { key: 'REGISTRATION_PENDING', label: 'Регистрация', color: 'bg-pink-100' },
];

export default function DealsPage() {
  const [pipeline, setPipeline] = useState<Pipeline>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOwner, setFilterOwner] = useState('');

  useEffect(() => {
    fetchPipeline();
  }, []);

  const fetchPipeline = async () => {
    try {
      const data = await api.get<Pipeline>('/agency-crm/deals/pipeline');
      setPipeline(data);
    } catch (error) {
      console.error('Error fetching pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Find the deal
    const sourceStageDeal = pipeline[source.droppableId]?.deals.find((d) => d.id === draggableId);
    if (!sourceStageDeal) return;

    // Optimistic update
    const newPipeline = { ...pipeline };

    // Remove from source
    newPipeline[source.droppableId].deals = newPipeline[source.droppableId].deals.filter((d) => d.id !== draggableId);
    newPipeline[source.droppableId].count -= 1;
    newPipeline[source.droppableId].totalValue -= sourceStageDeal.dealValue;

    // Add to destination
    if (!newPipeline[destination.droppableId]) {
      newPipeline[destination.droppableId] = { count: 0, totalValue: 0, deals: [] };
    }
    const dealCopy = { ...sourceStageDeal, stage: destination.droppableId };
    newPipeline[destination.droppableId].deals.splice(destination.index, 0, dealCopy);
    newPipeline[destination.droppableId].count += 1;
    newPipeline[destination.droppableId].totalValue += sourceStageDeal.dealValue;

    setPipeline(newPipeline);

    // Update on server
    try {
      await api.patch(`/agency-crm/deals/${draggableId}`, {
        stage: destination.droppableId,
      });
    } catch (error) {
      console.error('Error updating deal stage:', error);
      // Revert on error
      fetchPipeline();
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    if (currency === 'YE') {
      return `${value.toLocaleString()} у.е.`;
    }
    return `${value.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Сделки</h1>
          <p className="text-gray-600 mt-1">Управление воронкой продаж</p>
        </div>
        <Link href="/agency/crm/leads">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Конвертировать лид
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по имени клиента..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Фильтры
        </button>
      </div>

      {/* Pipeline Stats - 2x2 grid on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Всего сделок</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {Object.values(pipeline).reduce((sum, stage) => sum + stage.count, 0)}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
              <Building className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Общая стоимость</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {formatCurrency(
                  Object.values(pipeline).reduce((sum, stage) => sum + stage.totalValue, 0),
                  'YE'
                )}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 truncate">На просмотре</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {(pipeline['VIEWING_SCHEDULED']?.count || 0) + (pipeline['VIEWING_COMPLETED']?.count || 0)}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 rounded-lg flex-shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 truncate">В переговорах</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {pipeline['NEGOTIATION']?.count || 0}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-orange-100 rounded-lg flex-shrink-0">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageData = pipeline[stage.key] || { count: 0, totalValue: 0, deals: [] };

            return (
              <div key={stage.key} className="flex-shrink-0 w-80">
                <div className={`${stage.color} p-4 rounded-t-lg`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                    <span className="bg-white px-2 py-1 rounded text-sm font-medium">{stageData.count}</span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">
                    {formatCurrency(stageData.totalValue, 'YE')}
                  </p>
                </div>

                <Droppable droppableId={stage.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`bg-gray-50 p-2 rounded-b-lg min-h-[200px] space-y-2 ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      }`}
                    >
                      {stageData.deals.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <Link href={`/agency/crm/deals/${deal.id}`}>
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow ${
                                  snapshot.isDragging ? 'opacity-50' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-gray-900">
                                    {deal.lead.firstName} {deal.lead.lastName}
                                  </h4>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {deal.probability}%
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{deal.lead.phone}</p>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-semibold text-green-600">
                                    {formatCurrency(deal.dealValue, deal.currency)}
                                  </span>
                                  {deal.expectedCloseDate && (
                                    <span className="text-gray-500">{formatDate(deal.expectedCloseDate)}</span>
                                  )}
                                </div>
                                {deal.property && (
                                  <p className="text-xs text-gray-500 mt-2 truncate">{deal.property.title}</p>
                                )}
                                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                  <User className="h-3 w-3" />
                                  {deal.owner.user.firstName} {deal.owner.user.lastName}
                                </div>
                              </div>
                            </Link>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
