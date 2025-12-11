import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreateSavedSearchDto, UpdateSavedSearchDto } from '@repo/shared';
import { SavedSearch } from '@repo/database';

@Injectable()
export class SavedSearchesService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreateSavedSearchDto,
  ): Promise<SavedSearch> {
    const savedSearch = await this.prisma.savedSearch.create({
      data: {
        userId,
        name: dto.name,
        filters: dto.filters as any,
        notificationsEnabled: dto.notificationsEnabled,
      },
    });

    return savedSearch;
  }

  async findAllByUser(userId: string): Promise<SavedSearch[]> {
    const savedSearches = await this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return savedSearches;
  }

  async findOne(id: string, userId: string): Promise<SavedSearch> {
    const savedSearch = await this.prisma.savedSearch.findUnique({
      where: { id },
    });

    if (!savedSearch) {
      throw new NotFoundException('Saved search not found');
    }

    if (savedSearch.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this saved search',
      );
    }

    return savedSearch;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateSavedSearchDto,
  ): Promise<SavedSearch> {
    // Verify ownership
    await this.findOne(id, userId);

    const updatedSearch = await this.prisma.savedSearch.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.filters && { filters: dto.filters as any }),
        ...(dto.notificationsEnabled !== undefined && {
          notificationsEnabled: dto.notificationsEnabled,
        }),
      },
    });

    return updatedSearch;
  }

  async delete(id: string, userId: string): Promise<{ message: string }> {
    // Verify ownership
    await this.findOne(id, userId);

    await this.prisma.savedSearch.delete({
      where: { id },
    });

    return { message: 'Saved search deleted successfully' };
  }

  async toggleNotifications(
    id: string,
    userId: string,
    enabled: boolean,
  ): Promise<SavedSearch> {
    // Verify ownership
    await this.findOne(id, userId);

    const updatedSearch = await this.prisma.savedSearch.update({
      where: { id },
      data: { notificationsEnabled: enabled },
    });

    return updatedSearch;
  }

  // Get count of saved searches for a user (useful for limiting)
  async getCount(userId: string): Promise<number> {
    return this.prisma.savedSearch.count({
      where: { userId },
    });
  }
}
