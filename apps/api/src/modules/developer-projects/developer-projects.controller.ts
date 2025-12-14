import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsDateString,
} from 'class-validator';
import { DeveloperProjectsService } from './developer-projects.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, DeveloperProject } from '@repo/database';

// Temporary DTOs (will be moved to @repo/shared later)
class CreateProjectDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  nameUz?: string;

  @IsString()
  @IsOptional()
  descriptionRu?: string;

  @IsString()
  @IsOptional()
  descriptionUz?: string;

  @IsString()
  cityId!: string;

  @IsString()
  districtId!: string;

  @IsString()
  @IsOptional()
  mahallaId?: string;

  @IsString()
  address!: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  buildingClass?: string;

  @IsString()
  @IsOptional()
  buildingType?: string;

  @IsNumber()
  totalUnits!: number;

  @IsNumber()
  @IsOptional()
  totalFloors?: number;

  @IsNumber()
  @IsOptional()
  totalBlocks?: number;

  @IsNumber()
  @IsOptional()
  parkingSpaces?: number;

  @IsDateString()
  @IsOptional()
  constructionStartDate?: string;

  @IsDateString()
  completionDate!: string;

  @IsOptional()
  deliveryStages?: any;

  @IsArray()
  @IsOptional()
  amenities?: string[];

  @IsBoolean()
  @IsOptional()
  hasGatedArea?: boolean;

  @IsBoolean()
  @IsOptional()
  hasConcierge?: boolean;

  @IsBoolean()
  @IsOptional()
  hasGreenArea?: boolean;

  @IsBoolean()
  @IsOptional()
  hasKindergarten?: boolean;

  @IsBoolean()
  @IsOptional()
  hasCommercial?: boolean;

  @IsString()
  @IsOptional()
  heating?: string;

  @IsBoolean()
  @IsOptional()
  gasSupply?: boolean;

  @IsString()
  @IsOptional()
  waterSupply?: string;

  @IsBoolean()
  @IsOptional()
  elevator?: boolean;

  @IsNumber()
  @IsOptional()
  elevatorCount?: number;

  @IsString()
  @IsOptional()
  masterPlanImage?: string;

  @IsString()
  @IsOptional()
  siteLayoutImage?: string;

  @IsString()
  @IsOptional()
  virtualTourUrl?: string;
}

class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  nameUz?: string;

  @IsString()
  @IsOptional()
  descriptionRu?: string;

  @IsString()
  @IsOptional()
  descriptionUz?: string;

  @IsString()
  @IsOptional()
  cityId?: string;

  @IsString()
  @IsOptional()
  districtId?: string;

  @IsString()
  @IsOptional()
  mahallaId?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  buildingClass?: string;

  @IsString()
  @IsOptional()
  buildingType?: string;

  @IsNumber()
  @IsOptional()
  totalUnits?: number;

  @IsNumber()
  @IsOptional()
  totalFloors?: number;

  @IsNumber()
  @IsOptional()
  totalBlocks?: number;

  @IsNumber()
  @IsOptional()
  parkingSpaces?: number;

  @IsDateString()
  @IsOptional()
  constructionStartDate?: string;

  @IsDateString()
  @IsOptional()
  completionDate?: string;

  @IsOptional()
  deliveryStages?: any;

  @IsArray()
  @IsOptional()
  amenities?: string[];

  @IsBoolean()
  @IsOptional()
  hasGatedArea?: boolean;

  @IsBoolean()
  @IsOptional()
  hasConcierge?: boolean;

  @IsBoolean()
  @IsOptional()
  hasGreenArea?: boolean;

  @IsBoolean()
  @IsOptional()
  hasKindergarten?: boolean;

  @IsBoolean()
  @IsOptional()
  hasCommercial?: boolean;

  @IsString()
  @IsOptional()
  heating?: string;

  @IsBoolean()
  @IsOptional()
  gasSupply?: boolean;

  @IsString()
  @IsOptional()
  waterSupply?: string;

  @IsBoolean()
  @IsOptional()
  elevator?: boolean;

  @IsNumber()
  @IsOptional()
  elevatorCount?: number;

  @IsString()
  @IsOptional()
  masterPlanImage?: string;

  @IsString()
  @IsOptional()
  siteLayoutImage?: string;

  @IsString()
  @IsOptional()
  virtualTourUrl?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;
}

@Controller('developer-projects')
export class DeveloperProjectsController {
  constructor(
    private readonly developerProjectsService: DeveloperProjectsService,
  ) {}

  /**
   * Create a new project (developer admin or admin)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'DEVELOPER_ADMIN')
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateProjectDto,
  ): Promise<DeveloperProject> {
    // Use developer ID from user
    return this.developerProjectsService.create(user.developerId!, dto);
  }

  /**
   * Get all projects for the current developer
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'DEVELOPER_ADMIN', 'DEVELOPER_SALES_AGENT')
  findAll(@CurrentUser() user: User): Promise<any[]> {
    return this.developerProjectsService.findAll(user.developerId!);
  }

  /**
   * Get project by slug (public)
   */
  @Get('slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string): Promise<DeveloperProject> {
    return this.developerProjectsService.findBySlug(slug);
  }

  /**
   * Get project by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string): Promise<DeveloperProject> {
    return this.developerProjectsService.findOne(id);
  }

  /**
   * Update a project (developer admin or admin)
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'DEVELOPER_ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<DeveloperProject> {
    return this.developerProjectsService.update(id, dto);
  }

  /**
   * Delete a project (developer admin or admin)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'DEVELOPER_ADMIN')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.developerProjectsService.delete(id);
    return { message: 'Project deleted successfully' };
  }

  /**
   * Update project statistics (admin only - for manual recalculation)
   */
  @Post(':id/update-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateStatistics(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.developerProjectsService.updateStats(id);
    return { message: 'Statistics updated successfully' };
  }
}
