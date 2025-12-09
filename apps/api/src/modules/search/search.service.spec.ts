import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { ElasticsearchService } from './elasticsearch.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { mockPrismaService, resetMocks, TestFactories } from '../../test/test-utils';

// Mock ElasticsearchService
const mockElasticsearchService = {
  isElasticsearchEnabled: jest.fn(),
  createIndex: jest.fn(),
  indexDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
  bulkIndex: jest.fn(),
  search: jest.fn(),
  indexExists: jest.fn(),
  deleteIndex: jest.fn(),
  getClient: jest.fn(),
};

describe('SearchService', () => {
  let service: SearchService;
  let elasticsearchService: typeof mockElasticsearchService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    resetMocks();
    // Reset Elasticsearch mock
    Object.values(mockElasticsearchService).forEach((method) => {
      if (jest.isMockFunction(method)) {
        method.mockReset();
      }
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: ElasticsearchService,
          useValue: mockElasticsearchService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    elasticsearchService = mockElasticsearchService;
    prisma = mockPrismaService;
  });

  describe('initializeIndex', () => {
    it('should create index when Elasticsearch is enabled', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.createIndex.mockResolvedValue(true);

      await service.initializeIndex();

      expect(elasticsearchService.createIndex).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          properties: expect.objectContaining({
            id: { type: 'keyword' },
            title: expect.any(Object),
            description: expect.any(Object),
            price: { type: 'float' },
            propertyType: { type: 'keyword' },
            listingType: { type: 'keyword' },
            status: { type: 'keyword' },
            city: expect.any(Object),
            location: { type: 'geo_point' },
          }),
        })
      );
    });

    it('should skip index initialization when Elasticsearch is disabled', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(false);

      await service.initializeIndex();

      expect(elasticsearchService.createIndex).not.toHaveBeenCalled();
    });
  });

  describe('indexProperty', () => {
    const propertyId = 'prop-123';

    it('should return false when Elasticsearch is disabled', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(false);

      const result = await service.indexProperty(propertyId);

      expect(result).toBe(false);
      expect(prisma.property.findUnique).not.toHaveBeenCalled();
    });

    it('should return false when property does not exist', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      prisma.property.findUnique.mockResolvedValue(null);

      const result = await service.indexProperty(propertyId);

      expect(result).toBe(false);
      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: propertyId },
        include: { amenities: true },
      });
      expect(elasticsearchService.indexDocument).not.toHaveBeenCalled();
    });

    it('should index property successfully', async () => {
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        latitude: 41.2995,
        longitude: 69.2401,
        amenities: [{ amenity: 'WiFi' }, { amenity: 'Parking' }],
      });

      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      elasticsearchService.indexDocument.mockResolvedValue(true);

      const result = await service.indexProperty(propertyId);

      expect(result).toBe(true);
      expect(elasticsearchService.indexDocument).toHaveBeenCalledWith(
        'properties',
        propertyId,
        expect.objectContaining({
          id: propertyId,
          title: mockProperty.title,
          description: mockProperty.description,
          price: mockProperty.price,
          city: mockProperty.city,
          location: { lat: 41.2995, lon: 69.2401 },
          amenities: ['WiFi', 'Parking'],
          featured: mockProperty.featured,
          verified: mockProperty.verified,
        })
      );
    });

    it('should handle property without location', async () => {
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        latitude: null,
        longitude: null,
        amenities: [],
      });

      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      elasticsearchService.indexDocument.mockResolvedValue(true);

      const result = await service.indexProperty(propertyId);

      expect(result).toBe(true);
      expect(elasticsearchService.indexDocument).toHaveBeenCalledWith(
        'properties',
        propertyId,
        expect.objectContaining({
          location: undefined,
          amenities: [],
        })
      );
    });

    it('should return false on indexing error', async () => {
      const mockProperty = TestFactories.createProperty({ id: propertyId });

      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      elasticsearchService.indexDocument.mockRejectedValue(new Error('Index error'));

      const result = await service.indexProperty(propertyId);

      expect(result).toBe(false);
    });
  });

  describe('updatePropertyIndex', () => {
    it('should call indexProperty', async () => {
      const propertyId = 'prop-123';
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        amenities: [{ amenity: 'WiFi' }],
      });

      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      elasticsearchService.indexDocument.mockResolvedValue(true);

      const result = await service.updatePropertyIndex(propertyId);

      expect(result).toBe(true);
      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: propertyId },
        include: { amenities: true },
      });
    });
  });

  describe('deletePropertyIndex', () => {
    const propertyId = 'prop-123';

    it('should return false when Elasticsearch is disabled', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(false);

      const result = await service.deletePropertyIndex(propertyId);

      expect(result).toBe(false);
      expect(elasticsearchService.deleteDocument).not.toHaveBeenCalled();
    });

    it('should delete property from index successfully', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.deleteDocument.mockResolvedValue(true);

      const result = await service.deletePropertyIndex(propertyId);

      expect(result).toBe(true);
      expect(elasticsearchService.deleteDocument).toHaveBeenCalledWith(
        'properties',
        propertyId
      );
    });

    it('should return false on deletion error', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.deleteDocument.mockResolvedValue(false);

      const result = await service.deletePropertyIndex(propertyId);

      expect(result).toBe(false);
    });
  });

  describe('reindexAllProperties', () => {
    it('should return failure when Elasticsearch is disabled', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(false);

      const result = await service.reindexAllProperties();

      expect(result).toEqual({ success: false, count: 0 });
      expect(prisma.property.findMany).not.toHaveBeenCalled();
    });

    it('should reindex all active properties successfully', async () => {
      const mockProperties = Array.from({ length: 3 }, (_, i) =>
        TestFactories.createProperty({
          id: `prop-${i}`,
          status: 'ACTIVE',
          amenities: [{ amenity: 'WiFi' }],
        })
      );

      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      prisma.property.findMany.mockResolvedValue(mockProperties);
      elasticsearchService.bulkIndex.mockResolvedValue(true);

      const result = await service.reindexAllProperties();

      expect(result).toEqual({ success: true, count: 3 });
      expect(prisma.property.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        include: { amenities: true },
      });
      expect(elasticsearchService.bulkIndex).toHaveBeenCalledWith(
        'properties',
        expect.arrayContaining([
          expect.objectContaining({
            id: 'prop-0',
            data: expect.objectContaining({
              id: 'prop-0',
              title: mockProperties[0].title,
              amenities: ['WiFi'],
            }),
          }),
        ])
      );
    });

    it('should handle empty property list', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      prisma.property.findMany.mockResolvedValue([]);
      elasticsearchService.bulkIndex.mockResolvedValue(true);

      const result = await service.reindexAllProperties();

      expect(result).toEqual({ success: true, count: 0 });
    });

    it('should return failure on bulk indexing error', async () => {
      const mockProperties = [TestFactories.createProperty()];

      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      prisma.property.findMany.mockResolvedValue(mockProperties);
      elasticsearchService.bulkIndex.mockRejectedValue(new Error('Bulk error'));

      const result = await service.reindexAllProperties();

      expect(result).toEqual({ success: false, count: 0 });
    });
  });

  describe('searchProperties', () => {
    const mockUser = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+998901234567',
      role: 'USER',
      agent: null,
    };

    it('should fall back to database search when Elasticsearch is disabled', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(false);

      const mockProperties = [
        TestFactories.createProperty({
          user: mockUser,
          images: [{ isPrimary: true }],
        }),
      ];

      prisma.property.findMany.mockResolvedValue(mockProperties);
      prisma.property.count.mockResolvedValue(1);

      const result = await service.searchProperties({ query: 'apartment' });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(prisma.property.findMany).toHaveBeenCalled();
    });

    it('should search properties with full-text query', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);

      const mockProperty = TestFactories.createProperty({ id: 'prop-1' });
      const mockSearchResult = {
        hits: {
          hits: [
            {
              _source: mockProperty,
              _score: 1.5,
            },
          ],
          total: { value: 1 },
        },
      };

      elasticsearchService.search.mockResolvedValue(mockSearchResult);
      prisma.property.findMany.mockResolvedValue([
        { id: 'prop-1', user: mockUser },
      ]);

      const result = await service.searchProperties({
        query: 'luxury apartment',
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].user).toEqual(mockUser);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.pages).toBe(1);

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: [{ term: { status: 'ACTIVE' } }],
              should: expect.arrayContaining([
                expect.objectContaining({ match: expect.objectContaining({ title: expect.any(Object) }) }),
                expect.objectContaining({ match: expect.objectContaining({ description: expect.any(Object) }) }),
              ]),
              minimum_should_match: 1,
            }),
          }),
          from: 0,
          size: 20,
        })
      );
    });

    it('should apply price filters', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.search.mockResolvedValue({
        hits: { hits: [], total: { value: 0 } },
      });
      prisma.property.findMany.mockResolvedValue([]);

      await service.searchProperties({
        minPrice: 50000,
        maxPrice: 200000,
      });

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { range: { price: { gte: 50000, lte: 200000 } } },
              ]),
            }),
          }),
        })
      );
    });

    it('should apply area filters', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.search.mockResolvedValue({
        hits: { hits: [], total: { value: 0 } },
      });
      prisma.property.findMany.mockResolvedValue([]);

      await service.searchProperties({
        minArea: 50,
        maxArea: 150,
      });

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { range: { area: { gte: 50, lte: 150 } } },
              ]),
            }),
          }),
        })
      );
    });

    it('should apply city filter', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.search.mockResolvedValue({
        hits: { hits: [], total: { value: 0 } },
      });
      prisma.property.findMany.mockResolvedValue([]);

      await service.searchProperties({ city: 'Ташкент' });

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { term: { 'city.keyword': 'Ташкент' } },
              ]),
            }),
          }),
        })
      );
    });

    it('should apply propertyType filter', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.search.mockResolvedValue({
        hits: { hits: [], total: { value: 0 } },
      });
      prisma.property.findMany.mockResolvedValue([]);

      await service.searchProperties({ propertyType: 'APARTMENT' });

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { term: { propertyType: 'APARTMENT' } },
              ]),
            }),
          }),
        })
      );
    });

    it('should apply listingType filter', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.search.mockResolvedValue({
        hits: { hits: [], total: { value: 0 } },
      });
      prisma.property.findMany.mockResolvedValue([]);

      await service.searchProperties({ listingType: 'SALE' });

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { term: { listingType: 'SALE' } },
              ]),
            }),
          }),
        })
      );
    });

    it('should apply bedrooms and bathrooms filters', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.search.mockResolvedValue({
        hits: { hits: [], total: { value: 0 } },
      });
      prisma.property.findMany.mockResolvedValue([]);

      await service.searchProperties({
        bedrooms: 3,
        bathrooms: 2,
      });

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { term: { bedrooms: 3 } },
                { term: { bathrooms: 2 } },
              ]),
            }),
          }),
        })
      );
    });

    it('should apply buildingClass filter', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.search.mockResolvedValue({
        hits: { hits: [], total: { value: 0 } },
      });
      prisma.property.findMany.mockResolvedValue([]);

      await service.searchProperties({ buildingClass: 'BUSINESS' });

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { term: { buildingClass: 'BUSINESS' } },
              ]),
            }),
          }),
        })
      );
    });

    it('should apply userId filter', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.search.mockResolvedValue({
        hits: { hits: [], total: { value: 0 } },
      });
      prisma.property.findMany.mockResolvedValue([]);

      await service.searchProperties({ userId: 'user-123' });

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { term: { userId: 'user-123' } },
              ]),
            }),
          }),
        })
      );
    });

    it('should sort by price ascending', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.search.mockResolvedValue({
        hits: { hits: [], total: { value: 0 } },
      });
      prisma.property.findMany.mockResolvedValue([]);

      await service.searchProperties({ sortBy: 'price_asc' });

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          sort: [{ price: 'asc' }],
        })
      );
    });

    it('should sort by price descending', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.search.mockResolvedValue({
        hits: { hits: [], total: { value: 0 } },
      });
      prisma.property.findMany.mockResolvedValue([]);

      await service.searchProperties({ sortBy: 'price_desc' });

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          sort: [{ price: 'desc' }],
        })
      );
    });

    it('should sort by date descending', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.search.mockResolvedValue({
        hits: { hits: [], total: { value: 0 } },
      });
      prisma.property.findMany.mockResolvedValue([]);

      await service.searchProperties({ sortBy: 'date_desc' });

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          sort: [{ createdAt: 'desc' }],
        })
      );
    });

    it('should sort by date ascending', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.search.mockResolvedValue({
        hits: { hits: [], total: { value: 0 } },
      });
      prisma.property.findMany.mockResolvedValue([]);

      await service.searchProperties({ sortBy: 'date_asc' });

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          sort: [{ createdAt: 'asc' }],
        })
      );
    });

    it('should sort by relevance by default', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.search.mockResolvedValue({
        hits: { hits: [], total: { value: 0 } },
      });
      prisma.property.findMany.mockResolvedValue([]);

      await service.searchProperties({ sortBy: 'relevance' });

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          sort: ['_score', { createdAt: 'desc' }],
        })
      );
    });

    it('should handle pagination correctly', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);

      const mockProperties = Array.from({ length: 10 }, (_, i) =>
        TestFactories.createProperty({ id: `prop-${i}` })
      );

      elasticsearchService.search.mockResolvedValue({
        hits: {
          hits: mockProperties.map((p) => ({ _source: p, _score: 1 })),
          total: { value: 100 },
        },
      });

      const userDataMap = mockProperties.map((p) => ({
        id: p.id,
        user: mockUser,
      }));
      prisma.property.findMany.mockResolvedValue(userDataMap);

      const result = await service.searchProperties({
        page: 3,
        limit: 10,
      });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(100);
      expect(result.pages).toBe(10);

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          from: 20, // (page 3 - 1) * 10
          size: 10,
        })
      );
    });

    it('should enrich search results with user data', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);

      const mockProperty = TestFactories.createProperty({ id: 'prop-1' });
      elasticsearchService.search.mockResolvedValue({
        hits: {
          hits: [{ _source: mockProperty, _score: 1.5 }],
          total: { value: 1 },
        },
      });

      const mockAgent = {
        phone: '+998901234567',
        photo: 'agent-photo.jpg',
      };

      const mockUserWithAgent = {
        ...mockUser,
        agent: mockAgent,
      };

      prisma.property.findMany.mockResolvedValue([
        { id: 'prop-1', user: mockUserWithAgent },
      ]);

      const result = await service.searchProperties({});

      expect(result.data[0].user).toEqual(mockUserWithAgent);
      expect(result.data[0].user.agent).toEqual(mockAgent);
      expect(result.data[0]._score).toBe(1.5);
    });

    it('should handle properties without user data', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);

      const mockProperty = TestFactories.createProperty({ id: 'prop-1' });
      elasticsearchService.search.mockResolvedValue({
        hits: {
          hits: [{ _source: mockProperty, _score: 1 }],
          total: { value: 1 },
        },
      });

      // Return empty array for user data
      prisma.property.findMany.mockResolvedValue([]);

      const result = await service.searchProperties({});

      expect(result.data[0].user).toBeNull();
    });
  });

  describe('getSuggestions', () => {
    it('should return empty array when Elasticsearch is disabled', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(false);

      const result = await service.getSuggestions('apartment');

      expect(result).toEqual([]);
      expect(elasticsearchService.search).not.toHaveBeenCalled();
    });

    it('should return empty array when query is empty', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);

      const result = await service.getSuggestions('');

      expect(result).toEqual([]);
      expect(elasticsearchService.search).not.toHaveBeenCalled();
    });

    it('should return title suggestions', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);

      const mockSuggestions = [
        { _source: { title: 'Luxury Apartment', city: 'Ташкент' } },
        { _source: { title: 'Modern Apartment', city: 'Ташкент' } },
        { _source: { title: 'Cozy Apartment', city: 'Самарканд' } },
      ];

      elasticsearchService.search.mockResolvedValue({
        hits: { hits: mockSuggestions },
      });

      const result = await service.getSuggestions('apartment', 5);

      expect(result).toEqual([
        'Luxury Apartment',
        'Modern Apartment',
        'Cozy Apartment',
      ]);

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: [
                { term: { status: 'ACTIVE' } },
                {
                  multi_match: {
                    query: 'apartment',
                    fields: ['title^3', 'city^2', 'address'],
                    type: 'bool_prefix',
                  },
                },
              ],
            }),
          }),
          _source: ['title', 'city'],
          size: 5,
        })
      );
    });

    it('should use default limit of 5', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.search.mockResolvedValue({
        hits: { hits: [] },
      });

      await service.getSuggestions('test');

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'properties',
        expect.objectContaining({
          size: 5,
        })
      );
    });

    it('should return empty array on search error', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(true);
      elasticsearchService.search.mockRejectedValue(new Error('Search error'));

      const result = await service.getSuggestions('apartment');

      expect(result).toEqual([]);
    });
  });

  describe('fallbackDatabaseSearch', () => {
    const mockUser = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+998901234567',
      role: 'USER',
      agent: null,
    };

    it('should perform database search with query', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(false);

      const mockProperties = [
        TestFactories.createProperty({
          user: mockUser,
          images: [{ isPrimary: true }],
        }),
      ];

      prisma.property.findMany.mockResolvedValue(mockProperties);
      prisma.property.count.mockResolvedValue(1);

      const result = await service.searchProperties({
        query: 'luxury',
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.pages).toBe(1);

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            OR: [
              { title: { contains: 'luxury', mode: 'insensitive' } },
              { description: { contains: 'luxury', mode: 'insensitive' } },
              { city: { contains: 'luxury', mode: 'insensitive' } },
            ],
          }),
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should apply filters in database search', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(false);

      prisma.property.findMany.mockResolvedValue([]);
      prisma.property.count.mockResolvedValue(0);

      await service.searchProperties({
        city: 'Ташкент',
        propertyType: 'APARTMENT',
        listingType: 'SALE',
        minPrice: 50000,
        maxPrice: 200000,
        userId: 'user-123',
      });

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            city: { contains: 'Ташкент', mode: 'insensitive' },
            propertyType: 'APARTMENT',
            listingType: 'SALE',
            price: { gte: 50000, lte: 200000 },
            userId: 'user-123',
          }),
        })
      );
    });

    it('should handle pagination in database search', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(false);

      prisma.property.findMany.mockResolvedValue([]);
      prisma.property.count.mockResolvedValue(0);

      await service.searchProperties({
        page: 3,
        limit: 10,
      });

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (page 3 - 1) * 10
          take: 10,
        })
      );
    });

    it('should include user and images in database search', async () => {
      elasticsearchService.isElasticsearchEnabled.mockReturnValue(false);

      const mockAgent = {
        phone: '+998901234567',
        photo: 'agent-photo.jpg',
      };

      const mockProperty = TestFactories.createProperty({
        user: { ...mockUser, agent: mockAgent },
        images: [
          { id: 'img-1', isPrimary: true, url: 'image1.jpg' },
        ],
      });

      prisma.property.findMany.mockResolvedValue([mockProperty]);
      prisma.property.count.mockResolvedValue(1);

      const result = await service.searchProperties({});

      expect(result.data[0].user).toEqual({ ...mockUser, agent: mockAgent });
      expect(result.data[0].images).toHaveLength(1);
      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            images: {
              take: 1,
              where: { isPrimary: true },
            },
            user: expect.objectContaining({
              select: expect.objectContaining({
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                agent: expect.any(Object),
              }),
            }),
          }),
        })
      );
    });
  });
});
