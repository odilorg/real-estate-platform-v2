import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(agencyId: string, memberId: string, role: string, query: any): Promise<any> {
    const { startDate, endDate } = this.getDateRange(query.period || 'MONTH');

    const baseWhere: any = { agencyId, createdAt: { gte: startDate, lte: endDate } };

    // Regular agents can only see their own data
    let where: any = baseWhere;
    if (role === 'AGENT') {
      // For agents, filter to only show leads/deals assigned to them
      // Note: This where clause is used for leads, so we use assignedToId
      // For deals queries, the code uses agencyId directly
      where = {
        agencyId,
        createdAt: { gte: startDate, lte: endDate },
        assignedToId: memberId,
      };
    }

    // Parallel queries for performance
    const [
      totalLeads,
      newLeads,
      convertedLeads,
      totalDeals,
      activeDeals,
      wonDeals,
      totalRevenue,
      totalCommissions,
      leadsBySource,
      dealsByStage,
    ] = await Promise.all([
      // Total leads (all time)
      this.prisma.agencyLead.count({
        where: role === 'AGENT' ? { agencyId, assignedToId: memberId } : { agencyId },
      }),

      // New leads in period
      this.prisma.agencyLead.count({ where }),

      // Converted leads in period
      this.prisma.agencyLead.count({ where: { ...where, status: 'CONVERTED' } }),

      // Total deals (all time)
      this.prisma.agencyDeal.count({
        where: role === 'AGENT' ? { agencyId, ownerId: memberId } : { agencyId },
      }),

      // Active deals
      this.prisma.agencyDeal.count({
        where: role === 'AGENT' ? { agencyId, ownerId: memberId, status: 'ACTIVE' } : { agencyId, status: 'ACTIVE' },
      }),

      // Won deals in period
      this.prisma.agencyDeal.count({
        where: role === 'AGENT'
          ? { agencyId, ownerId: memberId, status: 'WON', actualCloseDate: { gte: startDate, lte: endDate } }
          : { agencyId, status: 'WON', actualCloseDate: { gte: startDate, lte: endDate } },
      }),

      // Total revenue (deal value of won deals in period)
      this.prisma.agencyDeal.aggregate({
        where: role === 'AGENT'
          ? { agencyId, ownerId: memberId, status: 'WON', actualCloseDate: { gte: startDate, lte: endDate } }
          : { agencyId, status: 'WON', actualCloseDate: { gte: startDate, lte: endDate } },
        _sum: { dealValue: true },
      }),

      // Total commissions in period
      this.prisma.agencyCommission.aggregate({
        where: role === 'AGENT'
          ? { agencyId, memberId, createdAt: { gte: startDate, lte: endDate } }
          : { agencyId, createdAt: { gte: startDate, lte: endDate } },
        _sum: { netAmount: true },
        _count: true,
      }),

      // Leads by source
      this.prisma.agencyLead.groupBy({
        by: ['source'],
        where: role === 'AGENT'
          ? { agencyId, assignedToId: memberId, createdAt: { gte: startDate, lte: endDate } }
          : { agencyId, createdAt: { gte: startDate, lte: endDate } },
        _count: true,
      }),

      // Deals by stage
      this.prisma.agencyDeal.groupBy({
        by: ['stage'],
        where: role === 'AGENT' ? { agencyId, ownerId: memberId, status: 'ACTIVE' } : { agencyId, status: 'ACTIVE' },
        _count: true,
        _sum: { dealValue: true },
      }),
    ]);

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const winRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;
    const avgDealValue = wonDeals > 0 ? (totalRevenue._sum.dealValue || 0) / wonDeals : 0;

    return {
      period: {
        startDate,
        endDate,
      },
      overview: {
        totalLeads,
        newLeads,
        convertedLeads,
        conversionRate: Math.round(conversionRate * 10) / 10,
        totalDeals,
        activeDeals,
        wonDeals,
        winRate: Math.round(winRate * 10) / 10,
        totalRevenue: totalRevenue._sum.dealValue || 0,
        avgDealValue: Math.round(avgDealValue),
        totalCommissions: totalCommissions._sum.netAmount || 0,
        commissionsCount: totalCommissions._count,
      },
      leadsBySource: leadsBySource.map((item: any) => ({
        source: item.source,
        count: item._count,
      })),
      dealsByStage: dealsByStage.map((item: any) => ({
        stage: item.stage,
        count: item._count,
        totalValue: item._sum.dealValue || 0,
      })),
    };
  }

  private getDateRange(period: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'WEEK':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'MONTH':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'QUARTER':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'YEAR':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1);
    }

    return { startDate, endDate };
  }

  async getLeadAnalytics(agencyId: string, query: any): Promise<any> {
    const { startDate, endDate } = this.getDateRange(query.period || 'MONTH');

    const statusDistribution = await this.prisma.agencyLead.groupBy({
      by: ['status'],
      where: { agencyId, createdAt: { gte: startDate, lte: endDate } },
      _count: true,
    });

    const sourceDistribution = await this.prisma.agencyLead.groupBy({
      by: ['source'],
      where: { agencyId, createdAt: { gte: startDate, lte: endDate } },
      _count: true,
    });

    return {
      period: { startDate, endDate },
      statusDistribution: statusDistribution.map((item: any) => ({
        status: item.status,
        count: item._count,
      })),
      sourceDistribution: sourceDistribution.map((item: any) => ({
        source: item.source,
        count: item._count,
      })),
    };
  }

  async getDealAnalytics(agencyId: string, query: any): Promise<any> {
    const { startDate, endDate } = this.getDateRange(query.period || 'MONTH');

    const stageDistribution = await this.prisma.agencyDeal.groupBy({
      by: ['stage'],
      where: { agencyId, createdAt: { gte: startDate, lte: endDate } },
      _count: true,
      _sum: { dealValue: true },
    });

    const statusDistribution = await this.prisma.agencyDeal.groupBy({
      by: ['status'],
      where: { agencyId, createdAt: { gte: startDate, lte: endDate } },
      _count: true,
      _sum: { dealValue: true },
    });

    return {
      period: { startDate, endDate },
      stageDistribution: stageDistribution.map((item: any) => ({
        stage: item.stage,
        count: item._count,
        totalValue: item._sum.dealValue || 0,
      })),
      statusDistribution: statusDistribution.map((item: any) => ({
        status: item.status,
        count: item._count,
        totalValue: item._sum.dealValue || 0,
      })),
    };
  }

  async getAgentPerformance(agencyId: string, query: any): Promise<any> {
    const { startDate, endDate } = this.getDateRange(query.period || 'MONTH');

    const members = await this.prisma.agencyMember.findMany({
      where: { agencyId, isActive: true },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const leaderboard = await Promise.all(
      members.map(async (member) => {
        const [totalLeads, convertedLeads, totalDeals, wonDeals, revenue, commissions] = await Promise.all([
          this.prisma.agencyLead.count({
            where: { agencyId, assignedToId: member.id },
          }),
          this.prisma.agencyLead.count({
            where: { agencyId, assignedToId: member.id, status: 'CONVERTED' },
          }),
          this.prisma.agencyDeal.count({
            where: { agencyId, ownerId: member.id },
          }),
          this.prisma.agencyDeal.count({
            where: { agencyId, ownerId: member.id, status: 'WON' },
          }),
          this.prisma.agencyDeal.aggregate({
            where: { agencyId, ownerId: member.id, status: 'WON' },
            _sum: { dealValue: true },
          }),
          this.prisma.agencyCommission.aggregate({
            where: { agencyId, memberId: member.id },
            _sum: { netAmount: true },
          }),
        ]);

        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
        const winRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

        return {
          memberId: member.id,
          name: member.user.firstName + ' ' + member.user.lastName,
          totalLeads,
          convertedLeads,
          conversionRate: Math.round(conversionRate * 10) / 10,
          totalDeals,
          wonDeals,
          winRate: Math.round(winRate * 10) / 10,
          revenue: revenue._sum.dealValue || 0,
          commissions: commissions._sum.netAmount || 0,
        };
      }),
    );

    return {
      period: { startDate, endDate },
      leaderboard: leaderboard.sort((a, b) => b.revenue - a.revenue),
    };
  }

  async getRevenueAnalytics(agencyId: string, query: any): Promise<any> {
    const { startDate, endDate } = this.getDateRange(query.period || 'MONTH');

    // Get revenue by month/week
    const deals = await this.prisma.agencyDeal.findMany({
      where: {
        agencyId,
        status: 'WON',
        actualCloseDate: { gte: startDate, lte: endDate },
      },
      select: {
        actualCloseDate: true,
        dealValue: true,
        commissionAmount: true,
      },
      orderBy: { actualCloseDate: 'asc' },
    });

    const totalRevenue = deals.reduce((sum, deal) => sum + deal.dealValue, 0);
    const totalCommissions = deals.reduce((sum, deal) => sum + deal.commissionAmount, 0);

    return {
      period: { startDate, endDate },
      trend: deals.map((deal) => ({
        date: deal.actualCloseDate,
        revenue: deal.dealValue,
        commission: deal.commissionAmount,
      })),
      totals: {
        revenue: totalRevenue,
        commissions: totalCommissions,
        deals: deals.length,
        avgDealValue: deals.length > 0 ? totalRevenue / deals.length : 0,
      },
    };
  }
}
