import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Property, UnitStatus } from '@repo/database';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { ChangeUnitStatusDto } from './dto/change-unit-status.dto';
import { BulkUploadResult } from './dto/bulk-upload.dto';
import * as Papa from 'papaparse';

interface UnitFilters {
  status?: UnitStatus;
  floor?: number;
  bedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  buildingBlock?: string;
}

export interface PaginatedUnits {
  units: Property[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a single unit
   */
  async create(
    projectId: string,
    userId: string,
    dto: CreateUnitDto,
  ): Promise<Property> {
    // Get project to verify ownership and get project details
    const project = await this.prisma.developerProject.findUnique({
      where: { id: projectId },
      include: {
        developer: true,
        city: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if unit number already exists in this project
    const existingUnit = await this.prisma.property.findFirst({
      where: {
        developerProjectId: projectId,
        unitNumber: dto.unitNumber,
      },
    });

    if (existingUnit) {
      throw new BadRequestException(
        `Unit number ${dto.unitNumber} already exists in this project`,
      );
    }

    // Generate title based on bedrooms
    const bedroomLabel =
      dto.bedrooms === 0
        ? 'Studio'
        : `${dto.bedrooms}-bedroom ${dto.bedrooms === 1 ? 'apartment' : 'apartments'}`;
    const title = `${bedroomLabel} in ${project.name}`;

    // Create the unit
    const unit = await this.prisma.property.create({
      data: {
        // Developer ownership
        developerId: project.developerId,
        developerProjectId: projectId,
        userId, // Service account or developer user

        // Unit-specific fields
        unitNumber: dto.unitNumber,
        buildingBlock: dto.buildingBlock,
        floor: dto.floor,
        entrance: dto.entrance,
        unitStatus: 'AVAILABLE',

        // Property details
        title,
        description:
          dto.description || `Unit ${dto.unitNumber} - ${bedroomLabel}`,
        propertyType: 'APARTMENT',
        listingType: 'SALE',
        marketType: 'NEW_BUILDING',

        // Specs
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms || 1,
        area: dto.area,
        livingArea: dto.livingArea,
        kitchenArea: dto.kitchenArea,
        balcony: dto.balcony,
        loggia: dto.loggia,

        // Price
        price: dto.price,
        currency: dto.currency || 'YE',

        // Payment plan
        paymentPlanAvailable: dto.paymentPlanAvailable || false,
        downPaymentPercent: dto.downPaymentPercent,
        installmentMonths: dto.installmentMonths,
        paymentPlanDetails: dto.paymentPlanDetails,

        // Renovation
        renovation: dto.renovation as any,
        windowView: dto.windowView,

        // Location (inherit from project)
        city: project.city.nameRu,
        address: project.address,
        latitude: project.latitude,
        longitude: project.longitude,

        // Building info (inherit from project)
        buildingClass: project.buildingClass,
        buildingType: project.buildingType,
        totalFloors: project.totalFloors,

        // Metadata
        status: 'ACTIVE',
        featured: false,
        verified: true, // Developer units are pre-verified
      },
    });

    // Update project stats
    await this.updateProjectStats(projectId);

    return unit;
  }

  /**
   * Bulk upload units from CSV
   */
  async bulkUpload(
    projectId: string,
    userId: string,
    csvContent: string,
    mapping?: Record<string, string>,
  ): Promise<BulkUploadResult> {
    // Get project details
    const project = await this.prisma.developerProject.findUnique({
      where: { id: projectId },
      include: {
        developer: true,
        city: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Parse CSV
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (parsed.errors.length > 0) {
      throw new BadRequestException(
        `CSV parsing error: ${parsed.errors[0].message}`,
      );
    }

    const rows = parsed.data as Record<string, any>[];

    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    if (rows.length > 1000) {
      throw new BadRequestException(
        'Maximum 1000 units per upload. Please split into smaller batches.',
      );
    }

    // Default column mapping
    const columnMapping = mapping || {
      unitNumber: 'unitNumber',
      floor: 'floor',
      bedrooms: 'bedrooms',
      bathrooms: 'bathrooms',
      area: 'area',
      price: 'price',
      block: 'block',
      entrance: 'entrance',
      livingArea: 'livingArea',
      kitchenArea: 'kitchenArea',
      currency: 'currency',
    };

    const result: BulkUploadResult = {
      created: 0,
      failed: 0,
      errors: [],
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because 1-indexed and header row

      try {
        // Extract values from row using mapping
        const unitNumber = row[columnMapping.unitNumber]?.toString().trim();
        const floor = parseFloat(row[columnMapping.floor]);
        const bedrooms = parseInt(row[columnMapping.bedrooms], 10);
        const bathrooms = row[columnMapping.bathrooms]
          ? parseFloat(row[columnMapping.bathrooms])
          : 1;
        const area = parseFloat(row[columnMapping.area]);
        const price = parseFloat(row[columnMapping.price]);
        const block = row[columnMapping.block]?.toString().trim();
        const entrance = row[columnMapping.entrance]?.toString().trim();
        const livingArea = row[columnMapping.livingArea]
          ? parseFloat(row[columnMapping.livingArea])
          : undefined;
        const kitchenArea = row[columnMapping.kitchenArea]
          ? parseFloat(row[columnMapping.kitchenArea])
          : undefined;
        const currency =
          row[columnMapping.currency]?.toString().toUpperCase() || 'YE';

        // Validate required fields
        if (!unitNumber || unitNumber === '') {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            unitNumber: unitNumber || 'unknown',
            error: 'Unit number is required',
          });
          continue;
        }

        if (isNaN(floor)) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            unitNumber,
            error: 'Floor must be a valid number',
          });
          continue;
        }

        if (isNaN(bedrooms) || bedrooms < 0) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            unitNumber,
            error: 'Bedrooms must be a valid number (0 or greater)',
          });
          continue;
        }

        if (isNaN(area) || area <= 0) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            unitNumber,
            error: 'Area must be a positive number',
          });
          continue;
        }

        if (isNaN(price) || price <= 0) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            unitNumber,
            error: 'Price must be a positive number',
          });
          continue;
        }

        if (!['YE', 'UZS'].includes(currency)) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            unitNumber,
            error: 'Currency must be YE or UZS',
          });
          continue;
        }

        // Check if unit already exists
        const existing = await this.prisma.property.findFirst({
          where: {
            developerProjectId: projectId,
            unitNumber,
          },
        });

        if (existing) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            unitNumber,
            error: 'Unit number already exists in this project',
          });
          continue;
        }

        // Generate title
        const bedroomLabel =
          bedrooms === 0
            ? 'Studio'
            : `${bedrooms}-bedroom ${bedrooms === 1 ? 'apartment' : 'apartments'}`;
        const title = `${bedroomLabel} in ${project.name}`;

        // Create unit
        await this.prisma.property.create({
          data: {
            // Developer ownership
            developerId: project.developerId,
            developerProjectId: projectId,
            userId,

            // Unit-specific
            unitNumber,
            buildingBlock: block,
            floor,
            entrance,
            unitStatus: 'AVAILABLE',

            // Property details
            title,
            description: `Unit ${unitNumber} - ${bedroomLabel}`,
            propertyType: 'APARTMENT',
            listingType: 'SALE',
            marketType: 'NEW_BUILDING',

            // Specs
            bedrooms,
            bathrooms,
            area,
            livingArea,
            kitchenArea,

            // Price
            price,
            currency: currency as 'YE' | 'UZS',

            // Location (inherit from project)
            city: project.city.nameRu,
            address: project.address,
            latitude: project.latitude,
            longitude: project.longitude,

            // Building info
            buildingClass: project.buildingClass,
            buildingType: project.buildingType,
            totalFloors: project.totalFloors,

            // Metadata
            status: 'ACTIVE',
            featured: false,
            verified: true,
          },
        });

        result.created++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          unitNumber: row[columnMapping.unitNumber] || 'unknown',
          error: error.message || 'Unknown error',
        });
      }
    }

    // Update project stats
    if (result.created > 0) {
      await this.updateProjectStats(projectId);
    }

    return result;
  }

  /**
   * Get all units for a project with filters and pagination
   */
  async findAll(
    projectId: string,
    filters?: UnitFilters,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedUnits> {
    const where: any = {
      developerProjectId: projectId,
    };

    // Apply filters
    if (filters?.status) {
      where.unitStatus = filters.status;
    }

    if (filters?.floor !== undefined) {
      where.floor = filters.floor;
    }

    if (filters?.bedrooms !== undefined) {
      where.bedrooms = filters.bedrooms;
    }

    if (filters?.buildingBlock) {
      where.buildingBlock = filters.buildingBlock;
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    // Get total count
    const total = await this.prisma.property.count({ where });

    // Get units with pagination
    const units = await this.prisma.property.findMany({
      where,
      include: {
        images: {
          take: 1,
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [
        { buildingBlock: 'asc' },
        { floor: 'asc' },
        { unitNumber: 'asc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      units,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single unit by ID
   */
  async findOne(unitId: string): Promise<Property> {
    const unit = await this.prisma.property.findUnique({
      where: { id: unitId },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        developerProject: {
          include: {
            developer: true,
            city: true,
            district: true,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return unit;
  }

  /**
   * Update a unit
   */
  async update(unitId: string, dto: UpdateUnitDto): Promise<Property> {
    const existingUnit = await this.prisma.property.findUnique({
      where: { id: unitId },
    });

    if (!existingUnit) {
      throw new NotFoundException('Unit not found');
    }

    // If updating unit number, check for duplicates
    if (dto.unitNumber && dto.unitNumber !== existingUnit.unitNumber) {
      const duplicate = await this.prisma.property.findFirst({
        where: {
          developerProjectId: existingUnit.developerProjectId!,
          unitNumber: dto.unitNumber,
          id: { not: unitId },
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          `Unit number ${dto.unitNumber} already exists in this project`,
        );
      }
    }

    // Update title if bedrooms changed
    let title = existingUnit.title;
    if (dto.bedrooms !== undefined && dto.bedrooms !== existingUnit.bedrooms) {
      const bedroomLabel =
        dto.bedrooms === 0
          ? 'Studio'
          : `${dto.bedrooms}-bedroom ${dto.bedrooms === 1 ? 'apartment' : 'apartments'}`;
      const project = await this.prisma.developerProject.findUnique({
        where: { id: existingUnit.developerProjectId! },
      });
      title = `${bedroomLabel} in ${project?.name}`;
    }

    const unit = await this.prisma.property.update({
      where: { id: unitId },
      data: {
        ...(dto.unitNumber !== undefined && { unitNumber: dto.unitNumber }),
        ...(dto.buildingBlock !== undefined && {
          buildingBlock: dto.buildingBlock,
        }),
        ...(dto.floor !== undefined && { floor: dto.floor }),
        ...(dto.entrance !== undefined && { entrance: dto.entrance }),
        ...(dto.bedrooms !== undefined && { bedrooms: dto.bedrooms, title }),
        ...(dto.bathrooms !== undefined && { bathrooms: dto.bathrooms }),
        ...(dto.area !== undefined && { area: dto.area }),
        ...(dto.livingArea !== undefined && { livingArea: dto.livingArea }),
        ...(dto.kitchenArea !== undefined && { kitchenArea: dto.kitchenArea }),
        ...(dto.balcony !== undefined && { balcony: dto.balcony }),
        ...(dto.loggia !== undefined && { loggia: dto.loggia }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.paymentPlanAvailable !== undefined && {
          paymentPlanAvailable: dto.paymentPlanAvailable,
        }),
        ...(dto.downPaymentPercent !== undefined && {
          downPaymentPercent: dto.downPaymentPercent,
        }),
        ...(dto.installmentMonths !== undefined && {
          installmentMonths: dto.installmentMonths,
        }),
        ...(dto.paymentPlanDetails !== undefined && {
          paymentPlanDetails: dto.paymentPlanDetails,
        }),
        ...(dto.renovation !== undefined && { renovation: dto.renovation as any }),
        ...(dto.windowView !== undefined && { windowView: dto.windowView }),
      },
    });

    return unit;
  }

  /**
   * Change unit status
   */
  async changeStatus(
    unitId: string,
    dto: ChangeUnitStatusDto,
  ): Promise<Property> {
    const unit = await this.prisma.property.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    const updateData: any = {
      unitStatus: dto.status,
    };

    // Handle reservation
    if (dto.status === 'RESERVED') {
      updateData.reservedBy = dto.reservedBy;
      updateData.reservedUntil = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
    } else {
      updateData.reservedBy = null;
      updateData.reservedUntil = null;
    }

    // Handle handover
    if (dto.status === 'HANDED_OVER') {
      updateData.handoverDate = new Date();
    }

    const updatedUnit = await this.prisma.property.update({
      where: { id: unitId },
      data: updateData,
    });

    // Update project stats
    if (unit.developerProjectId) {
      await this.updateProjectStats(unit.developerProjectId);
    }

    return updatedUnit;
  }

  /**
   * Delete a unit
   */
  async delete(unitId: string): Promise<void> {
    const unit = await this.prisma.property.findUnique({
      where: { id: unitId },
      select: { id: true, developerProjectId: true },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    await this.prisma.property.delete({
      where: { id: unitId },
    });

    // Update project stats
    if (unit.developerProjectId) {
      await this.updateProjectStats(unit.developerProjectId);
    }
  }

  /**
   * Update project statistics (unit counts)
   */
  private async updateProjectStats(projectId: string): Promise<void> {
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
   * Verify user has permission to manage units in this project
   */
  async verifyProjectAccess(
    projectId: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    if (userRole === 'ADMIN') {
      return; // Admins can access any project
    }

    const project = await this.prisma.developerProject.findUnique({
      where: { id: projectId },
      include: {
        developer: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.developerId !== project.developerId) {
      throw new ForbiddenException(
        'You do not have permission to manage units in this project',
      );
    }
  }
}
