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
    // Get user's recent views
    const recentViews = await this.prisma.recentlyViewed.findMany({
      where: { userId },
      take: 20,
      orderBy: { viewedAt: 'desc' },
      include: {
        property: {
          select: {
            propertyType: true,
            city: true,
            district: true,
            priceUsd: true,
            listingType: true,
          },
        },
      },
    });

    // Get user's favorites
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: {
            propertyType: true,
            city: true,
            district: true,
            priceUsd: true,
            listingType: true,
          },
        },
      },
    });

    if (recentViews.length === 0 && favorites.length === 0) {
      // Return popular/recent properties if no history
      return this.prisma.property.findMany({
        where: { status: 'ACTIVE' },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
        take: limit,
        orderBy: [
          { createdAt: 'desc' },
        ],
      });
    }

    // Analyze preferences
    const allProperties = [
      ...recentViews.map((v) => v.property),
      ...favorites.map((f) => f.property),
    ];

    const preferences = {
      propertyTypes: this.getMostCommon(allProperties.map((p) => p.propertyType)),
      cities: this.getMostCommon(allProperties.map((p) => p.city)),
      listingTypes: this.getMostCommon(allProperties.map((p) => p.listingType)),
      avgPrice: this.getAverage(allProperties.map((p) => p.priceUsd)),
    };

    // Get excluded IDs (already viewed/favorited)
    const excludedIds = [
      ...recentViews.map((v) => v.propertyId),
      ...favorites.map((f) => f.propertyId),
    ];

    // Find similar properties
    const recommendations = await this.prisma.property.findMany({
      where: {
        id: { notIn: excludedIds },
        status: 'ACTIVE',
        OR: [
          { propertyType: { in: preferences.propertyTypes } },
          { city: { in: preferences.cities } },
        ],
        priceUsd: {
          gte: preferences.avgPrice * 0.5,
          lte: preferences.avgPrice * 1.5,
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
      take: limit,
      orderBy: [
        { createdAt: 'desc' },
      ],
    });

    return recommendations;
  }

  private getMostCommon<T>(arr: T[]): T[] {
    const counts = new Map<T, number>();
    arr.forEach((item) => {
      counts.set(item, (counts.get(item) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([item]) => item);
  }

  private getAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }
}
