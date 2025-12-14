import { useState } from 'react';
import { Edit, Trash2, Home, Loader2 } from 'lucide-react';
import UnitStatusBadge from './UnitStatusBadge';
import UnitActions from './UnitActions';
import EditUnitModal from './EditUnitModal';
import { api } from '@/lib/api';

interface UnitTableProps {
  units: any[];
  loading: boolean;
  error: string;
  projectId: string;
  onUpdate: () => void;
}

export default function UnitTable({
  units,
  loading,
  error,
  projectId,
  onUpdate,
}: UnitTableProps) {
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);

  const handleDelete = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;

    try {
      setDeletingUnitId(unitId);
      await api.delete(`/developer-projects/${projectId}/units/${unitId}`);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete unit');
    } finally {
      setDeletingUnitId(null);
    }
  };

  const handleStatusChange = async (unitId: string, newStatus: string) => {
    try {
      await api.patch(`/developer-projects/${projectId}/units/${unitId}/status`, { status: newStatus });
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading units...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-6">
        <h3 className="text-lg font-semibold text-red-900">Error</h3>
        <p className="text-red-700 mt-1">{error}</p>
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="text-center py-12">
        <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No units found</h3>
        <p className="text-sm text-gray-500">
          Try adjusting your filters or add your first unit
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Floor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bedrooms
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bathrooms
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Area (m²)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {units.map((unit) => (
              <tr key={unit.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {unit.unitNumber}
                  </div>
                  {unit.block && (
                    <div className="text-sm text-gray-500">Block {unit.block}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {unit.floor}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {unit.bedrooms === 0 ? 'Studio' : unit.bedrooms}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {unit.bathrooms}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {unit.area} m²
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {unit.price.toLocaleString()} {unit.currency || 'UZS'}
                  </div>
                  {unit.paymentPlanAvailable && (
                    <div className="text-xs text-green-600">Payment plan</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <UnitStatusBadge status={unit.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingUnit(unit)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <UnitActions
                      unit={unit}
                      onStatusChange={(status) => handleStatusChange(unit.id, status)}
                    />
                    <button
                      onClick={() => handleDelete(unit.id)}
                      disabled={deletingUnitId === unit.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingUnitId === unit.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingUnit && (
        <EditUnitModal
          unit={editingUnit}
          projectId={projectId}
          onClose={() => setEditingUnit(null)}
          onSuccess={() => {
            setEditingUnit(null);
            onUpdate();
          }}
        />
      )}
    </>
  );
}
