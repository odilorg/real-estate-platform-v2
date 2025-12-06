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
      city,
      propertyType,
      listingType,
      status,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      bedrooms,
      buildingClass,
      renovation,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.PropertyWhereInput = {
      status: status || 'ACTIVE',
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(propertyType && { propertyType }),
      ...(listingType && { listingType }),
      ...(minPrice && { price: { gte: minPrice } }),
      ...(maxPrice && { price: { lte: maxPrice } }),
      ...(minArea && { area: { gte: minArea } }),
      ...(maxArea && { area: { lte: maxArea } }),
      ...(bedrooms && { bedrooms }),
      ...(buildingClass && { buildingClass }),
      ...(renovation && { renovation }),
    };

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    // Calculate average rating for each property
    const items = properties.map((property) => {
      const { reviews, ...rest } = property;
      const reviewCount = reviews.length;
      const averageRating =
        reviewCount > 0
          ? Math.round(
              (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10,
            ) / 10
          : null;
      return { ...rest, averageRating, reviewCount };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
}
