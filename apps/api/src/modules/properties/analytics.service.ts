import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';

export interface PropertyAnalyticsSummary {
  totalViews: number;
  totalFavorites: number;
  totalContacts: number;
  viewsToday: number;
  favoritesToday: number;
  contactsToday: number;
  viewsTrend: number; // percentage change from previous period
  favoritesTrend: number;
  contactsTrend: number;
  dailyStats: {
    date: string;
    views: number;
    favorites: number;
    contacts: number;
  }[];
}

export interface PropertyPerformance {
  propertyId: string;
  title: string;
  totalViews: number;
  totalFavorites: number;
  totalContacts: number;
  avgViewsPerDay: number;
  lastViewedAt: Date | null;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Track a property view
   */
  async trackView(
    propertyId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    referrer?: string,
  ): Promise<void> {
    // Create individual view record
    await this.prisma.propertyView.create({
      data: {
        propertyId,
        userId,
        ipAddress,
        userAgent,
        referrer,
      },
    });

    // Update daily analytics
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
        views: 1,
      },
      update: {
        views: {
          increment: 1,
        },
      },
    });

    // Update property view count
    await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        views: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Track a contact/inquiry
   */
  async trackContact(propertyId: string): Promise<void> {
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
        contacts: 1,
      },
      update: {
        contacts: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Get analytics summary for a specific property
   */
  async getPropertyAnalytics(
    propertyId: string,
    days: number = 30,
  ): Promise<PropertyAnalyticsSummary> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const analytics = await this.prisma.propertyAnalytics.findMany({
      where: {
        propertyId,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
    const totalFavorites = analytics.reduce(
      (sum, a) => sum + a.favorites - a.unfavorites,
      0,
    );
    const totalContacts = analytics.reduce((sum, a) => sum + a.contacts, 0);

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStats = analytics.find(
      (a) => a.date.getTime() === today.getTime(),
    );

    const viewsToday = todayStats?.views || 0;
    const favoritesToday = todayStats
      ? todayStats.favorites - todayStats.unfavorites
      : 0;
    const contactsToday = todayStats?.contacts || 0;

    // Calculate trends (compare last 7 days vs previous 7 days)
    const last7Days = analytics.slice(-7);
    const previous7Days = analytics.slice(-14, -7);

    const last7ViewsTotal = last7Days.reduce((sum, a) => sum + a.views, 0);
    const previous7ViewsTotal = previous7Days.reduce(
      (sum, a) => sum + a.views,
      0,
    );

    const viewsTrend =
      previous7ViewsTotal > 0
        ? ((last7ViewsTotal - previous7ViewsTotal) / previous7ViewsTotal) * 100
        : 0;

    const last7FavoritesTotal = last7Days.reduce(
      (sum, a) => sum + a.favorites - a.unfavorites,
      0,
    );
    const previous7FavoritesTotal = previous7Days.reduce(
      (sum, a) => sum + a.favorites - a.unfavorites,
      0,
    );

    const favoritesTrend =
      previous7FavoritesTotal > 0
        ? ((last7FavoritesTotal - previous7FavoritesTotal) /
            previous7FavoritesTotal) *
          100
        : 0;

    const last7ContactsTotal = last7Days.reduce(
      (sum, a) => sum + a.contacts,
      0,
    );
    const previous7ContactsTotal = previous7Days.reduce(
      (sum, a) => sum + a.contacts,
      0,
    );

    const contactsTrend =
      previous7ContactsTotal > 0
        ? ((last7ContactsTotal - previous7ContactsTotal) /
            previous7ContactsTotal) *
          100
        : 0;

    return {
      totalViews,
      totalFavorites,
      totalContacts,
      viewsToday,
      favoritesToday,
      contactsToday,
      viewsTrend: Math.round(viewsTrend * 10) / 10,
      favoritesTrend: Math.round(favoritesTrend * 10) / 10,
      contactsTrend: Math.round(contactsTrend * 10) / 10,
      dailyStats: analytics.map((a) => ({
        date: a.date.toISOString().split('T')[0],
        views: a.views,
        favorites: a.favorites - a.unfavorites,
        contacts: a.contacts,
      })),
    };
  }

  /**
   * Get analytics summary for all user's properties
   */
  async getUserPropertiesAnalytics(
    userId: string,
    days: number = 30,
  ): Promise<{
    totalViews: number;
    totalFavorites: number;
    totalContacts: number;
    propertyPerformance: PropertyPerformance[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get user's properties
    const properties = await this.prisma.property.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });

    const propertyIds = properties.map((p) => p.id);

    // Get analytics for all properties
    const analytics = await this.prisma.propertyAnalytics.findMany({
      where: {
        propertyId: {
          in: propertyIds,
        },
        date: {
          gte: startDate,
        },
      },
    });

    // Get last view for each property
    const lastViews = await this.prisma.propertyView.groupBy({
      by: ['propertyId'],
      where: {
        propertyId: {
          in: propertyIds,
        },
      },
      _max: {
        createdAt: true,
      },
    });

    const lastViewsMap = new Map(
      lastViews.map((v) => [v.propertyId, v._max.createdAt]),
    );

    // Calculate totals
    const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
    const totalFavorites = analytics.reduce(
      (sum, a) => sum + a.favorites - a.unfavorites,
      0,
    );
    const totalContacts = analytics.reduce((sum, a) => sum + a.contacts, 0);

    // Calculate per-property performance
    const propertyPerformance: PropertyPerformance[] = properties.map((prop) => {
      const propAnalytics = analytics.filter(
        (a) => a.propertyId === prop.id,
      );
      const views = propAnalytics.reduce((sum, a) => sum + a.views, 0);
      const favorites = propAnalytics.reduce(
        (sum, a) => sum + a.favorites - a.unfavorites,
        0,
      );
      const contacts = propAnalytics.reduce((sum, a) => sum + a.contacts, 0);

      const daysSinceCreation = Math.max(
        1,
        Math.floor(
          (Date.now() - prop.createdAt.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );

      return {
        propertyId: prop.id,
        title: prop.title,
        totalViews: views,
        totalFavorites: favorites,
        totalContacts: contacts,
        avgViewsPerDay: Math.round((views / daysSinceCreation) * 10) / 10,
        lastViewedAt: lastViewsMap.get(prop.id) || null,
      };
    });

    // Sort by total views descending
    propertyPerformance.sort((a, b) => b.totalViews - a.totalViews);

    return {
      totalViews,
      totalFavorites,
      totalContacts,
      propertyPerformance,
    };
  }
}
