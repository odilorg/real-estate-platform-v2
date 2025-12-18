'use client';

import { Phone, Mail, Calendar, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface RecentLead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  status: string;
  source: string;
  priority: number;
  createdAt: Date | string;
  budget?: number | null;
  currency?: string;
}

interface RecentLeadsTableProps {
  leads: RecentLead[];
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  QUALIFIED: 'bg-purple-100 text-purple-800',
  NEGOTIATING: 'bg-orange-100 text-orange-800',
  CONVERTED: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
};

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Website',
  PHONE_CALL: 'Phone',
  SOCIAL_MEDIA: 'Social',
  REFERRAL: 'Referral',
  AGENT: 'Agent',
  WALK_IN: 'Walk-in',
  OTHER: 'Other',
};

const PRIORITY_COLORS = [
  'text-gray-400',
  'text-blue-500',
  'text-green-500',
  'text-yellow-500',
  'text-orange-500',
  'text-red-500',
];

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}

function formatBudget(budget: number | null | undefined, currency?: string): string {
  if (!budget) return '-';
  const formatted = budget >= 1000000
    ? `${(budget / 1000000).toFixed(1)}M`
    : budget >= 1000
    ? `${(budget / 1000).toFixed(0)}K`
    : budget.toString();
  return currency === 'UZS' ? `${formatted} UZS` : `$${formatted}`;
}

export function RecentLeadsTable({ leads }: RecentLeadsTableProps) {
  if (!leads || leads.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Leads</h3>
        <div className="h-48 flex items-center justify-center text-gray-500">
          No recent leads
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Recent Leads</h3>
        <Link
          href="/developer/leads"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Added
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* Priority indicator */}
                    <div className="flex flex-col gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            i < lead.priority
                              ? PRIORITY_COLORS[lead.priority]
                              : 'bg-gray-200'
                          }`}
                          style={{
                            backgroundColor: i < lead.priority
                              ? undefined
                              : undefined,
                          }}
                        />
                      ))}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {lead.firstName} {lead.lastName}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {lead.phone}
                    </a>
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3" />
                        {lead.email}
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm text-gray-600">
                    {SOURCE_LABELS[lead.source] || lead.source}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-medium text-gray-900">
                    {formatBudget(lead.budget, lead.currency)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      STATUS_COLORS[lead.status] || STATUS_COLORS.NEW
                    }`}
                  >
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm text-gray-500 flex items-center justify-end gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatTimeAgo(lead.createdAt)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
