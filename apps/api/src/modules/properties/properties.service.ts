import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreatePropertyDto, UpdatePropertyDto, PropertyFilterDto } from '@repo/shared';
import { UploadService } from '../upload/upload.service';
import { Prisma } from '@repo/database';

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
  ) {}

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

    return property;
  }

  async findAll(filters: PropertyFilterDto): Promise<PaginatedResult<any>> {
    const {
      // Full-text search
      search,
      // Location
      city,
      district,
      nearestMetro,
      // Geo-location
      latitude,
      longitude,
      radius,
      // Property type
      propertyType,
      listingType,
      status,
      // Price
      minPrice,
      maxPrice,
      // Area
      minArea,
      maxArea,
      // Rooms
      bedrooms,
      minBedrooms,
      maxBedrooms,
      rooms,
      minRooms,
      maxRooms,
      // Floor
      floor,
      minFloor,
      maxFloor,
      notFirstFloor,
      notLastFloor,
      // Building
      buildingClass,
      buildingType,
      renovation,
      parkingType,
      // Year
      minYearBuilt,
      maxYearBuilt,
      // Amenities
      amenities,
      // Boolean features
      hasBalcony,
      hasConcierge,
      hasGatedArea,
      // Listing options
      featured,
      verified,
      // Pagination
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    // Build the where clause
    const where: Prisma.PropertyWhereInput = {
      status: status || 'ACTIVE',
    };

    // Full-text search on title, description, address, city, district
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
        { nearestMetro: { contains: search, mode: 'insensitive' } },
        { buildingName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Location filters
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }
    if (district) {
      where.district = { contains: district, mode: 'insensitive' };
    }
    if (nearestMetro) {
      where.nearestMetro = { contains: nearestMetro, mode: 'insensitive' };
    }

    // Property type filters
    if (propertyType) {
      where.propertyType = propertyType;
    }
    if (listingType) {
      where.listingType = listingType;
    }

    // Price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    // Area range
    if (minArea || maxArea) {
      where.area = {};
      if (minArea) where.area.gte = minArea;
      if (maxArea) where.area.lte = maxArea;
    }

    // Bedrooms
    if (bedrooms !== undefined) {
      where.bedrooms = bedrooms;
    } else if (minBedrooms !== undefined || maxBedrooms !== undefined) {
      where.bedrooms = {};
      if (minBedrooms !== undefined) where.bedrooms.gte = minBedrooms;
      if (maxBedrooms !== undefined) where.bedrooms.lte = maxBedrooms;
    }

    // Rooms
    if (rooms !== undefined) {
      where.rooms = rooms;
    } else if (minRooms !== undefined || maxRooms !== undefined) {
      where.rooms = {};
      if (minRooms !== undefined) where.rooms.gte = minRooms;
      if (maxRooms !== undefined) where.rooms.lte = maxRooms;
    }

    // Floor
    if (floor !== undefined) {
      where.floor = floor;
    } else if (minFloor !== undefined || maxFloor !== undefined) {
      where.floor = {};
      if (minFloor !== undefined) where.floor.gte = minFloor;
      if (maxFloor !== undefined) where.floor.lte = maxFloor;
    }
    if (notFirstFloor) {
      where.floor = { ...((where.floor as object) || {}), gt: 1 };
    }
    if (notLastFloor) {
      // This requires comparing floor to totalFloors, handled in post-filter
    }

    // Building filters
    if (buildingClass) {
      where.buildingClass = buildingClass;
    }
    if (buildingType) {
      where.buildingType = buildingType;
    }
    if (renovation) {
      where.renovation = renovation;
    }
    if (parkingType) {
      where.parkingType = parkingType;
    }

    // Year built range
    if (minYearBuilt || maxYearBuilt) {
      where.yearBuilt = {};
      if (minYearBuilt) where.yearBuilt.gte = minYearBuilt;
      if (maxYearBuilt) where.yearBuilt.lte = maxYearBuilt;
    }

    // Amenities filter
    if (amenities && amenities.length > 0) {
      where.amenities = {
        some: {
          amenity: { in: amenities },
        },
      };
    }

    // Boolean features
    if (hasBalcony) {
      where.balcony = { gt: 0 };
    }
    if (hasConcierge) {
      where.hasConcierge = true;
    }
    if (hasGatedArea) {
      where.hasGatedArea = true;
    }

    // Listing options
    if (featured !== undefined) {
      where.featured = featured;
    }
    if (verified !== undefined) {
      where.verified = verified;
    }

    // For geo-location search, we need to fetch more and filter
    const needsGeoFilter = latitude !== undefined && longitude !== undefined && radius !== undefined;
    const fetchLimit = needsGeoFilter ? limit * 10 : limit; // Fetch more for geo filtering

    // Determine order by
    let orderBy: Prisma.PropertyOrderByWithRelationInput = { [sortBy]: sortOrder };

    // For rating sort, we need to handle differently
    if (sortBy === 'rating') {
      // We'll sort in memory after fetching
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
            },
          },
          reviews: {
            where: { approved: true },
            select: { rating: true },
          },
          amenities: amenities && amenities.length > 0 ? true : false,
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    // Process results
    let processedProperties = properties.map((property) => {
      const { reviews, amenities: propAmenities, ...rest } = property;
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

    // Apply geo filter
    if (needsGeoFilter) {
      processedProperties = processedProperties.filter(
        (p) => p.distance !== undefined && p.distance <= radius!,
      );
    }

    // Apply notLastFloor filter
    if (notLastFloor) {
      processedProperties = processedProperties.filter(
        (p) => p.floor !== p.totalFloors,
      );
    }

    // Sort by rating if needed
    if (sortBy === 'rating') {
      processedProperties.sort((a, b) => {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        return sortOrder === 'desc' ? ratingB - ratingA : ratingA - ratingB;
      });
    }

    // Sort by distance if geo search
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

    // Update property
    await this.prisma.property.update({
      where: { id },
      data: propertyData,
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
      return { cities: [], districts: [], metros: [] };
    }

    const [cities, districts, metros] = await Promise.all([
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
    ]);

    return {
      cities: cities.map((c) => c.city),
      districts: districts
        .filter((d) => d.district)
        .map((d) => ({ district: d.district!, city: d.city })),
      metros: metros
        .filter((m) => m.nearestMetro)
        .map((m) => ({ metro: m.nearestMetro!, city: m.city })),
    };
  }

  /**
   * Get available filter options based on current filters
   */
  async getFilterOptions() {
    const [cities, districts, propertyTypes, buildingClasses, renovations] =
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
    };
  }
}
