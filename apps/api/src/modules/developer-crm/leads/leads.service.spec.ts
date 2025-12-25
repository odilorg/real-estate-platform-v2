import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LeadSource, PropertyType, ListingType, LeadStatus, LeadPriority } from '@repo/database';

// Extended mock PrismaService with Developer CRM models
const mockPrismaService = {
  developerLead: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  developerMember: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

describe('LeadsService', () => {
  let service: LeadsService;
  let prisma: typeof mockPrismaService;

  // Mock factory functions
  const createMockLead = (overrides = {}) => ({
    id: 'lead-123',
    developerId: 'agency-123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+998901234567',
    email: 'john@example.com',
    telegram: '@johndoe',
    whatsapp: '+998901234567',
    propertyType: PropertyType.APARTMENT,
    listingType: ListingType.SALE,
    budget: 100000,
    bedrooms: 2,
    districts: ['Юнусабад', 'Мирабад'],
    requirements: 'Need apartment near metro',
    source: LeadSource.WEBSITE,
    status: 'NEW' as LeadStatus,
    priority: 'MEDIUM' as LeadPriority,
    notes: 'Contacted via phone',
    assignedToId: null,
    assignedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });

  const createMockMember = (overrides = {}) => ({
    id: 'member-123',
    developerId: 'agency-123',
    userId: 'user-123',
    role: 'AGENT',
    isActive: true,
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      firstName: 'Agent',
      lastName: 'Smith',
    },
    ...overrides,
  });


  beforeEach(async () => {
    // Reset all mocks
    Object.values(mockPrismaService).forEach((service) => {
      Object.values(service).forEach((method) => {
        if (jest.isMockFunction(method)) {
          method.mockReset();
        }
      });
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    prisma = mockPrismaService;
  });

  describe('create', () => {
    const developerId = 'agency-123';
    const createDto = {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+998909876543',
      email: 'jane@example.com',
      telegram: '@janesmith',
      whatsapp: '+998909876543',
      propertyType: PropertyType.HOUSE,
      listingType: ListingType.RENT_LONG,
      budget: 50000,
      bedrooms: 3,
      districts: ['Чиланзар'],
      requirements: 'Need house with garden',
      source: LeadSource.PHONE_CALL,
      status: 'NEW' as LeadStatus,
      priority: 'HIGH' as LeadPriority,
      notes: 'Urgent request',
    };

    it('should create a new lead successfully', async () => {
      const mockLead = createMockLead({
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        phone: createDto.phone,
      });

      prisma.developerLead.create.mockResolvedValue(mockLead);

      const result = await service.create(developerId, createDto);

      expect(result).toEqual(mockLead);
      expect(prisma.developerLead.create).toHaveBeenCalledWith({
        data: {
          developerId,
          ...createDto,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
    });

    it('should create lead with minimal required fields', async () => {
      const minimalDto = {
        firstName: 'Min',
        lastName: 'Imal',
        phone: '+998901111111',
        source: LeadSource.WEBSITE,
      };

      const mockLead = createMockLead(minimalDto);
      prisma.developerLead.create.mockResolvedValue(mockLead);

      const result = await service.create(developerId, minimalDto);

      expect(result).toEqual(mockLead);
      expect(prisma.developerLead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            developerId,
            firstName: minimalDto.firstName,
            lastName: minimalDto.lastName,
            phone: minimalDto.phone,
            source: LeadSource.WEBSITE,
          }),
        }),
      );
    });

    it('should include assignedTo details if provided', async () => {
      const dtoWithAssignee = {
        ...createDto,
        assignedToId: 'member-123',
      };

      const mockMember = createMockMember();
      const mockLead = createMockLead({
        ...dtoWithAssignee,
        assignedTo: mockMember,
      });

      prisma.developerLead.create.mockResolvedValue(mockLead);

      const result = await service.create(developerId, dtoWithAssignee);

      expect(result.assignedTo).toBeDefined();
      expect(result.assignedTo?.user.firstName).toBe('Agent');
    });
  });

  describe('findAll', () => {
    const developerId = 'agency-123';

    it('should return paginated leads with default values', async () => {
      const mockLeads = Array.from({ length: 3 }, (_, i) =>
        createMockLead({
          id: `lead-${i}`,
          firstName: `Lead ${i}`,
        }),
      );

      prisma.developerLead.findMany.mockResolvedValue(mockLeads);
      prisma.developerLead.count.mockResolvedValue(50);

      const result = await service.findAll(developerId, {});

      expect(result.leads).toEqual(mockLeads);
      expect(result.total).toBe(50);
      expect(result.skip).toBe(0);
      expect(result.take).toBe(20);
      expect(prisma.developerLead.findMany).toHaveBeenCalledWith({
        where: { developerId },
        skip: 0,
        take: 20,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        include: {
          assignedTo: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
    });

    it('should handle pagination correctly', async () => {
      prisma.developerLead.findMany.mockResolvedValue([]);
      prisma.developerLead.count.mockResolvedValue(100);

      const result = await service.findAll(developerId, {
        skip: 20,
        take: 10,
      });

      expect(result.skip).toBe(20);
      expect(result.take).toBe(10);
      expect(prisma.developerLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });

    it('should filter by status', async () => {
      prisma.developerLead.findMany.mockResolvedValue([]);
      prisma.developerLead.count.mockResolvedValue(0);

      await service.findAll(developerId, { status: 'CONTACTED' as LeadStatus });

      expect(prisma.developerLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            developerId,
            status: 'CONTACTED',
          }),
        }),
      );
    });

    it('should filter by assignedToId', async () => {
      prisma.developerLead.findMany.mockResolvedValue([]);
      prisma.developerLead.count.mockResolvedValue(0);

      await service.findAll(developerId, { assignedToId: 'member-123' });

      expect(prisma.developerLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            developerId,
            assignedToId: 'member-123',
          }),
        }),
      );
    });

    it('should filter by source', async () => {
      prisma.developerLead.findMany.mockResolvedValue([]);
      prisma.developerLead.count.mockResolvedValue(0);

      await service.findAll(developerId, { source: LeadSource.SOCIAL_MEDIA });

      expect(prisma.developerLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            developerId,
            source: LeadSource.SOCIAL_MEDIA,
          }),
        }),
      );
    });

    it('should filter by priority', async () => {
      prisma.developerLead.findMany.mockResolvedValue([]);
      prisma.developerLead.count.mockResolvedValue(0);

      await service.findAll(developerId, { priority: 'URGENT' as LeadPriority });

      expect(prisma.developerLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            developerId,
            priority: 'URGENT',
          }),
        }),
      );
    });

    it('should search across multiple fields', async () => {
      prisma.developerLead.findMany.mockResolvedValue([]);
      prisma.developerLead.count.mockResolvedValue(0);

      await service.findAll(developerId, { search: 'john' });

      expect(prisma.developerLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            developerId,
            OR: [
              { firstName: { contains: 'john', mode: 'insensitive' } },
              { lastName: { contains: 'john', mode: 'insensitive' } },
              { phone: { contains: 'john' } },
              { email: { contains: 'john', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should combine multiple filters', async () => {
      prisma.developerLead.findMany.mockResolvedValue([]);
      prisma.developerLead.count.mockResolvedValue(0);

      await service.findAll(developerId, {
        status: 'NEW' as LeadStatus,
        priority: 'HIGH' as LeadPriority,
        source: LeadSource.WEBSITE,
      });

      expect(prisma.developerLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            developerId,
            status: 'NEW',
            priority: 'HIGH',
            source: LeadSource.WEBSITE,
          }),
        }),
      );
    });

    it('should order by priority (asc) then createdAt (desc)', async () => {
      prisma.developerLead.findMany.mockResolvedValue([]);
      prisma.developerLead.count.mockResolvedValue(0);

      await service.findAll(developerId, {});

      expect(prisma.developerLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        }),
      );
    });

    it('should return empty array when no leads exist', async () => {
      prisma.developerLead.findMany.mockResolvedValue([]);
      prisma.developerLead.count.mockResolvedValue(0);

      const result = await service.findAll(developerId, {});

      expect(result.leads).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    const developerId = 'agency-123';
    const leadId = 'lead-123';

    it('should return lead with activities and tasks', async () => {
      const mockLead = createMockLead({
        id: leadId,
        developerId,
        activities: [
          {
            id: 'activity-1',
            type: 'NOTE',
            description: 'Called client',
            createdAt: new Date(),
            member: {
              user: {
                firstName: 'Agent',
                lastName: 'Smith',
              },
            },
          },
        ],
        tasks: [
          {
            id: 'task-1',
            title: 'Follow up call',
            dueDate: new Date(),
            status: 'PENDING',
            assignedTo: {
              user: {
                firstName: 'Agent',
                lastName: 'Smith',
              },
            },
          },
        ],
      });

      prisma.developerLead.findUnique.mockResolvedValue(mockLead);

      const result = await service.findOne(developerId, leadId);

      expect(result).toEqual(mockLead);
      expect(result.activities).toBeDefined();
      expect(result.tasks).toBeDefined();
      expect(prisma.developerLead.findUnique).toHaveBeenCalledWith({
        where: { id: leadId },
        include: {
          assignedTo: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              member: {
                select: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          tasks: {
            where: {
              status: { not: 'COMPLETED' },
            },
            orderBy: { dueDate: 'asc' },
            include: {
              assignedTo: {
                select: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    it('should throw NotFoundException if lead does not exist', async () => {
      prisma.developerLead.findUnique.mockResolvedValue(null);

      await expect(service.findOne(developerId, leadId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if lead belongs to different agency', async () => {
      const mockLead = createMockLead({
        id: leadId,
        developerId: 'different-agency',
      });

      prisma.developerLead.findUnique.mockResolvedValue(mockLead);

      await expect(service.findOne(developerId, leadId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOne(developerId, leadId)).rejects.toThrow(
        'Access denied',
      );
    });

    it('should limit activities to 10 most recent', async () => {
      const mockLead = createMockLead({ id: leadId, developerId });
      prisma.developerLead.findUnique.mockResolvedValue(mockLead);

      await service.findOne(developerId, leadId);

      expect(prisma.developerLead.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            activities: expect.objectContaining({
              take: 10,
            }),
          }),
        }),
      );
    });

    it('should only include non-completed tasks', async () => {
      const mockLead = createMockLead({ id: leadId, developerId });
      prisma.developerLead.findUnique.mockResolvedValue(mockLead);

      await service.findOne(developerId, leadId);

      expect(prisma.developerLead.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            tasks: expect.objectContaining({
              where: {
                status: { not: 'COMPLETED' },
              },
            }),
          }),
        }),
      );
    });
  });

  describe('update', () => {
    const developerId = 'agency-123';
    const leadId = 'lead-123';
    const updateDto = {
      firstName: 'Updated',
      lastName: 'Name',
      status: 'CONTACTED' as LeadStatus,
      priority: 'URGENT' as LeadPriority,
      notes: 'Updated notes',
    };

    it('should update lead successfully', async () => {
      const existingLead = createMockLead({ id: leadId, developerId });
      const updatedLead = createMockLead({
        id: leadId,
        developerId,
        ...updateDto,
      });

      prisma.developerLead.findUnique.mockResolvedValue(existingLead);
      prisma.developerLead.update.mockResolvedValue(updatedLead);

      const result = await service.update(developerId, leadId, updateDto);

      expect(result).toEqual(updatedLead);
      expect(prisma.developerLead.update).toHaveBeenCalledWith({
        where: { id: leadId },
        data: updateDto,
        include: {
          assignedTo: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
    });

    it('should verify ownership before updating', async () => {
      const differentAgencyLead = createMockLead({
        id: leadId,
        developerId: 'different-agency',
      });

      prisma.developerLead.findUnique.mockResolvedValue(differentAgencyLead);

      await expect(
        service.update(developerId, leadId, updateDto),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.developerLead.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if lead does not exist', async () => {
      prisma.developerLead.findUnique.mockResolvedValue(null);

      await expect(
        service.update(developerId, leadId, updateDto),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.developerLead.update).not.toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const existingLead = createMockLead({ id: leadId, developerId });
      const partialDto = { status: 'CONTACTED' as LeadStatus };
      const updatedLead = createMockLead({
        id: leadId,
        developerId,
        status: 'CONTACTED' as LeadStatus,
      });

      prisma.developerLead.findUnique.mockResolvedValue(existingLead);
      prisma.developerLead.update.mockResolvedValue(updatedLead);

      await service.update(developerId, leadId, partialDto);

      expect(prisma.developerLead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: partialDto,
        }),
      );
    });
  });

  describe('remove', () => {
    const developerId = 'agency-123';
    const leadId = 'lead-123';

    it('should delete lead successfully', async () => {
      const mockLead = createMockLead({ id: leadId, developerId });

      prisma.developerLead.findUnique.mockResolvedValue(mockLead);
      prisma.developerLead.delete.mockResolvedValue(mockLead);

      const result = await service.remove(developerId, leadId);

      expect(result).toEqual(mockLead);
      expect(prisma.developerLead.delete).toHaveBeenCalledWith({
        where: { id: leadId },
      });
    });

    it('should verify ownership before deleting', async () => {
      const differentAgencyLead = createMockLead({
        id: leadId,
        developerId: 'different-agency',
      });

      prisma.developerLead.findUnique.mockResolvedValue(differentAgencyLead);

      await expect(service.remove(developerId, leadId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.developerLead.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if lead does not exist', async () => {
      prisma.developerLead.findUnique.mockResolvedValue(null);

      await expect(service.remove(developerId, leadId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.developerLead.delete).not.toHaveBeenCalled();
    });
  });

  describe('assign', () => {
    const developerId = 'agency-123';
    const leadId = 'lead-123';
    const memberId = 'member-123';

    it('should assign lead to member successfully', async () => {
      const mockLead = createMockLead({ id: leadId, developerId });
      const mockMember = createMockMember({ id: memberId, developerId });
      const assignedLead = createMockLead({
        id: leadId,
        developerId,
        assignedToId: memberId,
        assignedAt: expect.any(Date),
      });

      prisma.developerLead.findUnique.mockResolvedValue(mockLead);
      prisma.developerMember.findFirst.mockResolvedValue(mockMember);
      prisma.developerLead.update.mockResolvedValue(assignedLead);

      const result = await service.assign(developerId, leadId, memberId);

      expect(result.assignedToId).toBe(memberId);
      expect(result.assignedAt).toBeDefined();
      expect(prisma.developerLead.update).toHaveBeenCalledWith({
        where: { id: leadId },
        data: {
          assignedToId: memberId,
          assignedAt: expect.any(Date),
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
    });

    it('should verify lead ownership before assigning', async () => {
      const differentAgencyLead = createMockLead({
        id: leadId,
        developerId: 'different-agency',
      });

      prisma.developerLead.findUnique.mockResolvedValue(differentAgencyLead);

      await expect(service.assign(developerId, leadId, memberId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.developerMember.findFirst).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if member does not exist', async () => {
      const mockLead = createMockLead({ id: leadId, developerId });

      prisma.developerLead.findUnique.mockResolvedValue(mockLead);
      prisma.developerMember.findFirst.mockResolvedValue(null);

      await expect(service.assign(developerId, leadId, memberId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.developerLead.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if member belongs to different agency', async () => {
      const mockLead = createMockLead({ id: leadId, developerId });

      prisma.developerLead.findUnique.mockResolvedValue(mockLead);
      prisma.developerMember.findFirst.mockResolvedValue(null); // Different agency

      await expect(service.assign(developerId, leadId, memberId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if member is not active', async () => {
      const mockLead = createMockLead({ id: leadId, developerId });

      prisma.developerLead.findUnique.mockResolvedValue(mockLead);
      prisma.developerMember.findFirst.mockResolvedValue(null); // Not active

      await expect(service.assign(developerId, leadId, memberId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should verify member belongs to same agency and is active', async () => {
      const mockLead = createMockLead({ id: leadId, developerId });

      prisma.developerLead.findUnique.mockResolvedValue(mockLead);
      prisma.developerMember.findFirst.mockResolvedValue(null);

      await expect(service.assign(developerId, leadId, memberId)).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.developerMember.findFirst).toHaveBeenCalledWith({
        where: {
          id: memberId,
          developerId,
          isActive: true,
        },
      });
    });
  });
});
