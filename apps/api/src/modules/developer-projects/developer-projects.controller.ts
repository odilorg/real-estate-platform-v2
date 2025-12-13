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
import { DeveloperProjectsService } from './developer-projects.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, DeveloperProject } from '@repo/database';

// Temporary DTOs (will be moved to @repo/shared later)
class CreateProjectDto {
  name!: string;
  nameUz?: string;
  descriptionRu?: string;
  descriptionUz?: string;
  cityId!: string;
  districtId!: string;
  mahallaId?: string;
  address!: string;
  latitude?: number;
  longitude?: number;
  buildingClass?: string;
  buildingType?: string;
  totalUnits!: number;
  totalFloors?: number;
  totalBlocks?: number;
  parkingSpaces?: number;
  constructionStartDate?: Date;
  completionDate!: Date;
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

class UpdateProjectDto {
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
