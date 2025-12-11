import { Test, TestingModule } from '@nestjs/testing';
import { CollectionsService } from './collections.service';
import { PrismaService } from '../../common/prisma';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('CollectionsService', () => {
  let service: CollectionsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    collection: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    collectionProperty: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    property: {
      findUnique: jest.fn(),
    },
  };

  const mockUser = {
    id: 'user-123',
  };

  const mockCollection = {
    id: 'collection-123',
    userId: 'user-123',
    name: 'My Collection',
    description: 'Test collection',
    isDefault: false,
    color: '#FF5733',
    icon: 'bookmark',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProperty = {
    id: 'property-123',
    title: 'Test Property',
    price: 100000,
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new collection', async () => {
      const dto = {
        name: 'My Collection',
        description: 'Test collection',
        color: '#FF5733',
        icon: 'bookmark',
      };

      const expectedResult = {
        ...mockCollection,
        properties: [],
      };

      mockPrismaService.collection.create.mockResolvedValue(expectedResult);

      const result = await service.create(mockUser.id, dto);

      expect(result).toEqual(expectedResult);
      expect(prisma.collection.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          name: dto.name,
          description: dto.description,
          color: dto.color,
          icon: dto.icon,
        },
        include: {
          properties: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all collections for a user', async () => {
      const expectedCollections = [
        { ...mockCollection, _count: { properties: 5 } },
        { ...mockCollection, id: 'collection-456', _count: { properties: 3 } },
      ];

      mockPrismaService.collection.findMany.mockResolvedValue(expectedCollections);

      const result = await service.findAll(mockUser.id);

      expect(result).toEqual(expectedCollections);
      expect(prisma.collection.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: {
          _count: {
            select: { properties: true },
          },
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      });
    });
  });

  describe('findOne', () => {
    it('should return a collection by id', async () => {
      const expectedCollection = {
        ...mockCollection,
        properties: [],
      };

      mockPrismaService.collection.findFirst.mockResolvedValue(expectedCollection);

      const result = await service.findOne(mockCollection.id, mockUser.id);

      expect(result).toEqual(expectedCollection);
      expect(prisma.collection.findFirst).toHaveBeenCalledWith({
        where: { id: mockCollection.id, userId: mockUser.id },
        include: {
          properties: {
            include: {
              property: {
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
              },
            },
            orderBy: { addedAt: 'desc' },
          },
        },
      });
    });

    it('should throw NotFoundException if collection not found', async () => {
      mockPrismaService.collection.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent', mockUser.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a collection', async () => {
      const dto = { description: 'Updated description' };
      const updatedCollection = { ...mockCollection, ...dto };

      mockPrismaService.collection.findFirst.mockResolvedValue(mockCollection);
      mockPrismaService.collection.update.mockResolvedValue(updatedCollection);

      const result = await service.update(mockCollection.id, mockUser.id, dto);

      expect(result).toEqual(updatedCollection);
      expect(prisma.collection.update).toHaveBeenCalledWith({
        where: { id: mockCollection.id },
        data: dto,
      });
    });

    it('should throw NotFoundException if collection not found', async () => {
      mockPrismaService.collection.findFirst.mockResolvedValue(null);

      await expect(
        service.update('non-existent', mockUser.id, { description: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when trying to rename default collection', async () => {
      const defaultCollection = { ...mockCollection, isDefault: true };
      mockPrismaService.collection.findFirst.mockResolvedValue(defaultCollection);

      await expect(
        service.update(mockCollection.id, mockUser.id, { name: 'New Name' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete a collection', async () => {
      mockPrismaService.collection.findFirst.mockResolvedValue(mockCollection);
      mockPrismaService.collection.delete.mockResolvedValue(mockCollection);

      const result = await service.delete(mockCollection.id, mockUser.id);

      expect(result).toEqual({ message: 'Collection deleted successfully' });
      expect(prisma.collection.delete).toHaveBeenCalledWith({
        where: { id: mockCollection.id },
      });
    });

    it('should throw NotFoundException if collection not found', async () => {
      mockPrismaService.collection.findFirst.mockResolvedValue(null);

      await expect(service.delete('non-existent', mockUser.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when trying to delete default collection', async () => {
      const defaultCollection = { ...mockCollection, isDefault: true };
      mockPrismaService.collection.findFirst.mockResolvedValue(defaultCollection);

      await expect(service.delete(mockCollection.id, mockUser.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addProperty', () => {
    it('should add a property to a collection', async () => {
      const dto = { propertyId: mockProperty.id, notes: 'Great property!' };
      const expectedResult = {
        id: 'cp-123',
        collectionId: mockCollection.id,
        propertyId: mockProperty.id,
        notes: dto.notes,
        addedAt: new Date(),
      };

      mockPrismaService.collection.findFirst.mockResolvedValue(mockCollection);
      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.collectionProperty.findFirst.mockResolvedValue(null);
      mockPrismaService.collectionProperty.create.mockResolvedValue(expectedResult);

      const result = await service.addProperty(mockCollection.id, mockUser.id, dto);

      expect(result).toEqual(expectedResult);
      expect(prisma.collectionProperty.create).toHaveBeenCalledWith({
        data: {
          collectionId: mockCollection.id,
          propertyId: dto.propertyId,
          notes: dto.notes,
        },
      });
    });

    it('should update notes if property already in collection', async () => {
      const dto = { propertyId: mockProperty.id, notes: 'Updated notes' };
      const existing = {
        id: 'cp-123',
        collectionId: mockCollection.id,
        propertyId: mockProperty.id,
        notes: 'Old notes',
        addedAt: new Date(),
      };
      const updated = { ...existing, notes: dto.notes };

      mockPrismaService.collection.findFirst.mockResolvedValue(mockCollection);
      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.collectionProperty.findFirst.mockResolvedValue(existing);
      mockPrismaService.collectionProperty.update.mockResolvedValue(updated);

      const result = await service.addProperty(mockCollection.id, mockUser.id, dto);

      expect(result).toEqual(updated);
      expect(prisma.collectionProperty.update).toHaveBeenCalledWith({
        where: { id: existing.id },
        data: { notes: dto.notes },
      });
    });

    it('should throw NotFoundException if collection not found', async () => {
      mockPrismaService.collection.findFirst.mockResolvedValue(null);

      await expect(
        service.addProperty(mockCollection.id, mockUser.id, {
          propertyId: mockProperty.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if property not found', async () => {
      mockPrismaService.collection.findFirst.mockResolvedValue(mockCollection);
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(
        service.addProperty(mockCollection.id, mockUser.id, {
          propertyId: 'non-existent',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeProperty', () => {
    it('should remove a property from a collection', async () => {
      const collectionProperty = {
        id: 'cp-123',
        collectionId: mockCollection.id,
        propertyId: mockProperty.id,
        notes: null,
        addedAt: new Date(),
      };

      mockPrismaService.collection.findFirst.mockResolvedValue(mockCollection);
      mockPrismaService.collectionProperty.findFirst.mockResolvedValue(
        collectionProperty,
      );
      mockPrismaService.collectionProperty.delete.mockResolvedValue(collectionProperty);

      const result = await service.removeProperty(
        mockCollection.id,
        mockProperty.id,
        mockUser.id,
      );

      expect(result).toEqual({ message: 'Property removed from collection' });
      expect(prisma.collectionProperty.delete).toHaveBeenCalledWith({
        where: { id: collectionProperty.id },
      });
    });

    it('should throw NotFoundException if collection not found', async () => {
      mockPrismaService.collection.findFirst.mockResolvedValue(null);

      await expect(
        service.removeProperty(mockCollection.id, mockProperty.id, mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if property not in collection', async () => {
      mockPrismaService.collection.findFirst.mockResolvedValue(mockCollection);
      mockPrismaService.collectionProperty.findFirst.mockResolvedValue(null);

      await expect(
        service.removeProperty(mockCollection.id, mockProperty.id, mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOrCreateDefaultCollection', () => {
    it('should return existing default collection', async () => {
      const defaultCollection = { ...mockCollection, isDefault: true };
      mockPrismaService.collection.findFirst.mockResolvedValue(defaultCollection);

      const result = await service.getOrCreateDefaultCollection(mockUser.id);

      expect(result).toEqual(defaultCollection);
      expect(prisma.collection.create).not.toHaveBeenCalled();
    });

    it('should create default collection if not exists', async () => {
      const newDefaultCollection = {
        ...mockCollection,
        name: 'Избранное',
        isDefault: true,
      };

      mockPrismaService.collection.findFirst.mockResolvedValue(null);
      mockPrismaService.collection.create.mockResolvedValue(newDefaultCollection);

      const result = await service.getOrCreateDefaultCollection(mockUser.id);

      expect(result).toEqual(newDefaultCollection);
      expect(prisma.collection.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          name: 'Избранное',
          isDefault: true,
        },
      });
    });
  });
});
