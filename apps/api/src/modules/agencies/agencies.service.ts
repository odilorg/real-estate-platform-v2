import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreateAgencyDto, UpdateAgencyDto } from '@repo/shared';
import { Agency } from '@repo/database';

@Injectable()
export class AgenciesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new agency (admin or verified agent)
   */
  async create(_userId: string, dto: CreateAgencyDto): Promise<Agency> {
    // Check if slug is already taken
    const existing = await this.prisma.agency.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Agency slug already exists');
    }

    const agency = await this.prisma.agency.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        logo: dto.logo,
        description: dto.description,
        website: dto.website,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
      },
    });

    return agency;
  }

  /**
   * Get all agencies with pagination
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    city?: string;
    verified?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: { city?: string; verified?: boolean } = {};
    if (params.city) where.city = params.city;
    if (params.verified !== undefined) where.verified = params.verified;

    const [agencies, total] = await Promise.all([
      this.prisma.agency.findMany({
        where,
        skip,
        take: limit,
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
      }),
      this.prisma.agency.count({ where }),
    ]);

    return {
      agencies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get agency by ID
   */
  async findById(id: string): Promise<Agency> {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
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

    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    return agency;
  }

  /**
   * Get agency by slug (public)
   */
  async findBySlug(slug: string): Promise<Agency> {
    const agency = await this.prisma.agency.findUnique({
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
          orderBy: [{ superAgent: 'desc' }, { rating: 'desc' }],
        },
      },
    });

    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    return agency;
  }

  /**
   * Update agency (admin or agency owner)
   */
  async update(
    id: string,
    userId: string,
    dto: UpdateAgencyDto,
  ): Promise<Agency> {
    // Verify user has permission (admin or agent in this agency)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        agent: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'ADMIN') {
      if (!user.agent || user.agent.agencyId !== id) {
        throw new ForbiddenException(
          'You do not have permission to update this agency',
        );
      }
    }

    const agency = await this.prisma.agency.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.logo !== undefined && { logo: dto.logo }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
      },
    });

    return agency;
  }

  /**
   * Delete agency (admin only)
   */
  async delete(id: string, userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete agencies');
    }

    const agency = await this.prisma.agency.findUnique({
      where: { id },
      include: {
        _count: {
          select: { agents: true },
        },
      },
    });

    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    // Warn if agency has agents
    if (agency._count.agents > 0) {
      throw new ConflictException(
        `Cannot delete agency with ${agency._count.agents} active agents. Remove agents first.`,
      );
    }

    await this.prisma.agency.delete({
      where: { id },
    });

    return { message: 'Agency deleted successfully' };
  }
}
