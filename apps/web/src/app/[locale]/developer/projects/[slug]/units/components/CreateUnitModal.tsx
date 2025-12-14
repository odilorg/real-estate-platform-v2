import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { api } from '@/lib/api';

interface CreateUnitModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const createUnitSchema = z.object({
  unitNumber: z.string().min(1, 'Unit number is required'),
  floor: z.number().min(0, 'Floor must be 0 or greater'),
  bedrooms: z.number().min(0, 'Bedrooms must be 0 or greater').max(10),
  bathrooms: z.number().min(0.5, 'Bathrooms must be at least 0.5').max(10),
  area: z.number().min(1, 'Area must be greater than 0'),
  price: z.number().min(1, 'Price must be greater than 0'),
  currency: z.enum(['UZS', 'YE']),
  block: z.string().optional(),
  entrance: z.number().optional(),
  livingArea: z.number().optional(),
  kitchenArea: z.number().optional(),
  paymentPlanAvailable: z.boolean(),
  downPaymentPercent: z.number().optional(),
  installmentMonths: z.number().optional(),
});

type CreateUnitData = z.infer<typeof createUnitSchema>;

export default function CreateUnitModal({
  projectId,
  onClose,
  onSuccess,
}: CreateUnitModalProps) {
  const [formData, setFormData] = useState<Partial<CreateUnitData>>({
    unitNumber: '',
    floor: 1,
    bedrooms: 1,
    bathrooms: 1,
    area: 0,
    price: 0,
    currency: 'UZS',
    block: '',
    entrance: undefined,
    livingArea: undefined,
    kitchenArea: undefined,
    paymentPlanAvailable: false,
    downPaymentPercent: undefined,
    installmentMonths: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof CreateUnitData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validate form data
      const validatedData = createUnitSchema.parse({
        ...formData,
        floor: Number(formData.floor),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        area: Number(formData.area),
        price: Number(formData.price),
        entrance: formData.entrance ? Number(formData.entrance) : undefined,
        livingArea: formData.livingArea ? Number(formData.livingArea) : undefined,
        kitchenArea: formData.kitchenArea ? Number(formData.kitchenArea) : undefined,
        downPaymentPercent: formData.downPaymentPercent
          ? Number(formData.downPaymentPercent)
          : undefined,
        installmentMonths: formData.installmentMonths
          ? Number(formData.installmentMonths)
          : undefined,
      });

      setLoading(true);

      await api.post(`/developer-projects/${projectId}/units`, validatedData);

      onSuccess();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0] as string] = issue.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        alert(err instanceof Error ? err.message : 'Failed to create unit');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Unit</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.unitNumber}
                onChange={(e) => handleChange('unitNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.unitNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="101"
              />
              {errors.unitNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.unitNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Floor <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.floor}
                onChange={(e) => handleChange('floor', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.floor ? 'border-red-500' : 'border-gray-300'
                }`}
                min="0"
              />
              {errors.floor && (
                <p className="mt-1 text-sm text-red-600">{errors.floor}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Building Block
              </label>
              <input
                type="text"
                value={formData.block}
                onChange={(e) => handleChange('block', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="A, B, Tower 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entrance
              </label>
              <input
                type="number"
                value={formData.entrance || ''}
                onChange={(e) => handleChange('entrance', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>
          </div>

          {/* Room Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => handleChange('bedrooms', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.bedrooms ? 'border-red-500' : 'border-gray-300'
                }`}
                min="0"
                max="10"
              />
              {errors.bedrooms && (
                <p className="mt-1 text-sm text-red-600">{errors.bedrooms}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.bathrooms}
                onChange={(e) => handleChange('bathrooms', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.bathrooms ? 'border-red-500' : 'border-gray-300'
                }`}
                min="0.5"
                max="10"
              />
              {errors.bathrooms && (
                <p className="mt-1 text-sm text-red-600">{errors.bathrooms}</p>
              )}
            </div>
          </div>

          {/* Area Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Area (m²) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.area}
                onChange={(e) => handleChange('area', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.area ? 'border-red-500' : 'border-gray-300'
                }`}
                min="1"
              />
              {errors.area && (
                <p className="mt-1 text-sm text-red-600">{errors.area}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Living Area (m²)
              </label>
              <input
                type="number"
                value={formData.livingArea || ''}
                onChange={(e) => handleChange('livingArea', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kitchen Area (m²)
              </label>
              <input
                type="number"
                value={formData.kitchenArea || ''}
                onChange={(e) => handleChange('kitchenArea', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                min="1"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="UZS">UZS (Uzbekistan Som)</option>
                <option value="YE">YE</option>
              </select>
            </div>
          </div>

          {/* Payment Plan */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.paymentPlanAvailable}
                onChange={(e) =>
                  handleChange('paymentPlanAvailable', e.target.checked)
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Payment Plan Available
              </span>
            </label>
          </div>

          {formData.paymentPlanAvailable && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Down Payment (%)
                </label>
                <input
                  type="number"
                  value={formData.downPaymentPercent || ''}
                  onChange={(e) =>
                    handleChange('downPaymentPercent', e.target.value || undefined)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Installment Months
                </label>
                <input
                  type="number"
                  value={formData.installmentMonths || ''}
                  onChange={(e) =>
                    handleChange('installmentMonths', e.target.value || undefined)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="120"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating...' : 'Create Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
