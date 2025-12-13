import { DeveloperStats } from './components/DeveloperStats';

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
