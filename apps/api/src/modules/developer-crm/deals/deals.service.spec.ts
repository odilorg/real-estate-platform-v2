import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DealsService } from './deals.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Currency, DealStage, DealStatus, DealType } from './dto/create-deal.dto';

// Extended mock PrismaService
const mockPrismaService: any = {
  developerDeal: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  developerLead: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  developerMember: {
    findFirst: jest.fn(),
  },
  developerCRM: {
    findUnique: jest.fn(),
  },
  developerCommission: {
    create: jest.fn(),
  },
  developerActivity: {
    create: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaService)),
};

describe('DealsService', () => {
  let service: DealsService;
  let prisma: typeof mockPrismaService;

  const createMockDeal = (overrides = {}) => ({
    id: 'deal-123',
    developerId: 'agency-123',
    leadId: 'lead-123',
    propertyId: 'property-123',
    ownerId: 'member-123',
    dealValue: 100000,
    currency: Currency.YE,
    commissionRate: 3.0,
    commissionAmount: 3000,
    stage: DealStage.QUALIFIED,
    status: DealStatus.ACTIVE,
    probability: 50,
    expectedCloseDate: new Date('2024-12-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockLead = (overrides = {}) => ({
    id: 'lead-123',
    developerId: 'agency-123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+998901234567',
    email: 'john@example.com',
    status: 'QUALIFIED',
    ...overrides,
  });

  const createMockMember = (overrides = {}) => ({
    id: 'member-123',
    developerId: 'agency-123',
    userId: 'user-123',
    role: 'AGENT',
    isActive: true,
    user: {
      firstName: 'Agent',
      lastName: 'Smith',
    },
    ...overrides,
  });

  const createMockDeveloperCRM = (overrides = {}) => ({
    id: 'crm-123',
    developerId: 'agency-123',
    defaultCommissionRate: 3.0,
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
        DealsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DealsService>(DealsService);
    prisma = mockPrismaService;
  });

  describe('create', () => {
    const developerId = 'agency-123';
    const memberId = 'member-123';
    const createDto = {
      leadId: 'lead-123',
      propertyId: 'property-123',
      ownerId: 'member-123',
      dealType: DealType.BUYER,
      dealValue: 100000,
      currency: Currency.YE,
      commissionRate: 3.0,
      stage: DealStage.QUALIFIED,
      expectedCloseDate: '2024-12-31',
    };

    it('should create a deal successfully', async () => {
      const mockLead = createMockLead();
      const mockMember = createMockMember();
      const mockDeal = createMockDeal();

      prisma.developerLead.findFirst.mockResolvedValue(mockLead);
      prisma.developerDeal.findUnique.mockResolvedValue(null);
      prisma.developerMember.findFirst.mockResolvedValue(mockMember);
      prisma.developerCRM.findUnique.mockResolvedValue(null);
      prisma.developerDeal.create.mockResolvedValue(mockDeal);
      prisma.developerLead.update.mockResolvedValue(mockLead);

      const result = await service.create(developerId, memberId, createDto);

      expect(result).toEqual(mockDeal);
      expect(prisma.developerLead.findFirst).toHaveBeenCalledWith({
        where: { id: createDto.leadId, developerId },
      });
      expect(prisma.developerDeal.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if lead not found', async () => {
      prisma.developerLead.findFirst.mockResolvedValue(null);

      await expect(
        service.create(developerId, memberId, createDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create(developerId, memberId, createDto),
      ).rejects.toThrow('Lead not found');
    });

    it('should throw BadRequestException if lead already has a deal', async () => {
      const mockLead = createMockLead();
      const existingDeal = createMockDeal();

      prisma.developerLead.findFirst.mockResolvedValue(mockLead);
      prisma.developerDeal.findUnique.mockResolvedValue(existingDeal);

      await expect(
        service.create(developerId, memberId, createDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(developerId, memberId, createDto),
      ).rejects.toThrow('Lead already has a deal');
    });

    it('should throw NotFoundException if owner not found', async () => {
      const mockLead = createMockLead();

      prisma.developerLead.findFirst.mockResolvedValue(mockLead);
      prisma.developerDeal.findUnique.mockResolvedValue(null);
      prisma.developerMember.findFirst.mockResolvedValue(null);

      await expect(
        service.create(developerId, memberId, createDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create(developerId, memberId, createDto),
      ).rejects.toThrow('Deal owner not found or inactive');
    });

    it('should use default commission rate if not provided', async () => {
      const mockLead = createMockLead();
      const mockMember = createMockMember();
      const mockDeveloperCRM = createMockDeveloperCRM({ defaultCommissionRate: 5.0 });
      const dtoWithoutCommission = { ...createDto, commissionRate: undefined };

      prisma.developerLead.findFirst.mockResolvedValue(mockLead);
      prisma.developerDeal.findUnique.mockResolvedValue(null);
      prisma.developerMember.findFirst.mockResolvedValue(mockMember);
      prisma.developerCRM.findUnique.mockResolvedValue(mockDeveloperCRM);
      prisma.developerDeal.create.mockResolvedValue(createMockDeal());
      prisma.developerLead.update.mockResolvedValue(mockLead);

      await service.create(developerId, memberId, dtoWithoutCommission as any);

      expect(prisma.developerCRM.findUnique).toHaveBeenCalledWith({
        where: { developerId },
      });
      expect(prisma.developerDeal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            commissionRate: 5.0,
            commissionAmount: 5000, // 100000 * 5 / 100
          }),
        }),
      );
    });

    it('should calculate commission amount correctly', async () => {
      const mockLead = createMockLead();
      const mockMember = createMockMember();

      prisma.developerLead.findFirst.mockResolvedValue(mockLead);
      prisma.developerDeal.findUnique.mockResolvedValue(null);
      prisma.developerMember.findFirst.mockResolvedValue(mockMember);
      prisma.developerCRM.findUnique.mockResolvedValue(null);
      prisma.developerDeal.create.mockResolvedValue(createMockDeal());
      prisma.developerLead.update.mockResolvedValue(mockLead);

      await service.create(developerId, memberId, createDto);

      expect(prisma.developerDeal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            commissionAmount: 3000, // 100000 * 3 / 100
          }),
        }),
      );
    });

    it('should update lead status to CONVERTED', async () => {
      const mockLead = createMockLead();
      const mockMember = createMockMember();
      const mockDeal = createMockDeal();

      prisma.developerLead.findFirst.mockResolvedValue(mockLead);
      prisma.developerDeal.findUnique.mockResolvedValue(null);
      prisma.developerMember.findFirst.mockResolvedValue(mockMember);
      prisma.developerCRM.findUnique.mockResolvedValue(null);
      prisma.developerDeal.create.mockResolvedValue(mockDeal);
      prisma.developerLead.update.mockResolvedValue(mockLead);

      await service.create(developerId, memberId, createDto);

      expect(prisma.developerLead.update).toHaveBeenCalledWith({
        where: { id: createDto.leadId },
        data: {
          status: 'CONVERTED',
          convertedAt: expect.any(Date),
          convertedToDealId: mockDeal.id,
          conversionValue: createDto.dealValue,
        },
      });
    });

    it('should set default values for stage, status, and probability', async () => {
      const mockLead = createMockLead();
      const mockMember = createMockMember();
      const dtoWithoutDefaults = {
        leadId: 'lead-123',
        propertyId: 'property-123',
        ownerId: 'member-123',
        dealValue: 100000,
      };

      prisma.developerLead.findFirst.mockResolvedValue(mockLead);
      prisma.developerDeal.findUnique.mockResolvedValue(null);
      prisma.developerMember.findFirst.mockResolvedValue(mockMember);
      prisma.developerCRM.findUnique.mockResolvedValue(null);
      prisma.developerDeal.create.mockResolvedValue(createMockDeal());
      prisma.developerLead.update.mockResolvedValue(mockLead);

      await service.create(developerId, memberId, dtoWithoutDefaults as any);

      expect(prisma.developerDeal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stage: 'QUALIFIED',
            status: 'ACTIVE',
            probability: 50,
            currency: 'YE',
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    const developerId = 'agency-123';
    const memberId = 'member-123';
    const role = 'AGENT';

    it('should return paginated deals', async () => {
      const mockDeals = Array.from({ length: 3 }, (_, i) =>
        createMockDeal({ id: `deal-${i}` }),
      );

      prisma.developerDeal.findMany.mockResolvedValue(mockDeals);
      prisma.developerDeal.count.mockResolvedValue(50);

      const result = await service.findAll(developerId, memberId, role, {});

      expect(result.data).toEqual(mockDeals);
      expect(result.meta.total).toBe(50);
      expect(prisma.developerDeal.findMany).toHaveBeenCalled();
    });

    it('should filter deals by owner for non-admin roles', async () => {
      prisma.developerDeal.findMany.mockResolvedValue([]);
      prisma.developerDeal.count.mockResolvedValue(0);

      await service.findAll(developerId, memberId, 'AGENT', {});

      expect(prisma.developerDeal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            developerId,
            ownerId: memberId,
          }),
        }),
      );
    });

    it('should show all deals for admin role', async () => {
      prisma.developerDeal.findMany.mockResolvedValue([]);
      prisma.developerDeal.count.mockResolvedValue(0);

      await service.findAll(developerId, memberId, 'ADMIN', {});

      expect(prisma.developerDeal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            developerId,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    const developerId = 'agency-123';
    const memberId = 'member-123';
    const dealId = 'deal-123';

    it('should return deal for owner', async () => {
      const mockDeal = createMockDeal({ id: dealId, ownerId: memberId });

      prisma.developerDeal.findFirst.mockResolvedValue(mockDeal);

      const result = await service.findOne(developerId, memberId, 'AGENT', dealId);

      expect(result).toEqual(mockDeal);
    });

    it('should throw NotFoundException if deal not found', async () => {
      prisma.developerDeal.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(developerId, memberId, 'AGENT', dealId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not owner and not admin', async () => {
      const mockDeal = createMockDeal({ id: dealId, ownerId: 'other-member' });

      prisma.developerDeal.findFirst.mockResolvedValue(mockDeal);

      await expect(
        service.findOne(developerId, memberId, 'AGENT', dealId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to access any deal', async () => {
      const mockDeal = createMockDeal({ id: dealId, ownerId: 'other-member' });

      prisma.developerDeal.findFirst.mockResolvedValue(mockDeal);

      const result = await service.findOne(developerId, memberId, 'ADMIN', dealId);

      expect(result).toEqual(mockDeal);
    });
  });

  describe('update', () => {
    const developerId = 'agency-123';
    const memberId = 'member-123';
    const dealId = 'deal-123';
    const updateDto = {
      stage: DealStage.NEGOTIATION,
      probability: 75,
      dealValue: 120000,
    };

    it('should update deal successfully', async () => {
      const existingDeal = createMockDeal({ id: dealId, ownerId: memberId });
      const updatedDeal = createMockDeal({ ...existingDeal, ...updateDto });

      prisma.developerDeal.findFirst.mockResolvedValue(existingDeal);
      prisma.developerDeal.update.mockResolvedValue(updatedDeal);
      prisma.developerActivity.create.mockResolvedValue({});

      const result = await service.update(
        developerId,
        memberId,
        'AGENT',
        dealId,
        updateDto,
      );

      expect(result).toEqual(updatedDeal);
      expect(prisma.developerDeal.update).toHaveBeenCalled();
    });

    it('should recalculate commission if dealValue changes', async () => {
      const existingDeal = createMockDeal({ id: dealId, ownerId: memberId });

      prisma.developerDeal.findFirst.mockResolvedValue(existingDeal);
      prisma.developerDeal.update.mockResolvedValue(createMockDeal());
      prisma.developerActivity.create.mockResolvedValue({});

      await service.update(developerId, memberId, 'AGENT', dealId, updateDto);

      expect(prisma.developerDeal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            commissionAmount: 3600, // 120000 * 3 / 100
          }),
        }),
      );
    });
  });

  describe('delete', () => {
    const developerId = 'agency-123';
    const memberId = 'member-123';
    const dealId = 'deal-123';

    it('should delete deal successfully', async () => {
      const mockDeal = createMockDeal({ id: dealId, ownerId: memberId });

      prisma.developerDeal.findFirst.mockResolvedValue(mockDeal);
      prisma.developerDeal.delete.mockResolvedValue(mockDeal);

      const result = await service.delete(developerId, memberId, 'ADMIN', dealId);

      expect(result).toEqual({ success: true });
      expect(prisma.developerDeal.delete).toHaveBeenCalledWith({
        where: { id: dealId },
      });
    });

    it('should only allow admin to delete', async () => {
      const mockDeal = createMockDeal({ id: dealId, ownerId: memberId });

      prisma.developerDeal.findFirst.mockResolvedValue(mockDeal);

      await expect(
        service.delete(developerId, memberId, 'AGENT', dealId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getPipeline', () => {
    const developerId = 'agency-123';
    const memberId = 'member-123';

    it('should return pipeline statistics for all stages', async () => {
      const mockDeals = [
        createMockDeal({ stage: DealStage.QUALIFIED, dealValue: 100000 }),
        createMockDeal({ stage: DealStage.QUALIFIED, dealValue: 50000 }),
        createMockDeal({ stage: DealStage.NEGOTIATION, dealValue: 75000 }),
      ];

      prisma.developerDeal.findMany.mockResolvedValue(mockDeals);

      const result = await service.getPipeline(developerId, memberId, 'ADMIN');

      expect(result).toBeDefined();
      expect(result.QUALIFIED).toBeDefined();
      expect(result.QUALIFIED.count).toBe(2);
      expect(result.QUALIFIED.totalValue).toBe(150000);
      expect(result.NEGOTIATION).toBeDefined();
      expect(result.NEGOTIATION.count).toBe(1);
      expect(result.NEGOTIATION.totalValue).toBe(75000);
    });
  });
});
