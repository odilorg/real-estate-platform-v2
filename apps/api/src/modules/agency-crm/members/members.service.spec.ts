import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AgencyRole } from '@repo/database';

// Extended mock PrismaService
const mockPrismaService: any = {
  agencyMember: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  agencyCRM: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaService)),
};

describe('MembersService', () => {
  let service: MembersService;
  let prisma: typeof mockPrismaService;

  const createMockMember = (overrides = {}) => ({
    id: 'member-123',
    agencyId: 'agency-123',
    userId: 'user-123',
    role: AgencyRole.AGENT,
    isActive: true,
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+998901234567',
    },
    ...overrides,
  });

  const createMockUser = (overrides = {}) => ({
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+998901234567',
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
        MembersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
    prisma = mockPrismaService;
  });

  describe('create', () => {
    const agencyId = 'agency-123';
    const createDto = {
      userId: 'user-123',
      role: AgencyRole.AGENT,
    };

    it('should create a member successfully', async () => {
      const mockUser = createMockUser();
      const mockMember = createMockMember();

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agencyMember.findFirst.mockResolvedValue(null);
      prisma.agencyMember.create.mockResolvedValue(mockMember);

      const result = await service.create(agencyId, createDto);

      expect(result).toEqual(mockMember);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.userId },
      });
      expect(prisma.agencyMember.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.create(agencyId, createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(agencyId, createDto)).rejects.toThrow(
        `User with ID ${createDto.userId} not found`,
      );
    });

    it('should throw ConflictException if user already a member', async () => {
      const mockUser = createMockUser();
      const existingMember = createMockMember();

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.agencyMember.findFirst.mockResolvedValue(existingMember);

      await expect(service.create(agencyId, createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(agencyId, createDto)).rejects.toThrow(
        'User is already a member of this agency',
      );
    });

  });

  describe('findAll', () => {
    const agencyId = 'agency-123';

    it('should return paginated members', async () => {
      const mockMembers = Array.from({ length: 3 }, (_, i) =>
        createMockMember({ id: `member-${i}` }),
      );

      prisma.agencyMember.findMany.mockResolvedValue(mockMembers);
      prisma.agencyMember.count.mockResolvedValue(50);

      const result = await service.findAll(agencyId, {});

      expect(result.members).toEqual(mockMembers);
      expect(result.total).toBe(50);
      expect(prisma.agencyMember.findMany).toHaveBeenCalled();
    });

    it('should filter members by role', async () => {
      prisma.agencyMember.findMany.mockResolvedValue([]);
      prisma.agencyMember.count.mockResolvedValue(0);

      await service.findAll(agencyId, { role: AgencyRole.ADMIN });

      expect(prisma.agencyMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            role: AgencyRole.ADMIN,
          }),
        }),
      );
    });

    it('should filter members by isActive status', async () => {
      prisma.agencyMember.findMany.mockResolvedValue([]);
      prisma.agencyMember.count.mockResolvedValue(0);

      await service.findAll(agencyId, { isActive: true });

      expect(prisma.agencyMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            isActive: true,
          }),
        }),
      );
    });

    it('should support pagination', async () => {
      prisma.agencyMember.findMany.mockResolvedValue([]);
      prisma.agencyMember.count.mockResolvedValue(0);

      await service.findAll(agencyId, { skip: 10, take: 10 });

      expect(prisma.agencyMember.findMany).toHaveBeenCalledWith(
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

    it('should return member by id', async () => {
      const mockMember = createMockMember({ id: memberId, agencyId });

      prisma.agencyMember.findUnique.mockResolvedValue(mockMember);

      const result = await service.findOne(agencyId, memberId);

      expect(result).toEqual(mockMember);
      expect(prisma.agencyMember.findUnique).toHaveBeenCalledWith({
        where: { id: memberId },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if member not found', async () => {
      prisma.agencyMember.findUnique.mockResolvedValue(null);

      await expect(service.findOne(agencyId, memberId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(agencyId, memberId)).rejects.toThrow(
        `Member with ID ${memberId} not found`,
      );
    });
  });

  describe('update', () => {
    const agencyId = 'agency-123';
    const memberId = 'member-123';
    const updateDto = {
      role: AgencyRole.ADMIN,
      isActive: true,
    };

    it('should update member successfully', async () => {
      const existingMember = createMockMember({ id: memberId, agencyId });
      const updatedMember = createMockMember({ ...existingMember, ...updateDto });

      prisma.agencyMember.findUnique.mockResolvedValue(existingMember);
      prisma.agencyMember.update.mockResolvedValue(updatedMember);

      const result = await service.update(agencyId, memberId, updateDto);

      expect(result).toEqual(updatedMember);
      expect(prisma.agencyMember.update).toHaveBeenCalledWith({
        where: { id: memberId },
        data: updateDto,
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if member not found', async () => {
      prisma.agencyMember.findUnique.mockResolvedValue(null);

      await expect(
        service.update(agencyId, memberId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow updating role', async () => {
      const existingMember = createMockMember({ role: AgencyRole.AGENT, agencyId });

      prisma.agencyMember.findUnique.mockResolvedValue(existingMember);
      prisma.agencyMember.update.mockResolvedValue(createMockMember());

      await service.update(agencyId, memberId, { role: AgencyRole.ADMIN });

      expect(prisma.agencyMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: AgencyRole.ADMIN,
          }),
        }),
      );
    });

    it('should allow deactivating member', async () => {
      const existingMember = createMockMember({ isActive: true, agencyId });

      prisma.agencyMember.findUnique.mockResolvedValue(existingMember);
      prisma.agencyMember.update.mockResolvedValue(createMockMember());

      await service.update(agencyId, memberId, { isActive: false });

      expect(prisma.agencyMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isActive: false,
          }),
        }),
      );
    });
  });

  describe('remove', () => {
    const agencyId = 'agency-123';
    const memberId = 'member-123';

    it('should deactivate member (soft delete)', async () => {
      const mockMember = createMockMember({ id: memberId, agencyId });
      const deactivatedMember = createMockMember({ ...mockMember, isActive: false });

      prisma.agencyMember.findUnique.mockResolvedValue(mockMember);
      prisma.agencyMember.update.mockResolvedValue(deactivatedMember);

      const result = await service.remove(agencyId, memberId);

      expect(result).toEqual(deactivatedMember);
      expect(prisma.agencyMember.update).toHaveBeenCalledWith({
        where: { id: memberId },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException if member not found', async () => {
      prisma.agencyMember.findUnique.mockResolvedValue(null);

      await expect(service.remove(agencyId, memberId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
