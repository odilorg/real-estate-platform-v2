import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

// Extended mock PrismaService
const mockPrismaService: any = {
  agencyCommission: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
  },
};

describe('CommissionsService', () => {
  let service: CommissionsService;
  let prisma: typeof mockPrismaService;

  const createMockCommission = (overrides = {}) => ({
    id: 'commission-123',
    agencyId: 'agency-123',
    dealId: 'deal-123',
    memberId: 'member-123',
    status: 'PENDING',
    grossAmount: 10000,
    netAmount: 9000,
    currency: 'UZS',
    paidDate: null,
    paymentMethod: null,
    paymentNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    member: {
      id: 'member-123',
      user: {
        firstName: 'John',
        lastName: 'Doe',
      },
    },
    deal: {
      id: 'deal-123',
      lead: {
        id: 'lead-123',
        firstName: 'Jane',
        lastName: 'Smith',
      },
      property: {
        id: 'property-123',
        title: 'Modern Apartment',
      },
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
        CommissionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
    prisma = mockPrismaService;
  });

  describe('findAll', () => {
    const agencyId = 'agency-123';
    const memberId = 'member-123';

    it('should return paginated commissions for admin', async () => {
      const mockCommissions = Array.from({ length: 3 }, (_, i) =>
        createMockCommission({ id: `commission-${i}` }),
      );

      prisma.agencyCommission.findMany.mockResolvedValue(mockCommissions);
      prisma.agencyCommission.count.mockResolvedValue(50);

      const result = await service.findAll(agencyId, memberId, 'ADMIN', {});

      expect(result.data).toEqual(mockCommissions);
      expect(result.meta.total).toBe(50);
      expect(prisma.agencyCommission.findMany).toHaveBeenCalled();
    });

    it('should filter commissions by status', async () => {
      prisma.agencyCommission.findMany.mockResolvedValue([]);
      prisma.agencyCommission.count.mockResolvedValue(0);

      await service.findAll(agencyId, memberId, 'ADMIN', { status: 'PAID' });

      expect(prisma.agencyCommission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            status: 'PAID',
          }),
        }),
      );
    });

    it('should restrict agents to their own commissions', async () => {
      prisma.agencyCommission.findMany.mockResolvedValue([]);
      prisma.agencyCommission.count.mockResolvedValue(0);

      await service.findAll(agencyId, memberId, 'AGENT', {});

      expect(prisma.agencyCommission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            memberId,
          }),
        }),
      );
    });

    it('should allow admins to filter by specific member', async () => {
      const targetMemberId = 'member-456';
      prisma.agencyCommission.findMany.mockResolvedValue([]);
      prisma.agencyCommission.count.mockResolvedValue(0);

      await service.findAll(agencyId, memberId, 'ADMIN', { memberId: targetMemberId });

      expect(prisma.agencyCommission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            memberId: targetMemberId,
          }),
        }),
      );
    });

    it('should support pagination', async () => {
      prisma.agencyCommission.findMany.mockResolvedValue([]);
      prisma.agencyCommission.count.mockResolvedValue(0);

      await service.findAll(agencyId, memberId, 'ADMIN', { page: 2, limit: 10 });

      expect(prisma.agencyCommission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('findOne', () => {
    const agencyId = 'agency-123';
    const memberId = 'member-123';
    const commissionId = 'commission-123';

    it('should return commission by id', async () => {
      const mockCommission = createMockCommission({ id: commissionId });

      prisma.agencyCommission.findFirst.mockResolvedValue(mockCommission);

      const result = await service.findOne(agencyId, memberId, 'ADMIN', commissionId);

      expect(result).toEqual(mockCommission);
      expect(prisma.agencyCommission.findFirst).toHaveBeenCalledWith({
        where: { id: commissionId, agencyId },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if commission not found', async () => {
      prisma.agencyCommission.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(agencyId, memberId, 'ADMIN', commissionId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne(agencyId, memberId, 'ADMIN', commissionId),
      ).rejects.toThrow('Commission not found');
    });

    it('should allow agent to view their own commission', async () => {
      const mockCommission = createMockCommission({ id: commissionId, memberId });

      prisma.agencyCommission.findFirst.mockResolvedValue(mockCommission);

      const result = await service.findOne(agencyId, memberId, 'AGENT', commissionId);

      expect(result).toEqual(mockCommission);
    });

    it('should throw ForbiddenException if agent tries to view another member commission', async () => {
      const mockCommission = createMockCommission({ id: commissionId, memberId: 'other-member' });

      prisma.agencyCommission.findFirst.mockResolvedValue(mockCommission);

      await expect(
        service.findOne(agencyId, memberId, 'AGENT', commissionId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.findOne(agencyId, memberId, 'AGENT', commissionId),
      ).rejects.toThrow('You can only view your own commissions');
    });
  });

  describe('approve', () => {
    const agencyId = 'agency-123';
    const commissionId = 'commission-123';

    it('should approve commission successfully', async () => {
      const mockCommission = createMockCommission({ id: commissionId, status: 'PENDING' });
      const approvedCommission = createMockCommission({ id: commissionId, status: 'APPROVED' });

      prisma.agencyCommission.findFirst.mockResolvedValue(mockCommission);
      prisma.agencyCommission.update.mockResolvedValue(approvedCommission);

      const result = await service.approve(agencyId, 'ADMIN', commissionId);

      expect(result).toEqual(approvedCommission);
      expect(prisma.agencyCommission.update).toHaveBeenCalledWith({
        where: { id: commissionId },
        data: { status: 'APPROVED' },
        include: expect.any(Object),
      });
    });

    it('should throw ForbiddenException if agent tries to approve', async () => {
      await expect(service.approve(agencyId, 'AGENT', commissionId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.approve(agencyId, 'AGENT', commissionId)).rejects.toThrow(
        'Only admins can approve commissions',
      );
    });

    it('should throw NotFoundException if commission not found', async () => {
      prisma.agencyCommission.findFirst.mockResolvedValue(null);

      await expect(service.approve(agencyId, 'ADMIN', commissionId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.approve(agencyId, 'ADMIN', commissionId)).rejects.toThrow(
        'Commission not found',
      );
    });

    it('should throw ForbiddenException if commission is not pending', async () => {
      const mockCommission = createMockCommission({ id: commissionId, status: 'PAID' });

      prisma.agencyCommission.findFirst.mockResolvedValue(mockCommission);

      await expect(service.approve(agencyId, 'ADMIN', commissionId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.approve(agencyId, 'ADMIN', commissionId)).rejects.toThrow(
        'Only pending commissions can be approved',
      );
    });
  });

  describe('markAsPaid', () => {
    const agencyId = 'agency-123';
    const commissionId = 'commission-123';
    const paymentData = {
      paidDate: '2025-12-23',
      paymentMethod: 'BANK_TRANSFER',
      paymentNotes: 'Paid via bank transfer',
    };

    it('should mark commission as paid successfully', async () => {
      const mockCommission = createMockCommission({ id: commissionId, status: 'APPROVED' });
      const paidCommission = createMockCommission({ id: commissionId, status: 'PAID' });

      prisma.agencyCommission.findFirst.mockResolvedValue(mockCommission);
      prisma.agencyCommission.update.mockResolvedValue(paidCommission);

      const result = await service.markAsPaid(agencyId, 'ADMIN', commissionId, paymentData);

      expect(result).toEqual(paidCommission);
      expect(prisma.agencyCommission.update).toHaveBeenCalledWith({
        where: { id: commissionId },
        data: {
          status: 'PAID',
          paidDate: new Date(paymentData.paidDate),
          paymentMethod: paymentData.paymentMethod,
          paymentNotes: paymentData.paymentNotes,
        },
        include: expect.any(Object),
      });
    });

    it('should throw ForbiddenException if agent tries to mark as paid', async () => {
      await expect(
        service.markAsPaid(agencyId, 'AGENT', commissionId, paymentData),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.markAsPaid(agencyId, 'AGENT', commissionId, paymentData),
      ).rejects.toThrow('Only admins can mark commissions as paid');
    });

    it('should throw NotFoundException if commission not found', async () => {
      prisma.agencyCommission.findFirst.mockResolvedValue(null);

      await expect(
        service.markAsPaid(agencyId, 'ADMIN', commissionId, paymentData),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.markAsPaid(agencyId, 'ADMIN', commissionId, paymentData),
      ).rejects.toThrow('Commission not found');
    });

    it('should throw ForbiddenException if commission is already paid', async () => {
      const mockCommission = createMockCommission({ id: commissionId, status: 'PAID' });

      prisma.agencyCommission.findFirst.mockResolvedValue(mockCommission);

      await expect(
        service.markAsPaid(agencyId, 'ADMIN', commissionId, paymentData),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.markAsPaid(agencyId, 'ADMIN', commissionId, paymentData),
      ).rejects.toThrow('Commission is already paid');
    });
  });

  describe('getSummary', () => {
    const agencyId = 'agency-123';
    const memberId = 'member-123';

    it('should return commission summary', async () => {
      const mockCommissions = [
        { status: 'PENDING', grossAmount: 10000, netAmount: 9000, currency: 'UZS' },
        { status: 'APPROVED', grossAmount: 20000, netAmount: 18000, currency: 'UZS' },
        { status: 'PAID', grossAmount: 15000, netAmount: 13500, currency: 'UZS' },
      ];

      const mockAggregateResult = {
        _sum: {
          grossAmount: 45000,
          netAmount: 40500,
        },
        _count: 3,
      };

      prisma.agencyCommission.findMany.mockResolvedValue(mockCommissions);
      prisma.agencyCommission.aggregate.mockResolvedValue(mockAggregateResult);

      const result = await service.getSummary(agencyId, memberId, 'ADMIN', {});

      expect(result).toEqual({
        total: 40500,
        gross: 45000,
        count: 3,
        pending: { count: 1, total: 9000 },
        approved: { count: 1, total: 18000 },
        paid: { count: 1, total: 13500 },
        disputed: { count: 0, total: 0 },
      });
    });

    it('should restrict agents to their own summary', async () => {
      prisma.agencyCommission.findMany.mockResolvedValue([]);
      prisma.agencyCommission.aggregate.mockResolvedValue({
        _sum: { grossAmount: 0, netAmount: 0 },
        _count: 0,
      });

      await service.getSummary(agencyId, memberId, 'AGENT', {});

      expect(prisma.agencyCommission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            memberId,
          }),
        }),
      );
    });

    it('should support date range filtering', async () => {
      const startDate = '2025-01-01';
      const endDate = '2025-12-31';

      prisma.agencyCommission.findMany.mockResolvedValue([]);
      prisma.agencyCommission.aggregate.mockResolvedValue({
        _sum: { grossAmount: 0, netAmount: 0 },
        _count: 0,
      });

      await service.getSummary(agencyId, memberId, 'ADMIN', { startDate, endDate });

      expect(prisma.agencyCommission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
        }),
      );
    });
  });
});
