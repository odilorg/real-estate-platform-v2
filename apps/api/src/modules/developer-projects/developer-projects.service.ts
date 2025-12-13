import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DeveloperProject } from '@repo/database';

// DTOs (will be defined in @repo/shared later)
interface CreateProjectDto {
  name: string;
  nameUz?: string;
  descriptionRu?: string;
  descriptionUz?: string;
  cityId: string;
  districtId: string;
  mahallaId?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  buildingClass?: string;
  buildingType?: string;
  totalUnits: number;
  totalFloors?: number;
  totalBlocks?: number;
  parkingSpaces?: number;
  constructionStartDate?: Date;
  completionDate: Date;
  deliveryStages?: any;
  amenities?: string[];
  hasGatedArea?: boolean;
  hasConcierge?: boolean;
  hasGreenArea?: boolean;
  hasKindergarten?: boolean;
  hasCommercial?: boolean;
  heating?: string;
  gasSupply?: boolean;
  waterSupply?: string;
  elevator?: boolean;
  elevatorCount?: number;
  masterPlanImage?: string;
  siteLayoutImage?: string;
  virtualTourUrl?: string;
}

interface UpdateProjectDto {
  name?: string;
  nameUz?: string;
  descriptionRu?: string;
  descriptionUz?: string;
  cityId?: string;
  districtId?: string;
  mahallaId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  buildingClass?: string;
  buildingType?: string;
  totalUnits?: number;
  totalFloors?: number;
  totalBlocks?: number;
  parkingSpaces?: number;
  constructionStartDate?: Date;
  completionDate?: Date;
  deliveryStages?: any;
  amenities?: string[];
  hasGatedArea?: boolean;
  hasConcierge?: boolean;
  hasGreenArea?: boolean;
  hasKindergarten?: boolean;
  hasCommercial?: boolean;
  heating?: string;
  gasSupply?: boolean;
  waterSupply?: string;
  elevator?: boolean;
  elevatorCount?: number;
  masterPlanImage?: string;
  siteLayoutImage?: string;
  virtualTourUrl?: string;
  status?: string;
  featured?: boolean;
}

