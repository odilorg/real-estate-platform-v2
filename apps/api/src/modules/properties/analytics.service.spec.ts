import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../common/prisma';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    propertyView: {
      create: jest.fn(),
      groupBy: jest.fn(),
    },
    propertyAnalytics: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    property: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
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
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackView', () => {
    it('should track a property view with all parameters', async () => {
      const propertyId = 'property-123';
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';
      const referrer = 'https://google.com';

      mockPrismaService.propertyView.create.mockResolvedValue({});
      mockPrismaService.propertyAnalytics.upsert.mockResolvedValue({});
      mockPrismaService.property.update.mockResolvedValue({});

      await service.trackView(propertyId, userId, ipAddress, userAgent, referrer);

      expect(prisma.propertyView.create).toHaveBeenCalledWith({
        data: {
          propertyId,
          userId,
          ipAddress,
          userAgent,
          referrer,
        },
      });

      expect(prisma.propertyAnalytics.upsert).toHaveBeenCalled();
      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: propertyId },
        data: {
          views: {
            increment: 1,
          },
        },
      });
    });

    it('should track anonymous property view', async () => {
      const propertyId = 'property-123';

      mockPrismaService.propertyView.create.mockResolvedValue({});
      mockPrismaService.propertyAnalytics.upsert.mockResolvedValue({});
      mockPrismaService.property.update.mockResolvedValue({});

      await service.trackView(propertyId);

      expect(prisma.propertyView.create).toHaveBeenCalledWith({
        data: {
          propertyId,
          userId: undefined,
          ipAddress: undefined,
          userAgent: undefined,
          referrer: undefined,
        },
      });
    });

    it('should update daily analytics', async () => {
      const propertyId = 'property-123';
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      mockPrismaService.propertyView.create.mockResolvedValue({});
      mockPrismaService.propertyAnalytics.upsert.mockResolvedValue({});
      mockPrismaService.property.update.mockResolvedValue({});

      await service.trackView(propertyId);

      expect(prisma.propertyAnalytics.upsert).toHaveBeenCalledWith({
        where: {
          propertyId_date: {
            propertyId,
            date: expect.any(Date),
          },
        },
        create: {
          propertyId,
          date: expect.any(Date),
          views: 1,
        },
        update: {
          views: {
            increment: 1,
          },
        },
      });
    });
  });

  describe('trackContact', () => {
    it('should track a contact/inquiry', async () => {
      const propertyId = 'property-123';
      mockPrismaService.propertyAnalytics.upsert.mockResolvedValue({});

      await service.trackContact(propertyId);

      expect(prisma.propertyAnalytics.upsert).toHaveBeenCalledWith({
        where: {
          propertyId_date: {
            propertyId,
            date: expect.any(Date),
          },
        },
        create: {
          propertyId,
          date: expect.any(Date),
          contacts: 1,
        },
        update: {
          contacts: {
            increment: 1,
          },
        },
      });
    });
  });

  describe('getPropertyAnalytics', () => {
    it('should return analytics summary for a property', async () => {
      const propertyId = 'property-123';
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockAnalytics = [
        {
          propertyId,
          date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          views: 10,
          favorites: 3,
          unfavorites: 1,
          contacts: 2,
        },
        {
          propertyId,
          date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), // yesterday
          views: 15,
          favorites: 5,
          unfavorites: 0,
          contacts: 3,
        },
        {
          propertyId,
          date: today,
          views: 20,
          favorites: 7,
          unfavorites: 2,
          contacts: 4,
        },
      ];

      mockPrismaService.propertyAnalytics.findMany.mockResolvedValue(mockAnalytics);

      const result = await service.getPropertyAnalytics(propertyId, 30);

      expect(result).toEqual({
        totalViews: 45,
        totalFavorites: 12, // (3-1) + (5-0) + (7-2) = 12
        totalContacts: 9,
        viewsToday: 20,
        favoritesToday: 5, // 7 - 2
        contactsToday: 4,
        viewsTrend: expect.any(Number),
        favoritesTrend: expect.any(Number),
        contactsTrend: expect.any(Number),
        dailyStats: expect.arrayContaining([
          expect.objectContaining({
            date: expect.any(String),
            views: expect.any(Number),
            favorites: expect.any(Number),
            contacts: expect.any(Number),
          }),
        ]),
      });

      expect(prisma.propertyAnalytics.findMany).toHaveBeenCalledWith({
        where: {
          propertyId,
          date: {
            gte: expect.any(Date),
          },
        },
        orderBy: {
          date: 'asc',
        },
      });
    });

    it('should handle no analytics data', async () => {
      mockPrismaService.propertyAnalytics.findMany.mockResolvedValue([]);

      const result = await service.getPropertyAnalytics('property-123', 30);

      expect(result).toEqual({
        totalViews: 0,
        totalFavorites: 0,
        totalContacts: 0,
        viewsToday: 0,
        favoritesToday: 0,
        contactsToday: 0,
        viewsTrend: 0,
        favoritesTrend: 0,
        contactsTrend: 0,
        dailyStats: [],
      });
    });

    it('should use custom days parameter', async () => {
      const propertyId = 'property-123';
      mockPrismaService.propertyAnalytics.findMany.mockResolvedValue([]);

      await service.getPropertyAnalytics(propertyId, 7);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);

      expect(prisma.propertyAnalytics.findMany).toHaveBeenCalledWith({
        where: {
          propertyId,
          date: {
            gte: expect.any(Date),
          },
        },
        orderBy: {
          date: 'asc',
        },
      });
    });
  });

  describe('getUserPropertiesAnalytics', () => {
    it('should return analytics for all user properties', async () => {
      const userId = 'user-123';
      const mockProperties = [
        {
          id: 'prop-1',
          title: 'Property 1',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        },
        {
          id: 'prop-2',
          title: 'Property 2',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        },
      ];

      const mockAnalytics = [
        {
          propertyId: 'prop-1',
          date: new Date(),
          views: 100,
          favorites: 10,
          unfavorites: 2,
          contacts: 5,
        },
        {
          propertyId: 'prop-2',
          date: new Date(),
          views: 50,
          favorites: 5,
          unfavorites: 1,
          contacts: 3,
        },
      ];

      const mockLastViews = [
        {
          propertyId: 'prop-1',
          _max: {
            createdAt: new Date(),
          },
        },
        {
          propertyId: 'prop-2',
          _max: {
            createdAt: new Date(),
          },
        },
      ];

      mockPrismaService.property.findMany.mockResolvedValue(mockProperties);
      mockPrismaService.propertyAnalytics.findMany.mockResolvedValue(mockAnalytics);
      mockPrismaService.propertyView.groupBy.mockResolvedValue(mockLastViews);

      const result = await service.getUserPropertiesAnalytics(userId, 30);

      expect(result).toEqual({
        totalViews: 150,
        totalFavorites: 12, // (10-2) + (5-1) = 12
        totalContacts: 8,
        propertyPerformance: expect.arrayContaining([
          expect.objectContaining({
            propertyId: expect.any(String),
            title: expect.any(String),
            totalViews: expect.any(Number),
            totalFavorites: expect.any(Number),
            totalContacts: expect.any(Number),
            avgViewsPerDay: expect.any(Number),
            lastViewedAt: expect.any(Date),
          }),
        ]),
      });

      expect(prisma.property.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      });
    });

    it('should handle user with no properties', async () => {
      mockPrismaService.property.findMany.mockResolvedValue([]);
      mockPrismaService.propertyAnalytics.findMany.mockResolvedValue([]);
      mockPrismaService.propertyView.groupBy.mockResolvedValue([]);

      const result = await service.getUserPropertiesAnalytics('user-123', 30);

      expect(result).toEqual({
        totalViews: 0,
        totalFavorites: 0,
        totalContacts: 0,
        propertyPerformance: [],
      });
    });

    it('should sort properties by total views descending', async () => {
      const userId = 'user-123';
      const mockProperties = [
        {
          id: 'prop-1',
          title: 'Low Views',
          createdAt: new Date(),
        },
        {
          id: 'prop-2',
          title: 'High Views',
          createdAt: new Date(),
        },
      ];

      const mockAnalytics = [
        {
          propertyId: 'prop-1',
          date: new Date(),
          views: 10,
          favorites: 1,
          unfavorites: 0,
          contacts: 1,
        },
        {
          propertyId: 'prop-2',
          date: new Date(),
          views: 100,
          favorites: 10,
          unfavorites: 0,
          contacts: 5,
        },
      ];

      mockPrismaService.property.findMany.mockResolvedValue(mockProperties);
      mockPrismaService.propertyAnalytics.findMany.mockResolvedValue(mockAnalytics);
      mockPrismaService.propertyView.groupBy.mockResolvedValue([]);

      const result = await service.getUserPropertiesAnalytics(userId, 30);

      // First property should have higher views
      expect(result.propertyPerformance[0].totalViews).toBeGreaterThan(
        result.propertyPerformance[1].totalViews,
      );
      expect(result.propertyPerformance[0].propertyId).toBe('prop-2');
    });
  });
});
