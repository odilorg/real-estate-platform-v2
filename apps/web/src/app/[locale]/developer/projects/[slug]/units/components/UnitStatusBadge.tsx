interface UnitStatusBadgeProps {
  status: string;
}

export default function UnitStatusBadge({ status }: UnitStatusBadgeProps) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    AVAILABLE: {
      label: 'Available',
      color: 'bg-green-100 text-green-800',
    },
    RESERVED: {
      label: 'Reserved',
      color: 'bg-yellow-100 text-yellow-800',
    },
    SOLD: {
      label: 'Sold',
      color: 'bg-red-100 text-red-800',
    },
    HANDED_OVER: {
      label: 'Handed Over',
      color: 'bg-blue-100 text-blue-800',
    },
  };

  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

  return (
    <span
      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}
    >
      {config.label}
    </span>
  );
}
