import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { Developer } from '@repo/database';

// DTOs (will be defined in @repo/shared later)
interface CreateDeveloperDto {
  name: string;
  nameUz?: string;
  slug: string;
  logo?: string;
  descriptionRu?: string;
  descriptionUz?: string;
  licenseNumber?: string;
  innTin?: string;
  legalEntity?: string;
  legalAddress?: string;
  establishedYear?: number;
  phone: string;
  email?: string;
  website?: string;
  telegram?: string;
  whatsapp?: string;
  city: string;
  officeAddress?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface UpdateDeveloperDto {
  name?: string;
  nameUz?: string;
  logo?: string;
  descriptionRu?: string;
  descriptionUz?: string;
  licenseNumber?: string;
  innTin?: string;
  legalEntity?: string;
  legalAddress?: string;
  establishedYear?: number;
  phone?: string;
  email?: string;
  website?: string;
  telegram?: string;
  whatsapp?: string;
  city?: string;
  officeAddress?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

@Injectable()
export class DevelopersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new developer (admin or developer registration)
   */
  async create(_userId: string, dto: CreateDeveloperDto): Promise<Developer> {
    // Check if slug is already taken
    const existing = await this.prisma.developer.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Developer slug already exists');
    }

    const developer = await this.prisma.developer.create({
      data: {
        name: dto.name,
        nameUz: dto.nameUz,
        slug: dto.slug,
        logo: dto.logo,
        descriptionRu: dto.descriptionRu,
        descriptionUz: dto.descriptionUz,
        licenseNumber: dto.licenseNumber,
        innTin: dto.innTin,
        legalEntity: dto.legalEntity,
        legalAddress: dto.legalAddress,
        establishedYear: dto.establishedYear,
        phone: dto.phone,
        email: dto.email,
        website: dto.website,
        telegram: dto.telegram,
        whatsapp: dto.whatsapp,
        city: dto.city,
        officeAddress: dto.officeAddress,
        primaryColor: dto.primaryColor || '#3B82F6',
        secondaryColor: dto.secondaryColor || '#1E40AF',
      },
    });

    return developer;
  }

