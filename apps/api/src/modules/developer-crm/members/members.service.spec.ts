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
  developerMember: {
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
  developerCRM: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaService)),
};

describe('MembersService', () => {
  let service: MembersService;
  let prisma: typeof mockPrismaService;

  const createMockMember = (overrides = {}) => ({
    id: 'member-123',
    developerId: 'agency-123',
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
    const developerId = 'agency-123';
    const createDto = {
      userId: 'user-123',
      role: AgencyRole.AGENT,
    };

    it('should create a member successfully', async () => {
      const mockUser = createMockUser();
      const mockMember = createMockMember();

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.developerMember.findFirst.mockResolvedValue(null);
      prisma.developerMember.create.mockResolvedValue(mockMember);

      const result = await service.create(developerId, createDto);

      expect(result).toEqual(mockMember);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.userId },
      });
      expect(prisma.developerMember.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.create(developerId, createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(developerId, createDto)).rejects.toThrow(
        `User with ID ${createDto.userId} not found`,
      );
    });

    it('should throw ConflictException if user already a member', async () => {
      const mockUser = createMockUser();
      const existingMember = createMockMember();

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.developerMember.findFirst.mockResolvedValue(existingMember);

      await expect(service.create(developerId, createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(developerId, createDto)).rejects.toThrow(
        'User is already a member of this agency',
      );
    });

  });

  describe('findAll', () => {
    const developerId = 'agency-123';

    it('should return paginated members', async () => {
      const mockMembers = Array.from({ length: 3 }, (_, i) =>
        createMockMember({ id: `member-${i}` }),
      );

      prisma.developerMember.findMany.mockResolvedValue(mockMembers);
      prisma.developerMember.count.mockResolvedValue(50);

      const result = await service.findAll(developerId, {});

      expect(result.members).toEqual(mockMembers);
      expect(result.total).toBe(50);
      expect(prisma.developerMember.findMany).toHaveBeenCalled();
    });

    it('should filter members by role', async () => {
      prisma.developerMember.findMany.mockResolvedValue([]);
      prisma.developerMember.count.mockResolvedValue(0);

      await service.findAll(developerId, { role: AgencyRole.ADMIN });

      expect(prisma.developerMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            developerId,
            role: AgencyRole.ADMIN,
          }),
        }),
      );
    });

    it('should filter members by isActive status', async () => {
      prisma.developerMember.findMany.mockResolvedValue([]);
      prisma.developerMember.count.mockResolvedValue(0);

      await service.findAll(developerId, { isActive: true });

      expect(prisma.developerMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            developerId,
            isActive: true,
          }),
        }),
      );
    });

    it('should support pagination', async () => {
      prisma.developerMember.findMany.mockResolvedValue([]);
      prisma.developerMember.count.mockResolvedValue(0);

      await service.findAll(developerId, { skip: 10, take: 10 });

      expect(prisma.developerMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('findOne', () => {
    const developerId = 'agency-123';
    const memberId = 'member-123';

    it('should return member by id', async () => {
      const mockMember = createMockMember({ id: memberId, developerId });

      prisma.developerMember.findUnique.mockResolvedValue(mockMember);

      const result = await service.findOne(developerId, memberId);

      expect(result).toEqual(mockMember);
      expect(prisma.developerMember.findUnique).toHaveBeenCalledWith({
        where: { id: memberId },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if member not found', async () => {
      prisma.developerMember.findUnique.mockResolvedValue(null);

      await expect(service.findOne(developerId, memberId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(developerId, memberId)).rejects.toThrow(
        `Member with ID ${memberId} not found`,
      );
    });
  });

  describe('update', () => {
    const developerId = 'agency-123';
    const memberId = 'member-123';
    const updateDto = {
      role: AgencyRole.ADMIN,
      isActive: true,
    };

    it('should update member successfully', async () => {
      const existingMember = createMockMember({ id: memberId, developerId });
      const updatedMember = createMockMember({ ...existingMember, ...updateDto });

      prisma.developerMember.findUnique.mockResolvedValue(existingMember);
      prisma.developerMember.update.mockResolvedValue(updatedMember);

      const result = await service.update(developerId, memberId, updateDto);

      expect(result).toEqual(updatedMember);
      expect(prisma.developerMember.update).toHaveBeenCalledWith({
        where: { id: memberId },
        data: updateDto,
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if member not found', async () => {
      prisma.developerMember.findUnique.mockResolvedValue(null);

      await expect(
        service.update(developerId, memberId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow updating role', async () => {
      const existingMember = createMockMember({ role: AgencyRole.AGENT, developerId });

      prisma.developerMember.findUnique.mockResolvedValue(existingMember);
      prisma.developerMember.update.mockResolvedValue(createMockMember());

      await service.update(developerId, memberId, { role: AgencyRole.ADMIN });

      expect(prisma.developerMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: AgencyRole.ADMIN,
          }),
        }),
      );
    });

    it('should allow deactivating member', async () => {
      const existingMember = createMockMember({ isActive: true, developerId });

      prisma.developerMember.findUnique.mockResolvedValue(existingMember);
      prisma.developerMember.update.mockResolvedValue(createMockMember());

      await service.update(developerId, memberId, { isActive: false });

      expect(prisma.developerMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isActive: false,
          }),
        }),
      );
    });
  });

  describe('remove', () => {
    const developerId = 'agency-123';
    const memberId = 'member-123';

    it('should deactivate member (soft delete)', async () => {
      const mockMember = createMockMember({ id: memberId, developerId });
      const deactivatedMember = createMockMember({ ...mockMember, isActive: false });

      prisma.developerMember.findUnique.mockResolvedValue(mockMember);
      prisma.developerMember.update.mockResolvedValue(deactivatedMember);

      const result = await service.remove(developerId, memberId);

      expect(result).toEqual(deactivatedMember);
      expect(prisma.developerMember.update).toHaveBeenCalledWith({
        where: { id: memberId },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException if member not found', async () => {
      prisma.developerMember.findUnique.mockResolvedValue(null);

      await expect(service.remove(developerId, memberId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