@Injectable()
export class DeveloperProjectsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new developer project
   */
  async create(
    developerId: string,
    dto: CreateProjectDto,
  ): Promise<DeveloperProject> {
    // Generate slug from name
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const project = await this.prisma.developerProject.create({
      data: {
        developerId,
        name: dto.name,
        nameUz: dto.nameUz,
        slug,
        descriptionRu: dto.descriptionRu,
        descriptionUz: dto.descriptionUz,
        cityId: dto.cityId,
        districtId: dto.districtId,
        mahallaId: dto.mahallaId,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        buildingClass: dto.buildingClass as any,
        buildingType: dto.buildingType as any,
        totalUnits: dto.totalUnits,
        totalFloors: dto.totalFloors,
        totalBlocks: dto.totalBlocks || 1,
        parkingSpaces: dto.parkingSpaces,
        constructionStartDate: dto.constructionStartDate,
        completionDate: dto.completionDate,
        deliveryStages: dto.deliveryStages,
        amenities: dto.amenities || [],
        hasGatedArea: dto.hasGatedArea || false,
        hasConcierge: dto.hasConcierge || false,
        hasGreenArea: dto.hasGreenArea || false,
        hasKindergarten: dto.hasKindergarten || false,
        hasCommercial: dto.hasCommercial || false,
        heating: dto.heating,
        gasSupply: dto.gasSupply !== undefined ? dto.gasSupply : true,
        waterSupply: dto.waterSupply,
        elevator: dto.elevator !== undefined ? dto.elevator : true,
        elevatorCount: dto.elevatorCount,
        masterPlanImage: dto.masterPlanImage,
        siteLayoutImage: dto.siteLayoutImage,
        virtualTourUrl: dto.virtualTourUrl,
      },
    });

    // Update developer stats
    await this.updateDeveloperStats(developerId);

    return project;
  }

  /**
   * Get all projects for a developer
   */
  async findAll(developerId: string): Promise<any[]> {
    return this.prisma.developerProject.findMany({
      where: { developerId },
      include: {
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
        mahalla: {
          select: {
            id: true,
            nameRu: true,
            nameUz: true,
          },
        },
        _count: {
          select: {
            properties: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single project by ID
   */
  async findOne(id: string): Promise<DeveloperProject> {
    const project = await this.prisma.developerProject.findUnique({
      where: { id },
      include: {
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
        mahalla: {
          select: {
            id: true,
            nameRu: true,
            nameUz: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        videos: {
          orderBy: { order: 'asc' },
        },
        properties: {
          select: {
            id: true,
            unitNumber: true,
            buildingBlock: true,
            price: true,
            unitStatus: true,
            bedrooms: true,
            area: true,
            floor: true,
          },
          orderBy: [{ buildingBlock: 'asc' }, { floor: 'asc' }],
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  /**
   * Get project by slug (public)
   */
  async findBySlug(slug: string): Promise<DeveloperProject> {
    const project = await this.prisma.developerProject.findUnique({
      where: { slug },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            nameUz: true,
            logo: true,
            phone: true,
            email: true,
            website: true,
            verified: true,
          },
        },
        city: true,
        district: true,
        mahalla: true,
        images: {
          orderBy: { order: 'asc' },
        },
        videos: {
          orderBy: { order: 'asc' },
        },
        properties: {
          where: {
            status: 'ACTIVE',
            unitStatus: {
              in: ['AVAILABLE', 'RESERVED'],
            },
          },
          select: {
            id: true,
            unitNumber: true,
            buildingBlock: true,
            price: true,
            unitStatus: true,
            bedrooms: true,
            area: true,
            floor: true,
            images: {
              take: 1,
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  /**
   * Update a project
   */
  async update(
    id: string,
    dto: UpdateProjectDto,
  ): Promise<DeveloperProject> {
    const project = await this.prisma.developerProject.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.nameUz !== undefined && { nameUz: dto.nameUz }),
        ...(dto.descriptionRu !== undefined && {
          descriptionRu: dto.descriptionRu,
        }),
        ...(dto.descriptionUz !== undefined && {
          descriptionUz: dto.descriptionUz,
        }),
        ...(dto.cityId && { cityId: dto.cityId }),
        ...(dto.districtId && { districtId: dto.districtId }),
        ...(dto.mahallaId !== undefined && { mahallaId: dto.mahallaId }),
        ...(dto.address && { address: dto.address }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.buildingClass && { buildingClass: dto.buildingClass as any }),
        ...(dto.buildingType && { buildingType: dto.buildingType as any }),
        ...(dto.totalUnits !== undefined && { totalUnits: dto.totalUnits }),
        ...(dto.totalFloors !== undefined && { totalFloors: dto.totalFloors }),
        ...(dto.totalBlocks !== undefined && { totalBlocks: dto.totalBlocks }),
        ...(dto.parkingSpaces !== undefined && {
          parkingSpaces: dto.parkingSpaces,
        }),
        ...(dto.constructionStartDate !== undefined && {
          constructionStartDate: dto.constructionStartDate,
        }),
        ...(dto.completionDate && { completionDate: dto.completionDate }),
        ...(dto.deliveryStages !== undefined && {
          deliveryStages: dto.deliveryStages,
        }),
        ...(dto.amenities && { amenities: dto.amenities }),
        ...(dto.hasGatedArea !== undefined && {
          hasGatedArea: dto.hasGatedArea,
        }),
        ...(dto.hasConcierge !== undefined && {
          hasConcierge: dto.hasConcierge,
        }),
        ...(dto.hasGreenArea !== undefined && {
          hasGreenArea: dto.hasGreenArea,
        }),
        ...(dto.hasKindergarten !== undefined && {
          hasKindergarten: dto.hasKindergarten,
        }),
        ...(dto.hasCommercial !== undefined && {
          hasCommercial: dto.hasCommercial,
        }),
        ...(dto.heating !== undefined && { heating: dto.heating }),
        ...(dto.gasSupply !== undefined && { gasSupply: dto.gasSupply }),
        ...(dto.waterSupply !== undefined && { waterSupply: dto.waterSupply }),
        ...(dto.elevator !== undefined && { elevator: dto.elevator }),
        ...(dto.elevatorCount !== undefined && {
          elevatorCount: dto.elevatorCount,
        }),
        ...(dto.masterPlanImage !== undefined && {
          masterPlanImage: dto.masterPlanImage,
        }),
        ...(dto.siteLayoutImage !== undefined && {
          siteLayoutImage: dto.siteLayoutImage,
        }),
        ...(dto.virtualTourUrl !== undefined && {
          virtualTourUrl: dto.virtualTourUrl,
        }),
        ...(dto.status && { status: dto.status as any }),
        ...(dto.featured !== undefined && { featured: dto.featured }),
      },
    });

    return project;
  }

  /**
   * Delete a project
   */
  async delete(id: string): Promise<void> {
    const project = await this.prisma.developerProject.findUnique({
      where: { id },
      select: { developerId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.developerProject.delete({
      where: { id },
    });

    // Update developer stats
    await this.updateDeveloperStats(project.developerId);
  }

  /**
   * Update project statistics (unit counts)
   */
  async updateStats(projectId: string): Promise<void> {
    const [total, available, reserved, sold, handedOver] = await Promise.all([
      this.prisma.property.count({
        where: { developerProjectId: projectId },
      }),
      this.prisma.property.count({
        where: {
          developerProjectId: projectId,
          unitStatus: 'AVAILABLE',
        },
      }),
      this.prisma.property.count({
        where: {
          developerProjectId: projectId,
          unitStatus: 'RESERVED',
        },
      }),
      this.prisma.property.count({
        where: {
          developerProjectId: projectId,
          unitStatus: 'SOLD',
        },
      }),
      this.prisma.property.count({
        where: {
          developerProjectId: projectId,
          unitStatus: 'HANDED_OVER',
        },
      }),
    ]);

    await this.prisma.developerProject.update({
      where: { id: projectId },
      data: {
        unitsTotal: total,
        unitsAvailable: available,
        unitsReserved: reserved,
        unitsSold: sold + handedOver,
      },
    });
  }

  /**
   * Update developer statistics (auto-triggered when projects change)
   */
  private async updateDeveloperStats(developerId: string): Promise<void> {
    const totalProjects = await this.prisma.developerProject.count({
      where: { developerId },
    });

    await this.prisma.developer.update({
      where: { id: developerId },
      data: { totalProjects },
    });
  }
}
