'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from '@/i18n/routing';
import {
  ArrowLeft,
  Edit,
  X,
  Check,
  Phone,
  Mail,
  User,
  Building,
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  Loader2,
} from 'lucide-react';
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
    email?: string;
    propertyType?: string;
    listingType?: string;
    budget?: number;
    requirements?: string;
  };
  owner: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      phone?: string;
      email?: string;
    };
  };
  property?: {
    id: string;
    title: string;
    price: number;
    propertyType: string;
    bedrooms?: number;
  };
  dealType: string;
  dealValue: number;
  currency: string;
  stage: string;
  status: string;
  probability: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  commissionRate: number;
  commissionAmount: number;
  commissionSplit?: any;
  notaryScheduled?: string;
  notaryCompleted: boolean;
  registrationId?: string;
  registrationDate?: string;
  closeReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  activities: any[];
  commissions: any[];
  tasks: any[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DealDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeStatus, setCloseStatus] = useState<'WON' | 'LOST'>('WON');
  const [closeReason, setCloseReason] = useState('');
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    fetchDeal();
  }, [resolvedParams.id]);

  const fetchDeal = async () => {
    try {
      const data = await api.get<Deal>(`/agency-crm/deals/${resolvedParams.id}`);
      setDeal(data);
    } catch (error) {
      console.error('Error fetching deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDeal = async () => {
    if (!deal) return;
    if (closeStatus === 'LOST' && !closeReason) {
      alert('Пожалуйста, укажите причину закрытия сделки');
      return;
    }

    setClosing(true);
    try {
      await api.post(`/agency-crm/deals/${deal.id}/close`, {
        status: closeStatus,
        closeReason: closeReason || undefined,
      });
      setShowCloseModal(false);
      fetchDeal();
    } catch (error) {
      console.error('Error closing deal:', error);
      alert('Ошибка при закрытии сделки');
    } finally {
      setClosing(false);
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    if (currency === 'YE') {
      return `${value.toLocaleString()} у.е.`;
    }
    return `${value.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStageLabel = (stage: string) => {
    const stages: Record<string, string> = {
      QUALIFIED: 'Квалифицирован',
      VIEWING_SCHEDULED: 'Просмотр назначен',
      VIEWING_COMPLETED: 'Просмотр завершен',
      OFFER_MADE: 'Предложение сделано',
      NEGOTIATION: 'Переговоры',
      AGREEMENT_REACHED: 'Соглашение достигнуто',
      NOTARY_SCHEDULED: 'Нотариус назначен',
      DOCUMENTS_PENDING: 'Ожидание документов',
      REGISTRATION_PENDING: 'Регистрация',
      CLOSED_WON: 'Закрыта - выиграна',
      CLOSED_LOST: 'Закрыта - проиграна',
    };
    return stages[stage] || stage;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Активна' },
      ON_HOLD: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Приостановлена' },
      WON: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Выиграна' },
      LOST: { bg: 'bg-red-100', text: 'text-red-800', label: 'Проиграна' },
    };
    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Сделка не найдена</h2>
          <Link href="/agency/crm/deals">
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/agency/crm/deals">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {deal.lead.firstName} {deal.lead.lastName}
              </h1>
              {getStatusBadge(deal.status)}
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                {deal.probability}%
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Сделка создана {formatDate(deal.createdAt)} • {getStageLabel(deal.stage)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {deal.status === 'ACTIVE' && (
            <button
              onClick={() => setShowCloseModal(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Закрыть сделку
            </button>
          )}
          <Link href={`/agency/crm/deals/${deal.id}/edit`}>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Редактировать
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Value */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Стоимость сделки</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Стоимость объекта</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(deal.dealValue, deal.currency)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Комиссия ({deal.commissionRate}%)</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(deal.commissionAmount, deal.currency)}
                </p>
              </div>
            </div>
            {deal.expectedCloseDate && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">Ожидаемая дата закрытия</p>
                <p className="text-lg font-medium text-gray-900">{formatDate(deal.expectedCloseDate)}</p>
              </div>
            )}
          </div>

          {/* Client Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Информация о клиенте</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="h-5 w-5 text-gray-400" />
                <a href={`tel:${deal.lead.phone}`} className="hover:text-blue-600">
                  {deal.lead.phone}
                </a>
              </div>
              {deal.lead.email && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <a href={`mailto:${deal.lead.email}`} className="hover:text-blue-600">
                    {deal.lead.email}
                  </a>
                </div>
              )}
              {deal.lead.requirements && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Требования клиента</h4>
                  <p className="text-gray-700">{deal.lead.requirements}</p>
                </div>
              )}
            </div>
            <Link href={`/agency/crm/leads/${deal.leadId}`}>
              <button className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                Открыть профиль лида →
              </button>
            </Link>
          </div>

          {/* Property Info */}
          {deal.property && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Информация об объекте</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">{deal.property.title}</h3>
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">
                    {deal.property.propertyType}
                    {deal.property.bedrooms && ` • ${deal.property.bedrooms} комнат`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{formatCurrency(deal.property.price, deal.currency)}</span>
                </div>
              </div>
              <Link href={`/properties/${deal.property.id}`}>
                <button className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Открыть объект →
                </button>
              </Link>
            </div>
          )}

          {/* Notes */}
          {deal.notes && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Заметки</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{deal.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Deal Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Детали сделки</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Тип сделки:</span>
                <p className="font-medium">
                  {deal.dealType === 'BUYER'
                    ? 'Покупатель'
                    : deal.dealType === 'SELLER'
                    ? 'Продавец'
                    : 'Обе стороны'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Ответственный:</span>
                <p className="font-medium">
                  {deal.owner.user.firstName} {deal.owner.user.lastName}
                </p>
                {deal.owner.user.phone && <p className="text-gray-600">{deal.owner.user.phone}</p>}
              </div>
              {deal.actualCloseDate && (
                <div>
                  <span className="text-gray-500">Дата закрытия:</span>
                  <p className="font-medium">{formatDate(deal.actualCloseDate)}</p>
                </div>
              )}
              {deal.closeReason && (
                <div>
                  <span className="text-gray-500">Причина:</span>
                  <p className="font-medium text-red-600">{deal.closeReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notary Info */}
          {deal.notaryScheduled && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Нотариус и регистрация</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Нотариус назначен:</span>
                  <p className="font-medium">{formatDate(deal.notaryScheduled)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Статус:</span>
                  <p className="font-medium">{deal.notaryCompleted ? 'Завершено ✓' : 'В процессе'}</p>
                </div>
                {deal.registrationId && (
                  <div>
                    <span className="text-gray-500">Номер регистрации:</span>
                    <p className="font-medium">{deal.registrationId}</p>
                  </div>
                )}
                {deal.registrationDate && (
                  <div>
                    <span className="text-gray-500">Дата регистрации:</span>
                    <p className="font-medium">{formatDate(deal.registrationDate)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Commission Info */}
          {deal.commissions.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Комиссии</h2>
              <div className="space-y-3">
                {deal.commissions.map((commission: any) => (
                  <div key={commission.id} className="border-b pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {commission.member.user.firstName} {commission.member.user.lastName}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        commission.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        commission.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {commission.status === 'PAID' ? 'Выплачено' :
                         commission.status === 'APPROVED' ? 'Одобрено' : 'Ожидает'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(commission.netAmount, commission.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Close Deal Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Закрыть сделку</h3>
              <button onClick={() => setShowCloseModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Результат</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCloseStatus('WON')}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      closeStatus === 'WON'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Check className="h-5 w-5 mx-auto mb-1" />
                    Выиграна
                  </button>
                  <button
                    onClick={() => setCloseStatus('LOST')}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      closeStatus === 'LOST'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <X className="h-5 w-5 mx-auto mb-1" />
                    Проиграна
                  </button>
                </div>
              </div>

              {closeStatus === 'LOST' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Причина закрытия *
                  </label>
                  <textarea
                    value={closeReason}
                    onChange={(e) => setCloseReason(e.target.value)}
                    placeholder="Укажите причину..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleCloseDeal}
                  disabled={closing}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {closing ? 'Закрытие...' : 'Подтвердить'}
                </button>
                <button
                  onClick={() => setShowCloseModal(false)}
                  disabled={closing}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
