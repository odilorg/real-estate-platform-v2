import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SavedSearchesService } from './saved-searches.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  mockPrismaService,
  resetMocks,
  TestFactories,
} from '../../test/test-utils';
import { PropertyType, ListingType, Currency } from '@repo/shared';

describe('SavedSearchesService', () => {
  let service: SavedSearchesService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    resetMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavedSearchesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SavedSearchesService>(SavedSearchesService);
    prisma = mockPrismaService;
  });

  describe('create', () => {
    const userId = 'user-123';

    it('should create a saved search successfully', async () => {
      const createDto = {
        name: 'My Tashkent Apartments Search',
        filters: {
          city: 'Ташкент',
          propertyType: PropertyType.APARTMENT,
          listingType: ListingType.SALE,
          minPrice: 50000,
          maxPrice: 150000,
          currency: Currency.YE,
          bedrooms: 2,
        },
        notificationsEnabled: true,
      };

      const mockSavedSearch = {
        id: 'search-123',
        userId,
        name: createDto.name,
        filters: createDto.filters,
        notificationsEnabled: createDto.notificationsEnabled,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.savedSearch.create.mockResolvedValue(mockSavedSearch as any);

      const result = await service.create(userId, createDto);

      expect(result).toEqual(mockSavedSearch);
      expect(prisma.savedSearch.create).toHaveBeenCalledWith({
        data: {
          userId,
          name: createDto.name,
          filters: createDto.filters,
          notificationsEnabled: createDto.notificationsEnabled,
        },
      });
    });

    it('should create saved search with notifications disabled by default', async () => {
      const createDto = {
        name: 'Test Search',
        filters: { city: 'Ташкент' },
        notificationsEnabled: false,
      };

      const mockSavedSearch = {
        id: 'search-123',
        userId,
        name: createDto.name,
        filters: createDto.filters,
        notificationsEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.savedSearch.create.mockResolvedValue(mockSavedSearch as any);

      const result = await service.create(userId, createDto);

      expect(result.notificationsEnabled).toBe(false);
    });

    it('should create saved search with complex filters', async () => {
      const createDto = {
        name: 'Complex Search',
        filters: {
          city: 'Ташкент',
          district: 'Мирабадский',
          propertyType: PropertyType.HOUSE,
          listingType: ListingType.RENT_LONG,
          minPrice: 1000,
          maxPrice: 5000,
          currency: Currency.YE,
          minArea: 100,
          maxArea: 300,
          bedrooms: 3,
          bathrooms: 2,
          amenities: ['AIR_CONDITIONING', 'PARKING'],
        },
        notificationsEnabled: true,
      };

      prisma.savedSearch.create.mockResolvedValue({ id: 'search-123' } as any);

      await service.create(userId, createDto);

      expect(prisma.savedSearch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            filters: createDto.filters,
          }),
        }),
      );
    });
  });

  describe('findAllByUser', () => {
    const userId = 'user-123';

    it('should return all saved searches for a user', async () => {
      const mockSavedSearches = Array.from({ length: 3 }, (_, i) => ({
        id: `search-${i}`,
        userId,
        name: `Search ${i}`,
        filters: { city: 'Ташкент' },
        notificationsEnabled: i % 2 === 0,
        createdAt: new Date(Date.now() - i * 1000),
        updatedAt: new Date(),
      }));

      prisma.savedSearch.findMany.mockResolvedValue(mockSavedSearches as any);

      const result = await service.findAllByUser(userId);

      expect(result).toEqual(mockSavedSearches);
      expect(prisma.savedSearch.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array if user has no saved searches', async () => {
      prisma.savedSearch.findMany.mockResolvedValue([]);

      const result = await service.findAllByUser(userId);

      expect(result).toEqual([]);
    });

    it('should order saved searches by creation date descending', async () => {
      const now = Date.now();
      const mockSavedSearches = [
        {
          id: 'search-1',
          userId,
          createdAt: new Date(now),
        },
        {
          id: 'search-2',
          userId,
          createdAt: new Date(now - 1000),
        },
      ];

      prisma.savedSearch.findMany.mockResolvedValue(mockSavedSearches as any);

      await service.findAllByUser(userId);

      expect(prisma.savedSearch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    const searchId = 'search-123';
    const userId = 'user-123';

    it('should return a saved search by ID', async () => {
      const mockSavedSearch = TestFactories.createSavedSearch({
        id: searchId,
        userId,
      });

      prisma.savedSearch.findUnique.mockResolvedValue(mockSavedSearch as any);

      const result = await service.findOne(searchId, userId);

      expect(result).toEqual(mockSavedSearch);
      expect(prisma.savedSearch.findUnique).toHaveBeenCalledWith({
        where: { id: searchId },
      });
    });

    it('should throw NotFoundException if saved search does not exist', async () => {
      prisma.savedSearch.findUnique.mockResolvedValue(null);

      await expect(service.findOne(searchId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own the saved search', async () => {
      const mockSavedSearch = TestFactories.createSavedSearch({
        id: searchId,
        userId: 'different-user',
      });

      prisma.savedSearch.findUnique.mockResolvedValue(mockSavedSearch as any);

      await expect(service.findOne(searchId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    const searchId = 'search-123';
    const userId = 'user-123';

    it('should update saved search name', async () => {
      const mockSavedSearch = TestFactories.createSavedSearch({
        id: searchId,
        userId,
      });
      const updateDto = {
        name: 'Updated Search Name',
      };
      const updatedSearch = {
        ...mockSavedSearch,
        name: updateDto.name,
      };

      prisma.savedSearch.findUnique.mockResolvedValue(mockSavedSearch as any);
      prisma.savedSearch.update.mockResolvedValue(updatedSearch as any);

      const result = await service.update(searchId, userId, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(prisma.savedSearch.update).toHaveBeenCalledWith({
        where: { id: searchId },
        data: expect.objectContaining({
          name: updateDto.name,
        }),
      });
    });

    it('should update saved search filters', async () => {
      const mockSavedSearch = TestFactories.createSavedSearch({
        id: searchId,
        userId,
      });
      const updateDto = {
        filters: {
          city: 'Бухара',
          minPrice: 75000,
          maxPrice: 200000,
        },
      };

      prisma.savedSearch.findUnique.mockResolvedValue(mockSavedSearch as any);
      prisma.savedSearch.update.mockResolvedValue({
        ...mockSavedSearch,
        filters: updateDto.filters,
      } as any);

      await service.update(searchId, userId, updateDto);

      expect(prisma.savedSearch.update).toHaveBeenCalledWith({
        where: { id: searchId },
        data: expect.objectContaining({
          filters: updateDto.filters,
        }),
      });
    });

    it('should update notification settings', async () => {
      const mockSavedSearch = TestFactories.createSavedSearch({
        id: searchId,
        userId,
        notificationsEnabled: false,
      });
      const updateDto = {
        notificationsEnabled: true,
      };

      prisma.savedSearch.findUnique.mockResolvedValue(mockSavedSearch as any);
      prisma.savedSearch.update.mockResolvedValue({
        ...mockSavedSearch,
        notificationsEnabled: true,
      } as any);

      const result = await service.update(searchId, userId, updateDto);

      expect(result.notificationsEnabled).toBe(true);
      expect(prisma.savedSearch.update).toHaveBeenCalledWith({
        where: { id: searchId },
        data: expect.objectContaining({
          notificationsEnabled: true,
        }),
      });
    });

    it('should throw NotFoundException if saved search does not exist', async () => {
      prisma.savedSearch.findUnique.mockResolvedValue(null);

      await expect(
        service.update(searchId, userId, { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.savedSearch.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own the saved search', async () => {
      const mockSavedSearch = TestFactories.createSavedSearch({
        id: searchId,
        userId: 'different-user',
      });

      prisma.savedSearch.findUnique.mockResolvedValue(mockSavedSearch as any);

      await expect(
        service.update(searchId, userId, { name: 'Test' }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.savedSearch.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    const searchId = 'search-123';
    const userId = 'user-123';

    it('should delete saved search successfully', async () => {
      const mockSavedSearch = TestFactories.createSavedSearch({
        id: searchId,
        userId,
      });

      prisma.savedSearch.findUnique.mockResolvedValue(mockSavedSearch as any);
      prisma.savedSearch.delete.mockResolvedValue(mockSavedSearch as any);

      const result = await service.delete(searchId, userId);

      expect(result).toEqual({ message: 'Saved search deleted successfully' });
      expect(prisma.savedSearch.delete).toHaveBeenCalledWith({
        where: { id: searchId },
      });
    });

    it('should throw NotFoundException if saved search does not exist', async () => {
      prisma.savedSearch.findUnique.mockResolvedValue(null);

      await expect(service.delete(searchId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.savedSearch.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own the saved search', async () => {
      const mockSavedSearch = TestFactories.createSavedSearch({
        id: searchId,
        userId: 'different-user',
      });

      prisma.savedSearch.findUnique.mockResolvedValue(mockSavedSearch as any);

      await expect(service.delete(searchId, userId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.savedSearch.delete).not.toHaveBeenCalled();
    });
  });

  describe('toggleNotifications', () => {
    const searchId = 'search-123';
    const userId = 'user-123';

    it('should enable notifications', async () => {
      const mockSavedSearch = TestFactories.createSavedSearch({
        id: searchId,
        userId,
        notificationsEnabled: false,
      });

      prisma.savedSearch.findUnique.mockResolvedValue(mockSavedSearch as any);
      prisma.savedSearch.update.mockResolvedValue({
        ...mockSavedSearch,
        notificationsEnabled: true,
      } as any);

      const result = await service.toggleNotifications(searchId, userId, true);

      expect(result.notificationsEnabled).toBe(true);
      expect(prisma.savedSearch.update).toHaveBeenCalledWith({
        where: { id: searchId },
        data: { notificationsEnabled: true },
      });
    });

    it('should disable notifications', async () => {
      const mockSavedSearch = TestFactories.createSavedSearch({
        id: searchId,
        userId,
        notificationsEnabled: true,
      });

      prisma.savedSearch.findUnique.mockResolvedValue(mockSavedSearch as any);
      prisma.savedSearch.update.mockResolvedValue({
        ...mockSavedSearch,
        notificationsEnabled: false,
      } as any);

      const result = await service.toggleNotifications(searchId, userId, false);

      expect(result.notificationsEnabled).toBe(false);
      expect(prisma.savedSearch.update).toHaveBeenCalledWith({
        where: { id: searchId },
        data: { notificationsEnabled: false },
      });
    });

    it('should throw NotFoundException if saved search does not exist', async () => {
      prisma.savedSearch.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleNotifications(searchId, userId, true),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.savedSearch.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own the saved search', async () => {
      const mockSavedSearch = TestFactories.createSavedSearch({
        id: searchId,
        userId: 'different-user',
      });

      prisma.savedSearch.findUnique.mockResolvedValue(mockSavedSearch as any);

      await expect(
        service.toggleNotifications(searchId, userId, true),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.savedSearch.update).not.toHaveBeenCalled();
    });
  });

  describe('getCount', () => {
    const userId = 'user-123';

    it('should return count of saved searches for user', async () => {
      prisma.savedSearch.count.mockResolvedValue(5);

      const result = await service.getCount(userId);

      expect(result).toBe(5);
      expect(prisma.savedSearch.count).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return 0 if user has no saved searches', async () => {
      prisma.savedSearch.count.mockResolvedValue(0);

      const result = await service.getCount(userId);

      expect(result).toBe(0);
    });
  });
});
