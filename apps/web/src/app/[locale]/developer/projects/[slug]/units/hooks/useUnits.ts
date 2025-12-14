import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface Filters {
  status: string;
  floorMin: string;
  floorMax: string;
  bedrooms: number[];
  priceMin: string;
  priceMax: string;
  search: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  unitStatus: string;
  floor: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  price: number | null;
  pricePerSqm: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface UnitsResponse {
  data: Unit[];
  total: number;
  page: number;
  limit: number;
}

export function useUnits(
  projectId: string | undefined,
  filters: Filters,
  page: number,
  limit: number
) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUnits = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError('');

      // Build query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      if (filters.status) params.append('status', filters.status);
      if (filters.floorMin) params.append('floorMin', filters.floorMin);
      if (filters.floorMax) params.append('floorMax', filters.floorMax);
      if (filters.bedrooms.length > 0) {
        filters.bedrooms.forEach((b) => params.append('bedrooms', b.toString()));
      }
      if (filters.priceMin) params.append('priceMin', filters.priceMin);
      if (filters.priceMax) params.append('priceMax', filters.priceMax);
      if (filters.search) params.append('search', filters.search);

      const data = await api.get<UnitsResponse>(
        `/developer-projects/${projectId}/units?${params.toString()}`
      );

      setUnits(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch units');
      setUnits([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [projectId, filters, page, limit]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  return {
    units,
    total,
    loading,
    error,
    refetch: fetchUnits,
  };
}
