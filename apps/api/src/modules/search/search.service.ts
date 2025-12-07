import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';
import { PrismaService } from '../../common/prisma';

const PROPERTIES_INDEX = 'properties';

interface PropertySearchFilters {
  query?: string;
  city?: string;
  propertyType?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  buildingClass?: string;
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc';
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly prisma: PrismaService,
  ) {}

  async initializeIndex(): Promise<void> {
    if (!this.elasticsearchService.isElasticsearchEnabled()) {
      this.logger.warn('Elasticsearch is disabled - skipping index initialization');
      return;
    }

    const mappings = {
      properties: {
        id: { type: 'keyword' },
        title: {
          type: 'text',
          analyzer: 'autocomplete',
          search_analyzer: 'autocomplete_search',
          fields: {
            keyword: { type: 'keyword' },
          },
        },
        description: {
          type: 'text',
          analyzer: 'standard',
        },
        price: { type: 'float' },
        priceUsd: { type: 'float' },
        currency: { type: 'keyword' },
        propertyType: { type: 'keyword' },
        listingType: { type: 'keyword' },
        status: { type: 'keyword' },
        city: {
          type: 'text',
          fields: {
            keyword: { type: 'keyword' },
          },
        },
        address: { type: 'text' },
        district: { type: 'keyword' },
        bedrooms: { type: 'integer' },
        bathrooms: { type: 'float' },
        area: { type: 'float' },
        buildingClass: { type: 'keyword' },
        buildingType: { type: 'keyword' },
        renovation: { type: 'keyword' },
        floor: { type: 'integer' },
        totalFloors: { type: 'integer' },
        yearBuilt: { type: 'integer' },
        location: { type: 'geo_point' },
        amenities: { type: 'keyword' },
        featured: { type: 'boolean' },
        verified: { type: 'boolean' },
        views: { type: 'integer' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    };

    await this.elasticsearchService.createIndex(PROPERTIES_INDEX, mappings);
  }

  async indexProperty(propertyId: string): Promise<boolean> {
    if (!this.elasticsearchService.isElasticsearchEnabled()) {
      return false;
    }

    try {
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          amenities: true,
        },
      });

      if (!property) {
        this.logger.error(`Property ${propertyId} not found`);
        return false;
      }

      const document = {
        id: property.id,
        title: property.title,
        description: property.description,
        price: property.price,
        priceUsd: property.priceUsd,
        currency: property.currency,
        propertyType: property.propertyType,
        listingType: property.listingType,
        status: property.status,
        city: property.city,
        address: property.address,
        district: property.district,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        buildingClass: property.buildingClass,
        buildingType: property.buildingType,
        renovation: property.renovation,
        floor: property.floor,
        totalFloors: property.totalFloors,
        yearBuilt: property.yearBuilt,
        location:
          property.latitude && property.longitude
            ? { lat: property.latitude, lon: property.longitude }
            : undefined,
        amenities: property.amenities.map((a) => a.amenity),
        featured: property.featured,
        verified: property.verified,
        views: property.views,
        createdAt: property.createdAt.toISOString(),
        updatedAt: property.updatedAt.toISOString(),
      };

      return await this.elasticsearchService.indexDocument(
        PROPERTIES_INDEX,
        property.id,
        document,
      );
    } catch (error) {
      this.logger.error(`Error indexing property ${propertyId}:`, error);
      return false;
    }
  }

  async updatePropertyIndex(propertyId: string): Promise<boolean> {
    return await this.indexProperty(propertyId);
  }

  async deletePropertyIndex(propertyId: string): Promise<boolean> {
    if (!this.elasticsearchService.isElasticsearchEnabled()) {
      return false;
    }

    return await this.elasticsearchService.deleteDocument(PROPERTIES_INDEX, propertyId);
  }

  async reindexAllProperties(): Promise<{ success: boolean; count: number }> {
    if (!this.elasticsearchService.isElasticsearchEnabled()) {
      return { success: false, count: 0 };
    }

    try {
      const properties = await this.prisma.property.findMany({
        where: { status: 'ACTIVE' },
        include: {
          amenities: true,
        },
      });

      const documents = properties.map((property) => ({
        id: property.id,
        data: {
          id: property.id,
          title: property.title,
          description: property.description,
          price: property.price,
          priceUsd: property.priceUsd,
          currency: property.currency,
          propertyType: property.propertyType,
          listingType: property.listingType,
          status: property.status,
          city: property.city,
          address: property.address,
          district: property.district,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area: property.area,
          buildingClass: property.buildingClass,
          buildingType: property.buildingType,
          renovation: property.renovation,
          floor: property.floor,
          totalFloors: property.totalFloors,
          yearBuilt: property.yearBuilt,
          location:
            property.latitude && property.longitude
              ? { lat: property.latitude, lon: property.longitude }
              : undefined,
          amenities: property.amenities.map((a) => a.amenity),
          featured: property.featured,
          verified: property.verified,
          views: property.views,
          createdAt: property.createdAt.toISOString(),
          updatedAt: property.updatedAt.toISOString(),
        },
      }));

      const success = await this.elasticsearchService.bulkIndex(
        PROPERTIES_INDEX,
        documents,
      );

      return { success, count: properties.length };
    } catch (error) {
      this.logger.error('Error reindexing properties:', error);
      return { success: false, count: 0 };
    }
  }

  async searchProperties(filters: PropertySearchFilters): Promise<any> {
    if (!this.elasticsearchService.isElasticsearchEnabled()) {
      this.logger.warn('Elasticsearch disabled - falling back to database search');
      return this.fallbackDatabaseSearch(filters);
    }

    const { query, page = 1, limit = 20, sortBy = 'relevance', ...restFilters } = filters;
    const from = (page - 1) * limit;

    const mustClauses: any[] = [{ term: { status: 'ACTIVE' } }];
    const shouldClauses: any[] = [];
    const filterClauses: any[] = [];

    // Full-text search
    if (query) {
      shouldClauses.push(
        { match: { title: { query, boost: 3, fuzziness: 'AUTO' } } },
        { match: { description: { query, boost: 1, fuzziness: 'AUTO' } } },
        { match: { city: { query, boost: 2 } } },
        { match: { address: { query } } },
      );
    }

    // Filters
    if (restFilters.userId) {
      filterClauses.push({ term: { userId: restFilters.userId } });
    }

    if (restFilters.city) {
      filterClauses.push({ term: { 'city.keyword': restFilters.city } });
    }

    if (restFilters.propertyType) {
      filterClauses.push({ term: { propertyType: restFilters.propertyType } });
    }

    if (restFilters.listingType) {
      filterClauses.push({ term: { listingType: restFilters.listingType } });
    }

    if (restFilters.buildingClass) {
      filterClauses.push({ term: { buildingClass: restFilters.buildingClass } });
    }

    if (restFilters.minPrice !== undefined || restFilters.maxPrice !== undefined) {
      const priceRange: any = {};
      if (restFilters.minPrice !== undefined) priceRange.gte = restFilters.minPrice;
      if (restFilters.maxPrice !== undefined) priceRange.lte = restFilters.maxPrice;
      filterClauses.push({ range: { price: priceRange } });
    }

    if (restFilters.minArea !== undefined || restFilters.maxArea !== undefined) {
      const areaRange: any = {};
      if (restFilters.minArea !== undefined) areaRange.gte = restFilters.minArea;
      if (restFilters.maxArea !== undefined) areaRange.lte = restFilters.maxArea;
      filterClauses.push({ range: { area: areaRange } });
    }

    if (restFilters.bedrooms) {
      filterClauses.push({ term: { bedrooms: restFilters.bedrooms } });
    }

    if (restFilters.bathrooms) {
      filterClauses.push({ term: { bathrooms: restFilters.bathrooms } });
    }

    // Sort
    let sort: any = [];
    switch (sortBy) {
      case 'price_asc':
        sort = [{ price: 'asc' }];
        break;
      case 'price_desc':
        sort = [{ price: 'desc' }];
        break;
      case 'date_desc':
        sort = [{ createdAt: 'desc' }];
        break;
      case 'date_asc':
        sort = [{ createdAt: 'asc' }];
        break;
      default:
        sort = ['_score', { createdAt: 'desc' }];
    }

    const searchQuery: any = {
      query: {
        bool: {
          must: mustClauses,
          filter: filterClauses,
        },
      },
      from,
      size: limit,
      sort,
    };

    if (shouldClauses.length > 0) {
      searchQuery.query.bool.should = shouldClauses;
      searchQuery.query.bool.minimum_should_match = 1;
    }

    const result = await this.elasticsearchService.search(PROPERTIES_INDEX, searchQuery);

    const hits = result.hits.hits.map((hit: any) => ({
      ...hit._source,
      _score: hit._score,
    }));

    // Fetch user data for each property
    const propertyIds = hits.map((hit: any) => hit.id);
    const properties = await this.prisma.property.findMany({
      where: { id: { in: propertyIds } },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            agent: {
              select: {
                phone: true,
                photo: true,
              },
            },
          },
        },
      },
    });

    // Create a map of property ID to user data
    const userDataMap = new Map();
    properties.forEach((prop) => {
      userDataMap.set(prop.id, prop.user);
    });

    // Merge user data with hits
    const enrichedHits = hits.map((hit: any) => ({
      ...hit,
      user: userDataMap.get(hit.id) || null,
    }));

    return {
      data: enrichedHits,
      total: result.hits.total.value,
      page,
      limit,
      pages: Math.ceil(result.hits.total.value / limit),
    };
  }

  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!this.elasticsearchService.isElasticsearchEnabled() || !query) {
      return [];
    }

    try {
      const searchQuery = {
        query: {
          bool: {
            must: [
              { term: { status: 'ACTIVE' } },
              {
                multi_match: {
                  query,
                  fields: ['title^3', 'city^2', 'address'],
                  type: 'bool_prefix',
                },
              },
            ],
          },
        },
        _source: ['title', 'city'],
        size: limit,
      };

      const result = await this.elasticsearchService.search(
        PROPERTIES_INDEX,
        searchQuery,
      );

      return result.hits.hits.map((hit: any) => hit._source.title);
    } catch (error) {
      this.logger.error('Error getting suggestions:', error);
      return [];
    }
  }

  private async fallbackDatabaseSearch(filters: PropertySearchFilters): Promise<any> {
    const { query, page = 1, limit = 20, ...restFilters } = filters;
    const skip = (page - 1) * limit;

    const where: any = { status: 'ACTIVE' };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (restFilters.userId) {
      where.userId = restFilters.userId;
    }

    if (restFilters.city) {
      where.city = { contains: restFilters.city, mode: 'insensitive' };
    }

    if (restFilters.propertyType) {
      where.propertyType = restFilters.propertyType;
    }

    if (restFilters.listingType) {
      where.listingType = restFilters.listingType;
    }

    if (restFilters.minPrice !== undefined || restFilters.maxPrice !== undefined) {
      where.price = {};
      if (restFilters.minPrice !== undefined) where.price.gte = restFilters.minPrice;
      if (restFilters.maxPrice !== undefined) where.price.lte = restFilters.maxPrice;
    }

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: {
            take: 1,
            where: { isPrimary: true },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              role: true,
              agent: {
                select: {
                  phone: true,
                  photo: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}
