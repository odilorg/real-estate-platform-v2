import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreatePropertyDto, UpdatePropertyDto, PropertyFilterDto, Currency, EXCHANGE_RATE_UZS_TO_USD } from '@repo/shared';
import { UploadService } from '../upload/upload.service';
import { Prisma } from '@repo/database';
import { PropertyQueryBuilder } from './property-query-builder';
import { POIService } from './poi.service';
import { PriceHistoryService } from './price-history.service';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PropertiesService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
    private priceHistoryService: PriceHistoryService,
    private poiService: POIService,
  ) { }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
      Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async create(userId: string, dto: CreatePropertyDto) {
    const { images, amenities, ...propertyData } = dto;

    const property = await this.prisma.property.create({
      data: {
        ...propertyData,
        userId,
        priceUsd: propertyData.currency === Currency.UZS
          ? propertyData.price / EXCHANGE_RATE_UZS_TO_USD
          : propertyData.price,
        images: images
          ? {
            create: images.map((url, index) => ({
              url,
              order: index,
              isPrimary: index === 0,
            })),
          }
          : undefined,
        amenities: amenities
          ? {
            create: amenities.map((amenity) => ({ amenity })),
          }
          : undefined,
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        amenities: true,
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

    // Fire-and-forget: Trigger background POI fetching if property has coordinates
    if (property.latitude && property.longitude) {
      this.poiService
        .fetchAndStorePOIs(property.id, property.latitude, property.longitude)
        .catch((err) => {
          console.error(`Failed to fetch POIs for property ${property.id}:`, err);
        });
    }

    return property;
  }

  async findAll(filters: PropertyFilterDto): Promise<PaginatedResult<Record<string, unknown>>> {
    const {
      latitude,
      longitude,
      radius,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    // Build where clause using PropertyQueryBuilder
    const queryBuilder = new PropertyQueryBuilder(filters);
    const where = queryBuilder.getWhereClause();
    const needsGeoFilter = queryBuilder.needsGeoFilter();
    const needsFloorPostFilter = queryBuilder.needsFloorPostFilter();
    const needsPricePerSqMFilter = queryBuilder.needsPricePerSqMFilter();

    // For geo-location search or price per m² filter, fetch more to account for post-filtering
    const fetchLimit = (needsGeoFilter || needsPricePerSqMFilter) ? limit * 10 : limit;

    // Determine order by
    let orderBy: Prisma.PropertyOrderByWithRelationInput = { [sortBy]: sortOrder };

    // For rating sort, we need to handle differently (in-memory sort after fetch)
    if (sortBy === 'rating') {
      orderBy = { createdAt: 'desc' };
    }

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip: needsGeoFilter ? 0 : (page - 1) * limit,
        take: needsGeoFilter ? fetchLimit : limit,
        orderBy,
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
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
          reviews: {
            where: { approved: true },
            select: { rating: true },
          },
          amenities: true,
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    // Process results: calculate ratings and distances
    let processedProperties = properties.map((property) => {
      const { reviews, amenities: _propAmenities, ...rest } = property;
      const reviewCount = reviews.length;
      const averageRating =
        reviewCount > 0
          ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10,
          ) / 10
          : null;

      // Calculate distance if geo search
      let distance: number | undefined;
      if (needsGeoFilter && rest.latitude && rest.longitude) {
        distance = this.calculateDistance(
          latitude!,
          longitude!,
          rest.latitude,
          rest.longitude,
        );
      }

      return { ...rest, averageRating, reviewCount, distance };
    });

    // Apply post-processing filters
    if (needsGeoFilter) {
      processedProperties = processedProperties.filter(
        (p) => p.distance !== undefined && p.distance <= radius!,
      );
    }

    if (needsFloorPostFilter) {
      processedProperties = processedProperties.filter(
        (p) => p.floor !== p.totalFloors,
      );
    }

    if (needsPricePerSqMFilter) {
      processedProperties = queryBuilder.filterByPricePerSqM(processedProperties);
    }

    // Apply in-memory sorting
    if (sortBy === 'rating') {
      processedProperties.sort((a, b) => {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        return sortOrder === 'desc' ? ratingB - ratingA : ratingA - ratingB;
      });
    }

    if (needsGeoFilter) {
      processedProperties.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    // Apply pagination for geo search
    const finalTotal = needsGeoFilter ? processedProperties.length : total;
    if (needsGeoFilter) {
      const start = (page - 1) * limit;
      processedProperties = processedProperties.slice(start, start + limit);
    }

    return {
      items: processedProperties,
      total: finalTotal,
      page,
      limit,
      totalPages: Math.ceil(finalTotal / limit),
    };
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        amenities: true,
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
                id: true,
                photo: true,
                phone: true,
                email: true,
                yearsExperience: true,
                totalDeals: true,
                rating: true,
                reviewCount: true,
                verified: true,
                superAgent: true,
                agency: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                    yearsOnPlatform: true,
                    verified: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Increment view count
    await this.prisma.property.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return property;
  }

  async update(id: string, userId: string, dto: UpdatePropertyDto) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.userId !== userId) {
      throw new ForbiddenException('You can only update your own properties');
    }

    const { images, amenities, ...propertyData } = dto;

    // Track price changes
    if (propertyData.price !== undefined && propertyData.price !== property.price) {
      await this.priceHistoryService.createPriceChange(
        id,
        property.price,
        propertyData.price,
        propertyData.currency || property.currency,
        userId,
      );
    }

    // Track status changes
    // Note: status is not part of UpdatePropertyDto, so this code is commented out
    // Status changes should be handled through a dedicated endpoint if needed
    // if (propertyData.status !== undefined && propertyData.status !== property.status) {
    //   await this.statusHistoryService.recordStatusChange(id, {
    //     oldStatus: property.status,
    //     newStatus: propertyData.status,
    //     changedBy: userId,
    //   });
    // }

    // Update property
    await this.prisma.property.update({
      where: { id },
      data: {
        ...propertyData,
        priceUsd: propertyData.price
          ? (propertyData.currency === Currency.UZS
            ? propertyData.price / EXCHANGE_RATE_UZS_TO_USD
            : propertyData.price)
          : undefined, // Only update priceUsd if price is being updated, logic technically needs to check if currency or price changed, but for now strict update is fine or we fallback to existing
      },
    });

    // Update images if provided
    if (images !== undefined) {
      // Delete old images
      await this.prisma.propertyImage.deleteMany({
        where: { propertyId: id },
      });

      // Create new images
      if (images.length > 0) {
        await this.prisma.propertyImage.createMany({
          data: images.map((url, index) => ({
            propertyId: id,
            url,
            order: index,
            isPrimary: index === 0,
          })),
        });
      }
    }

    // Update amenities if provided
    if (amenities !== undefined) {
      await this.prisma.propertyAmenity.deleteMany({
        where: { propertyId: id },
      });

      if (amenities.length > 0) {
        await this.prisma.propertyAmenity.createMany({
          data: amenities.map((amenity) => ({
            propertyId: id,
            amenity,
          })),
        });
      }
    }

    // Refetch with updated relations
    return this.prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        amenities: true,
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
  }

  async remove(id: string, userId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.userId !== userId) {
      throw new ForbiddenException('You can only delete your own properties');
    }

    // Delete images from R2
    if (property.images.length > 0) {
      const keys = property.images
        .map((img) => this.uploadService.extractKeyFromUrl(img.url))
        .filter((key): key is string => key !== null);

      if (keys.length > 0) {
        await this.uploadService.deleteMultiple(keys);
      }
    }

    await this.prisma.property.delete({ where: { id } });

    return { success: true };
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
        },
      }),
      this.prisma.property.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFeatured(limit = 6) {
    return this.prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        featured: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
      },
    });
  }

  async getRecent(limit = 12) {
    return this.prisma.property.findMany({
      where: { status: 'ACTIVE' },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
      },
    });
  }

  /**
   * Get search suggestions based on partial input
   */
  async getSearchSuggestions(query: string, limitCount = 10) {
    if (!query || query.length < 2) {
      return { cities: [], districts: [], metros: [], mahallas: [] };
    }

    const [cities, districts, metros, mahallas] = await Promise.all([
      // Get unique cities
      this.prisma.property.findMany({
        where: {
          status: 'ACTIVE',
          city: { contains: query, mode: 'insensitive' },
        },
        select: { city: true },
        distinct: ['city'],
        take: limitCount,
      }),
      // Get unique districts
      this.prisma.property.findMany({
        where: {
          status: 'ACTIVE',
          district: { contains: query, mode: 'insensitive' },
        },
        select: { district: true, city: true },
        distinct: ['district'],
        take: limitCount,
      }),
      // Get unique metro stations
      this.prisma.property.findMany({
        where: {
          status: 'ACTIVE',
          nearestMetro: { contains: query, mode: 'insensitive' },
        },
        select: { nearestMetro: true, city: true },
        distinct: ['nearestMetro'],
        take: limitCount,
      }),
      // Get unique mahallas
      this.prisma.property.findMany({
        where: {
          status: 'ACTIVE',
          mahalla: { contains: query, mode: 'insensitive' },
        },
        select: { mahalla: true, district: true, city: true },
        distinct: ['mahalla'],
        take: limitCount,
      }),
    ]);

    return {
      cities: cities.map((c) => c.city),
      districts: districts
        .filter((d) => d.district)
        .map((d) => ({ district: d.district!, city: d.city })),
      metros: metros
        .filter((m) => m.nearestMetro)
        .map((m) => ({ metro: m.nearestMetro!, city: m.city })),
      mahallas: mahallas
        .filter((m) => m.mahalla)
        .map((m) => ({ mahalla: m.mahalla!, district: m.district, city: m.city })),
    };
  }

  /**
   * Get available filter options based on current filters
   */
  async getFilterOptions() {
    const [cities, districts, propertyTypes, buildingClasses, renovations, listingTypes, bedrooms] =
      await Promise.all([
        this.prisma.property.findMany({
          where: { status: 'ACTIVE' },
          select: { city: true },
          distinct: ['city'],
          orderBy: { city: 'asc' },
        }),
        this.prisma.property.findMany({
          where: { status: 'ACTIVE', district: { not: null } },
          select: { district: true, city: true },
          distinct: ['district', 'city'],
        }),
        this.prisma.property.groupBy({
          by: ['propertyType'],
          where: { status: 'ACTIVE' },
          _count: true,
        }),
        this.prisma.property.groupBy({
          by: ['buildingClass'],
          where: { status: 'ACTIVE', buildingClass: { not: null } },
          _count: true,
        }),
        this.prisma.property.groupBy({
          by: ['renovation'],
          where: { status: 'ACTIVE', renovation: { not: null } },
          _count: true,
        }),
        this.prisma.property.groupBy({
          by: ['listingType'],
          where: { status: 'ACTIVE' },
          _count: true,
        }),
        this.prisma.property.groupBy({
          by: ['bedrooms'],
          where: { status: 'ACTIVE', bedrooms: { not: null } },
          _count: true,
        }),
      ]);

    return {
      cities: cities.map((c) => c.city),
      districts: districts.reduce(
        (acc, d) => {
          if (d.district) {
            if (!acc[d.city]) acc[d.city] = [];
            acc[d.city].push(d.district);
          }
          return acc;
        },
        {} as Record<string, string[]>,
      ),
      propertyTypes: propertyTypes.map((p) => ({
        type: p.propertyType,
        count: p._count,
      })),
      buildingClasses: buildingClasses.map((b) => ({
        class: b.buildingClass,
        count: b._count,
      })),
      renovations: renovations.map((r) => ({
        type: r.renovation,
        count: r._count,
      })),
      listingTypes: listingTypes.map((l) => ({
        type: l.listingType,
        count: l._count,
      })),
      bedrooms: bedrooms.map((b) => ({
        count: b.bedrooms,
        total: b._count,
      })),
    };
  }
}
