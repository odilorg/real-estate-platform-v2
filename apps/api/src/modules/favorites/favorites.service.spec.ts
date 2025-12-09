import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { mockPrismaService, resetMocks, TestFactories } from '../../test/test-utils';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    resetMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    prisma = mockPrismaService;
  });

  describe('getUserFavorites', () => {
    it('should return paginated user favorites', async () => {
      const userId = 'user-123';
      const mockProperty = TestFactories.createProperty();
      const mockFavorites = Array.from({ length: 5 }, (_, i) => ({
        id: `fav-${i}`,
        userId,
        propertyId: `prop-${i}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        property: mockProperty,
      }));

      prisma.favorite.findMany.mockResolvedValue(mockFavorites);
      prisma.favorite.count.mockResolvedValue(15);

      const result = await service.getUserFavorites(userId, 1, 5);

      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(15);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(3);
      expect(prisma.favorite.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 5,
      });
    });

    it('should handle pagination correctly', async () => {
      const userId = 'user-123';
      prisma.favorite.findMany.mockResolvedValue([]);
      prisma.favorite.count.mockResolvedValue(0);

      await service.getUserFavorites(userId, 2, 10);

      expect(prisma.favorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * 10
          take: 10,
        })
      );
    });

    it('should use default pagination values', async () => {
      const userId = 'user-123';
      prisma.favorite.findMany.mockResolvedValue([]);
      prisma.favorite.count.mockResolvedValue(0);

      await service.getUserFavorites(userId);

      expect(prisma.favorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0, // (page 1 - 1) * 20
          take: 20,
        })
      );
    });
  });

  describe('addFavorite', () => {
    const userId = 'user-123';
    const propertyId = 'prop-123';

    it('should add a new favorite successfully', async () => {
      const mockProperty = TestFactories.createProperty({ id: propertyId });
      const mockFavorite = {
        id: 'fav-123',
        userId,
        propertyId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.favorite.findUnique.mockResolvedValue(null);
      prisma.favorite.create.mockResolvedValue(mockFavorite);

      const result = await service.addFavorite(userId, propertyId);

      expect(result).toEqual(mockFavorite);
      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: propertyId },
      });
      expect(prisma.favorite.create).toHaveBeenCalledWith({
        data: { userId, propertyId },
      });
    });

    it('should throw NotFoundException if property does not exist', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(service.addFavorite(userId, propertyId)).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.favorite.create).not.toHaveBeenCalled();
    });

    it('should return existing favorite if already favorited', async () => {
      const mockProperty = TestFactories.createProperty({ id: propertyId });
      const existingFavorite = {
        id: 'fav-123',
        userId,
        propertyId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.favorite.findUnique.mockResolvedValue(existingFavorite);

      const result = await service.addFavorite(userId, propertyId);

      expect(result).toEqual(existingFavorite);
      expect(prisma.favorite.create).not.toHaveBeenCalled();
    });
  });

  describe('removeFavorite', () => {
    const userId = 'user-123';
    const propertyId = 'prop-123';

    it('should remove favorite successfully', async () => {
      const mockFavorite = {
        id: 'fav-123',
        userId,
        propertyId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.favorite.findUnique.mockResolvedValue(mockFavorite);
      prisma.favorite.delete.mockResolvedValue(mockFavorite);

      const result = await service.removeFavorite(userId, propertyId);

      expect(result).toEqual({ success: true });
      expect(prisma.favorite.delete).toHaveBeenCalledWith({
        where: { id: mockFavorite.id },
      });
    });

    it('should throw NotFoundException if favorite does not exist', async () => {
      prisma.favorite.findUnique.mockResolvedValue(null);

      await expect(service.removeFavorite(userId, propertyId)).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.favorite.delete).not.toHaveBeenCalled();
    });
  });

  describe('checkFavorite', () => {
    const userId = 'user-123';
    const propertyId = 'prop-123';

    it('should return true if property is favorited', async () => {
      const mockFavorite = {
        id: 'fav-123',
        userId,
        propertyId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.favorite.findUnique.mockResolvedValue(mockFavorite);

      const result = await service.checkFavorite(userId, propertyId);

      expect(result).toEqual({ isFavorite: true });
    });

    it('should return false if property is not favorited', async () => {
      prisma.favorite.findUnique.mockResolvedValue(null);

      const result = await service.checkFavorite(userId, propertyId);

      expect(result).toEqual({ isFavorite: false });
    });
  });

  describe('getFavoriteIds', () => {
    it('should return array of favorited property IDs', async () => {
      const userId = 'user-123';
      const mockFavorites = [
        { propertyId: 'prop-1' },
        { propertyId: 'prop-2' },
        { propertyId: 'prop-3' },
      ];

      prisma.favorite.findMany.mockResolvedValue(mockFavorites as any);

      const result = await service.getFavoriteIds(userId);

      expect(result).toEqual(['prop-1', 'prop-2', 'prop-3']);
      expect(prisma.favorite.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { propertyId: true },
      });
    });

    it('should return empty array if no favorites', async () => {
      const userId = 'user-123';
      prisma.favorite.findMany.mockResolvedValue([]);

      const result = await service.getFavoriteIds(userId);

      expect(result).toEqual([]);
    });
  });
});
