import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { PropertyStatus, PropertyStatusHistory } from '@repo/database';

export interface StatusChangeDto {
  oldStatus?: PropertyStatus;
  newStatus: PropertyStatus;
  changedBy?: string;
  reason?: string;
  notes?: string;
}

@Injectable()
export class StatusHistoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Record a property status change
   */
  async recordStatusChange(
    propertyId: string,
    dto: StatusChangeDto,
  ): Promise<PropertyStatusHistory> {
    return this.prisma.propertyStatusHistory.create({
      data: {
        propertyId,
        oldStatus: dto.oldStatus || null,
        newStatus: dto.newStatus,
        changedBy: dto.changedBy || null,
        reason: dto.reason || null,
        notes: dto.notes || null,
      },
    });
  }

  /**
   * Get status history for a property
   */
  async getPropertyStatusHistory(
    propertyId: string,
  ): Promise<PropertyStatusHistory[]> {
    return this.prisma.propertyStatusHistory.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      include: {
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

  /**
   * Get latest status change for a property
   */
  async getLatestStatusChange(
    propertyId: string,
  ): Promise<PropertyStatusHistory | null> {
    return this.prisma.propertyStatusHistory.findFirst({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Get timeline of all events for a property
   * Includes status changes and price changes
   */
  async getPropertyTimeline(propertyId: string) {
    const [statusHistory, priceHistory, property] = await Promise.all([
      this.prisma.propertyStatusHistory.findMany({
        where: { propertyId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.priceHistory.findMany({
        where: { propertyId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    // Combine and sort all events
    const timeline = [
      // Property created event
      {
        type: 'created',
        date: property?.createdAt,
        data: null,
      },
      // Status changes
      ...statusHistory.map((event) => ({
        type: 'status_change',
        date: event.createdAt,
        data: {
          id: event.id,
          oldStatus: event.oldStatus,
          newStatus: event.newStatus,
          reason: event.reason,
          notes: event.notes,
          changedBy: event.user,
        },
      })),
      // Price changes
      ...priceHistory.map((event) => ({
        type: 'price_change',
        date: event.createdAt,
        data: {
          id: event.id,
          oldPrice: event.oldPrice,
          newPrice: event.newPrice,
          currency: event.currency,
          changedBy: event.user,
        },
      })),
    ].sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return b.date.getTime() - a.date.getTime();
    });

    return timeline;
  }

  /**
   * Get status statistics for a property
   */
  async getStatusStats(propertyId: string) {
    const history = await this.prisma.propertyStatusHistory.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'asc' },
    });

    if (history.length === 0) {
      return null;
    }

    const firstChange = history[0];
    const lastChange = history[history.length - 1];

    // Calculate time in each status
    const statusDurations: Record<string, number> = {};
    let currentStatus = firstChange.newStatus;
    let statusStartTime = firstChange.createdAt.getTime();

    for (let i = 1; i < history.length; i++) {
      const nextChange = history[i];
      const duration = nextChange.createdAt.getTime() - statusStartTime;

      if (!statusDurations[currentStatus]) {
        statusDurations[currentStatus] = 0;
      }
      statusDurations[currentStatus] += duration;

      currentStatus = nextChange.newStatus;
      statusStartTime = nextChange.createdAt.getTime();
    }

    // Add current status duration
    const now = Date.now();
    const currentDuration = now - statusStartTime;
    if (!statusDurations[currentStatus]) {
      statusDurations[currentStatus] = 0;
    }
    statusDurations[currentStatus] += currentDuration;

    // Convert to days
    const statusDaysCount: Record<string, number> = {};
    Object.entries(statusDurations).forEach(([status, ms]) => {
      statusDaysCount[status] = Math.floor(ms / (1000 * 60 * 60 * 24));
    });

    return {
      totalChanges: history.length,
      firstStatus: firstChange.oldStatus || firstChange.newStatus,
      currentStatus: lastChange.newStatus,
      firstChangeDate: firstChange.createdAt,
      lastChangeDate: lastChange.createdAt,
      statusDaysCount,
    };
  }
}
