import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMembersDto } from './dto/query-members.dto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async create(agencyId: string, createMemberDto: CreateMemberDto): Promise<any> {
    // Check if user is already a member
    const existing = await this.prisma.agencyMember.findFirst({
      where: {
        agencyId,
        userId: createMemberDto.userId,
      },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this agency');
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createMemberDto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createMemberDto.userId} not found`);
    }

    return this.prisma.agencyMember.create({
      data: {
        agencyId,
        ...createMemberDto,
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
