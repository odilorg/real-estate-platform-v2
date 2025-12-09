import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma';
import { EmailService } from '../email/email.service';
import { PropertiesService } from '../properties/properties.service';
import { PropertyFilterDto } from '@repo/shared';

@Injectable()
export class SavedSearchNotificationsService {
  private readonly logger = new Logger(SavedSearchNotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private propertiesService: PropertiesService,
  ) {}

  /**
   * Check for new properties matching saved searches
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkSavedSearches() {
    this.logger.log('Starting saved search notifications check...');

    try {
      // Get all saved searches with notifications enabled
      const savedSearches = await this.prisma.savedSearch.findMany({
        where: {
          notificationsEnabled: true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      this.logger.log(`Found ${savedSearches.length} saved searches with notifications enabled`);

      for (const savedSearch of savedSearches) {
        try {
          await this.processSearch(savedSearch);
        } catch (error) {
          this.logger.error(
            `Error processing saved search ${savedSearch.id}:`,
            error,
          );
        }
      }

      this.logger.log('Saved search notifications check completed');
    } catch (error) {
      this.logger.error('Error in saved search notifications cron:', error);
    }
  }

  private async processSearch(savedSearch: any) {
    const lastChecked = savedSearch.lastNotifiedAt || savedSearch.createdAt;

    // Find properties created since last check
    const filters = {
      ...(savedSearch.filters as any),
      // Only get properties created after last notification
      createdAfter: lastChecked,
    };

    // Parse filters using PropertyFilterDto
    const parsedFilters = PropertyFilterDto.parse(filters);

    // Get matching properties
    const result = await this.propertiesService.findAll(parsedFilters);

    if (!result || !result.items || result.items.length === 0) {
      // No new matches, just update timestamp
      await this.prisma.savedSearch.update({
        where: { id: savedSearch.id },
        data: { lastNotifiedAt: new Date() },
      });
      return;
    }

    // Prepare properties for email
    const properties = result.items.slice(0, 10).map((prop: any) => ({
      id: prop.id,
      title: prop.title,
      price: prop.price,
      city: prop.city,
    }));

    // Send email notification
    const userName = savedSearch.user.firstName || 'User';
    const emailSent = await this.emailService.sendPropertyMatchNotification(
      savedSearch.user.email,
      userName,
      savedSearch.name,
      properties,
    );

    if (emailSent) {
      // Update last notified timestamp
      await this.prisma.savedSearch.update({
        where: { id: savedSearch.id },
        data: { lastNotifiedAt: new Date() },
      });

      this.logger.log(
        `Sent notification for saved search "${savedSearch.name}" to ${savedSearch.user.email} with ${properties.length} properties`,
      );
    }
  }

  /**
   * Send immediate notification for a specific saved search
   * Used when user creates a new saved search and wants to see current matches
   */
  async sendImmediateNotification(savedSearchId: string) {
    const savedSearch = await this.prisma.savedSearch.findUnique({
      where: { id: savedSearchId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!savedSearch || !savedSearch.notificationsEnabled) {
      return;
    }

    await this.processSearch(savedSearch);
  }

  /**
   * Test notification endpoint - sends sample notification
   */
  async sendTestNotification(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Send test notification with sample properties
    const testProperties = [
      {
        id: 'test-1',
        title: 'Тестовая квартира в центре города',
        price: 150000,
        city: 'Ташкент',
      },
      {
        id: 'test-2',
        title: 'Современный дом в пригороде',
        price: 250000,
        city: 'Ташкент',
      },
    ];

    await this.emailService.sendPropertyMatchNotification(
      user.email,
      user.firstName || 'User',
      'Тестовый поиск',
      testProperties,
    );

    this.logger.log(`Sent test notification to ${user.email}`);
  }
}
