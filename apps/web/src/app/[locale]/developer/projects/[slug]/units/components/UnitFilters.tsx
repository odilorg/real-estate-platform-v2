import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface UnitFiltersProps {
  filters: {
    status: string;
    floorMin: string;
    floorMax: string;
    bedrooms: number[];
    priceMin: string;
    priceMax: string;
    search: string;
  };
  onChange: (filters: any) => void;
  onClear: () => void;
}

export default function UnitFilters({ filters, onChange, onClear }: UnitFiltersProps) {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, status: e.target.value });
  };

  const handleFloorMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, floorMin: e.target.value });
  };

  const handleFloorMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, floorMax: e.target.value });
  };

  const handleBedroomToggle = (bedroom: number) => {
    const newBedrooms = filters.bedrooms.includes(bedroom)
      ? filters.bedrooms.filter((b) => b !== bedroom)
      : [...filters.bedrooms, bedroom];
    onChange({ ...filters, bedrooms: newBedrooms });
  };

  const handlePriceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, priceMin: e.target.value });
  };

  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, priceMax: e.target.value });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const hasActiveFilters =
    filters.status ||
    filters.floorMin ||
    filters.floorMax ||
    filters.bedrooms.length > 0 ||
    filters.priceMin ||
    filters.priceMax ||
    filters.search;

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by unit number..."
          value={filters.search}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={handleStatusChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="HANDED_OVER">Handed Over</option>
          </select>
        </div>

        {/* Floor Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Floor Min
            </label>
            <input
              type="number"
              placeholder="0"
              value={filters.floorMin}
              onChange={handleFloorMinChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Floor Max
            </label>
            <input
              type="number"
              placeholder="50"
              value={filters.floorMax}
              onChange={handleFloorMaxChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Price Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Min
            </label>
            <input
              type="number"
              placeholder="0"
              value={filters.priceMin}
              onChange={handlePriceMinChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Max
            </label>
            <input
              type="number"
              placeholder="1000000"
              value={filters.priceMax}
              onChange={handlePriceMaxChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-end">
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bedrooms Checkboxes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bedrooms
        </label>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4].map((bedroom) => (
            <label
              key={bedroom}
              className="inline-flex items-center cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.bedrooms.includes(bedroom)}
                onChange={() => handleBedroomToggle(bedroom)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {bedroom === 0 ? 'Studio' : `${bedroom} BR`}
              </span>
            </label>
          ))}
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filters.bedrooms.includes(5)}
              onChange={() => handleBedroomToggle(5)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">5+ BR</span>
          </label>
        </div>
      </div>
    </div>
  );
}
