import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';

@Injectable()
export class RecommendationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get similar properties based on current property
   * Uses: same city, similar price range, same property type, similar area
   */
  async getSimilarProperties(propertyId: string, limit: number = 6) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
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

    if (!property) {
      return [];
    }

    // Calculate price range (±20%)
    const priceMin = property.priceUsd ? property.priceUsd * 0.8 : undefined;
    const priceMax = property.priceUsd ? property.priceUsd * 1.2 : undefined;

    // Calculate area range (±20%)
    const areaMin = property.area ? property.area * 0.8 : undefined;
    const areaMax = property.area ? property.area * 1.2 : undefined;

    const similar = await this.prisma.property.findMany({
      where: {
        id: { not: propertyId },
        status: 'ACTIVE',
        propertyType: property.propertyType,
        listingType: property.listingType,
        city: property.city,
        priceUsd: {
          gte: priceMin,
          lte: priceMax,
        },
        ...(areaMin && areaMax
          ? {
              area: {
                gte: areaMin,
                lte: areaMax,
              },
            }
          : {}),
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
      take: limit,
      orderBy: [
        // Prioritize same district
        { district: property.district ? 'asc' : 'desc' },
        // Then by creation date
        { createdAt: 'desc' },
      ],
    });

    return similar;
  }

  /**
   * Get personalized recommendations based on user's viewing history and favorites
   */
  async getPersonalizedRecommendations(userId: string, limit: number = 10) {
    // TODO: Implement personalized recommendations
    // Currently returning popular properties as RecentlyViewed model needs property relation added

    // Get user's favorites as a simple preference indicator
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      take: 5,
      select: { propertyId: true },
    });

    // Return popular/recent properties
    return this.prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        ...(favorites.length > 0 && {
          id: { notIn: favorites.map(f => f.propertyId) }
        })
      },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      take: limit,
      orderBy: [
        { views: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }
}
