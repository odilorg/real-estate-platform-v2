import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UnitsService, PaginatedUnits } from './units.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, Property } from '@repo/database';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { ChangeUnitStatusDto } from './dto/change-unit-status.dto';
import { BulkUploadDto, BulkUploadResult } from './dto/bulk-upload.dto';

@Controller('developer-projects/:projectId/units')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  /**
   * Bulk upload units from CSV
   */
  @Post('bulk')
  @Roles('ADMIN', 'DEVELOPER_ADMIN', 'DEVELOPER_SALES_AGENT')
  @UseInterceptors(FileInterceptor('file'))
  async bulkUpload(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: BulkUploadDto,
  ): Promise<BulkUploadResult> {
    // Verify access
    await this.unitsService.verifyProjectAccess(projectId, user.id, user.role);

    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    // Check file type
    if (
      !file.originalname.endsWith('.csv') &&
      file.mimetype !== 'text/csv' &&
      file.mimetype !== 'application/vnd.ms-excel'
    ) {
      throw new BadRequestException('File must be a CSV');
    }

    // Convert buffer to string
    const csvContent = file.buffer.toString('utf-8');

    return this.unitsService.bulkUpload(
      projectId,
      user.id,
      csvContent,
      dto.mapping,
    );
  }

  /**
   * Create a single unit
   */
  @Post()
  @Roles('ADMIN', 'DEVELOPER_ADMIN', 'DEVELOPER_SALES_AGENT')
  async create(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateUnitDto,
  ): Promise<Property> {
    // Verify access
    await this.unitsService.verifyProjectAccess(projectId, user.id, user.role);

    return this.unitsService.create(projectId, user.id, dto);
  }

  /**
   * Get all units for a project
   */
  @Get()
  @Roles('ADMIN', 'DEVELOPER_ADMIN', 'DEVELOPER_SALES_AGENT')
  async findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('floor') floor?: string,
    @Query('bedrooms') bedrooms?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('buildingBlock') buildingBlock?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedUnits> {
    // Verify access
    await this.unitsService.verifyProjectAccess(projectId, user.id, user.role);

    const filters: any = {};

    if (status) {
      filters.status = status;
    }

    if (floor) {
      filters.floor = parseInt(floor, 10);
    }

    if (bedrooms) {
      filters.bedrooms = parseInt(bedrooms, 10);
    }

    if (minPrice) {
      filters.minPrice = parseFloat(minPrice);
    }

    if (maxPrice) {
      filters.maxPrice = parseFloat(maxPrice);
    }

    if (buildingBlock) {
      filters.buildingBlock = buildingBlock;
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;

    return this.unitsService.findAll(projectId, filters, pageNum, limitNum);
  }

  /**
   * Get a single unit by ID
   */
  @Get(':unitId')
  @Roles('ADMIN', 'DEVELOPER_ADMIN', 'DEVELOPER_SALES_AGENT')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('unitId') unitId: string,
    @CurrentUser() user: User,
  ): Promise<Property> {
    // Verify access
    await this.unitsService.verifyProjectAccess(projectId, user.id, user.role);

    return this.unitsService.findOne(unitId);
  }

  /**
   * Update a unit
   */
  @Put(':unitId')
  @Roles('ADMIN', 'DEVELOPER_ADMIN', 'DEVELOPER_SALES_AGENT')
  async update(
    @Param('projectId') projectId: string,
    @Param('unitId') unitId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateUnitDto,
  ): Promise<Property> {
    // Verify access
    await this.unitsService.verifyProjectAccess(projectId, user.id, user.role);

    return this.unitsService.update(unitId, dto);
  }

  /**
   * Change unit status
   */
  @Patch(':unitId/status')
  @Roles('ADMIN', 'DEVELOPER_ADMIN', 'DEVELOPER_SALES_AGENT')
  async changeStatus(
    @Param('projectId') projectId: string,
    @Param('unitId') unitId: string,
    @CurrentUser() user: User,
    @Body() dto: ChangeUnitStatusDto,
  ): Promise<Property> {
    // Verify access
    await this.unitsService.verifyProjectAccess(projectId, user.id, user.role);

    return this.unitsService.changeStatus(unitId, dto);
  }

  /**
   * Delete a unit
   */
  @Delete(':unitId')
  @Roles('ADMIN', 'DEVELOPER_ADMIN')
  async delete(
    @Param('projectId') projectId: string,
    @Param('unitId') unitId: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    // Verify access
    await this.unitsService.verifyProjectAccess(projectId, user.id, user.role);

    await this.unitsService.delete(unitId);
    return { message: 'Unit deleted successfully' };
  }
}