  /**
   * Get all developers with pagination and filters
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

    const [developers, total] = await Promise.all([
      this.prisma.developer.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { featured: 'desc' },
          { verified: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          _count: {
            select: {
              projects: true,
              properties: true,
              salesTeam: true,
            },
          },
        },
      }),
      this.prisma.developer.count({ where }),
    ]);

    return {
      developers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get developer by ID
   */
  async findById(id: string): Promise<Developer> {
    const developer = await this.prisma.developer.findUnique({
      where: { id },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            nameUz: true,
            slug: true,
            status: true,
            completionDate: true,
            totalUnits: true,
            unitsAvailable: true,
            unitsSold: true,
            featured: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        salesTeam: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            projects: true,
            properties: true,
          },
        },
      },
    });

    if (!developer) {
      throw new NotFoundException('Developer not found');
    }

    return developer;
  }

  /**
   * Get developer by slug (public)
   */
  async findBySlug(slug: string): Promise<Developer> {
    const developer = await this.prisma.developer.findUnique({
      where: { slug },
      include: {
        projects: {
          where: {
            status: {
              in: ['PLANNING', 'UNDER_CONSTRUCTION', 'COMPLETED'],
            },
          },
          select: {
            id: true,
            name: true,
            nameUz: true,
            slug: true,
            status: true,
            completionDate: true,
            totalUnits: true,
            unitsAvailable: true,
            unitsSold: true,
            featured: true,
            buildingClass: true,
            city: {
              select: {
                id: true,
                nameRu: true,
                nameUz: true,
              },
            },
            district: {
              select: {
                id: true,
                nameRu: true,
                nameUz: true,
              },
            },
          },
          orderBy: [
            { featured: 'desc' },
            { status: 'asc' },
            { completionDate: 'asc' },
          ],
        },
        salesTeam: {
          where: {
            role: {
              in: ['DEVELOPER_ADMIN', 'DEVELOPER_SALES_AGENT'],
            },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!developer) {
      throw new NotFoundException('Developer not found');
    }

    return developer;
  }

  /**
   * Update developer (admin or developer owner)
   */
  async update(
    id: string,
    userId: string,
    dto: UpdateDeveloperDto,
  ): Promise<Developer> {
    // Verify user has permission (admin or developer team member)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check permissions
    if (user.role !== 'ADMIN') {
      if (user.developerId !== id) {
        throw new ForbiddenException(
          'You do not have permission to update this developer',
        );
      }
      // Only DEVELOPER_ADMIN can update developer profile
      if (user.role !== 'DEVELOPER_ADMIN') {
        throw new ForbiddenException(
          'Only developer admin can update developer profile',
        );
      }
    }

    const developer = await this.prisma.developer.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.nameUz !== undefined && { nameUz: dto.nameUz }),
        ...(dto.logo !== undefined && { logo: dto.logo }),
        ...(dto.descriptionRu !== undefined && {
          descriptionRu: dto.descriptionRu,
        }),
        ...(dto.descriptionUz !== undefined && {
          descriptionUz: dto.descriptionUz,
        }),
        ...(dto.licenseNumber !== undefined && {
          licenseNumber: dto.licenseNumber,
        }),
        ...(dto.innTin !== undefined && { innTin: dto.innTin }),
        ...(dto.legalEntity !== undefined && { legalEntity: dto.legalEntity }),
        ...(dto.legalAddress !== undefined && {
          legalAddress: dto.legalAddress,
        }),
        ...(dto.establishedYear !== undefined && {
          establishedYear: dto.establishedYear,
        }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.telegram !== undefined && { telegram: dto.telegram }),
        ...(dto.whatsapp !== undefined && { whatsapp: dto.whatsapp }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.officeAddress !== undefined && {
          officeAddress: dto.officeAddress,
        }),
        ...(dto.primaryColor !== undefined && {
          primaryColor: dto.primaryColor,
        }),
        ...(dto.secondaryColor !== undefined && {
          secondaryColor: dto.secondaryColor,
        }),
      },
    });

    return developer;
  }

  /**
   * Update developer statistics (auto-triggered by project/unit changes)
   */
  async updateStatistics(id: string): Promise<void> {
    const [projects, units] = await Promise.all([
      this.prisma.developerProject.count({
        where: { developerId: id },
      }),
      this.prisma.property.groupBy({
        by: ['unitStatus'],
        where: { developerId: id },
        _count: true,
      }),
    ]);

    const totalUnits = units.reduce((sum, item) => sum + item._count, 0);
    const soldUnits =
      units.find((item) => item.unitStatus === 'SOLD')?._count || 0;
    const availableUnits =
      units.find((item) => item.unitStatus === 'AVAILABLE')?._count || 0;

    await this.prisma.developer.update({
      where: { id },
      data: {
        totalProjects: projects,
        totalUnits: totalUnits,
        unitsSold: soldUnits,
        unitsAvailable: availableUnits,
      },
    });
  }

  /**
   * Delete developer (admin only)
   */
  async delete(id: string, userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete developers');
    }

    const developer = await this.prisma.developer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projects: true,
            properties: true,
            salesTeam: true,
          },
        },
      },
    });

    if (!developer) {
      throw new NotFoundException('Developer not found');
    }

    // Prevent deletion if developer has projects or team members
    if (developer._count.projects > 0) {
      throw new ConflictException(
        `Cannot delete developer with ${developer._count.projects} active projects. Remove projects first.`,
      );
    }

    if (developer._count.salesTeam > 0) {
      throw new ConflictException(
        `Cannot delete developer with ${developer._count.salesTeam} team members. Remove team members first.`,
      );
    }

    await this.prisma.developer.delete({
      where: { id },
    });

    return { message: 'Developer deleted successfully' };
  }

  /**
   * Add team member to developer
   */
  async addTeamMember(
    developerId: string,
    userId: string,
    role: 'DEVELOPER_ADMIN' | 'DEVELOPER_SALES_AGENT',
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        developerId: developerId,
        role: role,
      },
    });
  }

  /**
   * Remove team member from developer
   */
  async removeTeamMember(developerId: string, userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.developerId !== developerId) {
      throw new NotFoundException('Team member not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        developerId: null,
        role: 'USER', // Reset to regular user
      },
    });
  }
}
