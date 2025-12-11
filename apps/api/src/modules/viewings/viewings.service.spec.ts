import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ViewingsService } from './viewings.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  mockPrismaService,
  resetMocks,
  TestFactories,
} from '../../test/test-utils';

describe('ViewingsService', () => {
  let service: ViewingsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    resetMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ViewingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ViewingsService>(ViewingsService);
    prisma = mockPrismaService;
  });

  describe('requestViewing', () => {
    const requesterId = 'requester-123';
    const propertyId = 'prop-123';
    const ownerId = 'owner-123';
    const viewingData = {
      date: new Date('2025-12-15'),
      time: '14:00',
      message: 'I would like to view this property',
    };

    it('should create a viewing request successfully', async () => {
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        userId: ownerId,
      });
      const mockViewing = {
        id: 'viewing-123',
        propertyId,
        requesterId,
        ownerId,
        date: viewingData.date,
        time: viewingData.time,
        message: viewingData.message,
        status: 'PENDING',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        property: {
          id: propertyId,
          title: mockProperty.title,
          address: mockProperty.address,
          city: mockProperty.city,
        },
      };

      prisma.property.findUnique.mockResolvedValue({
        userId: ownerId,
        title: mockProperty.title,
      } as any);
      prisma.viewing.findFirst.mockResolvedValue(null);
      prisma.viewing.create.mockResolvedValue(mockViewing as any);

      const result = await service.requestViewing(
        requesterId,
        propertyId,
        viewingData,
      );

      expect(result).toEqual(mockViewing);
      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: propertyId },
        select: { userId: true, title: true },
      });
      expect(prisma.viewing.findFirst).toHaveBeenCalledWith({
        where: {
          propertyId,
          requesterId,
          status: 'PENDING',
        },
      });
      expect(prisma.viewing.create).toHaveBeenCalledWith({
        data: {
          propertyId,
          requesterId,
          ownerId,
          date: viewingData.date,
          time: viewingData.time,
          message: viewingData.message,
        },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if property does not exist', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(
        service.requestViewing(requesterId, propertyId, viewingData),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.viewing.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user tries to view their own property', async () => {
      prisma.property.findUnique.mockResolvedValue({
        userId: requesterId,
        title: 'Test Property',
      } as any);

      await expect(
        service.requestViewing(requesterId, propertyId, viewingData),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.viewing.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if pending viewing already exists', async () => {
      const existingViewing = {
        id: 'viewing-existing',
        propertyId,
        requesterId,
        status: 'PENDING',
      };

      prisma.property.findUnique.mockResolvedValue({
        userId: ownerId,
        title: 'Test Property',
      } as any);
      prisma.viewing.findFirst.mockResolvedValue(existingViewing as any);

      await expect(
        service.requestViewing(requesterId, propertyId, viewingData),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.viewing.create).not.toHaveBeenCalled();
    });

    it('should allow requesting viewing without message', async () => {
      const dataWithoutMessage = {
        date: new Date('2025-12-15'),
        time: '14:00',
      };

      prisma.property.findUnique.mockResolvedValue({
        userId: ownerId,
        title: 'Test Property',
      } as any);
      prisma.viewing.findFirst.mockResolvedValue(null);
      prisma.viewing.create.mockResolvedValue({
        id: 'viewing-123',
        message: null,
      } as any);

      await service.requestViewing(requesterId, propertyId, dataWithoutMessage);

      expect(prisma.viewing.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            message: undefined,
          }),
        }),
      );
    });
  });

  describe('getMyViewingRequests', () => {
    it('should return all viewing requests made by user', async () => {
      const userId = 'user-123';
      const mockViewings = Array.from({ length: 3 }, (_, i) => ({
        id: `viewing-${i}`,
        propertyId: `prop-${i}`,
        requesterId: userId,
        ownerId: 'owner-123',
        status: 'PENDING',
        date: new Date(),
        time: '14:00',
        createdAt: new Date(),
        updatedAt: new Date(),
        property: {
          id: `prop-${i}`,
          title: `Property ${i}`,
          address: `Address ${i}`,
          city: 'Test City',
          images: [],
        },
        owner: {
          id: 'owner-123',
          firstName: 'John',
          lastName: 'Doe',
        },
      }));

      prisma.viewing.findMany.mockResolvedValue(mockViewings as any);

      const result = await service.getMyViewingRequests(userId);

      expect(result).toEqual(mockViewings);
      expect(prisma.viewing.findMany).toHaveBeenCalledWith({
        where: { requesterId: userId },
        include: expect.objectContaining({
          property: expect.any(Object),
          owner: expect.any(Object),
        }),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array if user has no viewing requests', async () => {
      const userId = 'user-123';
      prisma.viewing.findMany.mockResolvedValue([]);

      const result = await service.getMyViewingRequests(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getPropertyViewingRequests', () => {
    it('should return all viewing requests for user properties', async () => {
      const userId = 'owner-123';
      const mockViewings = Array.from({ length: 2 }, (_, i) => ({
        id: `viewing-${i}`,
        propertyId: `prop-${i}`,
        requesterId: 'requester-123',
        ownerId: userId,
        status: 'PENDING',
        date: new Date(),
        time: '14:00',
        createdAt: new Date(),
        updatedAt: new Date(),
        property: {
          id: `prop-${i}`,
          title: `Property ${i}`,
          address: `Address ${i}`,
        },
        requester: {
          id: 'requester-123',
          firstName: 'Jane',
          lastName: 'Smith',
        },
      }));

      prisma.viewing.findMany.mockResolvedValue(mockViewings as any);

      const result = await service.getPropertyViewingRequests(userId);

      expect(result).toEqual(mockViewings);
      expect(prisma.viewing.findMany).toHaveBeenCalledWith({
        where: { ownerId: userId },
        include: expect.objectContaining({
          property: expect.any(Object),
          requester: expect.any(Object),
        }),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array if no viewing requests exist', async () => {
      const userId = 'owner-123';
      prisma.viewing.findMany.mockResolvedValue([]);

      const result = await service.getPropertyViewingRequests(userId);

      expect(result).toEqual([]);
    });
  });

  describe('respondToViewing', () => {
    const viewingId = 'viewing-123';
    const ownerId = 'owner-123';
    const mockViewing = {
      id: viewingId,
      propertyId: 'prop-123',
      requesterId: 'requester-123',
      ownerId,
      status: 'PENDING',
      date: new Date(),
      time: '14:00',
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should confirm viewing request successfully', async () => {
      const updatedViewing = {
        ...mockViewing,
        status: 'CONFIRMED',
        notes: 'Looking forward to showing you the property',
        property: {
          id: 'prop-123',
          title: 'Test Property',
        },
        requester: {
          id: 'requester-123',
          firstName: 'Jane',
          lastName: 'Smith',
        },
      };

      prisma.viewing.findUnique.mockResolvedValue(mockViewing as any);
      prisma.viewing.update.mockResolvedValue(updatedViewing as any);

      const result = await service.respondToViewing(
        viewingId,
        ownerId,
        'CONFIRMED',
        'Looking forward to showing you the property',
      );

      expect(result.status).toBe('CONFIRMED');
      expect(result.notes).toBe('Looking forward to showing you the property');
      expect(prisma.viewing.update).toHaveBeenCalledWith({
        where: { id: viewingId },
        data: {
          status: 'CONFIRMED',
          notes: 'Looking forward to showing you the property',
        },
        include: expect.any(Object),
      });
    });

    it('should cancel viewing request successfully', async () => {
      const updatedViewing = {
        ...mockViewing,
        status: 'CANCELLED',
      };

      prisma.viewing.findUnique.mockResolvedValue(mockViewing as any);
      prisma.viewing.update.mockResolvedValue(updatedViewing as any);

      const result = await service.respondToViewing(
        viewingId,
        ownerId,
        'CANCELLED',
      );

      expect(result.status).toBe('CANCELLED');
      expect(prisma.viewing.update).toHaveBeenCalledWith({
        where: { id: viewingId },
        data: {
          status: 'CANCELLED',
          notes: undefined,
        },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if viewing does not exist', async () => {
      prisma.viewing.findUnique.mockResolvedValue(null);

      await expect(
        service.respondToViewing(viewingId, ownerId, 'CONFIRMED'),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.viewing.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      prisma.viewing.findUnique.mockResolvedValue(mockViewing as any);

      await expect(
        service.respondToViewing(viewingId, 'different-user', 'CONFIRMED'),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.viewing.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if viewing already responded to', async () => {
      const confirmedViewing = {
        ...mockViewing,
        status: 'CONFIRMED',
      };

      prisma.viewing.findUnique.mockResolvedValue(confirmedViewing as any);

      await expect(
        service.respondToViewing(viewingId, ownerId, 'CONFIRMED'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.viewing.update).not.toHaveBeenCalled();
    });
  });

  describe('cancelViewing', () => {
    const viewingId = 'viewing-123';
    const requesterId = 'requester-123';
    const ownerId = 'owner-123';
    const mockViewing = {
      id: viewingId,
      propertyId: 'prop-123',
      requesterId,
      ownerId,
      status: 'PENDING',
      date: new Date(),
      time: '14:00',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should cancel viewing as requester', async () => {
      const cancelledViewing = {
        ...mockViewing,
        status: 'CANCELLED',
      };

      prisma.viewing.findUnique.mockResolvedValue(mockViewing as any);
      prisma.viewing.update.mockResolvedValue(cancelledViewing as any);

      const result = await service.cancelViewing(viewingId, requesterId);

      expect(result.status).toBe('CANCELLED');
      expect(prisma.viewing.update).toHaveBeenCalledWith({
        where: { id: viewingId },
        data: { status: 'CANCELLED' },
      });
    });

    it('should cancel viewing as owner', async () => {
      const cancelledViewing = {
        ...mockViewing,
        status: 'CANCELLED',
      };

      prisma.viewing.findUnique.mockResolvedValue(mockViewing as any);
      prisma.viewing.update.mockResolvedValue(cancelledViewing as any);

      const result = await service.cancelViewing(viewingId, ownerId);

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw NotFoundException if viewing does not exist', async () => {
      prisma.viewing.findUnique.mockResolvedValue(null);

      await expect(
        service.cancelViewing(viewingId, requesterId),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.viewing.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is neither requester nor owner', async () => {
      prisma.viewing.findUnique.mockResolvedValue(mockViewing as any);

      await expect(
        service.cancelViewing(viewingId, 'different-user'),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.viewing.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if viewing is already completed', async () => {
      const completedViewing = {
        ...mockViewing,
        status: 'COMPLETED',
      };

      prisma.viewing.findUnique.mockResolvedValue(completedViewing as any);

      await expect(
        service.cancelViewing(viewingId, requesterId),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.viewing.update).not.toHaveBeenCalled();
    });
  });

  describe('completeViewing', () => {
    const viewingId = 'viewing-123';
    const ownerId = 'owner-123';
    const mockViewing = {
      id: viewingId,
      propertyId: 'prop-123',
      requesterId: 'requester-123',
      ownerId,
      status: 'CONFIRMED',
      date: new Date(),
      time: '14:00',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should complete viewing successfully', async () => {
      const completedViewing = {
        ...mockViewing,
        status: 'COMPLETED',
      };

      prisma.viewing.findUnique.mockResolvedValue(mockViewing as any);
      prisma.viewing.update.mockResolvedValue(completedViewing as any);

      const result = await service.completeViewing(viewingId, ownerId);

      expect(result.status).toBe('COMPLETED');
      expect(prisma.viewing.update).toHaveBeenCalledWith({
        where: { id: viewingId },
        data: { status: 'COMPLETED' },
      });
    });

    it('should throw NotFoundException if viewing does not exist', async () => {
      prisma.viewing.findUnique.mockResolvedValue(null);

      await expect(service.completeViewing(viewingId, ownerId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.viewing.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      prisma.viewing.findUnique.mockResolvedValue(mockViewing as any);

      await expect(
        service.completeViewing(viewingId, 'different-user'),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.viewing.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if viewing is not confirmed', async () => {
      const pendingViewing = {
        ...mockViewing,
        status: 'PENDING',
      };

      prisma.viewing.findUnique.mockResolvedValue(pendingViewing as any);

      await expect(service.completeViewing(viewingId, ownerId)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.viewing.update).not.toHaveBeenCalled();
    });
  });
});
