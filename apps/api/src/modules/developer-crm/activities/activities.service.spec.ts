import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

// Extended mock PrismaService
const mockPrismaService: any = {
  developerActivity: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
  developerLead: {
    findFirst: jest.fn(),
  },
  developerMember: {
    findFirst: jest.fn(),
  },
};

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let prisma: typeof mockPrismaService;

  const createMockActivity = (overrides = {}) => ({
    id: 'activity-123',
    developerId: 'agency-123',
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
    developerId: 'agency-123',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+998901234567',
    ...overrides,
  });

  const createMockMember = (overrides = {}) => ({
    id: 'member-123',
    developerId: 'agency-123',
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
    const developerId = 'agency-123';
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

      prisma.developerLead.findFirst.mockResolvedValue(mockLead);
      prisma.developerMember.findFirst.mockResolvedValue(mockMember);
      prisma.developerActivity.create.mockResolvedValue(mockActivity);

      const result = await service.create(developerId, memberId, createDto as any);

      expect(result).toEqual(mockActivity);
      expect(prisma.developerLead.findFirst).toHaveBeenCalledWith({
        where: { id: createDto.leadId, developerId },
      });
      expect(prisma.developerMember.findFirst).toHaveBeenCalledWith({
        where: { id: memberId, developerId },
      });
      expect(prisma.developerActivity.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if lead not found', async () => {
      prisma.developerLead.findFirst.mockResolvedValue(null);

      await expect(
        service.create(developerId, memberId, createDto as any),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create(developerId, memberId, createDto as any),
      ).rejects.toThrow('Lead not found');
    });

    it('should throw NotFoundException if member not found', async () => {
      const mockLead = createMockLead();

      prisma.developerLead.findFirst.mockResolvedValue(mockLead);
      prisma.developerMember.findFirst.mockResolvedValue(null);

      await expect(
        service.create(developerId, memberId, createDto as any),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create(developerId, memberId, createDto as any),
      ).rejects.toThrow('Member not found');
    });

    it('should include memberId and developerId in activity data', async () => {
      const mockLead = createMockLead();
      const mockMember = createMockMember();
      const mockActivity = createMockActivity();

      prisma.developerLead.findFirst.mockResolvedValue(mockLead);
      prisma.developerMember.findFirst.mockResolvedValue(mockMember);
      prisma.developerActivity.create.mockResolvedValue(mockActivity);

      await service.create(developerId, memberId, createDto as any);

      expect(prisma.developerActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            developerId,
            memberId,
            leadId: createDto.leadId,
          }),
        }),
      );
    });
  });

  describe('findByLead', () => {
    const developerId = 'agency-123';
    const leadId = 'lead-123';

    it('should return activities for a lead', async () => {
      const mockLead = createMockLead({ id: leadId });
      const mockActivities = Array.from({ length: 3 }, (_, i) =>
        createMockActivity({ id: `activity-${i}`, leadId }),
      );

      prisma.developerLead.findFirst.mockResolvedValue(mockLead);
      prisma.developerActivity.findMany.mockResolvedValue(mockActivities);

      const result = await service.findByLead(developerId, leadId);

      expect(result).toEqual(mockActivities);
      expect(prisma.developerLead.findFirst).toHaveBeenCalledWith({
        where: { id: leadId, developerId },
      });
      expect(prisma.developerActivity.findMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException if lead not found', async () => {
      prisma.developerLead.findFirst.mockResolvedValue(null);

      await expect(service.findByLead(developerId, leadId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByLead(developerId, leadId)).rejects.toThrow(
        'Lead not found',
      );
    });

    it('should order activities by createdAt descending', async () => {
      const mockLead = createMockLead({ id: leadId });

      prisma.developerLead.findFirst.mockResolvedValue(mockLead);
      prisma.developerActivity.findMany.mockResolvedValue([]);

      await service.findByLead(developerId, leadId);

      expect(prisma.developerActivity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('delete', () => {
    const developerId = 'agency-123';
    const activityId = 'activity-123';

    it('should delete an activity successfully', async () => {
      const mockActivity = createMockActivity({ id: activityId, developerId });

      prisma.developerActivity.findFirst.mockResolvedValue(mockActivity);
      prisma.developerActivity.delete.mockResolvedValue(mockActivity);

      const result = await service.delete(developerId, activityId);

      expect(result).toEqual(mockActivity);
      expect(prisma.developerActivity.delete).toHaveBeenCalledWith({
        where: { id: activityId },
      });
    });

    it('should throw NotFoundException if activity not found', async () => {
      prisma.developerActivity.findFirst.mockResolvedValue(null);

      await expect(service.delete(developerId, activityId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.delete(developerId, activityId)).rejects.toThrow(
        'Activity not found',
      );
    });

    it('should verify activity belongs to agency', async () => {
      const mockActivity = createMockActivity({ id: activityId, developerId });

      prisma.developerActivity.findFirst.mockResolvedValue(mockActivity);
      prisma.developerActivity.delete.mockResolvedValue(mockActivity);

      await service.delete(developerId, activityId);

      expect(prisma.developerActivity.findFirst).toHaveBeenCalledWith({
        where: { id: activityId, developerId },
      });
    });
  });
});
