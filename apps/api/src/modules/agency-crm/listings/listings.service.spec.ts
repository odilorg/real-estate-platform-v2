import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

// Extended mock PrismaService
const mockPrismaService: any = {
  property: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  agencyMember: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaService)),
};

describe('ListingsService', () => {
  let service: ListingsService;
  let prisma: typeof mockPrismaService;

  const createMockProperty = (overrides = {}) => ({
    id: 'property-123',
    userId: 'user-123',
    title: 'Modern Apartment in Tashkent',
    description: 'Beautiful 3-bedroom apartment',
    price: 150000,
    currency: 'USD',
    propertyType: 'APARTMENT',
    listingType: 'SALE',
    marketType: 'SECONDARY',
    status: 'ACTIVE',
    address: '123 Main St',
    city: 'Tashkent',
    district: 'Yunusabad',
    bedrooms: 3,
    bathrooms: 2,
    area: 120.5,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockMember = (overrides = {}) => ({
    id: 'member-123',
    agencyId: 'agency-123',
    userId: 'user-123',
    role: 'AGENT',
    isActive: true,
    user: {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
    },
    ...overrides,
  });

  beforeEach(async () => {
    Object.keys(mockPrismaService).forEach((key) => {
      const service = mockPrismaService[key];
      if (typeof service === 'object' && service !== null) {
        Object.keys(service).forEach((methodKey) => {
          const method = service[methodKey];
          if (jest.isMockFunction(method)) {
            method.mockReset();
          }
        });
      }
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
    prisma = mockPrismaService;
  });

  describe('create', () => {
    const agencyId = 'agency-123';
    const memberId = 'member-123';
    const createDto = {
      title: 'Modern Apartment',
      description: 'Beautiful apartment',
      price: 150000,
      currency: 'USD',
      propertyType: 'APARTMENT',
      listingType: 'SALE',
      marketType: 'SECONDARY',
      address: '123 Main St',
      city: 'Tashkent',
      district: 'Yunusabad',
      bedrooms: 3,
      bathrooms: 2,
      area: 120.5,
    };

    it('should create a listing successfully', async () => {
      const mockMember = createMockMember();
      const mockProperty = createMockProperty();

      prisma.agencyMember.findUnique.mockResolvedValue(mockMember);
      prisma.property.create.mockResolvedValue(mockProperty);

      const result = await service.create(agencyId, memberId, createDto as any);

      expect(result).toEqual(mockProperty);
      expect(prisma.agencyMember.findUnique).toHaveBeenCalledWith({
        where: { id: memberId },
        include: { user: true },
      });
      expect(prisma.property.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if member not found', async () => {
      prisma.agencyMember.findUnique.mockResolvedValue(null);

      await expect(
        service.create(agencyId, memberId, createDto as any),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.create(agencyId, memberId, createDto as any),
      ).rejects.toThrow('Member not found');
    });

    it('should set default country to Uzbekistan', async () => {
      const mockMember = createMockMember();
      const mockProperty = createMockProperty();

      prisma.agencyMember.findUnique.mockResolvedValue(mockMember);
      prisma.property.create.mockResolvedValue(mockProperty);

      await service.create(agencyId, memberId, createDto as any);

      expect(prisma.property.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            country: 'Uzbekistan',
          }),
        }),
      );
    });

    it('should set status to ACTIVE by default', async () => {
      const mockMember = createMockMember();
      const mockProperty = createMockProperty();

      prisma.agencyMember.findUnique.mockResolvedValue(mockMember);
      prisma.property.create.mockResolvedValue(mockProperty);

      await service.create(agencyId, memberId, createDto as any);

      expect(prisma.property.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'ACTIVE',
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    const agencyId = 'agency-123';
    const memberId = 'member-123';
    const role = 'AGENT';

    it('should return paginated listings', async () => {
      const mockProperties = Array.from({ length: 3 }, (_, i) =>
        createMockProperty({ id: `property-${i}` }),
      );

      prisma.property.findMany.mockResolvedValue(mockProperties);
      prisma.property.count.mockResolvedValue(50);

      const result = await service.findAll(agencyId, memberId, role, {});

      expect(result.data).toEqual(mockProperties);
      expect(result.meta.total).toBe(50);
      expect(prisma.property.findMany).toHaveBeenCalled();
    });

    it('should filter listings by propertyType', async () => {
      prisma.property.findMany.mockResolvedValue([]);
      prisma.property.count.mockResolvedValue(0);

      await service.findAll(agencyId, memberId, role, { propertyType: 'APARTMENT' });

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyType: 'APARTMENT',
          }),
        }),
      );
    });

    it('should filter listings by listingType', async () => {
      prisma.property.findMany.mockResolvedValue([]);
      prisma.property.count.mockResolvedValue(0);

      await service.findAll(agencyId, memberId, role, { listingType: 'SALE' });

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            listingType: 'SALE',
          }),
        }),
      );
    });

    it('should filter listings by status', async () => {
      prisma.property.findMany.mockResolvedValue([]);
      prisma.property.count.mockResolvedValue(0);

      await service.findAll(agencyId, memberId, role, { status: 'ACTIVE' });

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    const agencyId = 'agency-123';
    const memberId = 'member-123';
    const propertyId = 'property-123';
    const role = 'AGENT';

    it('should return listing by id', async () => {
      const mockProperty = createMockProperty({ id: propertyId });

      prisma.property.findFirst.mockResolvedValue(mockProperty);

      const result = await service.findOne(agencyId, memberId, role, propertyId);

      expect(result).toEqual(mockProperty);
      expect(prisma.property.findFirst).toHaveBeenCalledWith({
        where: { id: propertyId },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if listing not found', async () => {
      prisma.property.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(agencyId, memberId, role, propertyId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne(agencyId, memberId, role, propertyId),
      ).rejects.toThrow('Listing not found');
    });
  });

  describe('update', () => {
    const agencyId = 'agency-123';
    const memberId = 'member-123';
    const propertyId = 'property-123';
    const role = 'AGENT';
    const updateDto = {
      title: 'Updated Title',
      price: 200000,
    };

    it('should update listing successfully', async () => {
      const existingProperty = createMockProperty({ id: propertyId, userId: 'user-123' });
      const updatedProperty = createMockProperty({ ...existingProperty, ...updateDto });
      const mockMember = createMockMember({ userId: 'user-123' });

      prisma.property.findFirst.mockResolvedValue(existingProperty);
      prisma.agencyMember.findUnique.mockResolvedValue(mockMember);
      prisma.property.update.mockResolvedValue(updatedProperty);

      const result = await service.update(agencyId, memberId, role, propertyId, updateDto as any);

      expect(result).toEqual(updatedProperty);
      expect(prisma.property.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if listing not found', async () => {
      prisma.property.findFirst.mockResolvedValue(null);

      await expect(
        service.update(agencyId, memberId, role, propertyId, updateDto as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if member not found', async () => {
      const existingProperty = createMockProperty({ id: propertyId, userId: 'user-123' });

      prisma.property.findFirst.mockResolvedValue(existingProperty);
      prisma.agencyMember.findUnique.mockResolvedValue(null);

      await expect(
        service.update(agencyId, memberId, role, propertyId, updateDto as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to update any listing', async () => {
      const existingProperty = createMockProperty({ id: propertyId, userId: 'other-user' });
      const updatedProperty = createMockProperty({ ...existingProperty, ...updateDto });
      const mockMember = createMockMember({ userId: 'user-123' });

      prisma.property.findFirst.mockResolvedValue(existingProperty);
      prisma.agencyMember.findUnique.mockResolvedValue(mockMember);
      prisma.property.update.mockResolvedValue(updatedProperty);

      const result = await service.update(agencyId, memberId, 'ADMIN', propertyId, updateDto as any);

      expect(result).toEqual(updatedProperty);
    });
  });

  describe('delete', () => {
    const agencyId = 'agency-123';
    const memberId = 'member-123';
    const propertyId = 'property-123';
    const role = 'AGENT';

    it('should delete listing successfully', async () => {
      const mockProperty = createMockProperty({ id: propertyId, userId: 'user-123' });
      const mockMember = createMockMember({ userId: 'user-123' });

      prisma.property.findFirst.mockResolvedValue(mockProperty);
      prisma.agencyMember.findUnique.mockResolvedValue(mockMember);
      prisma.property.delete.mockResolvedValue(mockProperty);

      const result = await service.delete(agencyId, memberId, role, propertyId);

      expect(result).toEqual({ success: true });
      expect(prisma.property.delete).toHaveBeenCalledWith({
        where: { id: propertyId },
      });
    });

    it('should throw NotFoundException if listing not found', async () => {
      prisma.property.findFirst.mockResolvedValue(null);

      await expect(
        service.delete(agencyId, memberId, role, propertyId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if member not found', async () => {
      const mockProperty = createMockProperty({ id: propertyId, userId: 'user-123' });

      prisma.property.findFirst.mockResolvedValue(mockProperty);
      prisma.agencyMember.findUnique.mockResolvedValue(null);

      await expect(
        service.delete(agencyId, memberId, role, propertyId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to delete any listing', async () => {
      const mockProperty = createMockProperty({ id: propertyId, userId: 'other-user' });
      const mockMember = createMockMember({ userId: 'user-123' });

      prisma.property.findFirst.mockResolvedValue(mockProperty);
      prisma.agencyMember.findUnique.mockResolvedValue(mockMember);
      prisma.property.delete.mockResolvedValue(mockProperty);

      const result = await service.delete(agencyId, memberId, 'ADMIN', propertyId);

      expect(result).toEqual({ success: true });
    });
  });
});
