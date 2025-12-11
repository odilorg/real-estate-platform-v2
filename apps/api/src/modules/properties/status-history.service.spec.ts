import { Test, TestingModule } from '@nestjs/testing';
import { StatusHistoryService } from './status-history.service';
import { PrismaService } from '../../common/prisma';
import { PropertyStatus } from '@repo/database';

describe('StatusHistoryService', () => {
  let service: StatusHistoryService;
  let prisma: PrismaService;

  const mockPrismaService = {
    propertyStatusHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    priceHistory: {
      findMany: jest.fn(),
    },
    property: {
      findUnique: jest.fn(),
    },
  };

  const mockStatusHistory = {
    id: 'history-123',
    propertyId: 'property-123',
    oldStatus: PropertyStatus.ACTIVE,
    newStatus: PropertyStatus.SOLD,
    changedBy: 'user-123',
    reason: 'Property sold',
    notes: 'Sold to buyer',
    createdAt: new Date(),
    user: {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusHistoryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StatusHistoryService>(StatusHistoryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordStatusChange', () => {
    it('should record a status change with all fields', async () => {
      const dto = {
        oldStatus: PropertyStatus.ACTIVE,
        newStatus: PropertyStatus.SOLD,
        changedBy: 'user-123',
        reason: 'Property sold',
        notes: 'Sold to buyer',
      };

      mockPrismaService.propertyStatusHistory.create.mockResolvedValue(mockStatusHistory);

      const result = await service.recordStatusChange('property-123', dto);

      expect(result).toEqual(mockStatusHistory);
      expect(prisma.propertyStatusHistory.create).toHaveBeenCalledWith({
        data: {
          propertyId: 'property-123',
          oldStatus: dto.oldStatus,
          newStatus: dto.newStatus,
          changedBy: dto.changedBy,
          reason: dto.reason,
          notes: dto.notes,
        },
      });
    });

    it('should record status change with minimal data', async () => {
      const dto = {
        newStatus: PropertyStatus.ACTIVE,
      };

      const minimalHistory = {
        ...mockStatusHistory,
        oldStatus: null,
        changedBy: null,
        reason: null,
        notes: null,
      };

      mockPrismaService.propertyStatusHistory.create.mockResolvedValue(minimalHistory);

      const result = await service.recordStatusChange('property-123', dto);

      expect(result).toEqual(minimalHistory);
      expect(prisma.propertyStatusHistory.create).toHaveBeenCalledWith({
        data: {
          propertyId: 'property-123',
          oldStatus: null,
          newStatus: PropertyStatus.ACTIVE,
          changedBy: null,
          reason: null,
          notes: null,
        },
      });
    });
  });

  describe('getPropertyStatusHistory', () => {
    it('should return status history for a property', async () => {
      const mockHistory = [
        { ...mockStatusHistory, id: 'history-1' },
        { ...mockStatusHistory, id: 'history-2' },
      ];

      mockPrismaService.propertyStatusHistory.findMany.mockResolvedValue(mockHistory);

      const result = await service.getPropertyStatusHistory('property-123');

      expect(result).toEqual(mockHistory);
      expect(prisma.propertyStatusHistory.findMany).toHaveBeenCalledWith({
        where: { propertyId: 'property-123' },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    });

    it('should return empty array if no history', async () => {
      mockPrismaService.propertyStatusHistory.findMany.mockResolvedValue([]);

      const result = await service.getPropertyStatusHistory('property-123');

      expect(result).toEqual([]);
    });
  });

  describe('getLatestStatusChange', () => {
    it('should return the latest status change', async () => {
      mockPrismaService.propertyStatusHistory.findFirst.mockResolvedValue(mockStatusHistory);

      const result = await service.getLatestStatusChange('property-123');

      expect(result).toEqual(mockStatusHistory);
      expect(prisma.propertyStatusHistory.findFirst).toHaveBeenCalledWith({
        where: { propertyId: 'property-123' },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });

    it('should return null if no history', async () => {
      mockPrismaService.propertyStatusHistory.findFirst.mockResolvedValue(null);

      const result = await service.getLatestStatusChange('property-123');

      expect(result).toBeNull();
    });
  });

  describe('getPropertyTimeline', () => {
    it('should return combined timeline of status and price changes', async () => {
      const propertyCreatedAt = new Date('2024-01-01');
      const statusChangeDate = new Date('2024-02-01');
      const priceChangeDate = new Date('2024-03-01');

      const statusHistory = [
        {
          id: 'status-1',
          oldStatus: null,
          newStatus: PropertyStatus.ACTIVE,
          reason: 'Listed',
          notes: null,
          createdAt: statusChangeDate,
          user: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
        },
      ];

      const priceHistory = [
        {
          id: 'price-1',
          oldPrice: 100000,
          newPrice: 95000,
          currency: 'USD',
          createdAt: priceChangeDate,
          user: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
        },
      ];

      const property = {
        createdAt: propertyCreatedAt,
        updatedAt: new Date(),
      };

      mockPrismaService.propertyStatusHistory.findMany.mockResolvedValue(statusHistory);
      mockPrismaService.priceHistory.findMany.mockResolvedValue(priceHistory);
      mockPrismaService.property.findUnique.mockResolvedValue(property);

      const result = await service.getPropertyTimeline('property-123');

      expect(result).toHaveLength(3);
      expect(result[0].type).toBe('price_change'); // Most recent
      expect(result[1].type).toBe('status_change');
      expect(result[2].type).toBe('created'); // Oldest

      // Verify events are sorted by date descending
      expect(result[0].date).toEqual(priceChangeDate);
      expect(result[1].date).toEqual(statusChangeDate);
      expect(result[2].date).toEqual(propertyCreatedAt);
    });

    it('should handle timeline with no events', async () => {
      const property = {
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.propertyStatusHistory.findMany.mockResolvedValue([]);
      mockPrismaService.priceHistory.findMany.mockResolvedValue([]);
      mockPrismaService.property.findUnique.mockResolvedValue(property);

      const result = await service.getPropertyTimeline('property-123');

      expect(result).toHaveLength(1); // Only created event
      expect(result[0].type).toBe('created');
    });
  });

  describe('getStatusStats', () => {
    it('should calculate status statistics', async () => {
      const now = Date.now();
      const day1 = new Date(now - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const day2 = new Date(now - 5 * 24 * 60 * 60 * 1000); // 5 days ago

      const history = [
        {
          id: 'h1',
          oldStatus: null,
          newStatus: PropertyStatus.ACTIVE,
          createdAt: day1,
        },
        {
          id: 'h2',
          oldStatus: PropertyStatus.ACTIVE,
          newStatus: PropertyStatus.PENDING,
          createdAt: day2,
        },
      ];

      mockPrismaService.propertyStatusHistory.findMany.mockResolvedValue(history);

      const result = await service.getStatusStats('property-123');

      expect(result).toEqual({
        totalChanges: 2,
        firstStatus: PropertyStatus.ACTIVE,
        currentStatus: PropertyStatus.PENDING,
        firstChangeDate: day1,
        lastChangeDate: day2,
        statusDaysCount: expect.objectContaining({
          [PropertyStatus.ACTIVE]: expect.any(Number),
          [PropertyStatus.PENDING]: expect.any(Number),
        }),
      });

      // ACTIVE was from day1 to day2 (5 days)
      expect(result?.statusDaysCount[PropertyStatus.ACTIVE]).toBeGreaterThanOrEqual(4);
      // PENDING is from day2 to now (5 days)
      expect(result?.statusDaysCount[PropertyStatus.PENDING]).toBeGreaterThanOrEqual(4);
    });

    it('should handle single status change', async () => {
      const history = [
        {
          id: 'h1',
          oldStatus: null,
          newStatus: PropertyStatus.ACTIVE,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.propertyStatusHistory.findMany.mockResolvedValue(history);

      const result = await service.getStatusStats('property-123');

      expect(result).toEqual({
        totalChanges: 1,
        firstStatus: PropertyStatus.ACTIVE,
        currentStatus: PropertyStatus.ACTIVE,
        firstChangeDate: expect.any(Date),
        lastChangeDate: expect.any(Date),
        statusDaysCount: expect.objectContaining({
          [PropertyStatus.ACTIVE]: expect.any(Number),
        }),
      });
    });

    it('should return null for no history', async () => {
      mockPrismaService.propertyStatusHistory.findMany.mockResolvedValue([]);

      const result = await service.getStatusStats('property-123');

      expect(result).toBeNull();
    });

    it('should calculate correct durations for multiple status changes', async () => {
      const now = Date.now();
      const day1 = new Date(now - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const day2 = new Date(now - 20 * 24 * 60 * 60 * 1000); // 20 days ago
      const day3 = new Date(now - 10 * 24 * 60 * 60 * 1000); // 10 days ago

      const history = [
        {
          id: 'h1',
          oldStatus: null,
          newStatus: PropertyStatus.ACTIVE,
          createdAt: day1,
        },
        {
          id: 'h2',
          oldStatus: PropertyStatus.ACTIVE,
          newStatus: PropertyStatus.PENDING,
          createdAt: day2,
        },
        {
          id: 'h3',
          oldStatus: PropertyStatus.PENDING,
          newStatus: PropertyStatus.SOLD,
          createdAt: day3,
        },
      ];

      mockPrismaService.propertyStatusHistory.findMany.mockResolvedValue(history);

      const result = await service.getStatusStats('property-123');

      expect(result?.totalChanges).toBe(3);
      // ACTIVE: day1 to day2 (~10 days)
      expect(result?.statusDaysCount[PropertyStatus.ACTIVE]).toBeGreaterThanOrEqual(9);
      // PENDING: day2 to day3 (~10 days)
      expect(result?.statusDaysCount[PropertyStatus.PENDING]).toBeGreaterThanOrEqual(9);
      // SOLD: day3 to now (~10 days)
      expect(result?.statusDaysCount[PropertyStatus.SOLD]).toBeGreaterThanOrEqual(9);
    });
  });
});
