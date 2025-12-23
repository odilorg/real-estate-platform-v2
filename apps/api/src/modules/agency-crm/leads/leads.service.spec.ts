import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LeadSource, PropertyType, ListingType, LeadStatus, LeadPriority } from '@repo/database';

// Extended mock PrismaService with Agency CRM models
const mockPrismaService = {
  agencyLead: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  agencyMember: {
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
    agencyId: 'agency-123',
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
    agencyId: 'agency-123',
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
    const agencyId = 'agency-123';
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

      prisma.agencyLead.create.mockResolvedValue(mockLead);

      const result = await service.create(agencyId, createDto);

      expect(result).toEqual(mockLead);
      expect(prisma.agencyLead.create).toHaveBeenCalledWith({
        data: {
          agencyId,
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
      prisma.agencyLead.create.mockResolvedValue(mockLead);

      const result = await service.create(agencyId, minimalDto);

      expect(result).toEqual(mockLead);
      expect(prisma.agencyLead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agencyId,
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

      prisma.agencyLead.create.mockResolvedValue(mockLead);

      const result = await service.create(agencyId, dtoWithAssignee);

      expect(result.assignedTo).toBeDefined();
      expect(result.assignedTo?.user.firstName).toBe('Agent');
    });
  });

  describe('findAll', () => {
    const agencyId = 'agency-123';

    it('should return paginated leads with default values', async () => {
      const mockLeads = Array.from({ length: 3 }, (_, i) =>
        createMockLead({
          id: `lead-${i}`,
          firstName: `Lead ${i}`,
        }),
      );

      prisma.agencyLead.findMany.mockResolvedValue(mockLeads);
      prisma.agencyLead.count.mockResolvedValue(50);

      const result = await service.findAll(agencyId, {});

      expect(result.leads).toEqual(mockLeads);
      expect(result.total).toBe(50);
      expect(result.skip).toBe(0);
      expect(result.take).toBe(20);
      expect(prisma.agencyLead.findMany).toHaveBeenCalledWith({
        where: { agencyId },
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
      prisma.agencyLead.findMany.mockResolvedValue([]);
      prisma.agencyLead.count.mockResolvedValue(100);

      const result = await service.findAll(agencyId, {
        skip: 20,
        take: 10,
      });

      expect(result.skip).toBe(20);
      expect(result.take).toBe(10);
      expect(prisma.agencyLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });

    it('should filter by status', async () => {
      prisma.agencyLead.findMany.mockResolvedValue([]);
      prisma.agencyLead.count.mockResolvedValue(0);

      await service.findAll(agencyId, { status: 'CONTACTED' as LeadStatus });

      expect(prisma.agencyLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            status: 'CONTACTED',
          }),
        }),
      );
    });

    it('should filter by assignedToId', async () => {
      prisma.agencyLead.findMany.mockResolvedValue([]);
      prisma.agencyLead.count.mockResolvedValue(0);

      await service.findAll(agencyId, { assignedToId: 'member-123' });

      expect(prisma.agencyLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            assignedToId: 'member-123',
          }),
        }),
      );
    });

    it('should filter by source', async () => {
      prisma.agencyLead.findMany.mockResolvedValue([]);
      prisma.agencyLead.count.mockResolvedValue(0);

      await service.findAll(agencyId, { source: LeadSource.SOCIAL_MEDIA });

      expect(prisma.agencyLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            source: LeadSource.SOCIAL_MEDIA,
          }),
        }),
      );
    });

    it('should filter by priority', async () => {
      prisma.agencyLead.findMany.mockResolvedValue([]);
      prisma.agencyLead.count.mockResolvedValue(0);

      await service.findAll(agencyId, { priority: 'URGENT' as LeadPriority });

      expect(prisma.agencyLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            priority: 'URGENT',
          }),
        }),
      );
    });

    it('should search across multiple fields', async () => {
      prisma.agencyLead.findMany.mockResolvedValue([]);
      prisma.agencyLead.count.mockResolvedValue(0);

      await service.findAll(agencyId, { search: 'john' });

      expect(prisma.agencyLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
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
      prisma.agencyLead.findMany.mockResolvedValue([]);
      prisma.agencyLead.count.mockResolvedValue(0);

      await service.findAll(agencyId, {
        status: 'NEW' as LeadStatus,
        priority: 'HIGH' as LeadPriority,
        source: LeadSource.WEBSITE,
      });

      expect(prisma.agencyLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            status: 'NEW',
            priority: 'HIGH',
            source: LeadSource.WEBSITE,
          }),
        }),
      );
    });

    it('should order by priority (asc) then createdAt (desc)', async () => {
      prisma.agencyLead.findMany.mockResolvedValue([]);
      prisma.agencyLead.count.mockResolvedValue(0);

      await service.findAll(agencyId, {});

      expect(prisma.agencyLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        }),
      );
    });

    it('should return empty array when no leads exist', async () => {
      prisma.agencyLead.findMany.mockResolvedValue([]);
      prisma.agencyLead.count.mockResolvedValue(0);

      const result = await service.findAll(agencyId, {});

      expect(result.leads).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    const agencyId = 'agency-123';
    const leadId = 'lead-123';

    it('should return lead with activities and tasks', async () => {
      const mockLead = createMockLead({
        id: leadId,
        agencyId,
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

      prisma.agencyLead.findUnique.mockResolvedValue(mockLead);

      const result = await service.findOne(agencyId, leadId);

      expect(result).toEqual(mockLead);
      expect(result.activities).toBeDefined();
      expect(result.tasks).toBeDefined();
      expect(prisma.agencyLead.findUnique).toHaveBeenCalledWith({
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
      prisma.agencyLead.findUnique.mockResolvedValue(null);

      await expect(service.findOne(agencyId, leadId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if lead belongs to different agency', async () => {
      const mockLead = createMockLead({
        id: leadId,
        agencyId: 'different-agency',
      });

      prisma.agencyLead.findUnique.mockResolvedValue(mockLead);

      await expect(service.findOne(agencyId, leadId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOne(agencyId, leadId)).rejects.toThrow(
        'Access denied',
      );
    });

    it('should limit activities to 10 most recent', async () => {
      const mockLead = createMockLead({ id: leadId, agencyId });
      prisma.agencyLead.findUnique.mockResolvedValue(mockLead);

      await service.findOne(agencyId, leadId);

      expect(prisma.agencyLead.findUnique).toHaveBeenCalledWith(
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
      const mockLead = createMockLead({ id: leadId, agencyId });
      prisma.agencyLead.findUnique.mockResolvedValue(mockLead);

      await service.findOne(agencyId, leadId);

      expect(prisma.agencyLead.findUnique).toHaveBeenCalledWith(
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
    const agencyId = 'agency-123';
    const leadId = 'lead-123';
    const updateDto = {
      firstName: 'Updated',
      lastName: 'Name',
      status: 'CONTACTED' as LeadStatus,
      priority: 'URGENT' as LeadPriority,
      notes: 'Updated notes',
    };

    it('should update lead successfully', async () => {
      const existingLead = createMockLead({ id: leadId, agencyId });
      const updatedLead = createMockLead({
        id: leadId,
        agencyId,
        ...updateDto,
      });

      prisma.agencyLead.findUnique.mockResolvedValue(existingLead);
      prisma.agencyLead.update.mockResolvedValue(updatedLead);

      const result = await service.update(agencyId, leadId, updateDto);

      expect(result).toEqual(updatedLead);
      expect(prisma.agencyLead.update).toHaveBeenCalledWith({
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
        agencyId: 'different-agency',
      });

      prisma.agencyLead.findUnique.mockResolvedValue(differentAgencyLead);

      await expect(
        service.update(agencyId, leadId, updateDto),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.agencyLead.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if lead does not exist', async () => {
      prisma.agencyLead.findUnique.mockResolvedValue(null);

      await expect(
        service.update(agencyId, leadId, updateDto),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.agencyLead.update).not.toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const existingLead = createMockLead({ id: leadId, agencyId });
      const partialDto = { status: 'CONTACTED' as LeadStatus };
      const updatedLead = createMockLead({
        id: leadId,
        agencyId,
        status: 'CONTACTED' as LeadStatus,
      });

      prisma.agencyLead.findUnique.mockResolvedValue(existingLead);
      prisma.agencyLead.update.mockResolvedValue(updatedLead);

      await service.update(agencyId, leadId, partialDto);

      expect(prisma.agencyLead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: partialDto,
        }),
      );
    });
  });

  describe('remove', () => {
    const agencyId = 'agency-123';
    const leadId = 'lead-123';

    it('should delete lead successfully', async () => {
      const mockLead = createMockLead({ id: leadId, agencyId });

      prisma.agencyLead.findUnique.mockResolvedValue(mockLead);
      prisma.agencyLead.delete.mockResolvedValue(mockLead);

      const result = await service.remove(agencyId, leadId);

      expect(result).toEqual(mockLead);
      expect(prisma.agencyLead.delete).toHaveBeenCalledWith({
        where: { id: leadId },
      });
    });

    it('should verify ownership before deleting', async () => {
      const differentAgencyLead = createMockLead({
        id: leadId,
        agencyId: 'different-agency',
      });

      prisma.agencyLead.findUnique.mockResolvedValue(differentAgencyLead);

      await expect(service.remove(agencyId, leadId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.agencyLead.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if lead does not exist', async () => {
      prisma.agencyLead.findUnique.mockResolvedValue(null);

      await expect(service.remove(agencyId, leadId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.agencyLead.delete).not.toHaveBeenCalled();
    });
  });

  describe('assign', () => {
    const agencyId = 'agency-123';
    const leadId = 'lead-123';
    const memberId = 'member-123';

    it('should assign lead to member successfully', async () => {
      const mockLead = createMockLead({ id: leadId, agencyId });
      const mockMember = createMockMember({ id: memberId, agencyId });
      const assignedLead = createMockLead({
        id: leadId,
        agencyId,
        assignedToId: memberId,
        assignedAt: expect.any(Date),
      });

      prisma.agencyLead.findUnique.mockResolvedValue(mockLead);
      prisma.agencyMember.findFirst.mockResolvedValue(mockMember);
      prisma.agencyLead.update.mockResolvedValue(assignedLead);

      const result = await service.assign(agencyId, leadId, memberId);

      expect(result.assignedToId).toBe(memberId);
      expect(result.assignedAt).toBeDefined();
      expect(prisma.agencyLead.update).toHaveBeenCalledWith({
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
        agencyId: 'different-agency',
      });

      prisma.agencyLead.findUnique.mockResolvedValue(differentAgencyLead);

      await expect(service.assign(agencyId, leadId, memberId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.agencyMember.findFirst).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if member does not exist', async () => {
      const mockLead = createMockLead({ id: leadId, agencyId });

      prisma.agencyLead.findUnique.mockResolvedValue(mockLead);
      prisma.agencyMember.findFirst.mockResolvedValue(null);

      await expect(service.assign(agencyId, leadId, memberId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.agencyLead.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if member belongs to different agency', async () => {
      const mockLead = createMockLead({ id: leadId, agencyId });

      prisma.agencyLead.findUnique.mockResolvedValue(mockLead);
      prisma.agencyMember.findFirst.mockResolvedValue(null); // Different agency

      await expect(service.assign(agencyId, leadId, memberId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if member is not active', async () => {
      const mockLead = createMockLead({ id: leadId, agencyId });

      prisma.agencyLead.findUnique.mockResolvedValue(mockLead);
      prisma.agencyMember.findFirst.mockResolvedValue(null); // Not active

      await expect(service.assign(agencyId, leadId, memberId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should verify member belongs to same agency and is active', async () => {
      const mockLead = createMockLead({ id: leadId, agencyId });

      prisma.agencyLead.findUnique.mockResolvedValue(mockLead);
      prisma.agencyMember.findFirst.mockResolvedValue(null);

      await expect(service.assign(agencyId, leadId, memberId)).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.agencyMember.findFirst).toHaveBeenCalledWith({
        where: {
          id: memberId,
          agencyId,
          isActive: true,
        },
      });
    });
  });
});
