'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  User, Phone, Mail, MapPin, Calendar, 
  DollarSign, Home, Bed, Tag, TrendingUp,
  Building2, Star, ArrowRight, MessageSquare
} from 'lucide-react';

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
  budgetCurrency?: string;
  bedrooms?: number;
  districts?: string[];
  requirements?: string;
  source: string;
  status: string;
  priority: string;
  assignedTo?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface MatchedProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  propertyType: string;
  listingType: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  address: string;
  city: string;
  district?: string;
  status: string;
  matchScore: number;
  images?: Array<{ url: string }>;
  user: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [matchedProperties, setMatchedProperties] = useState<MatchedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    fetchLead();
    fetchMatchedProperties();
  }, [params.id]);

  const fetchLead = async () => {
    try {
      const data = await api.get<Lead>(`/agency-crm/leads/${params.id}`);
      setLead(data);
    } catch (error) {
      console.error('Error fetching lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchedProperties = async () => {
    try {
      const data = await api.get<MatchedProperty[]>(`/agency-crm/leads/${params.id}/matched-properties`);
      setMatchedProperties(data);
    } catch (error) {
      console.error('Error fetching matched properties:', error);
    } finally {
      setLoadingMatches(false);
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

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return 'Отличное совпадение';
    if (score >= 60) return 'Хорошее совпадение';
    if (score >= 40) return 'Среднее совпадение';
    return 'Низкое совпадение';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Лид не найден</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {lead.firstName} {lead.lastName}
            </h1>
            <p className="text-gray-500 mt-1">ID лида: {lead.id.slice(0, 8)}</p>
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}>
              {lead.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(lead.priority)}`}>
              {lead.priority}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Lead Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Контактная информация</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-5 h-5" />
                  <span>{lead.phone}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="w-5 h-5" />
                    <span>{lead.email}</span>
                  </div>
                )}
                {lead.telegram && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <MessageSquare className="w-5 h-5" />
                    <span>@{lead.telegram}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Требования</h2>
              <div className="space-y-3">
                {lead.propertyType && (
                  <div className="flex items-center gap-3">
                    <Home className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Тип недвижимости</div>
                      <div className="text-gray-900">{lead.propertyType}</div>
                    </div>
                  </div>
                )}
                {lead.listingType && (
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Тип сделки</div>
                      <div className="text-gray-900">{lead.listingType}</div>
                    </div>
                  </div>
                )}
                {lead.budget && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Бюджет</div>
                      <div className="text-gray-900">{formatPrice(lead.budget, lead.budgetCurrency || 'UZS')}</div>
                    </div>
                  </div>
                )}
                {lead.bedrooms && (
                  <div className="flex items-center gap-3">
                    <Bed className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Комнат</div>
                      <div className="text-gray-900">{lead.bedrooms}</div>
                    </div>
                  </div>
                )}
                {lead.districts && lead.districts.length > 0 && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Районы</div>
                      <div className="text-gray-900">{lead.districts.join(', ')}</div>
                    </div>
                  </div>
                )}
              </div>
              {lead.requirements && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500 mb-1">Дополнительные требования</div>
                  <p className="text-gray-900 text-sm">{lead.requirements}</p>
                </div>
              )}
            </div>

            {/* Lead Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Детали лида</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Источник:</span>
                  <span className="text-gray-900">{lead.source}</span>
                </div>
                {lead.assignedTo && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Назначен:</span>
                    <span className="text-gray-900">
                      {lead.assignedTo.user.firstName} {lead.assignedTo.user.lastName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Создан:</span>
                  <span className="text-gray-900">{new Date(lead.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Matched Properties */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Подходящие объекты
                </h2>
                {!loadingMatches && (
                  <span className="text-sm text-gray-500">
                    Найдено: {matchedProperties.length}
                  </span>
                )}
              </div>

              {loadingMatches ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500">Поиск подходящих объектов...</div>
                </div>
              ) : matchedProperties.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Подходящие объекты не найдены</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Попробуйте изменить требования лида или добавьте новые объекты в базу
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matchedProperties.map((property) => (
                    <div
                      key={property.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/developer/crm/listings/${property.id}`)}
                    >
                      <div className="flex gap-4">
                        {/* Property Image */}
                        {property.images && property.images.length > 0 ? (
                          <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={property.images[0].url}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-32 h-32 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-gray-300" />
                          </div>
                        )}

                        {/* Property Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {property.title}
                            </h3>
                            <div className="flex items-center gap-2 ml-4">
                              <div className={`px-3 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(property.matchScore)}`}>
                                <Star className="w-3 h-3 inline mr-1" />
                                {property.matchScore}%
                              </div>
                            </div>
                          </div>

                          <div className="text-sm text-gray-500 mb-2">
                            {getMatchScoreLabel(property.matchScore)}
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Home className="w-4 h-4" />
                              {property.propertyType}
                            </div>
                            {property.bedrooms && (
                              <div className="flex items-center gap-1">
                                <Bed className="w-4 h-4" />
                                {property.bedrooms} комн.
                              </div>
                            )}
                            {property.area && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                {property.area} м²
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {property.district || property.city}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xl font-bold text-gray-900">
                              {formatPrice(property.price, property.currency)}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/developer/crm/listings/${property.id}`);
                              }}
                              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
                            >
                              Подробнее
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="text-xs text-gray-400 mt-2">
                            Агент: {property.user.firstName} {property.user.lastName}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
