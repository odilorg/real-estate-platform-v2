import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMembersDto } from './dto/query-members.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async create(agencyId: string, createMemberDto: CreateMemberDto): Promise<any> {
    // Validate that either userId or newUser is provided
    if (!createMemberDto.userId && !createMemberDto.newUser) {
      throw new BadRequestException('Either userId or newUser must be provided');
    }

    if (createMemberDto.userId && createMemberDto.newUser) {
      throw new BadRequestException('Provide either userId or newUser, not both');
    }

    let userId: string;

    if (createMemberDto.userId) {
      // Existing user flow
      const user = await this.prisma.user.findUnique({
        where: { id: createMemberDto.userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${createMemberDto.userId} not found`);
      }

      userId = user.id;

    } else {
      // New user creation flow
      const { email, firstName, lastName, password, phone } = createMemberDto.newUser!;

      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException(`User with email ${email} already exists`);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          phone,
          role: 'USER',
        },
      });

      userId = newUser.id;
    }

    // Check if user is already a member of this agency
    const existingMember = await this.prisma.agencyMember.findFirst({
      where: {
        agencyId,
        userId,
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this agency');
    }

    // Create agency member
    return this.prisma.agencyMember.create({
      data: {
        agencyId,
        userId,
        role: createMemberDto.role,
        agentType: createMemberDto.agentType,
        specializations: createMemberDto.specializations,
        districts: createMemberDto.districts,
        languages: createMemberDto.languages,
        phone: createMemberDto.phone,
        telegram: createMemberDto.telegram,
        whatsapp: createMemberDto.whatsapp,
        licenseNumber: createMemberDto.licenseNumber,
        licenseExpiry: createMemberDto.licenseExpiry,
        isActive: createMemberDto.isActive ?? true,
        permissions: createMemberDto.permissions,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
  }

  async searchUsers(agencyId: string, query: string): Promise<any> {
    if (!query || query.length < 2) {
      return [];
    }

    // Get existing agency member user IDs
    const existingMembers = await this.prisma.agencyMember.findMany({
      where: { agencyId },
      select: { userId: true },
    });

    const excludedUserIds = existingMembers.map(m => m.userId);

    // Search for users not in this agency
    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          {
            id: {
              notIn: excludedUserIds.length > 0 ? excludedUserIds : [''],
            },
          },
          {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
      take: 10,
    });

    return users;
  }

  async findAll(agencyId: string, query: QueryMembersDto): Promise<any> {
    const { role, agentType, isActive, search, skip = 0, take = 20 } = query;

    const where: any = { agencyId };
    if (role) where.role = role;
    if (agentType) where.agentType = agentType;
    if (isActive !== undefined) where.isActive = isActive;

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [members, total] = await Promise.all([
      this.prisma.agencyMember.findMany({
        where,
        skip,
        take,
        orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          _count: {
            select: {
              assignedLeads: true,
              deals: true,
            },
          },
        },
      }),
      this.prisma.agencyMember.count({ where }),
    ]);

    return { members, total, skip, take };
  }

  async findOne(agencyId: string, id: string): Promise<any> {
    const member = await this.prisma.agencyMember.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            createdAt: true,
          },
        },
        assignedLeads: {
          where: { status: { not: 'CONVERTED' } },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            priority: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            assignedLeads: true,
            deals: true,
            commissions: true,
            activities: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    if (member.agencyId !== agencyId) {
      throw new ForbiddenException('Access denied');
    }

    return member;
  }

  async update(agencyId: string, id: string, updateMemberDto: UpdateMemberDto): Promise<any> {
    await this.findOne(agencyId, id);

    return this.prisma.agencyMember.update({
      where: { id },
      data: updateMemberDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
  }

  async remove(agencyId: string, id: string): Promise<any> {
    const member = await this.findOne(agencyId, id);

    if (member.role === 'OWNER') {
      const ownerCount = await this.prisma.agencyMember.count({
        where: { agencyId, role: 'OWNER', isActive: true },
      });

      if (ownerCount <= 1) {
        throw new ForbiddenException('Cannot delete the last owner of the agency');
      }
    }

    return this.prisma.agencyMember.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
