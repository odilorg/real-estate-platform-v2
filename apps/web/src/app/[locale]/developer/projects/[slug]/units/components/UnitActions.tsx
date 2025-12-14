import { useState } from 'react';
import { MoreVertical, CheckCircle, Clock, XCircle, Home } from 'lucide-react';

interface UnitActionsProps {
  unit: any;
  onStatusChange: (status: string) => void;
}

export default function UnitActions({ unit, onStatusChange }: UnitActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions = [
    { value: 'AVAILABLE', label: 'Available', icon: Home, color: 'text-green-600' },
    { value: 'RESERVED', label: 'Reserved', icon: Clock, color: 'text-yellow-600' },
    { value: 'SOLD', label: 'Sold', icon: XCircle, color: 'text-red-600' },
    { value: 'HANDED_OVER', label: 'Handed Over', icon: CheckCircle, color: 'text-blue-600' },
  ];

  const handleStatusChange = (status: string) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-600 hover:text-gray-900"
        title="Change Status"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Change Status
              </div>
              {statusOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    disabled={unit.status === option.value}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                      unit.status === option.value ? 'bg-gray-50' : ''
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${option.color}`} />
                    <span>{option.label}</span>
                    {unit.status === option.value && (
                      <CheckCircle className="w-4 h-4 text-gray-400 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
