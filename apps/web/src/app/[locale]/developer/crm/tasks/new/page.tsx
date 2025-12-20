'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { ChevronLeft, Save } from 'lucide-react';

interface Member {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
}

export default function NewTaskPage() {
  const router = useRouter();
  const t = useTranslations('crm.tasks');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'FOLLOW_UP',
    priority: 'MEDIUM',
    assignedToId: '',
    leadId: '',
    dueDate: '',
  });

  useEffect(() => {
    fetchMembers();
    fetchLeads();
  }, []);

  const fetchMembers = async () => {
    try {
      const data = await api.get<{ members: Member[] }>('/agency-crm/members');
      setMembers(data.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      const data = await api.get<{ leads: Lead[] }>('/agency-crm/leads');
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/agency-crm/tasks', {
        ...formData,
        leadId: formData.leadId || undefined,
      });
      router.push('/developer/crm/tasks');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Ошибка при создании задачи');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            {t('actions.cancel')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('new.title')}</h1>
          <p className="text-gray-500 mt-1">{t('new.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.title')} *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('form.titlePlaceholder')}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('form.descriptionPlaceholder')}
            />
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.type')} *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="FOLLOW_UP">{t('type.FOLLOW_UP')}</option>
                <option value="VIEWING">{t('type.VIEWING')}</option>
                <option value="CALL">{t('type.CALL')}</option>
                <option value="DOCUMENT">{t('type.DOCUMENT')}</option>
                <option value="MEETING">{t('type.MEETING')}</option>
                <option value="OTHER">{t('type.OTHER')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.priority')} *
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="URGENT">{t('priority.URGENT')}</option>
                <option value="HIGH">{t('priority.HIGH')}</option>
                <option value="MEDIUM">{t('priority.MEDIUM')}</option>
                <option value="LOW">{t('priority.LOW')}</option>
              </select>
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.assignee')} *
            </label>
            <select
              required
              value={formData.assignedToId}
              onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('form.selectAssignee')}</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.user.firstName} {member.user.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Lead (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.lead')}
            </label>
            <select
              value={formData.leadId}
              onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('form.noLead')}</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.firstName} {lead.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.dueDate')} *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {loading ? t('actions.creating') : t('actions.create')}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border rounded-lg hover:bg-gray-50"
            >
              {t('actions.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
