import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async getUserFavorites(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        include: {
          property: {
            include: {
              images: {
                orderBy: { order: 'asc' },
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
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      items: favorites.map((fav) => ({
        id: fav.id,
        createdAt: fav.createdAt,
        property: fav.property,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async addFavorite(userId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    const favorite = await this.prisma.favorite.create({
      data: {
        userId,
        propertyId,
      },
    });

    // Track favorite addition in analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.propertyAnalytics.upsert({
      where: {
        propertyId_date: {
          propertyId,
          date: today,
        },
      },
      create: {
        propertyId,
        date: today,
        favorites: 1,
      },
      update: {
        favorites: {
          increment: 1,
        },
      },
    });

    return favorite;
  }

  async removeFavorite(userId: string, propertyId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.favorite.delete({
      where: { id: favorite.id },
    });

    // Track favorite removal in analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.propertyAnalytics.upsert({
      where: {
        propertyId_date: {
          propertyId,
          date: today,
        },
      },
      create: {
        propertyId,
        date: today,
        unfavorites: 1,
      },
      update: {
        unfavorites: {
          increment: 1,
        },
      },
    });

    return { success: true };
  }

  async checkFavorite(userId: string, propertyId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });

    return { isFavorite: !!favorite };
  }

  async getFavoriteIds(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      select: { propertyId: true },
    });

    return favorites.map((f) => f.propertyId);
  }
}
