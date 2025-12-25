import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

// Extended mock PrismaService
const mockPrismaService: any = {
  developerLead: {
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  developerDeal: {
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(),
  },
  developerCommission: {
    aggregate: jest.fn(),
  },
  developerMember: {
    findMany: jest.fn(),
  },
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    Object.keys(mockPrismaService).forEach((key) => {
      const serviceObj = mockPrismaService[key];
      if (typeof serviceObj === 'object' && serviceObj !== null) {
        Object.keys(serviceObj).forEach((methodKey) => {
          const method = serviceObj[methodKey];
          if (jest.isMockFunction(method)) {
            method.mockReset();
          }
        });
      }
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = mockPrismaService;
  });

  describe('getDashboard', () => {
    const developerId = 'agency-123';
    const memberId = 'member-123';

    beforeEach(() => {
      // Setup default mock responses for all parallel queries
      prisma.developerLead.count.mockResolvedValue(100);
      prisma.developerDeal.count.mockResolvedValue(50);
      prisma.developerDeal.aggregate.mockResolvedValue({ _sum: { dealValue: 1000000 } });
      prisma.developerCommission.aggregate.mockResolvedValue({
        _sum: { netAmount: 50000 },
        _count: 10,
      });
      prisma.developerLead.groupBy.mockResolvedValue([
        { source: 'WEBSITE', _count: 40 },
        { source: 'REFERRAL', _count: 30 },
      ]);
      prisma.developerDeal.groupBy.mockResolvedValue([
        { stage: 'QUALIFIED', _count: 10, _sum: { dealValue: 200000 } },
        { stage: 'NEGOTIATION', _count: 5, _sum: { dealValue: 150000 } },
      ]);
    });

    it('should return dashboard analytics for admin', async () => {
      const result = await service.getDashboard(developerId, memberId, 'ADMIN', {});

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('leadsBySource');
      expect(result).toHaveProperty('dealsByStage');
      expect(result.overview).toHaveProperty('totalLeads');
      expect(result.overview).toHaveProperty('newLeads');
      expect(result.overview).toHaveProperty('totalRevenue');
      expect(result.overview).toHaveProperty('conversionRate');
      expect(result.overview).toHaveProperty('winRate');
    });

    it('should calculate conversion rate correctly', async () => {
      // totalLeads = 100, convertedLeads = 20
      prisma.developerLead.count
        .mockResolvedValueOnce(100) // totalLeads
        .mockResolvedValueOnce(80) // newLeads
        .mockResolvedValueOnce(20); // convertedLeads

      const result = await service.getDashboard(developerId, memberId, 'ADMIN', {});

      expect(result.overview.conversionRate).toBe(20.0); // (20/100) * 100 = 20%
    });

    it('should calculate win rate correctly', async () => {
      // totalDeals = 50, wonDeals = 15
      prisma.developerDeal.count
        .mockResolvedValueOnce(50) // totalDeals
        .mockResolvedValueOnce(30) // activeDeals
        .mockResolvedValueOnce(15); // wonDeals

      const result = await service.getDashboard(developerId, memberId, 'ADMIN', {});

      expect(result.overview.winRate).toBe(30.0); // (15/50) * 100 = 30%
    });

    it('should restrict agent to their own data', async () => {
      await service.getDashboard(developerId, memberId, 'AGENT', {});

      // Verify that queries include memberId filtering
      expect(prisma.developerLead.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignedToId: memberId,
          }),
        }),
      );
    });

    it('should support different time periods', async () => {
      await service.getDashboard(developerId, memberId, 'ADMIN', { period: 'WEEK' });

      // Verify date range is applied
      expect(prisma.developerLead.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('should format leadsBySource correctly', async () => {
      prisma.developerLead.groupBy.mockResolvedValue([
        { source: 'WEBSITE', _count: 40 },
        { source: 'REFERRAL', _count: 30 },
      ]);

      const result = await service.getDashboard(developerId, memberId, 'ADMIN', {});

      expect(result.leadsBySource).toEqual([
        { source: 'WEBSITE', count: 40 },
        { source: 'REFERRAL', count: 30 },
      ]);
    });

    it('should format dealsByStage correctly', async () => {
      prisma.developerDeal.groupBy.mockResolvedValue([
        { stage: 'QUALIFIED', _count: 10, _sum: { dealValue: 200000 } },
        { stage: 'NEGOTIATION', _count: 5, _sum: { dealValue: 150000 } },
      ]);

      const result = await service.getDashboard(developerId, memberId, 'ADMIN', {});

      expect(result.dealsByStage).toEqual([
        { stage: 'QUALIFIED', count: 10, totalValue: 200000 },
        { stage: 'NEGOTIATION', count: 5, totalValue: 150000 },
      ]);
    });
  });

  describe('getLeadAnalytics', () => {
    const developerId = 'agency-123';

    it('should return lead analytics', async () => {
      const mockStatusDistribution = [
        { status: 'NEW', _count: 50 },
        { status: 'CONTACTED', _count: 30 },
      ];
      const mockSourceDistribution = [
        { source: 'WEBSITE', _count: 40 },
        { source: 'REFERRAL', _count: 40 },
      ];

      prisma.developerLead.groupBy
        .mockResolvedValueOnce(mockStatusDistribution)
        .mockResolvedValueOnce(mockSourceDistribution);

      const result = await service.getLeadAnalytics(developerId, {});

      expect(result).toHaveProperty('period');
      expect(result.statusDistribution).toEqual([
        { status: 'NEW', count: 50 },
        { status: 'CONTACTED', count: 30 },
      ]);
      expect(result.sourceDistribution).toEqual([
        { source: 'WEBSITE', count: 40 },
        { source: 'REFERRAL', count: 40 },
      ]);
    });

    it('should support different time periods', async () => {
      prisma.developerLead.groupBy.mockResolvedValue([]);

      await service.getLeadAnalytics(developerId, { period: 'QUARTER' });

      expect(prisma.developerLead.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  describe('getDealAnalytics', () => {
    const developerId = 'agency-123';

    it('should return deal analytics', async () => {
      const mockStageDistribution = [
        { stage: 'QUALIFIED', _count: 10, _sum: { dealValue: 200000 } },
        { stage: 'NEGOTIATION', _count: 5, _sum: { dealValue: 150000 } },
      ];
      const mockStatusDistribution = [
        { status: 'ACTIVE', _count: 30, _sum: { dealValue: 500000 } },
        { status: 'WON', _count: 10, _sum: { dealValue: 200000 } },
      ];

      prisma.developerDeal.groupBy
        .mockResolvedValueOnce(mockStageDistribution)
        .mockResolvedValueOnce(mockStatusDistribution);

      const result = await service.getDealAnalytics(developerId, {});

      expect(result).toHaveProperty('period');
      expect(result.stageDistribution).toEqual([
        { stage: 'QUALIFIED', count: 10, totalValue: 200000 },
        { stage: 'NEGOTIATION', count: 5, totalValue: 150000 },
      ]);
      expect(result.statusDistribution).toEqual([
        { status: 'ACTIVE', count: 30, totalValue: 500000 },
        { status: 'WON', count: 10, totalValue: 200000 },
      ]);
    });
  });

  describe('getAgentPerformance', () => {
    const developerId = 'agency-123';

    it('should return agent performance leaderboard', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          developerId,
          userId: 'user-1',
          user: { firstName: 'John', lastName: 'Doe' },
        },
        {
          id: 'member-2',
          developerId,
          userId: 'user-2',
          user: { firstName: 'Jane', lastName: 'Smith' },
        },
      ];

      prisma.developerMember.findMany.mockResolvedValue(mockMembers);
      prisma.developerLead.count.mockResolvedValue(100);
      prisma.developerDeal.count.mockResolvedValue(50);
      prisma.developerDeal.aggregate.mockResolvedValue({ _sum: { dealValue: 1000000 } });
      prisma.developerCommission.aggregate.mockResolvedValue({ _sum: { netAmount: 50000 } });

      const result = await service.getAgentPerformance(developerId, {});

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('leaderboard');
      expect(result.leaderboard).toHaveLength(2);
      expect(result.leaderboard[0]).toHaveProperty('memberId');
      expect(result.leaderboard[0]).toHaveProperty('name');
      expect(result.leaderboard[0]).toHaveProperty('totalLeads');
      expect(result.leaderboard[0]).toHaveProperty('conversionRate');
      expect(result.leaderboard[0]).toHaveProperty('revenue');
    });

    it('should sort leaderboard by revenue descending', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          developerId,
          userId: 'user-1',
          user: { firstName: 'John', lastName: 'Doe' },
        },
        {
          id: 'member-2',
          developerId,
          userId: 'user-2',
          user: { firstName: 'Jane', lastName: 'Smith' },
        },
      ];

      prisma.developerMember.findMany.mockResolvedValue(mockMembers);
      prisma.developerLead.count.mockResolvedValue(100);
      prisma.developerDeal.count.mockResolvedValue(50);
      // member-1: revenue 500000, member-2: revenue 1000000
      prisma.developerDeal.aggregate
        .mockResolvedValueOnce({ _sum: { dealValue: 500000 } }) // member-1
        .mockResolvedValueOnce({ _sum: { dealValue: 1000000 } }); // member-2
      prisma.developerCommission.aggregate.mockResolvedValue({ _sum: { netAmount: 50000 } });

      const result = await service.getAgentPerformance(developerId, {});

      // Should be sorted by revenue descending (member-2 first)
      expect(result.leaderboard[0].revenue).toBeGreaterThanOrEqual(result.leaderboard[1].revenue);
    });
  });

  describe('getRevenueAnalytics', () => {
    const developerId = 'agency-123';

    it('should return revenue analytics', async () => {
      const mockDeals = [
        {
          actualCloseDate: new Date('2025-12-01'),
          dealValue: 100000,
          commissionAmount: 5000,
        },
        {
          actualCloseDate: new Date('2025-12-15'),
          dealValue: 150000,
          commissionAmount: 7500,
        },
      ];

      prisma.developerDeal.findMany.mockResolvedValue(mockDeals);

      const result = await service.getRevenueAnalytics(developerId, {});

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('totals');
      expect(result.totals.revenue).toBe(250000);
      expect(result.totals.commissions).toBe(12500);
      expect(result.totals.deals).toBe(2);
      expect(result.totals.avgDealValue).toBe(125000);
    });

    it('should format trend data correctly', async () => {
      const mockDeals = [
        {
          actualCloseDate: new Date('2025-12-01'),
          dealValue: 100000,
          commissionAmount: 5000,
        },
      ];

      prisma.developerDeal.findMany.mockResolvedValue(mockDeals);

      const result = await service.getRevenueAnalytics(developerId, {});

      expect(result.trend).toEqual([
        {
          date: mockDeals[0].actualCloseDate,
          revenue: 100000,
          commission: 5000,
        },
      ]);
    });

    it('should handle empty deals', async () => {
      prisma.developerDeal.findMany.mockResolvedValue([]);

      const result = await service.getRevenueAnalytics(developerId, {});

      expect(result.totals.revenue).toBe(0);
      expect(result.totals.commissions).toBe(0);
      expect(result.totals.deals).toBe(0);
      expect(result.totals.avgDealValue).toBe(0);
    });
  });
});
