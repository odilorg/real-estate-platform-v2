import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from './recommendations.service';
import { PrismaService } from '../../common/prisma';

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    property: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    recentlyViewed: {
      findMany: jest.fn(),
    },
    favorite: {
      findMany: jest.fn(),
    },
  };

  const mockProperty = {
    id: 'property-123',
    propertyType: 'APARTMENT',
    listingType: 'SALE',
    city: 'Tashkent',
    district: 'Chilonzor',
    price: 100000,
    priceUsd: 100000,
    area: 85,
    bedrooms: 3,
  };

  const mockSimilarProperties = [
    {
      id: 'property-456',
      propertyType: 'APARTMENT',
      listingType: 'SALE',
      city: 'Tashkent',
      district: 'Chilonzor',
      price: 95000,
      priceUsd: 95000,
      area: 80,
      bedrooms: 3,
      images: [{ id: 'img-1', url: 'https://example.com/image.jpg', isPrimary: true }],
      user: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        agent: { id: 'agent-1', verified: true, superAgent: false },
      },
    },
    {
      id: 'property-789',
      propertyType: 'APARTMENT',
      listingType: 'SALE',
      city: 'Tashkent',
      district: 'Yunusabad',
      price: 110000,
      priceUsd: 110000,
      area: 90,
      bedrooms: 3,
      images: [],
      user: {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        agent: { id: 'agent-2', verified: true, superAgent: true },
      },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSimilarProperties', () => {
    it('should return similar properties based on price and area range', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.property.findMany.mockResolvedValue(mockSimilarProperties);

      const result = await service.getSimilarProperties('property-123', 6);

      expect(result).toEqual(mockSimilarProperties);
      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        select: {
          id: true,
          propertyType: true,
          listingType: true,
          city: true,
          district: true,
          price: true,
          priceUsd: true,
          area: true,
          bedrooms: true,
        },
      });

      // Verify price range calculation (±20%)
      const priceMin = mockProperty.priceUsd * 0.8; // 80000
      const priceMax = mockProperty.priceUsd * 1.2; // 120000

      // Verify area range calculation (±20%)
      const areaMin = mockProperty.area * 0.8; // 68
      const areaMax = mockProperty.area * 1.2; // 102

      expect(prisma.property.findMany).toHaveBeenCalledWith({
        where: {
          id: { not: 'property-123' },
          status: 'ACTIVE',
          propertyType: mockProperty.propertyType,
          listingType: mockProperty.listingType,
          city: mockProperty.city,
          priceUsd: {
            gte: priceMin,
            lte: priceMax,
          },
          area: {
            gte: areaMin,
            lte: areaMax,
          },
        },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              agent: {
                select: {
                  id: true,
                  verified: true,
                  superAgent: true,
                },
              },
            },
          },
        },
        take: 6,
        orderBy: [
          { district: mockProperty.district ? 'asc' : 'desc' },
          { createdAt: 'desc' },
        ],
      });
    });

    it('should return empty array if property not found', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      const result = await service.getSimilarProperties('non-existent', 6);

      expect(result).toEqual([]);
      expect(prisma.property.findMany).not.toHaveBeenCalled();
    });

    it('should handle properties without area', async () => {
      const propertyWithoutArea = { ...mockProperty, area: null };
      mockPrismaService.property.findUnique.mockResolvedValue(propertyWithoutArea);
      mockPrismaService.property.findMany.mockResolvedValue([]);

      await service.getSimilarProperties('property-123', 6);

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            area: expect.anything(),
          }),
        }),
      );
    });

    it('should use custom limit', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.property.findMany.mockResolvedValue(mockSimilarProperties);

      await service.getSimilarProperties('property-123', 10);

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });
  });

  describe('getPersonalizedRecommendations', () => {
    const mockRecentViews = [
      {
        propertyId: 'prop-1',
        property: {
          propertyType: 'APARTMENT',
          city: 'Tashkent',
          district: 'Chilonzor',
          priceUsd: 90000,
          listingType: 'SALE',
        },
      },
      {
        propertyId: 'prop-2',
        property: {
          propertyType: 'APARTMENT',
          city: 'Tashkent',
          district: 'Yunusabad',
          priceUsd: 110000,
          listingType: 'SALE',
        },
      },
    ];

    const mockFavorites = [
      {
        propertyId: 'prop-3',
        property: {
          propertyType: 'HOUSE',
          city: 'Samarkand',
          district: 'Center',
          priceUsd: 150000,
          listingType: 'SALE',
        },
      },
    ];

    const mockRecommendations = [
      {
        id: 'rec-1',
        propertyType: 'APARTMENT',
        city: 'Tashkent',
        priceUsd: 95000,
        images: [{ isPrimary: true, url: 'https://example.com/img1.jpg' }],
        user: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
      },
      {
        id: 'rec-2',
        propertyType: 'HOUSE',
        city: 'Samarkand',
        priceUsd: 140000,
        images: [],
        user: { id: 'user-2', firstName: 'Jane', lastName: 'Smith' },
      },
    ];

    it('should return personalized recommendations based on viewing history', async () => {
      mockPrismaService.recentlyViewed.findMany.mockResolvedValue(mockRecentViews);
      mockPrismaService.favorite.findMany.mockResolvedValue(mockFavorites);
      mockPrismaService.property.findMany.mockResolvedValue(mockRecommendations);

      const result = await service.getPersonalizedRecommendations('user-123', 10);

      expect(result).toEqual(mockRecommendations);
      expect(prisma.recentlyViewed.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        take: 20,
        orderBy: { viewedAt: 'desc' },
      });

      expect(prisma.favorite.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });

      // Average price: (90000 + 110000 + 150000) / 3 = 116666.67
      // Price range should be avgPrice * 0.5 to avgPrice * 1.5

      expect(prisma.property.findMany).toHaveBeenCalledWith({
        where: {
          id: { notIn: ['prop-1', 'prop-2', 'prop-3'] },
          status: 'ACTIVE',
          OR: [
            { propertyType: { in: expect.any(Array) } },
            { city: { in: expect.any(Array) } },
          ],
          priceUsd: {
            gte: expect.any(Number),
            lte: expect.any(Number),
          },
        },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        take: 10,
        orderBy: [{ createdAt: 'desc' }],
      });
    });

    it('should return popular properties if no history', async () => {
      mockPrismaService.recentlyViewed.findMany.mockResolvedValue([]);
      mockPrismaService.favorite.findMany.mockResolvedValue([]);
      mockPrismaService.property.findMany.mockResolvedValue(mockRecommendations);

      const result = await service.getPersonalizedRecommendations('user-123', 10);

      expect(result).toEqual(mockRecommendations);
      expect(prisma.property.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
        take: 10,
        orderBy: [{ createdAt: 'desc' }],
      });
    });

    it('should use custom limit', async () => {
      mockPrismaService.recentlyViewed.findMany.mockResolvedValue([]);
      mockPrismaService.favorite.findMany.mockResolvedValue([]);
      mockPrismaService.property.findMany.mockResolvedValue([]);

      await service.getPersonalizedRecommendations('user-123', 20);

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        }),
      );
    });
  });

  describe('getMostCommon', () => {
    it('should return top 3 most common items', () => {
      const items = ['A', 'B', 'A', 'C', 'A', 'B', 'D'];
      const result = service['getMostCommon'](items);

      expect(result).toEqual(['A', 'B', 'C']); // A:3, B:2, C:1
    });

    it('should handle empty array', () => {
      const result = service['getMostCommon']([]);
      expect(result).toEqual([]);
    });

    it('should return all items if less than 3', () => {
      const items = ['A', 'B'];
      const result = service['getMostCommon'](items);
      expect(result).toEqual(['A', 'B']);
    });
  });

  describe('getAverage', () => {
    it('should calculate average of numbers', () => {
      const numbers = [100, 200, 300];
      const result = service['getAverage'](numbers);
      expect(result).toBe(200);
    });

    it('should return 0 for empty array', () => {
      const result = service['getAverage']([]);
      expect(result).toBe(0);
    });

    it('should handle single number', () => {
      const result = service['getAverage']([42]);
      expect(result).toBe(42);
    });

    it('should handle decimals', () => {
      const numbers = [10.5, 20.5, 30];
      const result = service['getAverage'](numbers);
      expect(result).toBeCloseTo(20.333, 2);
    });
  });
});
