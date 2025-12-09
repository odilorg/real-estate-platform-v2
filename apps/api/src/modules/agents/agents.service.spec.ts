import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { mockPrismaService, resetMocks, TestFactories } from '../../test/test-utils';

describe('AgentsService', () => {
  let service: AgentsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    resetMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    prisma = mockPrismaService;
  });

  describe('register', () => {
    const userId = 'user-123';
    const registerDto = {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+998901234567',
      email: 'agent@example.com',
      bio: 'Experienced real estate agent',
      photo: 'https://example.com/photo.jpg',
      whatsapp: '+998901234567',
      telegram: '@johndoe',
      licenseNumber: 'LIC123456',
      specializations: ['Residential', 'Commercial'],
      languages: ['English', 'Uzbek', 'Russian'],
      areasServed: ['Ташкент', 'Самарканд'],
      yearsExperience: 5,
    };

    it('should register a user as an agent successfully', async () => {
      const mockUser = TestFactories.createUser({ id: userId });
      const mockAgent = TestFactories.createAgent({
        userId,
        ...registerDto,
        user: {
          id: userId,
          email: mockUser.email,
          role: 'AGENT',
        },
      });

      prisma.agent.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            update: jest.fn().mockResolvedValue({ ...mockUser, role: 'AGENT' }),
          },
          agent: {
            create: jest.fn().mockResolvedValue(mockAgent),
          },
        });
      });

      const result = await service.register(userId, registerDto);

      expect(result).toEqual(mockAgent);
      expect(prisma.agent.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should throw ConflictException if user is already an agent', async () => {
      const existingAgent = TestFactories.createAgent({ userId });

      prisma.agent.findUnique.mockResolvedValue(existingAgent);

      await expect(service.register(userId, registerDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.register(userId, registerDto)).rejects.toThrow(
        'User is already registered as an agent'
      );
    });

    it('should throw NotFoundException if agency does not exist', async () => {
      const agencyId = 'agency-123';
      const dtoWithAgency = { ...registerDto, agencyId };

      prisma.agent.findUnique.mockResolvedValue(null);
      prisma.agency.findUnique.mockResolvedValue(null);

      await expect(service.register(userId, dtoWithAgency)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.register(userId, dtoWithAgency)).rejects.toThrow(
        'Agency not found'
      );
    });

    it('should register agent with agency successfully', async () => {
      const agencyId = 'agency-123';
      const mockAgency = TestFactories.createAgency({ id: agencyId });
      const dtoWithAgency = { ...registerDto, agencyId };
      const mockAgent = TestFactories.createAgent({
        userId,
        agencyId,
        agency: mockAgency,
      });

      prisma.agent.findUnique.mockResolvedValue(null);
      prisma.agency.findUnique.mockResolvedValue(mockAgency);
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            update: jest.fn().mockResolvedValue({ role: 'AGENT' }),
          },
          agent: {
            create: jest.fn().mockResolvedValue(mockAgent),
          },
        });
      });

      const result = await service.register(userId, dtoWithAgency);

      expect(result).toEqual(mockAgent);
      expect(prisma.agency.findUnique).toHaveBeenCalledWith({
        where: { id: agencyId },
      });
    });

    it('should update user role to AGENT in transaction', async () => {
      const mockAgent = TestFactories.createAgent({ userId });
      const mockUpdateUser = jest.fn().mockResolvedValue({ role: 'AGENT' });
      const mockCreateAgent = jest.fn().mockResolvedValue(mockAgent);

      prisma.agent.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: { update: mockUpdateUser },
          agent: { create: mockCreateAgent },
        });
      });

      await service.register(userId, registerDto);

      expect(mockUpdateUser).toHaveBeenCalledWith({
        where: { id: userId },
        data: { role: 'AGENT' },
      });
    });

    it('should handle optional fields correctly', async () => {
      const minimalDto = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+998901234567',
        email: 'agent@example.com',
      };

      const mockAgent = TestFactories.createAgent({
        userId,
        ...minimalDto,
        specializations: [],
        languages: [],
        areasServed: [],
        yearsExperience: 0,
      });

      prisma.agent.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            update: jest.fn().mockResolvedValue({ role: 'AGENT' }),
          },
          agent: {
            create: jest.fn().mockResolvedValue(mockAgent),
          },
        });
      });

      const result = await service.register(userId, minimalDto as any);

      expect(result).toBeDefined();
      expect(result.specializations).toEqual([]);
      expect(result.languages).toEqual([]);
      expect(result.areasServed).toEqual([]);
      expect(result.yearsExperience).toBe(0);
    });
  });

  describe('getByUserId', () => {
    const userId = 'user-123';

    it('should return agent profile by user ID', async () => {
      const mockAgent = TestFactories.createAgent({
        userId,
        user: {
          id: userId,
          email: 'agent@example.com',
          role: 'AGENT',
        },
        agency: TestFactories.createAgency(),
      });

      prisma.agent.findUnique.mockResolvedValue(mockAgent as any);

      const result = await service.getByUserId(userId);

      expect(result).toEqual(mockAgent);
      expect(prisma.agent.findUnique).toHaveBeenCalledWith({
        where: { userId },
        include: {
          agency: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if agent profile not found', async () => {
      prisma.agent.findUnique.mockResolvedValue(null);

      await expect(service.getByUserId(userId)).rejects.toThrow(NotFoundException);
      await expect(service.getByUserId(userId)).rejects.toThrow(
        'Agent profile not found'
      );
    });

    it('should include user and agency relations', async () => {
      const mockAgency = TestFactories.createAgency();
      const mockAgent = TestFactories.createAgent({
        userId,
        agencyId: mockAgency.id,
        user: {
          id: userId,
          email: 'agent@example.com',
          role: 'AGENT',
        },
        agency: mockAgency,
      });

      prisma.agent.findUnique.mockResolvedValue(mockAgent as any);

      const result = await service.getByUserId(userId);

      expect((result as any).user).toBeDefined();
      expect((result as any).agency).toBeDefined();
      expect((result as any).agency.id).toBe(mockAgency.id);
    });
  });

  describe('getById', () => {
    const agentId = 'agent-123';

    it('should return agent profile by agent ID', async () => {
      const mockAgent = TestFactories.createAgent({
        id: agentId,
        showPhone: true,
        showEmail: true,
        agency: {
          id: 'agency-123',
          name: 'Test Agency',
          slug: 'test-agency',
          logo: 'https://example.com/logo.jpg',
          city: 'Ташкент',
          verified: true,
        },
      });

      prisma.agent.findUnique.mockResolvedValue(mockAgent as any);

      const result = await service.getById(agentId);

      expect(result).toBeDefined();
      expect(result.id).toBe(agentId);
      expect(prisma.agent.findUnique).toHaveBeenCalledWith({
        where: { id: agentId },
        include: {
          agency: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              city: true,
              verified: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if agent not found', async () => {
      prisma.agent.findUnique.mockResolvedValue(null);

      await expect(service.getById(agentId)).rejects.toThrow(NotFoundException);
      await expect(service.getById(agentId)).rejects.toThrow('Agent not found');
    });

    it('should filter phone if showPhone is false', async () => {
      const mockAgent = TestFactories.createAgent({
        id: agentId,
        phone: '+998901234567',
        showPhone: false,
        showEmail: true,
      });

      prisma.agent.findUnique.mockResolvedValue(mockAgent as any);

      const result = await service.getById(agentId);

      expect(result.phone).toBeNull();
      expect(result.email).not.toBeNull();
    });

    it('should filter email if showEmail is false', async () => {
      const mockAgent = TestFactories.createAgent({
        id: agentId,
        email: 'agent@example.com',
        showPhone: true,
        showEmail: false,
      });

      prisma.agent.findUnique.mockResolvedValue(mockAgent as any);

      const result = await service.getById(agentId);

      expect(result.email).toBeNull();
      expect(result.phone).not.toBeNull();
    });

    it('should filter both phone and email if privacy settings disabled', async () => {
      const mockAgent = TestFactories.createAgent({
        id: agentId,
        phone: '+998901234567',
        email: 'agent@example.com',
        showPhone: false,
        showEmail: false,
      });

      prisma.agent.findUnique.mockResolvedValue(mockAgent as any);

      const result = await service.getById(agentId);

      expect(result.phone).toBeNull();
      expect(result.email).toBeNull();
    });

    it('should show both phone and email if privacy settings enabled', async () => {
      const mockAgent = TestFactories.createAgent({
        id: agentId,
        phone: '+998901234567',
        email: 'agent@example.com',
        showPhone: true,
        showEmail: true,
      });

      prisma.agent.findUnique.mockResolvedValue(mockAgent as any);

      const result = await service.getById(agentId);

      expect(result.phone).toBe('+998901234567');
      expect(result.email).toBe('agent@example.com');
    });
  });

  describe('update', () => {
    const userId = 'user-123';
    const agentId = 'agent-123';

    it('should update agent profile successfully', async () => {
      const existingAgent = TestFactories.createAgent({
        id: agentId,
        userId,
        firstName: 'John',
        lastName: 'Doe',
      });

      const updateDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        bio: 'Updated bio',
        yearsExperience: 10,
      };

      const updatedAgent = {
        ...existingAgent,
        ...updateDto,
      };

      prisma.agent.findUnique.mockResolvedValue(existingAgent as any);
      prisma.agent.update.mockResolvedValue(updatedAgent as any);

      const result = await service.update(userId, updateDto);

      expect(result).toEqual(updatedAgent);
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: { id: agentId },
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          bio: 'Updated bio',
          yearsExperience: 10,
        },
        include: {
          agency: true,
        },
      });
    });

    it('should throw NotFoundException if agent does not exist', async () => {
      prisma.agent.findUnique.mockResolvedValue(null);

      await expect(service.update(userId, { firstName: 'Jane' })).rejects.toThrow(
        NotFoundException
      );
    });

    it('should update only provided fields', async () => {
      const existingAgent = TestFactories.createAgent({
        id: agentId,
        userId,
        firstName: 'John',
        lastName: 'Doe',
        bio: 'Original bio',
      });

      const updateDto = {
        bio: 'Updated bio only',
      };

      prisma.agent.findUnique.mockResolvedValue(existingAgent as any);
      prisma.agent.update.mockResolvedValue({
        ...existingAgent,
        bio: updateDto.bio,
      } as any);

      await service.update(userId, updateDto);

      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: { id: agentId },
        data: {
          bio: 'Updated bio only',
        },
        include: {
          agency: true,
        },
      });
    });

    it('should handle null values for optional fields', async () => {
      const existingAgent = TestFactories.createAgent({
        id: agentId,
        userId,
        bio: 'Some bio',
        photo: 'https://example.com/photo.jpg',
      });

      const updateDto = {
        bio: null,
        photo: null,
      };

      prisma.agent.findUnique.mockResolvedValue(existingAgent as any);
      prisma.agent.update.mockResolvedValue({
        ...existingAgent,
        bio: null,
        photo: null,
      } as any);

      await service.update(userId, updateDto as any);

      expect(prisma.agent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bio: null,
            photo: null,
          }),
        })
      );
    });

    it('should update arrays (specializations, languages, areasServed)', async () => {
      const existingAgent = TestFactories.createAgent({
        id: agentId,
        userId,
        specializations: ['Residential'],
        languages: ['English'],
        areasServed: ['Ташкент'],
      });

      const updateDto = {
        specializations: ['Residential', 'Commercial', 'Luxury'],
        languages: ['English', 'Uzbek', 'Russian'],
        areasServed: ['Ташкент', 'Самарканд', 'Бухара'],
      };

      prisma.agent.findUnique.mockResolvedValue(existingAgent as any);
      prisma.agent.update.mockResolvedValue({
        ...existingAgent,
        ...updateDto,
      } as any);

      await service.update(userId, updateDto);

      expect(prisma.agent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            specializations: updateDto.specializations,
            languages: updateDto.languages,
            areasServed: updateDto.areasServed,
          }),
        })
      );
    });

    it('should update privacy settings', async () => {
      const existingAgent = TestFactories.createAgent({
        id: agentId,
        userId,
        showPhone: true,
        showEmail: true,
      });

      const updateDto = {
        showPhone: false,
        showEmail: false,
      };

      prisma.agent.findUnique.mockResolvedValue(existingAgent as any);
      prisma.agent.update.mockResolvedValue({
        ...existingAgent,
        ...updateDto,
      } as any);

      await service.update(userId, updateDto);

      expect(prisma.agent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            showPhone: false,
            showEmail: false,
          }),
        })
      );
    });

    it('should call getByUserId to verify agent exists', async () => {
      const existingAgent = TestFactories.createAgent({ id: agentId, userId });

      prisma.agent.findUnique.mockResolvedValue(existingAgent as any);
      prisma.agent.update.mockResolvedValue(existingAgent as any);

      await service.update(userId, { bio: 'test' });

      expect(prisma.agent.findUnique).toHaveBeenCalledWith({
        where: { userId },
        include: {
          agency: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated agents list', async () => {
      const mockAgents = Array.from({ length: 5 }, (_, i) =>
        TestFactories.createAgent({
          id: `agent-${i}`,
          firstName: `Agent${i}`,
          agency: {
            id: 'agency-123',
            name: 'Test Agency',
            slug: 'test-agency',
            logo: 'https://example.com/logo.jpg',
            verified: true,
          },
        })
      );

      prisma.agent.findMany.mockResolvedValue(mockAgents as any);
      prisma.agent.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 1, limit: 5 });

      expect(result.agents).toHaveLength(5);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(5);
      expect(prisma.agent.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 5,
        orderBy: [
          { superAgent: 'desc' },
          { verified: 'desc' },
          { rating: 'desc' },
        ],
        include: {
          agency: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              verified: true,
            },
          },
        },
      });
    });

    it('should use default pagination values', async () => {
      prisma.agent.findMany.mockResolvedValue([]);
      prisma.agent.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      );
    });

    it('should filter by city', async () => {
      prisma.agent.findMany.mockResolvedValue([]);
      prisma.agent.count.mockResolvedValue(0);

      await service.findAll({ city: 'Ташкент' });

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            areasServed: { has: 'Ташкент' },
          },
        })
      );
    });

    it('should filter by agencyId', async () => {
      const agencyId = 'agency-123';

      prisma.agent.findMany.mockResolvedValue([]);
      prisma.agent.count.mockResolvedValue(0);

      await service.findAll({ agencyId });

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            agencyId,
          },
        })
      );
    });

    it('should filter by verified status', async () => {
      prisma.agent.findMany.mockResolvedValue([]);
      prisma.agent.count.mockResolvedValue(0);

      await service.findAll({ verified: true });

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            verified: true,
          },
        })
      );
    });

    it('should filter by superAgent status', async () => {
      prisma.agent.findMany.mockResolvedValue([]);
      prisma.agent.count.mockResolvedValue(0);

      await service.findAll({ superAgent: true });

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            superAgent: true,
          },
        })
      );
    });

    it('should combine multiple filters', async () => {
      const agencyId = 'agency-123';

      prisma.agent.findMany.mockResolvedValue([]);
      prisma.agent.count.mockResolvedValue(0);

      await service.findAll({
        city: 'Ташкент',
        agencyId,
        verified: true,
        superAgent: false,
      });

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            areasServed: { has: 'Ташкент' },
            agencyId,
            verified: true,
            superAgent: false,
          },
        })
      );
    });

    it('should filter contact info based on privacy settings', async () => {
      const mockAgents = [
        TestFactories.createAgent({
          id: 'agent-1',
          phone: '+998901234567',
          email: 'agent1@example.com',
          showPhone: true,
          showEmail: true,
        }),
        TestFactories.createAgent({
          id: 'agent-2',
          phone: '+998901234568',
          email: 'agent2@example.com',
          showPhone: false,
          showEmail: false,
        }),
        TestFactories.createAgent({
          id: 'agent-3',
          phone: '+998901234569',
          email: 'agent3@example.com',
          showPhone: true,
          showEmail: false,
        }),
      ];

      prisma.agent.findMany.mockResolvedValue(mockAgents as any);
      prisma.agent.count.mockResolvedValue(3);

      const result = await service.findAll({});

      expect(result.agents[0].phone).not.toBeNull();
      expect(result.agents[0].email).not.toBeNull();
      expect(result.agents[1].phone).toBeNull();
      expect(result.agents[1].email).toBeNull();
      expect(result.agents[2].phone).not.toBeNull();
      expect(result.agents[2].email).toBeNull();
    });

    it('should order by superAgent, verified, and rating', async () => {
      prisma.agent.findMany.mockResolvedValue([]);
      prisma.agent.count.mockResolvedValue(0);

      await service.findAll({});

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { superAgent: 'desc' },
            { verified: 'desc' },
            { rating: 'desc' },
          ],
        })
      );
    });

    it('should handle pagination correctly for page 2', async () => {
      prisma.agent.findMany.mockResolvedValue([]);
      prisma.agent.count.mockResolvedValue(50);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(5);
      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * 10
          take: 10,
        })
      );
    });
  });

  describe('delete', () => {
    const userId = 'user-123';
    const targetUserId = 'target-user-123';
    const agentId = 'agent-123';

    it('should delete own agent profile successfully', async () => {
      const mockUser = TestFactories.createUser({ id: userId, role: 'AGENT' });
      const mockAgent = TestFactories.createAgent({ id: agentId, userId });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agent.findUnique.mockResolvedValue(mockAgent as any);
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          agent: {
            delete: jest.fn().mockResolvedValue(mockAgent),
          },
          user: {
            update: jest.fn().mockResolvedValue({ ...mockUser, role: 'USER' }),
          },
        });
      });

      const result = await service.delete(userId, userId);

      expect(result).toEqual({ message: 'Agent profile deleted successfully' });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prisma.agent.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should allow admin to delete any agent profile', async () => {
      const adminId = 'admin-123';
      const mockAdmin = TestFactories.createUser({ id: adminId, role: 'ADMIN' });
      const mockAgent = TestFactories.createAgent({ id: agentId, userId: targetUserId });

      prisma.user.findUnique.mockResolvedValue(mockAdmin);
      prisma.agent.findUnique.mockResolvedValue(mockAgent as any);
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          agent: {
            delete: jest.fn().mockResolvedValue(mockAgent),
          },
          user: {
            update: jest.fn().mockResolvedValue({ role: 'USER' }),
          },
        });
      });

      const result = await service.delete(adminId, targetUserId);

      expect(result).toEqual({ message: 'Agent profile deleted successfully' });
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.delete(userId, targetUserId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.delete(userId, targetUserId)).rejects.toThrow(
        'User not found'
      );
    });

    it('should throw ForbiddenException if non-admin tries to delete another profile', async () => {
      const mockUser = TestFactories.createUser({ id: userId, role: 'USER' });

      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.delete(userId, targetUserId)).rejects.toThrow(
        ForbiddenException
      );
      await expect(service.delete(userId, targetUserId)).rejects.toThrow(
        'You can only delete your own agent profile'
      );
    });

    it('should throw NotFoundException if agent profile not found', async () => {
      const mockUser = TestFactories.createUser({ id: userId, role: 'AGENT' });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agent.findUnique.mockResolvedValue(null);

      await expect(service.delete(userId, userId)).rejects.toThrow(NotFoundException);
      await expect(service.delete(userId, userId)).rejects.toThrow(
        'Agent profile not found'
      );
    });

    it('should downgrade user role to USER in transaction', async () => {
      const mockUser = TestFactories.createUser({ id: userId, role: 'AGENT' });
      const mockAgent = TestFactories.createAgent({ id: agentId, userId });
      const mockDeleteAgent = jest.fn().mockResolvedValue(mockAgent);
      const mockUpdateUser = jest.fn().mockResolvedValue({ ...mockUser, role: 'USER' });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agent.findUnique.mockResolvedValue(mockAgent as any);
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          agent: { delete: mockDeleteAgent },
          user: { update: mockUpdateUser },
        });
      });

      await service.delete(userId, userId);

      expect(mockDeleteAgent).toHaveBeenCalledWith({
        where: { id: agentId },
      });
      expect(mockUpdateUser).toHaveBeenCalledWith({
        where: { id: userId },
        data: { role: 'USER' },
      });
    });

    it('should allow agent to delete own profile', async () => {
      const mockUser = TestFactories.createUser({ id: userId, role: 'AGENT' });
      const mockAgent = TestFactories.createAgent({ id: agentId, userId });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agent.findUnique.mockResolvedValue(mockAgent as any);
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          agent: { delete: jest.fn().mockResolvedValue(mockAgent) },
          user: { update: jest.fn().mockResolvedValue({ role: 'USER' }) },
        });
      });

      const result = await service.delete(userId, userId);

      expect(result.message).toBe('Agent profile deleted successfully');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete agent lifecycle: register, update, delete', async () => {
      const userId = 'user-123';
      const agentId = 'agent-123';

      // Register
      const registerDto = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+998901234567',
        email: 'agent@example.com',
        bio: 'New agent',
        yearsExperience: 2,
      };

      const mockAgent = TestFactories.createAgent({
        id: agentId,
        userId,
        ...registerDto,
      });

      prisma.agent.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            update: jest.fn().mockResolvedValue({ role: 'AGENT' }),
          },
          agent: {
            create: jest.fn().mockResolvedValue(mockAgent),
          },
        });
      });

      const registeredAgent = await service.register(userId, registerDto as any);
      expect(registeredAgent.yearsExperience).toBe(2);

      // Update
      const updateDto = {
        bio: 'Experienced agent',
        yearsExperience: 5,
      };

      const updatedAgent = {
        ...mockAgent,
        ...updateDto,
      };

      prisma.agent.findUnique.mockResolvedValue(mockAgent as any);
      prisma.agent.update.mockResolvedValue(updatedAgent as any);

      const updated = await service.update(userId, updateDto);
      expect(updated.yearsExperience).toBe(5);

      // Delete
      const mockUser = TestFactories.createUser({ id: userId, role: 'AGENT' });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agent.findUnique.mockResolvedValue(updatedAgent as any);
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          agent: { delete: jest.fn().mockResolvedValue(updatedAgent) },
          user: { update: jest.fn().mockResolvedValue({ role: 'USER' }) },
        });
      });

      const deleteResult = await service.delete(userId, userId);
      expect(deleteResult.message).toBe('Agent profile deleted successfully');
    });

    it('should handle agent with agency relationship', async () => {
      const userId = 'user-123';
      const agencyId = 'agency-123';
      const mockAgency = TestFactories.createAgency({ id: agencyId });

      // Register with agency
      prisma.agent.findUnique.mockResolvedValue(null);
      prisma.agency.findUnique.mockResolvedValue(mockAgency);

      const mockAgent = TestFactories.createAgent({
        userId,
        agencyId,
        agency: mockAgency,
      });

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: { update: jest.fn().mockResolvedValue({ role: 'AGENT' }) },
          agent: { create: jest.fn().mockResolvedValue(mockAgent) },
        });
      });

      const result = await service.register(userId, {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+998901234567',
        email: 'agent@example.com',
        agencyId,
      } as any);

      expect(result.agencyId).toBe(agencyId);

      // Get by ID should include agency
      prisma.agent.findUnique.mockResolvedValue(mockAgent as any);
      const retrieved = await service.getById(mockAgent.id);
      expect((retrieved as any).agency).toBeDefined();
      expect((retrieved as any).agency.id).toBe(agencyId);
    });

    it('should properly filter contact info in public listing', async () => {
      const agents = [
        TestFactories.createAgent({
          id: 'agent-1',
          phone: '+998901234567',
          email: 'agent1@example.com',
          showPhone: true,
          showEmail: false,
        }),
        TestFactories.createAgent({
          id: 'agent-2',
          phone: '+998901234568',
          email: 'agent2@example.com',
          showPhone: false,
          showEmail: true,
        }),
      ];

      prisma.agent.findMany.mockResolvedValue(agents as any);
      prisma.agent.count.mockResolvedValue(2);

      const result = await service.findAll({});

      // Agent 1: phone shown, email hidden
      expect(result.agents[0].phone).toBe('+998901234567');
      expect(result.agents[0].email).toBeNull();

      // Agent 2: phone hidden, email shown
      expect(result.agents[1].phone).toBeNull();
      expect(result.agents[1].email).toBe('agent2@example.com');
    });
  });
});
