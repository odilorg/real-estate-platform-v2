'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, DollarSign, Check, X, Calendar, User, TrendingUp, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';

interface Commission {
  id: string;
  grossAmount: number;
  agencyFee: number;
  netAmount: number;
  currency: string;
  status: string;
  dueDate?: string;
  paidDate?: string;
  paymentMethod?: string;
  paymentNotes?: string;
  createdAt: string;
  member: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  deal: {
    id: string;
    dealValue: number;
    lead: {
      id: string;
      firstName: string;
      lastName: string;
    };
    property?: {
      id: string;
      title: string;
    };
  };
}

interface Summary {
  total: number;
  gross: number;
  count: number;
  pending: { count: number; total: number };
  approved: { count: number; total: number };
  paid: { count: number; total: number };
  disputed: { count: number; total: number };
}

export default function CommissionsPage() {
  const t = useTranslations('crm.commissions');
  const tc = useTranslations('crm.common');
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCommissions();
    fetchSummary();
  }, [statusFilter]);

  const fetchCommissions = async () => {
    try {
      const queryParams = statusFilter ? `?status=${statusFilter}` : '';
      const response = await api.get<{ data: Commission[] }>(`/agency-crm/commissions${queryParams}`);
      setCommissions(response.data);
    } catch (error) {
      console.error('Error fetching commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await api.get<Summary>('/agency-crm/commissions/summary');
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm(t('alerts.approveConfirm'))) return;

    try {
      await api.post(`/agency-crm/commissions/${id}/approve`, {});
      fetchCommissions();
      fetchSummary();
    } catch (error) {
      console.error('Error approving commission:', error);
      alert(t('alerts.approveError'));
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedCommission) return;
    if (!paymentMethod) {
      alert(t('alerts.paymentMethodRequired'));
      return;
    }

    setProcessing(true);
    try {
      await api.post(`/agency-crm/commissions/${selectedCommission.id}/pay`, {
        paymentMethod,
        paymentNotes: paymentNotes || undefined,
        paidDate: new Date().toISOString(),
      });
      setShowPayModal(false);
      setPaymentMethod('');
      setPaymentNotes('');
      setSelectedCommission(null);
      fetchCommissions();
      fetchSummary();
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert(t('alerts.payError'));
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    if (currency === 'YE') {
      return `${value.toLocaleString()} ${t('currency.ye', { defaultValue: 'у.е.' })}`;
    }
    return `${value.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      APPROVED: { bg: 'bg-blue-100', text: 'text-blue-800' },
      PAID: { bg: 'bg-green-100', text: 'text-green-800' },
      DISPUTED: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    const label = t(`statuses.${status}` as any, { defaultValue: status });
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badge.bg} ${badge.text}`}>
        {label}
      </span>
    );
  };

  const filteredCommissions = commissions.filter((comm) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      comm.member.user.firstName.toLowerCase().includes(query) ||
      comm.member.user.lastName.toLowerCase().includes(query) ||
      comm.deal.lead.firstName.toLowerCase().includes(query) ||
      comm.deal.lead.lastName.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-600 mt-1">{t('subtitle')}</p>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('stats.total')}</p>
                <p className="text-2xl font-bold text-gray-900">{summary.count}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('stats.pending')}</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total, 'YE')}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('stats.awaitingApproval')}</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.pending.count}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('stats.paid')}</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.paid.total, 'YE')}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">{t('statuses.all')}</option>
          <option value="PENDING">{t('statuses.PENDING')}</option>
          <option value="APPROVED">{t('statuses.APPROVED')}</option>
          <option value="PAID">{t('statuses.PAID')}</option>
          <option value="DISPUTED">{t('statuses.DISPUTED')}</option>
        </select>
      </div>

      {/* Commissions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.agent')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.deal')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.dealAmount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.commission')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.date')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {t('table.noCommissions')}
                  </td>
                </tr>
              ) : (
                filteredCommissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {commission.member.user.firstName} {commission.member.user.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {commission.deal.lead.firstName} {commission.deal.lead.lastName}
                      </div>
                      {commission.deal.property && (
                        <div className="text-xs text-gray-500">{commission.deal.property.title}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(commission.deal.dealValue, commission.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(commission.netAmount, commission.currency)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('table.gross')}: {formatCurrency(commission.grossAmount, commission.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(commission.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {commission.paidDate ? formatDate(commission.paidDate) : formatDate(commission.createdAt)}
                      </div>
                      {commission.paymentMethod && (
                        <div className="text-xs text-gray-500">{commission.paymentMethod}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {commission.status === 'PENDING' && (
                        <button
                          onClick={() => handleApprove(commission.id)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          {t('actions.approve')}
                        </button>
                      )}
                      {commission.status === 'APPROVED' && (
                        <button
                          onClick={() => {
                            setSelectedCommission(commission);
                            setShowPayModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          {t('actions.pay')}
                        </button>
                      )}
                      {commission.status === 'PAID' && (
                        <span className="text-gray-400">{t('actions.paidDone')}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayModal && selectedCommission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{t('payModal.title')}</h3>
              <button
                onClick={() => {
                  setShowPayModal(false);
                  setSelectedCommission(null);
                  setPaymentMethod('');
                  setPaymentNotes('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{t('payModal.agent')}</p>
              <p className="font-medium">
                {selectedCommission.member.user.firstName} {selectedCommission.member.user.lastName}
              </p>
              <p className="text-sm text-gray-600 mt-2">{t('payModal.amount')}</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(selectedCommission.netAmount, selectedCommission.currency)}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('payModal.paymentMethod')}</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('payModal.selectMethod')}</option>
                  <option value="BANK_TRANSFER">{t('payModal.bankTransfer')}</option>
                  <option value="CASH">{t('payModal.cash')}</option>
                  <option value="CARD">{t('payModal.card')}</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="OTHER">{t('payModal.other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('payModal.notes')}</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder={t('payModal.notesPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleMarkAsPaid}
                  disabled={processing}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? t('payModal.saving') : t('payModal.confirm')}
                </button>
                <button
                  onClick={() => {
                    setShowPayModal(false);
                    setSelectedCommission(null);
                    setPaymentMethod('');
                    setPaymentNotes('');
                  }}
                  disabled={processing}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {tc('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
