import { Test, TestingModule } from '@nestjs/testing';
import { ValuationService, ValuationInput } from './valuation.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PropertyType, ListingType, PropertyStatus } from '@repo/database';
import {
  mockPrismaService,
  resetMocks,
  TestFactories,
} from '../../test/test-utils';

describe('ValuationService', () => {
  let service: ValuationService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    resetMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValuationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ValuationService>(ValuationService);
    prisma = mockPrismaService;
  });

  describe('calculateValuation', () => {
    const mockInput: ValuationInput = {
      propertyType: PropertyType.APARTMENT,
      listingType: ListingType.SALE,
      city: 'Ташкент',
      district: 'Юнусабад',
      area: 100,
      bedrooms: 3,
      bathrooms: 2,
      floor: 5,
      totalFloors: 10,
      yearBuilt: 2020,
      buildingClass: 'BUSINESS',
      renovation: 'EURO_REPAIR',
      hasBalcony: true,
      parkingType: 'UNDERGROUND',
      latitude: 41.2995,
      longitude: 69.2401,
    };

    it('should calculate valuation with comparable properties', async () => {
      // Mock comparable properties
      const comparables = Array.from({ length: 10 }, (_, i) =>
        TestFactories.createProperty({
          propertyType: PropertyType.APARTMENT,
          listingType: ListingType.SALE,
          city: 'Ташкент',
          district: 'Юнусабад',
          status: PropertyStatus.ACTIVE,
          area: 95 + i * 2, // Areas from 95 to 113
          price: 100000 + i * 5000, // Prices from 100k to 145k
          bedrooms: 3,
          buildingClass: 'BUSINESS',
          renovation: 'EURO_REPAIR',
          balcony: 1,
          parkingType: 'UNDERGROUND',
          yearBuilt: 2019 + i,
          floor: 4 + i,
          totalFloors: 10,
          latitude: 41.3 + i * 0.001,
          longitude: 69.24 + i * 0.001,
        }),
      );

      prisma.property.findMany.mockResolvedValue(comparables);

      const result = await service.calculateValuation(mockInput);

      expect(result).toBeDefined();
      expect(result.estimatedPrice).toBeGreaterThan(0);
      expect(result.priceRange.low).toBeLessThan(result.estimatedPrice);
      expect(result.priceRange.high).toBeGreaterThan(result.estimatedPrice);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
      expect(result.comparableCount).toBe(10);
      expect(result.comparableProperties).toHaveLength(10);
      expect(result.marketInsights).toBeDefined();
      expect(result.marketInsights.averagePricePerSqm).toBeGreaterThan(0);
    });

    it('should throw error when no comparable properties found', async () => {
      prisma.property.findMany.mockResolvedValue([]);

      await expect(service.calculateValuation(mockInput)).rejects.toThrow(
        'Not enough comparable properties found for valuation',
      );
    });

    it('should calculate similarity scores correctly', async () => {
      const exactMatch = TestFactories.createProperty({
        propertyType: mockInput.propertyType,
        listingType: mockInput.listingType,
        city: mockInput.city,
        district: mockInput.district,
        area: mockInput.area,
        bedrooms: mockInput.bedrooms,
        buildingClass: mockInput.buildingClass,
        renovation: mockInput.renovation,
        balcony: 1,
        parkingType: mockInput.parkingType,
        yearBuilt: mockInput.yearBuilt,
        floor: mockInput.floor,
        latitude: mockInput.latitude,
        longitude: mockInput.longitude,
      });

      const poorMatch = TestFactories.createProperty({
        propertyType: mockInput.propertyType,
        listingType: mockInput.listingType,
        city: mockInput.city,
        area: mockInput.area * 1.5,
        bedrooms: 1,
        district: 'Другой район',
        buildingClass: 'ECONOMY',
        renovation: 'NEEDS_REPAIR',
        balcony: 0,
        parkingType: 'NONE',
        yearBuilt: 1990,
        floor: 1,
        latitude: 41.5,
        longitude: 69.5,
      });

      prisma.property.findMany.mockResolvedValue([exactMatch, poorMatch]);

      const result = await service.calculateValuation(mockInput);

      // The exact match should have higher influence on the estimated price
      expect(result.comparableProperties[0].similarity).toBeGreaterThan(
        result.comparableProperties[1].similarity,
      );
    });

    it('should calculate market trends correctly', async () => {
      const recentProperties = Array.from({ length: 5 }, () =>
        TestFactories.createProperty({
          propertyType: PropertyType.APARTMENT,
          listingType: ListingType.SALE,
          city: 'Ташкент',
          area: 100,
          price: 120000, // Higher recent prices
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        }),
      );

      const olderProperties = Array.from({ length: 5 }, () =>
        TestFactories.createProperty({
          propertyType: PropertyType.APARTMENT,
          listingType: ListingType.SALE,
          city: 'Ташкент',
          area: 100,
          price: 100000, // Lower older prices
          createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
        }),
      );

      prisma.property.findMany
        .mockResolvedValueOnce([...recentProperties, ...olderProperties]) // For comparables
        .mockResolvedValueOnce(recentProperties) // For recent trend
        .mockResolvedValueOnce(olderProperties); // For older trend

      const result = await service.calculateValuation(mockInput);

      expect(result.marketInsights.trend).toBe('increasing');
      expect(result.marketInsights.trendPercentage).toBeGreaterThan(0);
    });

    it('should handle properties without optional fields', async () => {
      const comparables = Array.from({ length: 5 }, () =>
        TestFactories.createProperty({
          propertyType: PropertyType.APARTMENT,
          listingType: ListingType.SALE,
          city: 'Ташкент',
          area: 100,
          price: 100000,
          bedrooms: null,
          bathrooms: null,
          floor: null,
          totalFloors: null,
          yearBuilt: null,
          buildingClass: null,
          renovation: null,
          parkingType: null,
          latitude: null,
          longitude: null,
        }),
      );

      prisma.property.findMany.mockResolvedValue(comparables);

      const minimalInput: ValuationInput = {
        propertyType: PropertyType.APARTMENT,
        listingType: ListingType.SALE,
        city: 'Ташкент',
        area: 100,
      };

      const result = await service.calculateValuation(minimalInput);

      expect(result).toBeDefined();
      expect(result.estimatedPrice).toBeGreaterThan(0);
    });

    it('should calculate distance correctly when coordinates provided', async () => {
      const nearbyProperty = TestFactories.createProperty({
        propertyType: PropertyType.APARTMENT,
        listingType: ListingType.SALE,
        city: 'Ташкент',
        district: 'Юнусабад',
        area: 100,
        bedrooms: 3,
        bathrooms: 2,
        price: 100000,
        status: PropertyStatus.ACTIVE,
        latitude: 41.2995, // Same location
        longitude: 69.2401,
      });

      const farProperty = TestFactories.createProperty({
        propertyType: PropertyType.APARTMENT,
        listingType: ListingType.SALE,
        city: 'Ташкент',
        district: 'Юнусабад',
        area: 100,
        bedrooms: 3,
        bathrooms: 2,
        price: 100000,
        status: PropertyStatus.ACTIVE,
        latitude: 41.35, // ~5km away
        longitude: 69.29,
      });

      prisma.property.findMany.mockResolvedValue([nearbyProperty, farProperty]);

      const result = await service.calculateValuation(mockInput);

      expect(result.comparableProperties[0].distance).toBeDefined();
      expect(result.comparableProperties[1].distance).toBeDefined();
      expect(result.comparableProperties[0].distance!).toBeLessThan(
        result.comparableProperties[1].distance!,
      );
    });

    it('should limit to top 10 comparables', async () => {
      const comparables = Array.from({ length: 50 }, () =>
        TestFactories.createProperty({
          propertyType: PropertyType.APARTMENT,
          listingType: ListingType.SALE,
          city: 'Ташкент',
          area: 100,
          price: 100000,
        }),
      );

      prisma.property.findMany.mockResolvedValue(comparables);

      const result = await service.calculateValuation(mockInput);

      expect(result.comparableProperties).toHaveLength(10);
      expect(result.comparableCount).toBe(50); // But report total found
    });

    it('should handle null area values gracefully', async () => {
      const comparablesWithNullArea = Array.from({ length: 5 }, () =>
        TestFactories.createProperty({
          propertyType: PropertyType.APARTMENT,
          listingType: ListingType.SALE,
          city: 'Ташкент',
          area: null,
          price: 100000,
        }),
      );

      prisma.property.findMany.mockResolvedValue(comparablesWithNullArea);

      const result = await service.calculateValuation(mockInput);

      // Should not crash and should handle division by null/zero
      expect(result).toBeDefined();
      expect(result.estimatedPrice).toBeGreaterThan(0);
    });
  });
});
