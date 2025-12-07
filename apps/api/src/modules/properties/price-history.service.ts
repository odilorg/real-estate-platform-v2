import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PriceHistoryService {
  constructor(private prisma: PrismaService) {}

  async getPriceHistory(propertyId: string) {
    const priceHistory = await this.prisma.priceHistory.findMany({
      where: {
        propertyId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        oldPrice: true,
        newPrice: true,
        currency: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return priceHistory;
  }

  async createPriceChange(
    propertyId: string,
    oldPrice: number,
    newPrice: number,
    currency: 'YE' | 'UZS',
    changedBy?: string,
  ) {
    return await this.prisma.priceHistory.create({
      data: {
        propertyId,
        oldPrice,
        newPrice,
        currency,
        changedBy,
      },
    });
  }

  async getLatestPrice(propertyId: string) {
    const latestChange = await this.prisma.priceHistory.findFirst({
      where: {
        propertyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return latestChange?.newPrice;
  }

  async getPriceStats(propertyId: string) {
    const history = await this.prisma.priceHistory.findMany({
      where: {
        propertyId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (history.length === 0) {
      return null;
    }

    const prices = history.map((h) => h.newPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const firstPrice = history[0].oldPrice;
    const currentPrice = history[history.length - 1].newPrice;
    const priceChange = currentPrice - firstPrice;
    const priceChangePercent = ((priceChange / firstPrice) * 100).toFixed(2);

    return {
      minPrice,
      maxPrice,
      firstPrice,
      currentPrice,
      priceChange,
      priceChangePercent: parseFloat(priceChangePercent),
      totalChanges: history.length,
    };
  }
}
