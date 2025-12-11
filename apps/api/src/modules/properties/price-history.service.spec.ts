import { Test, TestingModule } from '@nestjs/testing';
import { PriceHistoryService } from './price-history.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { mockPrismaService, resetMocks } from '../../test/test-utils';
import { Currency } from '@repo/shared';

describe('PriceHistoryService', () => {
  let service: PriceHistoryService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    resetMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceHistoryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PriceHistoryService>(PriceHistoryService);
    prisma = mockPrismaService;
  });

  describe('getPriceHistory', () => {
    const propertyId = 'prop-123';

    it('should return price history ordered by creation date ascending', async () => {
      const mockHistory = [
        {
          id: 'ph-1',
          propertyId,
          oldPrice: 100000,
          newPrice: 120000,
          currency: Currency.YE,
          createdAt: new Date('2025-01-01'),
          user: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        {
          id: 'ph-2',
          propertyId,
          oldPrice: 120000,
          newPrice: 110000,
          currency: Currency.YE,
          createdAt: new Date('2025-02-01'),
          user: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ];

      prisma.priceHistory.findMany.mockResolvedValue(mockHistory as any);

      const result = await service.getPriceHistory(propertyId);

      expect(result).toEqual(mockHistory);
      expect(prisma.priceHistory.findMany).toHaveBeenCalledWith({
        where: { propertyId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          oldPrice: true,
          newPrice: true,
          currency: true,
          createdAt: true,
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

    it('should return empty array if no price history exists', async () => {
      prisma.priceHistory.findMany.mockResolvedValue([]);

      const result = await service.getPriceHistory(propertyId);

      expect(result).toEqual([]);
    });
  });

  describe('createPriceChange', () => {
    it('should create price change with all fields', async () => {
      const propertyId = 'prop-123';
      const oldPrice = 100000;
      const newPrice = 120000;
      const currency = 'YE' as const;
      const changedBy = 'user-123';

      const mockPriceChange = {
        id: 'ph-123',
        propertyId,
        oldPrice,
        newPrice,
        currency,
        changedBy,
        createdAt: new Date(),
      };

      prisma.priceHistory.create.mockResolvedValue(mockPriceChange as any);

      const result = await service.createPriceChange(
        propertyId,
        oldPrice,
        newPrice,
        currency,
        changedBy,
      );

      expect(result).toEqual(mockPriceChange);
      expect(prisma.priceHistory.create).toHaveBeenCalledWith({
        data: {
          propertyId,
          oldPrice,
          newPrice,
          currency,
          changedBy,
        },
      });
    });

    it('should create price change without changedBy field', async () => {
      const propertyId = 'prop-123';
      const oldPrice = 100000;
      const newPrice = 120000;
      const currency = 'UZS' as const;

      const mockPriceChange = {
        id: 'ph-123',
        propertyId,
        oldPrice,
        newPrice,
        currency,
        changedBy: null,
        createdAt: new Date(),
      };

      prisma.priceHistory.create.mockResolvedValue(mockPriceChange as any);

      const result = await service.createPriceChange(
        propertyId,
        oldPrice,
        newPrice,
        currency,
      );

      expect(result).toEqual(mockPriceChange);
      expect(prisma.priceHistory.create).toHaveBeenCalledWith({
        data: {
          propertyId,
          oldPrice,
          newPrice,
          currency,
          changedBy: undefined,
        },
      });
    });

    it('should handle price decrease', async () => {
      const propertyId = 'prop-123';
      const oldPrice = 120000;
      const newPrice = 100000;
      const currency = 'YE' as const;

      prisma.priceHistory.create.mockResolvedValue({
        id: 'ph-123',
        oldPrice,
        newPrice,
      } as any);

      await service.createPriceChange(propertyId, oldPrice, newPrice, currency);

      expect(prisma.priceHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            oldPrice: 120000,
            newPrice: 100000,
          }),
        }),
      );
    });

    it('should handle UZS currency', async () => {
      const propertyId = 'prop-123';
      const oldPrice = 1000000000;
      const newPrice = 1250000000;
      const currency = 'UZS' as const;

      prisma.priceHistory.create.mockResolvedValue({
        id: 'ph-123',
        currency: 'UZS',
      } as any);

      await service.createPriceChange(propertyId, oldPrice, newPrice, currency);

      expect(prisma.priceHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currency: 'UZS',
          }),
        }),
      );
    });
  });

  describe('getLatestPrice', () => {
    const propertyId = 'prop-123';

    it('should return latest price from most recent change', async () => {
      const latestChange = {
        id: 'ph-3',
        propertyId,
        oldPrice: 110000,
        newPrice: 125000,
        currency: Currency.YE,
        createdAt: new Date('2025-03-01'),
      };

      prisma.priceHistory.findFirst.mockResolvedValue(latestChange as any);

      const result = await service.getLatestPrice(propertyId);

      expect(result).toBe(125000);
      expect(prisma.priceHistory.findFirst).toHaveBeenCalledWith({
        where: { propertyId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return undefined if no price history exists', async () => {
      prisma.priceHistory.findFirst.mockResolvedValue(null);

      const result = await service.getLatestPrice(propertyId);

      expect(result).toBeUndefined();
    });
  });

  describe('getPriceStats', () => {
    const propertyId = 'prop-123';

    it('should calculate complete price statistics', async () => {
      const mockHistory = [
        {
          id: 'ph-1',
          propertyId,
          oldPrice: 100000,
          newPrice: 120000,
          currency: Currency.YE,
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'ph-2',
          propertyId,
          oldPrice: 120000,
          newPrice: 110000,
          currency: Currency.YE,
          createdAt: new Date('2025-02-01'),
        },
        {
          id: 'ph-3',
          propertyId,
          oldPrice: 110000,
          newPrice: 130000,
          currency: Currency.YE,
          createdAt: new Date('2025-03-01'),
        },
      ];

      prisma.priceHistory.findMany.mockResolvedValue(mockHistory as any);

      const result = await service.getPriceStats(propertyId);

      expect(result).toEqual({
        minPrice: 110000,
        maxPrice: 130000,
        firstPrice: 100000,
        currentPrice: 130000,
        priceChange: 30000,
        priceChangePercent: 30,
        totalChanges: 3,
      });
      expect(prisma.priceHistory.findMany).toHaveBeenCalledWith({
        where: { propertyId },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return null if no price history exists', async () => {
      prisma.priceHistory.findMany.mockResolvedValue([]);

      const result = await service.getPriceStats(propertyId);

      expect(result).toBeNull();
    });

    it('should calculate negative price change correctly', async () => {
      const mockHistory = [
        {
          id: 'ph-1',
          propertyId,
          oldPrice: 150000,
          newPrice: 140000,
          currency: Currency.YE,
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'ph-2',
          propertyId,
          oldPrice: 140000,
          newPrice: 120000,
          currency: Currency.YE,
          createdAt: new Date('2025-02-01'),
        },
      ];

      prisma.priceHistory.findMany.mockResolvedValue(mockHistory as any);

      const result = await service.getPriceStats(propertyId);

      expect(result).toEqual({
        minPrice: 120000,
        maxPrice: 140000,
        firstPrice: 150000,
        currentPrice: 120000,
        priceChange: -30000,
        priceChangePercent: -20,
        totalChanges: 2,
      });
    });

    it('should handle single price change', async () => {
      const mockHistory = [
        {
          id: 'ph-1',
          propertyId,
          oldPrice: 100000,
          newPrice: 110000,
          currency: Currency.YE,
          createdAt: new Date('2025-01-01'),
        },
      ];

      prisma.priceHistory.findMany.mockResolvedValue(mockHistory as any);

      const result = await service.getPriceStats(propertyId);

      expect(result).toEqual({
        minPrice: 110000,
        maxPrice: 110000,
        firstPrice: 100000,
        currentPrice: 110000,
        priceChange: 10000,
        priceChangePercent: 10,
        totalChanges: 1,
      });
    });

    it('should calculate percentage with decimal precision', async () => {
      const mockHistory = [
        {
          id: 'ph-1',
          propertyId,
          oldPrice: 100000,
          newPrice: 103333,
          currency: Currency.YE,
          createdAt: new Date('2025-01-01'),
        },
      ];

      prisma.priceHistory.findMany.mockResolvedValue(mockHistory as any);

      const result = await service.getPriceStats(propertyId);

      expect(result?.priceChangePercent).toBeCloseTo(3.33, 2);
    });

    it('should handle large UZS prices', async () => {
      const mockHistory = [
        {
          id: 'ph-1',
          propertyId,
          oldPrice: 1000000000,
          newPrice: 1500000000,
          currency: Currency.UZS,
          createdAt: new Date('2025-01-01'),
        },
      ];

      prisma.priceHistory.findMany.mockResolvedValue(mockHistory as any);

      const result = await service.getPriceStats(propertyId);

      expect(result).toEqual({
        minPrice: 1500000000,
        maxPrice: 1500000000,
        firstPrice: 1000000000,
        currentPrice: 1500000000,
        priceChange: 500000000,
        priceChangePercent: 50,
        totalChanges: 1,
      });
    });
  });
});
