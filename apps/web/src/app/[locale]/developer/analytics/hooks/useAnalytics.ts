'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  DeveloperAnalyticsOverviewDto,
  LeadAnalyticsDto,
  PropertyPerformanceDto,
  AgentPerformanceDto,
} from '@repo/shared';

interface UseAnalyticsOptions {
  days?: number;
  projectId?: string;
}

interface AnalyticsData {
  overview: DeveloperAnalyticsOverviewDto | null;
  leads: LeadAnalyticsDto | null;
  properties: PropertyPerformanceDto | null;
  agents: AgentPerformanceDto | null;
}

interface UseAnalyticsReturn {
  data: AnalyticsData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const { days = 30, projectId } = options;

  const [data, setData] = useState<AnalyticsData>({
    overview: null,
    leads: null,
    properties: null,
    agents: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      params.set('days', days.toString());
      if (projectId) {
        params.set('projectId', projectId);
      }

      const queryString = params.toString();

      // Fetch all analytics data in parallel
      const [overview, leads, properties, agents] = await Promise.all([
        api.get<DeveloperAnalyticsOverviewDto>(`/analytics/developer/overview?${queryString}`),
        api.get<LeadAnalyticsDto>(`/analytics/developer/leads?${queryString}`),
        api.get<PropertyPerformanceDto>(`/analytics/developer/properties?${queryString}&limit=10`),
        api.get<AgentPerformanceDto>(`/analytics/developer/agents?${queryString}`),
      ]);

      setData({
        overview,
        leads,
        properties,
        agents,
      });
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [days, projectId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}
