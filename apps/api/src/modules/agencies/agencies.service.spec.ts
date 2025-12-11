import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { AgenciesService } from './agencies.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { mockPrismaService, resetMocks } from '../../test/test-utils';

describe('AgenciesService', () => {
  let service: AgenciesService;
  let prisma: typeof mockPrismaService;

  const createMockAgency = (overrides = {}) => ({
    id: 'agency-123',
    name: 'Test Agency',
    slug: 'test-agency',
    logo: 'https://example.com/logo.png',
    description: 'A test real estate agency',
    website: 'https://testagency.com',
    email: 'info@testagency.com',
    phone: '+1234567890',
    address: '123 Main St',
    city: 'Test City',
    verified: false,
    yearsOnPlatform: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockUser = (overrides = {}) => ({
    id: 'user-123',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER',
    verified: true,
    banned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockAgent = (overrides = {}) => ({
    id: 'agent-123',
    userId: 'user-123',
    agencyId: 'agency-123',
    phone: '+1234567890',
    bio: 'Test agent bio',
    verified: false,
    superAgent: false,
    totalDeals: 0,
    rating: null,
    reviewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    resetMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgenciesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AgenciesService>(AgenciesService);
    prisma = mockPrismaService;
  });

  describe('create', () => {
    const userId = 'user-123';
    const createDto = {
      name: 'New Agency',
      slug: 'new-agency',
      logo: 'https://example.com/logo.png',
      description: 'A new real estate agency',
      website: 'https://newagency.com',
      email: 'info@newagency.com',
      phone: '+1234567890',
      address: '456 Oak St',
      city: 'New City',
    };

    it('should create a new agency successfully', async () => {
      const mockAgency = createMockAgency({
        name: createDto.name,
        slug: createDto.slug,
      });

      prisma.agency.findUnique.mockResolvedValue(null);
      prisma.agency.create.mockResolvedValue(mockAgency);

      const result = await service.create(userId, createDto);

      expect(result).toEqual(mockAgency);
      expect(prisma.agency.findUnique).toHaveBeenCalledWith({
        where: { slug: createDto.slug },
      });
      expect(prisma.agency.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          slug: createDto.slug,
          logo: createDto.logo,
          description: createDto.description,
          website: createDto.website,
          email: createDto.email,
          phone: createDto.phone,
          address: createDto.address,
          city: createDto.city,
        },
      });
    });

    it('should throw ConflictException if slug already exists', async () => {
      const existingAgency = createMockAgency({ slug: createDto.slug });
      prisma.agency.findUnique.mockResolvedValue(existingAgency);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        ConflictException
      );
      expect(prisma.agency.create).not.toHaveBeenCalled();
    });

    it('should handle optional fields correctly', async () => {
      const minimalDto = {
        name: 'Minimal Agency',
        slug: 'minimal-agency',
        email: 'minimal@agency.com',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'Test City',
      };

      const mockAgency = createMockAgency(minimalDto);

      prisma.agency.findUnique.mockResolvedValue(null);
      prisma.agency.create.mockResolvedValue(mockAgency);

      const result = await service.create(userId, minimalDto);

      expect(result).toEqual(mockAgency);
      expect(prisma.agency.create).toHaveBeenCalledWith({
        data: minimalDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated agencies with default values', async () => {
      const mockAgencies = Array.from({ length: 3 }, (_, i) =>
        createMockAgency({
          id: `agency-${i}`,
          name: `Agency ${i}`,
          slug: `agency-${i}`,
          _count: { agents: i },
        })
      );

      prisma.agency.findMany.mockResolvedValue(mockAgencies);
      prisma.agency.count.mockResolvedValue(50);

      const result = await service.findAll({});

      expect(result.agencies).toEqual(mockAgencies);
      expect(result.total).toBe(50);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(3);
      expect(prisma.agency.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: [
          { verified: 'desc' },
          { yearsOnPlatform: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          _count: {
            select: { agents: true },
          },
        },
      });
    });

    it('should handle pagination correctly', async () => {
      prisma.agency.findMany.mockResolvedValue([]);
      prisma.agency.count.mockResolvedValue(100);

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(10);
      expect(prisma.agency.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (page 3 - 1) * 10
          take: 10,
        })
      );
    });

    it('should filter by city', async () => {
      prisma.agency.findMany.mockResolvedValue([]);
      prisma.agency.count.mockResolvedValue(0);

      await service.findAll({ city: 'Test City' });

      expect(prisma.agency.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { city: 'Test City' },
        })
      );
    });

    it('should filter by verified status', async () => {
      prisma.agency.findMany.mockResolvedValue([]);
      prisma.agency.count.mockResolvedValue(0);

      await service.findAll({ verified: true });

      expect(prisma.agency.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { verified: true },
        })
      );
    });

    it('should filter by both city and verified status', async () => {
      prisma.agency.findMany.mockResolvedValue([]);
      prisma.agency.count.mockResolvedValue(0);

      await service.findAll({ city: 'Test City', verified: true });

      expect(prisma.agency.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { city: 'Test City', verified: true },
        })
      );
    });

    it('should return empty array when no agencies exist', async () => {
      prisma.agency.findMany.mockResolvedValue([]);
      prisma.agency.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.agencies).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should include agent count for each agency', async () => {
      const mockAgencies = [
        createMockAgency({
          id: 'agency-1',
          _count: { agents: 5 },
        }),
        createMockAgency({
          id: 'agency-2',
          _count: { agents: 10 },
        }),
      ];

      prisma.agency.findMany.mockResolvedValue(mockAgencies);
      prisma.agency.count.mockResolvedValue(2);

      const result = await service.findAll({});

      expect(result.agencies[0]._count.agents).toBe(5);
      expect(result.agencies[1]._count.agents).toBe(10);
    });
  });

  describe('findById', () => {
    const agencyId = 'agency-123';

    it('should return agency with agents', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          firstName: 'John',
          lastName: 'Doe',
          photo: 'photo1.jpg',
          rating: 4.5,
          reviewCount: 10,
          verified: true,
          superAgent: false,
        },
      ];

      const mockAgency = createMockAgency({
        id: agencyId,
        agents: mockAgents,
      });

      prisma.agency.findUnique.mockResolvedValue(mockAgency);

      const result = await service.findById(agencyId);

      expect(result).toEqual(mockAgency);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect((result as any).agents).toEqual(mockAgents);
      expect(prisma.agency.findUnique).toHaveBeenCalledWith({
        where: { id: agencyId },
        include: {
          agents: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photo: true,
              rating: true,
              reviewCount: true,
              verified: true,
              superAgent: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if agency does not exist', async () => {
      prisma.agency.findUnique.mockResolvedValue(null);

      await expect(service.findById(agencyId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should include all agent details', async () => {
      const mockAgency = createMockAgency({
        id: agencyId,
        agents: [
          {
            id: 'agent-1',
            firstName: 'John',
            lastName: 'Doe',
            photo: 'photo.jpg',
            rating: 4.8,
            reviewCount: 25,
            verified: true,
            superAgent: true,
          },
        ],
      });

      prisma.agency.findUnique.mockResolvedValue(mockAgency);

      const result = await service.findById(agencyId);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect((result as any).agents[0].superAgent).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect((result as any).agents[0].rating).toBe(4.8);
    });
  });

  describe('findBySlug', () => {
    const slug = 'test-agency';

    it('should return agency by slug with verified agents', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          firstName: 'John',
          lastName: 'Doe',
          photo: 'photo1.jpg',
          rating: 4.5,
          reviewCount: 10,
          verified: true,
          superAgent: true,
          specializations: ['residential', 'commercial'],
        },
        {
          id: 'agent-2',
          firstName: 'Jane',
          lastName: 'Smith',
          photo: 'photo2.jpg',
          rating: 4.2,
          reviewCount: 8,
          verified: true,
          superAgent: false,
          specializations: ['residential'],
        },
      ];

      const mockAgency = createMockAgency({
        slug,
        agents: mockAgents,
      });

      prisma.agency.findUnique.mockResolvedValue(mockAgency);

      const result = await service.findBySlug(slug);

      expect(result).toEqual(mockAgency);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect((result as any).agents).toHaveLength(2);
      expect(prisma.agency.findUnique).toHaveBeenCalledWith({
        where: { slug },
        include: {
          agents: {
            where: { verified: true },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photo: true,
              rating: true,
              reviewCount: true,
              verified: true,
              superAgent: true,
              specializations: true,
            },
            orderBy: [
              { superAgent: 'desc' },
              { rating: 'desc' },
            ],
          },
        },
      });
    });

    it('should throw NotFoundException if agency does not exist', async () => {
      prisma.agency.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug(slug)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should only include verified agents', async () => {
      const mockAgency = createMockAgency({
        slug,
        agents: [],
      });

      prisma.agency.findUnique.mockResolvedValue(mockAgency);

      await service.findBySlug(slug);

      expect(prisma.agency.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            agents: expect.objectContaining({
              where: { verified: true },
            }),
          }),
        })
      );
    });

    it('should order agents by superAgent and rating', async () => {
      const mockAgency = createMockAgency({ slug });

      prisma.agency.findUnique.mockResolvedValue(mockAgency);

      await service.findBySlug(slug);

      expect(prisma.agency.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            agents: expect.objectContaining({
              orderBy: [
                { superAgent: 'desc' },
                { rating: 'desc' },
              ],
            }),
          }),
        })
      );
    });
  });

  describe('update', () => {
    const agencyId = 'agency-123';
    const userId = 'user-123';
    const updateDto = {
      name: 'Updated Agency Name',
      logo: 'https://example.com/new-logo.png',
      description: 'Updated description',
      website: 'https://updatedagency.com',
      email: 'updated@agency.com',
      phone: '+9876543210',
      address: '789 New St',
      city: 'Updated City',
    };

    it('should update agency as admin', async () => {
      const mockUser = createMockUser({ id: userId, role: 'ADMIN' });
      const updatedAgency = createMockAgency({
        id: agencyId,
        ...updateDto,
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agency.update.mockResolvedValue(updatedAgency);

      const result = await service.update(agencyId, userId, updateDto);

      expect(result).toEqual(updatedAgency);
      expect(prisma.agency.update).toHaveBeenCalledWith({
        where: { id: agencyId },
        data: {
          name: updateDto.name,
          logo: updateDto.logo,
          description: updateDto.description,
          website: updateDto.website,
          email: updateDto.email,
          phone: updateDto.phone,
          address: updateDto.address,
          city: updateDto.city,
        },
      });
    });

    it('should update agency as agent in the agency', async () => {
      const mockAgent = createMockAgent({ agencyId });
      const mockUser = createMockUser({
        id: userId,
        role: 'AGENT',
        agent: mockAgent,
      });
      const updatedAgency = createMockAgency({
        id: agencyId,
        name: updateDto.name,
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agency.update.mockResolvedValue(updatedAgency);

      const result = await service.update(agencyId, userId, updateDto);

      expect(result).toEqual(updatedAgency);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update(agencyId, userId, updateDto)
      ).rejects.toThrow(NotFoundException);
      expect(prisma.agency.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not admin and not agent in agency', async () => {
      const mockAgent = createMockAgent({ agencyId: 'different-agency' });
      const mockUser = createMockUser({
        id: userId,
        role: 'USER',
        agent: mockAgent,
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.update(agencyId, userId, updateDto)
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.agency.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not admin and has no agent profile', async () => {
      const mockUser = createMockUser({
        id: userId,
        role: 'USER',
        agent: null,
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.update(agencyId, userId, updateDto)
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.agency.update).not.toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const mockUser = createMockUser({ id: userId, role: 'ADMIN' });
      const partialDto = { name: 'New Name Only' };
      const updatedAgency = createMockAgency({
        id: agencyId,
        name: partialDto.name,
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agency.update.mockResolvedValue(updatedAgency);

      await service.update(agencyId, userId, partialDto);

      expect(prisma.agency.update).toHaveBeenCalledWith({
        where: { id: agencyId },
        data: {
          name: partialDto.name,
        },
      });
    });

    it('should allow setting fields to undefined', async () => {
      const mockUser = createMockUser({ id: userId, role: 'ADMIN' });
      const dtoWithUndefined = {
        logo: undefined,
        description: undefined,
        website: undefined,
      };
      const updatedAgency = createMockAgency({
        id: agencyId,
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agency.update.mockResolvedValue(updatedAgency);

      await service.update(agencyId, userId, dtoWithUndefined);

      // When fields are undefined, they are not included in the update
      expect(prisma.agency.update).toHaveBeenCalledWith({
        where: { id: agencyId },
        data: {},
      });
    });

    it('should not update fields that are not provided', async () => {
      const mockUser = createMockUser({ id: userId, role: 'ADMIN' });
      const minimalDto = { name: 'Updated Name' };
      const updatedAgency = createMockAgency({
        id: agencyId,
        name: minimalDto.name,
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agency.update.mockResolvedValue(updatedAgency);

      await service.update(agencyId, userId, minimalDto);

      const updateCall = prisma.agency.update.mock.calls[0][0];
      expect(updateCall.data).toEqual({ name: 'Updated Name' });
      expect(updateCall.data).not.toHaveProperty('logo');
      expect(updateCall.data).not.toHaveProperty('description');
    });
  });

  describe('delete', () => {
    const agencyId = 'agency-123';
    const userId = 'user-123';

    it('should delete agency as admin when agency has no agents', async () => {
      const mockUser = createMockUser({ id: userId, role: 'ADMIN' });
      const mockAgency = createMockAgency({
        id: agencyId,
        _count: { agents: 0 },
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agency.findUnique.mockResolvedValue(mockAgency);
      prisma.agency.delete.mockResolvedValue(mockAgency);

      const result = await service.delete(agencyId, userId);

      expect(result).toEqual({ message: 'Agency deleted successfully' });
      expect(prisma.agency.delete).toHaveBeenCalledWith({
        where: { id: agencyId },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.delete(agencyId, userId)).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.agency.findUnique).not.toHaveBeenCalled();
      expect(prisma.agency.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      const mockUser = createMockUser({ id: userId, role: 'USER' });

      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.delete(agencyId, userId)).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.agency.findUnique).not.toHaveBeenCalled();
      expect(prisma.agency.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is agent', async () => {
      const mockUser = createMockUser({ id: userId, role: 'AGENT' });

      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.delete(agencyId, userId)).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.agency.findUnique).not.toHaveBeenCalled();
      expect(prisma.agency.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if agency does not exist', async () => {
      const mockUser = createMockUser({ id: userId, role: 'ADMIN' });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agency.findUnique.mockResolvedValue(null);

      await expect(service.delete(agencyId, userId)).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.agency.delete).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if agency has active agents', async () => {
      const mockUser = createMockUser({ id: userId, role: 'ADMIN' });
      const mockAgency = createMockAgency({
        id: agencyId,
        _count: { agents: 5 },
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agency.findUnique.mockResolvedValue(mockAgency);

      await expect(service.delete(agencyId, userId)).rejects.toThrow(
        ConflictException
      );
      expect(prisma.agency.delete).not.toHaveBeenCalled();
    });

    it('should include agent count in error message', async () => {
      const mockUser = createMockUser({ id: userId, role: 'ADMIN' });
      const mockAgency = createMockAgency({
        id: agencyId,
        _count: { agents: 3 },
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agency.findUnique.mockResolvedValue(mockAgency);

      await expect(service.delete(agencyId, userId)).rejects.toThrow(
        'Cannot delete agency with 3 active agents. Remove agents first.'
      );
    });

    it('should verify user role before checking agency', async () => {
      const mockUser = createMockUser({ id: userId, role: 'USER' });

      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.delete(agencyId, userId)).rejects.toThrow(
        ForbiddenException
      );

      // Agency should not be checked if user is not admin
      expect(prisma.agency.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete agency lifecycle: create, update, delete', async () => {
      const userId = 'admin-123';
      const createDto = {
        name: 'New Agency',
        slug: 'new-agency',
        logo: 'https://example.com/logo.png',
        description: 'Test agency',
        website: 'https://test.com',
        email: 'info@test.com',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'Test City',
      };

      // Create
      const createdAgency = createMockAgency({
        id: 'new-agency-id',
        ...createDto,
      });

      prisma.agency.findUnique.mockResolvedValueOnce(null);
      prisma.agency.create.mockResolvedValue(createdAgency);

      const createResult = await service.create(userId, createDto);
      expect(createResult.name).toBe('New Agency');

      // Update
      const mockUser = createMockUser({ id: userId, role: 'ADMIN' });
      const updateDto = { name: 'Updated Agency Name' };
      const updatedAgency = {
        ...createdAgency,
        name: updateDto.name,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agency.update.mockResolvedValue(updatedAgency);

      const updateResult = await service.update(
        'new-agency-id',
        userId,
        updateDto
      );
      expect(updateResult.name).toBe('Updated Agency Name');

      // Delete
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agency.findUnique.mockResolvedValue({
        ...updatedAgency,
        _count: { agents: 0 },
      });
      prisma.agency.delete.mockResolvedValue(updatedAgency);

      const deleteResult = await service.delete('new-agency-id', userId);
      expect(deleteResult.message).toBe('Agency deleted successfully');
    });

    it('should find agency by both id and slug', async () => {
      const agencyId = 'agency-123';
      const slug = 'test-agency';
      const mockAgency = createMockAgency({
        id: agencyId,
        slug,
        agents: [],
      });

      // Find by ID
      prisma.agency.findUnique.mockResolvedValueOnce(mockAgency);
      const byIdResult = await service.findById(agencyId);
      expect(byIdResult.id).toBe(agencyId);

      // Find by slug
      prisma.agency.findUnique.mockResolvedValueOnce(mockAgency);
      const bySlugResult = await service.findBySlug(slug);
      expect(bySlugResult.slug).toBe(slug);
    });

    it('should handle filtering agencies by multiple criteria', async () => {
      const mockAgencies = [
        createMockAgency({
          id: 'agency-1',
          city: 'Test City',
          verified: true,
          _count: { agents: 5 },
        }),
        createMockAgency({
          id: 'agency-2',
          city: 'Test City',
          verified: true,
          _count: { agents: 3 },
        }),
      ];

      prisma.agency.findMany.mockResolvedValue(mockAgencies);
      prisma.agency.count.mockResolvedValue(2);

      const result = await service.findAll({
        city: 'Test City',
        verified: true,
        page: 1,
        limit: 10,
      });

      expect(result.agencies).toHaveLength(2);
      expect(result.agencies.every(a => a.city === 'Test City')).toBe(true);
      expect(result.agencies.every(a => a.verified === true)).toBe(true);
    });

    it('should enforce proper permissions for different user roles', async () => {
      const agencyId = 'agency-123';
      const adminId = 'admin-123';
      const agentId = 'agent-123';
      const userId = 'user-123';

      const updateDto = { name: 'Updated Name' };

      // Admin can update
      const mockAdmin = createMockUser({ id: adminId, role: 'ADMIN' });
      prisma.user.findUnique.mockResolvedValueOnce(mockAdmin);
      prisma.agency.update.mockResolvedValue(
        createMockAgency({ id: agencyId })
      );
      await expect(
        service.update(agencyId, adminId, updateDto)
      ).resolves.toBeDefined();

      // Agent in agency can update
      const mockAgent = createMockUser({
        id: agentId,
        role: 'AGENT',
        agent: createMockAgent({ agencyId }),
      });
      prisma.user.findUnique.mockResolvedValueOnce(mockAgent);
      prisma.agency.update.mockResolvedValue(
        createMockAgency({ id: agencyId })
      );
      await expect(
        service.update(agencyId, agentId, updateDto)
      ).resolves.toBeDefined();

      // Regular user cannot update
      const mockUser = createMockUser({
        id: userId,
        role: 'USER',
        agent: null,
      });
      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      await expect(
        service.update(agencyId, userId, updateDto)
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
