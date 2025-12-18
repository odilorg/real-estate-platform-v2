'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { Building, Users, UserPlus, FileText, Settings, Loader2, Edit } from 'lucide-react';
import { api } from '@/lib/api';

interface AgencyStats {
  leads: {
    total: number;
    active: number;
  };
  members: {
    total: number;
    active: number;
  };
}

interface Agency {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  _count: {
    members: number;
    agents: number;
    leads: number;
  };
}

export default function AgencyDashboardPage() {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgencyData();
  }, []);

  const fetchAgencyData = async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        api.get<any>('/agency/profile'),
        api.get<AgencyStats>('/agency/stats'),
      ]);
      setAgency(profileRes.agency);
      setRole(profileRes.role);
      setStats(statsRes);
    } catch (error) {
      console.error('Error fetching agency data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">You are not associated with any agency</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {agency.logo && (
              <img
                src={agency.logo}
                alt={agency.name}
                className="h-16 w-16 rounded-lg object-cover border border-gray-200"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{agency.name}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {role === 'OWNER' ? 'Agency Owner' : role}
              </p>
            </div>
          </div>
          <Link href="/agency/settings">
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              <Settings className="h-5 w-5" />
              Settings
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Members */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <Link href="/developer/crm/members" className="text-sm text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {stats?.members.active || 0}
            </p>
            <p className="text-sm text-gray-500">Active Team Members</p>
            <p className="text-xs text-gray-400 mt-1">
              {stats?.members.total || 0} total
            </p>
          </div>
        </div>

        {/* Total Leads */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <Link href="/developer/crm/leads" className="text-sm text-green-600 hover:text-green-700">
              View all →
            </Link>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {stats?.leads.active || 0}
            </p>
            <p className="text-sm text-gray-500">Active Leads</p>
            <p className="text-xs text-gray-400 mt-1">
              {stats?.leads.total || 0} total
            </p>
          </div>
        </div>

        {/* Agents */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {agency._count.agents || 0}
            </p>
            <p className="text-sm text-gray-500">Agents</p>
          </div>
        </div>
      </div>

      {/* Agency Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Agency Information</h2>
          <Link href="/agency/settings">
            <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Edit className="h-4 w-4" />
              Edit
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agency.description && (
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
              <p className="text-gray-900">{agency.description}</p>
            </div>
          )}

          {agency.email && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
              <p className="text-gray-900">{agency.email}</p>
            </div>
          )}

          {agency.phone && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
              <p className="text-gray-900">{agency.phone}</p>
            </div>
          )}

          {agency.website && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Website</p>
              <a
                href={agency.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                {agency.website}
              </a>
            </div>
          )}

          {agency.address && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Address</p>
              <p className="text-gray-900">{agency.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/developer/crm/members/new">
            <button className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Add Team Member</p>
                <p className="text-sm text-gray-500">Invite a new member</p>
              </div>
            </button>
          </Link>

          <Link href="/developer/crm/leads/new">
            <button className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Add Lead</p>
                <p className="text-sm text-gray-500">Create new lead</p>
              </div>
            </button>
          </Link>

          <Link href="/agency/settings">
            <button className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Agency Settings</p>
                <p className="text-sm text-gray-500">Update profile</p>
              </div>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
