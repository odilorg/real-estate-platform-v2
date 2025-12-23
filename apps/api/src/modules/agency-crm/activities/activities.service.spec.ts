import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

// Extended mock PrismaService
const mockPrismaService: any = {
  agencyActivity: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
  agencyLead: {
    findFirst: jest.fn(),
  },
  agencyMember: {
    findFirst: jest.fn(),
  },
};

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let prisma: typeof mockPrismaService;

  const createMockActivity = (overrides = {}) => ({
    id: 'activity-123',
    agencyId: 'agency-123',
    memberId: 'member-123',
    leadId: 'lead-123',
    type: 'CALL',
    title: 'Follow-up call',
    description: 'Discussed property details',
    createdAt: new Date(),
    updatedAt: new Date(),
    member: {
      id: 'member-123',
      user: {
        firstName: 'John',
        lastName: 'Doe',
      },
    },
    ...overrides,
  });

  const createMockLead = (overrides = {}) => ({
    id: 'lead-123',
    agencyId: 'agency-123',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+998901234567',
    ...overrides,
  });

  const createMockMember = (overrides = {}) => ({
    id: 'member-123',
    agencyId: 'agency-123',
    userId: 'user-123',
    role: 'AGENT',
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
        ActivitiesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    prisma = mockPrismaService;
  });

  describe('create', () => {
    const agencyId = 'agency-123';
    const memberId = 'member-123';
    const createDto = {
      leadId: 'lead-123',
      type: 'CALL',
      title: 'Follow-up call',
      description: 'Discussed property details',
    };

    it('should create an activity successfully', async () => {
      const mockLead = createMockLead();
      const mockMember = createMockMember();
      const mockActivity = createMockActivity();

      prisma.agencyLead.findFirst.mockResolvedValue(mockLead);
      prisma.agencyMember.findFirst.mockResolvedValue(mockMember);
      prisma.agencyActivity.create.mockResolvedValue(mockActivity);

      const result = await service.create(agencyId, memberId, createDto as any);

      expect(result).toEqual(mockActivity);
      expect(prisma.agencyLead.findFirst).toHaveBeenCalledWith({
        where: { id: createDto.leadId, agencyId },
      });
      expect(prisma.agencyMember.findFirst).toHaveBeenCalledWith({
        where: { id: memberId, agencyId },
      });
      expect(prisma.agencyActivity.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if lead not found', async () => {
      prisma.agencyLead.findFirst.mockResolvedValue(null);

      await expect(
        service.create(agencyId, memberId, createDto as any),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create(agencyId, memberId, createDto as any),
      ).rejects.toThrow('Lead not found');
    });

    it('should throw NotFoundException if member not found', async () => {
      const mockLead = createMockLead();

      prisma.agencyLead.findFirst.mockResolvedValue(mockLead);
      prisma.agencyMember.findFirst.mockResolvedValue(null);

      await expect(
        service.create(agencyId, memberId, createDto as any),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create(agencyId, memberId, createDto as any),
      ).rejects.toThrow('Member not found');
    });

    it('should include memberId and agencyId in activity data', async () => {
      const mockLead = createMockLead();
      const mockMember = createMockMember();
      const mockActivity = createMockActivity();

      prisma.agencyLead.findFirst.mockResolvedValue(mockLead);
      prisma.agencyMember.findFirst.mockResolvedValue(mockMember);
      prisma.agencyActivity.create.mockResolvedValue(mockActivity);

      await service.create(agencyId, memberId, createDto as any);

      expect(prisma.agencyActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agencyId,
            memberId,
            leadId: createDto.leadId,
          }),
        }),
      );
    });
  });

  describe('findByLead', () => {
    const agencyId = 'agency-123';
    const leadId = 'lead-123';

    it('should return activities for a lead', async () => {
      const mockLead = createMockLead({ id: leadId });
      const mockActivities = Array.from({ length: 3 }, (_, i) =>
        createMockActivity({ id: `activity-${i}`, leadId }),
      );

      prisma.agencyLead.findFirst.mockResolvedValue(mockLead);
      prisma.agencyActivity.findMany.mockResolvedValue(mockActivities);

      const result = await service.findByLead(agencyId, leadId);

      expect(result).toEqual(mockActivities);
      expect(prisma.agencyLead.findFirst).toHaveBeenCalledWith({
        where: { id: leadId, agencyId },
      });
      expect(prisma.agencyActivity.findMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException if lead not found', async () => {
      prisma.agencyLead.findFirst.mockResolvedValue(null);

      await expect(service.findByLead(agencyId, leadId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByLead(agencyId, leadId)).rejects.toThrow(
        'Lead not found',
      );
    });

    it('should order activities by createdAt descending', async () => {
      const mockLead = createMockLead({ id: leadId });

      prisma.agencyLead.findFirst.mockResolvedValue(mockLead);
      prisma.agencyActivity.findMany.mockResolvedValue([]);

      await service.findByLead(agencyId, leadId);

      expect(prisma.agencyActivity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('delete', () => {
    const agencyId = 'agency-123';
    const activityId = 'activity-123';

    it('should delete an activity successfully', async () => {
      const mockActivity = createMockActivity({ id: activityId, agencyId });

      prisma.agencyActivity.findFirst.mockResolvedValue(mockActivity);
      prisma.agencyActivity.delete.mockResolvedValue(mockActivity);

      const result = await service.delete(agencyId, activityId);

      expect(result).toEqual(mockActivity);
      expect(prisma.agencyActivity.delete).toHaveBeenCalledWith({
        where: { id: activityId },
      });
    });

    it('should throw NotFoundException if activity not found', async () => {
      prisma.agencyActivity.findFirst.mockResolvedValue(null);

      await expect(service.delete(agencyId, activityId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.delete(agencyId, activityId)).rejects.toThrow(
        'Activity not found',
      );
    });

    it('should verify activity belongs to agency', async () => {
      const mockActivity = createMockActivity({ id: activityId, agencyId });

      prisma.agencyActivity.findFirst.mockResolvedValue(mockActivity);
      prisma.agencyActivity.delete.mockResolvedValue(mockActivity);

      await service.delete(agencyId, activityId);

      expect(prisma.agencyActivity.findFirst).toHaveBeenCalledWith({
        where: { id: activityId, agencyId },
      });
    });
  });
});
