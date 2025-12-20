import Link from 'next/link';
import { DeveloperStats } from './components/DeveloperStats';
import { Search, FolderPlus, Users, FileText } from 'lucide-react';

export default async function DeveloperDashboard() {
  // TODO: Fetch developer data from API
  const stats = {
    totalProjects: 3,
    totalUnits: 450,
    unitsAvailable: 280,
    unitsSold: 170,
    activeLeads: 42,
    salesThisMonth: 12,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your projects and sales
        </p>
      </div>

      <DeveloperStats stats={stats} />

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/properties" className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Search className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Browse Properties</p>
              <p className="text-sm text-gray-500">View all listings</p>
            </div>
          </Link>

          <Link href="/developer/projects/new" className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FolderPlus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">New Project</p>
              <p className="text-sm text-gray-500">Create a project</p>
            </div>
          </Link>

          <Link href="/developer/crm/leads" className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">View Leads</p>
              <p className="text-sm text-gray-500">Manage leads</p>
            </div>
          </Link>

          <Link href="/developer/crm/members" className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Team Members</p>
              <p className="text-sm text-gray-500">Manage team</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Projects Overview */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Recent Projects</h2>
        <p className="text-sm text-gray-500">No projects yet. Create your first project!</p>
      </div>

      {/* Recent Leads */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Recent Leads</h2>
        <p className="text-sm text-gray-500">No leads yet.</p>
      </div>
    </div>
  );
}
