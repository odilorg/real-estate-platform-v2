'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { Search, Plus, Phone, Mail, User, Calendar, ChevronRight, AlertCircle, Loader2, UserPlus, X, LayoutList, LayoutGrid, Upload, Download, Trash2, CheckSquare, Square, CalendarDays } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import KanbanBoard from './KanbanBoard';
import CalendarView from './CalendarView';

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

interface TeamMember {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  role: string;
  agentType?: string;
}

const statusColors = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  QUALIFIED: 'bg-green-100 text-green-800',
  NEGOTIATING: 'bg-purple-100 text-purple-800',
  CONVERTED: 'bg-green-600 text-white',
  LOST: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export default function AgencyCRMLeadsPage() {
  const { user } = useAuth();
  const t = useTranslations('crm.leads');
  const tc = useTranslations('crm.common');

  const [leads, setLeads] = useState<Lead[]>([]);
  
  // Defensive: Ensure leads is always an array
  const safeLeads = Array.isArray(leads) ? leads : [];
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const safeTeamMembers = Array.isArray(teamMembers) ? teamMembers : [];
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [total, setTotal] = useState(0);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');

  // Bulk operations state
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkOperating, setBulkOperating] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
    fetchLeads();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, priorityFilter, assignedFilter]);

  const fetchTeamMembers = async () => {
    try {
      const data = await api.get<TeamMember[]>('/agency-crm/members');
      setTeamMembers(data);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (assignedFilter === 'unassigned') params.append('unassigned', 'true');
      else if (assignedFilter !== 'all') params.append('assignedTo', assignedFilter);

      const data = await api.get<{leads: Lead[], total: number, skip?: number}>(`/agency-crm/leads?${params.toString()}`);
      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (memberId: string) => {
    if (!selectedLead) return;

    setAssigning(true);
    try {
      await api.put(`/agency-crm/leads/${selectedLead.id}/assign`, { memberId });
      setShowAssignModal(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error) {
      console.error('Error assigning lead:', error);
      alert(t('alerts.assignError'));
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (leadId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(t('alerts.unassignConfirm'))) return;

    try {
      await api.put(`/agency-crm/leads/${leadId}/assign`, { memberId: null });
      fetchLeads();
    } catch (error) {
      console.error('Error unassigning lead:', error);
      alert(t('alerts.unassignError'));
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t('time.today');
    if (diffDays === 1) return t('time.yesterday');
    if (diffDays < 7) return t('time.daysAgo', { days: diffDays });
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getFollowUpLeads = () => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    return safeLeads.filter(lead => {
      if (!lead.nextFollowUpAt) return false;
      const followUpDate = new Date(lead.nextFollowUpAt);
      return followUpDate <= todayEnd;
    }).sort((a, b) => {
      const dateA = new Date(a.nextFollowUpAt!).getTime();
      const dateB = new Date(b.nextFollowUpAt!).getTime();
      return dateA - dateB;
    });
  };

  const followUpLeads = getFollowUpLeads();

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await api.put(`/agency-crm/leads/${leadId}`, { status: newStatus });
      fetchLeads(); // Refresh leads after status change
    } catch (error) {
      console.error('Error updating lead status:', error);
      alert(t('alerts.statusError'));
    }
  };

  // Bulk operations handlers
  const toggleSelectLead = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === safeLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(safeLeads.map(lead => lead.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;

    setBulkOperating(true);
    try {
      const result = await api.post<{ success: number; failed: number; errors: any[] }>(
        '/agency-crm/leads/bulk-delete',
        { leadIds: selectedLeads }
      );

      setShowBulkDeleteModal(false);
      setSelectedLeads([]);
      fetchLeads();

      if (result.failed > 0) {
        alert(t('alerts.deleteSuccess', { success: result.success, failed: result.failed }));
      } else {
        alert(t('alerts.deleteSuccessAll', { count: result.success }));
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert(t('alerts.deleteError'));
    } finally {
      setBulkOperating(false);
    }
  };

  const handleBulkAssign = async (memberId: string) => {
    if (selectedLeads.length === 0) return;

    setBulkOperating(true);
    try {
      const result = await api.post<{ success: number; failed: number; errors: any[] }>(
        '/agency-crm/leads/bulk-assign',
        { leadIds: selectedLeads, memberId }
      );

      setShowBulkAssignModal(false);
      setSelectedLeads([]);
      fetchLeads();

      if (result.failed > 0) {
        alert(t('alerts.assignSuccess', { success: result.success, failed: result.failed }));
      } else {
        alert(t('alerts.assignSuccessAll', { count: result.success }));
      }
    } catch (error) {
      console.error('Bulk assign error:', error);
      alert(t('alerts.assignError2'));
    } finally {
      setBulkOperating(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-6 w-full">
      {/* Header Section - Improved mobile layout */}
      <div className="space-y-4 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-gray-500">{t('subtitle')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex gap-2">
              <Link href="/developer/crm/leads/import" className="flex-1 sm:flex-initial">
                <button className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 sm:px-4 sm:py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium shadow-sm min-h-[38px] sm:min-h-[44px]">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm sm:text-base">{t('import')}</span>
                </button>
              </Link>
              <Link href="/developer/crm/leads/export" className="flex-1 sm:flex-initial">
                <button className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 sm:px-4 sm:py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium shadow-sm min-h-[38px] sm:min-h-[44px]">
                  <Download className="h-4 w-4" />
                  <span className="text-sm sm:text-base">{t('export')}</span>
                </button>
              </Link>
            </div>
            <Link href="/developer/crm/leads/new" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 sm:px-5 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-sm min-h-[38px] sm:min-h-[44px]">
                <Plus className="h-5 w-5" />
                <span className="text-sm sm:text-base">{t('addLead')}</span>
              </button>
            </Link>
          </div>
        </div>

        {/* View Mode Toggle - Mobile friendly */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 sm:flex-initial px-3 md:px-4 py-2.5 rounded-md transition-colors flex items-center justify-center gap-1.5 md:gap-2 min-h-[38px] sm:min-h-[44px] ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <LayoutList className="h-4 w-4" />
            <span className="font-medium text-sm md:text-base">{t('viewModes.list')}</span>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex-1 sm:flex-initial px-3 md:px-4 py-2.5 rounded-md transition-colors flex items-center justify-center gap-1.5 md:gap-2 min-h-[38px] sm:min-h-[44px] ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="font-medium text-sm md:text-base">{t('viewModes.kanban')}</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 sm:flex-initial px-3 md:px-4 py-2.5 rounded-md transition-colors flex items-center justify-center gap-1.5 md:gap-2 min-h-[38px] sm:min-h-[44px] ${viewMode === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <CalendarDays className="h-4 w-4" />
            <span className="font-medium text-sm md:text-base">{t('viewModes.calendar')}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - 2x2 grid on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: t('stats.total'), value: total, icon: '📊', color: 'text-gray-900' },
          { label: t('stats.new'), value: safeLeads.filter(l => l.status === 'NEW').length, icon: '🆕', color: 'text-blue-600' },
          { label: t('stats.qualified'), value: safeLeads.filter(l => l.status === 'QUALIFIED').length, icon: '✅', color: 'text-green-600' },
          { label: t('stats.urgent'), value: safeLeads.filter(l => l.priority === 'URGENT').length, icon: '🔥', color: 'text-red-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-2.5 sm:p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between gap-1">
              <div className="text-[11px] sm:text-xs lg:text-sm font-medium text-gray-500 truncate">{stat.label}</div>
              <span className="text-sm sm:text-base flex-shrink-0">{stat.icon}</span>
            </div>
            <div className={`text-base sm:text-xl lg:text-2xl font-bold mt-1 sm:mt-2 ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Follow-up Alert - Mobile optimized */}
      {followUpLeads.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm md:text-base font-semibold text-orange-900 mb-2">{t('followUp.alert')} ({followUpLeads.length})</h3>
              <div className="space-y-2">
                {followUpLeads.map(lead => (
                  <Link key={lead.id} href={`/developer/crm/leads/${lead.id}`}>
                    <div className="bg-white p-3 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{lead.firstName} {lead.lastName}</p>
                          <p className="text-xs text-gray-600">{lead.phone}</p>
                        </div>
                        {lead.assignedTo && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                            <User className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{lead.assignedTo.user.firstName}</span>
                          </div>
                        )}
                        {lead.priority === 'URGENT' && (
                          <span className="text-xs font-bold text-red-600 flex-shrink-0">{t('followUp.overdue')}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters - Mobile optimized */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[38px] sm:min-h-[44px]"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 sm:py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px] sm:min-h-[44px]"
          >
            <option value="all">{t('filters.allStatuses')}</option>
            <option value="NEW">{t('statuses.NEW')}</option>
            <option value="CONTACTED">{t('statuses.CONTACTED')}</option>
            <option value="QUALIFIED">{t('statuses.QUALIFIED')}</option>
            <option value="NEGOTIATING">{t('statuses.NEGOTIATING')}</option>
            <option value="CONVERTED">{t('statuses.CONVERTED')}</option>
            <option value="LOST">{t('statuses.LOST')}</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 sm:py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px] sm:min-h-[44px]"
          >
            <option value="all">{t('filters.allPriorities')}</option>
            <option value="URGENT">{t('priorities.URGENT')}</option>
            <option value="HIGH">{t('priorities.HIGH')}</option>
            <option value="MEDIUM">{t('priorities.MEDIUM')}</option>
            <option value="LOW">{t('priorities.LOW')}</option>
          </select>
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="px-3 py-1.5 sm:py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px] sm:min-h-[44px]"
          >
            <option value="all">{t('filters.allAgents')}</option>
            <option value="unassigned">{t('filters.unassigned')}</option>
            {safeTeamMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.user.firstName} {member.user.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedLeads.length > 0 && viewMode === 'list' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleSelectAll}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                {selectedLeads.length === safeLeads.length ? (
                  <CheckSquare className="h-5 w-5" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
              </button>
              <span className="text-sm font-medium text-blue-900">
                {t('bulk.selected')}: {selectedLeads.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkAssignModal(true)}
                className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">{t('bulk.assign')}</span>
              </button>
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('bulk.delete')}</span>
              </button>
              <button
                onClick={() => setSelectedLeads([])}
                className="text-blue-600 hover:text-blue-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leads List/Kanban */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{t('noLeads')}</h3>
            <p className="text-sm md:text-base text-gray-600 mb-6">{t('noLeadsDescription')}</p>
            <Link href="/developer/crm/leads/new">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mx-auto min-h-[38px] sm:min-h-[44px]">
                <Plus className="h-5 w-5" />
                <span>{t('addFirstLead')}</span>
              </button>
            </Link>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          <KanbanBoard leads={safeLeads} onStatusChange={handleStatusChange} />
        </div>
      ) : viewMode === 'calendar' ? (
        <CalendarView leads={safeLeads} />
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {leads.map((lead) => (
              <div key={lead.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
                <div className="p-4 flex gap-2 sm:gap-3">
                  {/* Checkbox */}
                  <div className="flex-shrink-0 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectLead(lead.id);
                      }}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      {selectedLeads.includes(lead.id) ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* Card Content - Now clickable link */}
                  <Link href={`/developer/crm/leads/${lead.id}`} className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                          {lead.firstName} {lead.lastName}
                        </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${statusColors[lead.status]}`}>
                          {lead.status}
                        </span>
                        {lead.priority === 'URGENT' || lead.priority === 'HIGH' ? (
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${priorityColors[lead.priority]}`}>
                            {lead.priority === 'URGENT' ? t('priority.urgentTag') : t('priority.highTag')}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-sm">{lead.phone}</span>
                    </div>
                    {lead.email && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Mail className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-sm truncate">{lead.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Agent & Time */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${lead.assignedTo ? 'bg-green-50' : 'bg-gray-50'}`}>
                        <User className={`h-4 w-4 ${lead.assignedTo ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <span className={`text-xs font-medium ${lead.assignedTo ? 'text-green-700' : 'text-gray-500'}`}>
                        {lead.assignedTo ? lead.assignedTo.user.firstName : t('filters.unassigned')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatTime(lead.createdAt)}</span>
                    </div>
                  </div>

                  {/* Follow-up Alert */}
                  {lead.nextFollowUpAt && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-orange-600">
                        <div className="w-6 h-6 bg-orange-50 rounded-full flex items-center justify-center">
                          <Calendar className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-semibold">
                          {t('followUp.call')}: {formatTime(lead.nextFollowUpAt)}
                        </span>
                      </div>
                    </div>
                  )}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <div key={lead.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                  {/* Checkbox */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectLead(lead.id);
                      }}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      {selectedLeads.includes(lead.id) ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* Content - Wrapped in Link */}
                  <Link href={`/developer/crm/leads/${lead.id}`} className="flex-1 min-w-0 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {lead.firstName} {lead.lastName}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusColors[lead.status]}`}>
                          {lead.status}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${priorityColors[lead.priority]}`}>
                          {lead.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatTime(lead.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lead.assignedTo ? (
                        <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                          <User className="h-4 w-4" />
                          <span>{lead.assignedTo.user.firstName}</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedLead(lead);
                            setShowAssignModal(true);
                          }}
                          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span>{t('assign.button')}</span>
                        </button>
                      )}
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t('assign.title')}</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {safeTeamMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleAssign(member.id)}
                  disabled={assigning}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <div className="font-medium text-gray-900">
                    {member.user.firstName} {member.user.lastName}
                  </div>
                  <div className="text-sm text-gray-600">{member.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-900">{t('deleteModal.title')}</h3>
              <button onClick={() => setShowBulkDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              {t('deleteModal.message', { count: selectedLeads.length })}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={bulkOperating}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {tc('cancel')}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkOperating}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {bulkOperating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('deleteModal.deleting')}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {tc('delete')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t('assign.title')}</h3>
              <button onClick={() => setShowBulkAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {t('assign.selectedLeads')}: {selectedLeads.length}
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {safeTeamMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleBulkAssign(member.id)}
                  disabled={bulkOperating}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <div className="font-medium text-gray-900">
                    {member.user.firstName} {member.user.lastName}
                  </div>
                  <div className="text-sm text-gray-600">{member.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
