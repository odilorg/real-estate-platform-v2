import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  DeveloperAnalyticsOverviewDto,
  LeadAnalyticsDto,
  PropertyPerformanceDto,
  AgentPerformanceDto,
} from '@repo/shared';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get developer analytics overview (KPIs, trends, pipeline)
   */
  async getOverview(
    developerId: string,
    days: number = 30,
    projectId?: string,
  ): Promise<DeveloperAnalyticsOverviewDto> {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Build where clause for project filtering
    const projectFilter = projectId ? { developerProjectId: projectId } : {};
    const leadProjectFilter = projectId ? { projectId } : {};

    // Current period metrics
    const [
      currentRevenue,
      previousRevenue,
      currentLeads,
      previousLeads,
      currentConversions,
      previousConversions,
      unitsPipeline,
      viewsOverTime,
      currentViews,
      previousViews,
    ] = await Promise.all([
      // Total revenue (current period)
      this.prisma.lead.aggregate({
        where: {
          developerId,
          convertedAt: { gte: startDate },
          ...leadProjectFilter,
        },
        _sum: { conversionValue: true },
        _count: true,
      }),

      // Total revenue (previous period)
      this.prisma.lead.aggregate({
        where: {
          developerId,
          convertedAt: { gte: previousStartDate, lt: startDate },
          ...leadProjectFilter,
        },
        _sum: { conversionValue: true },
        _count: true,
      }),

      // Total leads (current period)
      this.prisma.lead.count({
        where: {
          developerId,
          createdAt: { gte: startDate },
          ...leadProjectFilter,
        },
      }),

      // Total leads (previous period)
      this.prisma.lead.count({
        where: {
          developerId,
          createdAt: { gte: previousStartDate, lt: startDate },
          ...leadProjectFilter,
        },
      }),

      // Conversions (current period)
      this.prisma.lead.count({
        where: {
          developerId,
          status: 'CONVERTED',
          convertedAt: { gte: startDate },
          ...leadProjectFilter,
        },
      }),

      // Conversions (previous period)
      this.prisma.lead.count({
        where: {
          developerId,
          status: 'CONVERTED',
          convertedAt: { gte: previousStartDate, lt: startDate },
          ...leadProjectFilter,
        },
      }),

      // Units pipeline (current state)
      this.prisma.property.groupBy({
        by: ['unitStatus'],
        where: {
          developerId,
          unitStatus: { not: null },
          ...projectFilter,
        },
        _count: true,
      }),

      // Views over time (daily)
      this.prisma.propertyAnalytics.groupBy({
        by: ['date'],
        where: {
          property: {
            developerId,
            ...projectFilter,
          },
          date: { gte: startDate },
        },
        _sum: { views: true },
        orderBy: { date: 'asc' },
      }),

      // Total views (current period)
      this.prisma.propertyAnalytics.aggregate({
        where: {
          property: {
            developerId,
            ...projectFilter,
          },
          date: { gte: startDate },
        },
        _sum: { views: true },
      }),

      // Total views (previous period)
      this.prisma.propertyAnalytics.aggregate({
        where: {
          property: {
            developerId,
            ...projectFilter,
          },
          date: { gte: previousStartDate, lt: startDate },
        },
        _sum: { views: true },
      }),
    ]);

    // Calculate metrics
    const totalRevenue = currentRevenue._sum.conversionValue || 0;
    const prevRevenue = previousRevenue._sum.conversionValue || 0;
    const revenueTrend = this.calculateTrend(totalRevenue, prevRevenue);

    const totalLeads = currentLeads;
    const leadsTrend = this.calculateTrend(totalLeads, previousLeads);

    const conversionRate = totalLeads > 0 ? (currentConversions / totalLeads) * 100 : 0;
    const prevConversionRate = previousLeads > 0 ? (previousConversions / previousLeads) * 100 : 0;
    const conversionTrend = this.calculateTrend(conversionRate, prevConversionRate);

    const avgDealSize = currentConversions > 0 ? totalRevenue / currentConversions : 0;
    const prevAvgDealSize = previousConversions > 0 ? prevRevenue / previousConversions : 0;
    const dealSizeTrend = this.calculateTrend(avgDealSize, prevAvgDealSize);

    const totalViews = currentViews._sum.views || 0;
    const prevViews = previousViews._sum.views || 0;
    const viewsTrend = this.calculateTrend(totalViews, prevViews);

    // Process units pipeline
    const pipeline = {
      available: 0,
      reserved: 0,
      sold: 0,
      handedOver: 0,
    };

    unitsPipeline.forEach((item) => {
      switch (item.unitStatus) {
        case 'AVAILABLE':
          pipeline.available = item._count;
          break;
        case 'RESERVED':
          pipeline.reserved = item._count;
          break;
        case 'SOLD':
          pipeline.sold = item._count;
          break;
        case 'HANDED_OVER':
          pipeline.handedOver = item._count;
          break;
      }
    });

    // Format views over time
    const formattedViewsOverTime = viewsOverTime.map((item) => ({
      date: item.date.toISOString().split('T')[0],
      views: item._sum.views || 0,
    }));

    return {
      totalRevenue,
      revenueTrend,
      totalLeads,
      leadsTrend,
      conversionRate: Math.round(conversionRate * 100) / 100,
      conversionTrend,
      avgDealSize: Math.round(avgDealSize),
      dealSizeTrend,
      totalViews,
      viewsTrend,
      unitsPipeline: pipeline,
      viewsOverTime: formattedViewsOverTime,
    };
  }

  /**
   * Get lead analytics (funnel, sources, recent activity)
   */
  async getLeadAnalytics(
    developerId: string,
    days: number = 30,
    projectId?: string,
  ): Promise<LeadAnalyticsDto> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const projectFilter = projectId ? { projectId } : {};

    const [funnelData, sourcesData, recentLeads] = await Promise.all([
      // Lead funnel by status
      this.prisma.lead.groupBy({
        by: ['status'],
        where: {
          developerId,
          createdAt: { gte: startDate },
          ...projectFilter,
        },
        _count: true,
      }),

      // Lead sources breakdown
      this.prisma.lead.groupBy({
        by: ['source'],
        where: {
          developerId,
          createdAt: { gte: startDate },
          ...projectFilter,
        },
        _count: true,
      }),

      // Recent leads
      this.prisma.lead.findMany({
        where: {
          developerId,
          ...projectFilter,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Process funnel data
    const funnel = {
      new: 0,
      contacted: 0,
      qualified: 0,
      negotiating: 0,
      converted: 0,
      lost: 0,
    };

    funnelData.forEach((item) => {
      const status = item.status.toLowerCase() as keyof typeof funnel;
      if (status in funnel) {
        funnel[status] = item._count;
      }
    });

    // Process sources data
    const totalLeads = sourcesData.reduce((sum, item) => sum + item._count, 0);
    const sources = sourcesData.map((item) => ({
      source: item.source,
      count: item._count,
      percentage: totalLeads > 0 ? Math.round((item._count / totalLeads) * 100 * 10) / 10 : 0,
    })).sort((a, b) => b.count - a.count);

    return {
      funnel,
      sources,
      recentLeads: recentLeads.map((lead) => ({
        id: lead.id,
        developerId: lead.developerId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        phone: lead.phone,
        email: lead.email,
        projectId: lead.projectId,
        propertyType: lead.propertyType || undefined,
        budget: lead.budget,
        currency: lead.currency || undefined,
        bedrooms: lead.bedrooms || undefined,
        source: lead.source,
        status: lead.status,
        priority: lead.priority,
        notes: lead.notes || undefined,
        assignedToId: lead.assignedToId,
        lastContactedAt: lead.lastContactedAt || undefined,
        nextFollowUpAt: lead.nextFollowUpAt || undefined,
        totalContacts: lead.totalContacts,
        convertedAt: lead.convertedAt,
        conversionType: lead.conversionType || undefined,
        conversionValue: lead.conversionValue,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      })),
    };
  }

  /**
   * Get property performance analytics
   */
  async getPropertyPerformance(
    developerId: string,
    days: number = 30,
    projectId?: string,
    limit: number = 10,
  ): Promise<PropertyPerformanceDto> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const projectFilter = projectId ? { developerProjectId: projectId } : {};

    // Get properties with their view counts
    const properties = await this.prisma.property.findMany({
      where: {
        developerId,
        ...projectFilter,
      },
      select: {
        id: true,
        title: true,
        status: true,
        views: true,
        developerProjectId: true,
        developerProject: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { views: 'desc' },
      take: limit * 2, // Get more than needed for sorting
    });

    // Get leads count per project (via project association)
    const leadsPerProject = await this.prisma.lead.groupBy({
      by: ['projectId'],
      where: {
        developerId,
        createdAt: { gte: startDate },
        projectId: { not: null },
      },
      _count: true,
    });

    const leadsMap = new Map<string, number>(
      leadsPerProject
        .filter((item) => item.projectId !== null)
        .map((item) => [item.projectId as string, item._count]),
    );

    // Format and sort by views
    const formattedProperties = properties.map((prop) => ({
      id: prop.id,
      title: prop.title,
      views: prop.views,
      leads: prop.developerProjectId ? (leadsMap.get(prop.developerProjectId) || 0) : 0,
      status: prop.status,
      projectName: prop.developerProject?.name,
    }));

    // Sort by views
    const topByViews = [...formattedProperties]
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);

    // For leads, we need to aggregate at project level and distribute
    // For now, we'll show properties sorted by views as proxy for lead potential
    const topByLeads = [...formattedProperties]
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);

    return {
      topByViews,
      topByLeads,
    };
  }

  /**
   * Get sales agent performance analytics
   */
  async getAgentPerformance(
    developerId: string,
    days: number = 30,
  ): Promise<AgentPerformanceDto> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get all sales agents for this developer
    const salesAgents = await this.prisma.user.findMany({
      where: {
        developerId,
        role: { in: ['DEVELOPER_ADMIN', 'DEVELOPER_SALES_AGENT'] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    // Get lead stats per agent
    const agentLeadStats = await this.prisma.lead.groupBy({
      by: ['assignedToId', 'status'],
      where: {
        developerId,
        assignedToId: { not: null },
        createdAt: { gte: startDate },
      },
      _count: true,
      _sum: { conversionValue: true },
    });

    // Process agent stats
    const agentMap = new Map<string, {
      leadsAssigned: number;
      leadsConverted: number;
      totalRevenue: number;
    }>();

    agentLeadStats.forEach((stat) => {
      if (!stat.assignedToId) return;

      const current = agentMap.get(stat.assignedToId) || {
        leadsAssigned: 0,
        leadsConverted: 0,
        totalRevenue: 0,
      };

      current.leadsAssigned += stat._count;
      if (stat.status === 'CONVERTED') {
        current.leadsConverted += stat._count;
        current.totalRevenue += stat._sum.conversionValue || 0;
      }

      agentMap.set(stat.assignedToId, current);
    });

    // Format agent performance
    const agents = salesAgents.map((agent) => {
      const stats = agentMap.get(agent.id) || {
        leadsAssigned: 0,
        leadsConverted: 0,
        totalRevenue: 0,
      };

      return {
        id: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        leadsAssigned: stats.leadsAssigned,
        leadsConverted: stats.leadsConverted,
        conversionRate: stats.leadsAssigned > 0
          ? Math.round((stats.leadsConverted / stats.leadsAssigned) * 100 * 10) / 10
          : 0,
        totalRevenue: stats.totalRevenue,
      };
    }).sort((a, b) => b.conversionRate - a.conversionRate);

    return { agents };
  }

  /**
   * Calculate percentage trend between two values
   */
  private calculateTrend(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }
}
