import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DevelopersService } from './developers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, Developer } from '@repo/database';

// Temporary DTOs (will be moved to @repo/shared later)
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

interface AddTeamMemberDto {
  userId: string;
  role: 'DEVELOPER_ADMIN' | 'DEVELOPER_SALES_AGENT';
}

@Controller('developers')
export class DevelopersController {
  constructor(private readonly developersService: DevelopersService) {}

  /**
   * Create new developer (admin or registration)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateDeveloperDto,
  ): Promise<Developer> {
    return this.developersService.create(user.id, dto);
  }

  /**
   * Get all developers (public, with pagination)
   */
  @Get()
  @Public()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('city') city?: string,
    @Query('verified') verified?: string,
  ) {
    return this.developersService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      city,
      verified:
        verified === 'true' ? true : verified === 'false' ? false : undefined,
    });
  }

  /**
   * Get developer by slug (public)
   */
  @Get('slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string): Promise<Developer> {
    return this.developersService.findBySlug(slug);
  }

  /**
   * Get developer by ID (public)
   */
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string): Promise<Developer> {
    return this.developersService.findById(id);
  }

  /**
   * Update developer (admin or developer admin)
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateDeveloperDto,
  ): Promise<Developer> {
    return this.developersService.update(id, user.id, dto);
  }

  /**
   * Delete developer (admin only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  delete(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    return this.developersService.delete(id, user.id);
  }

  /**
   * Add team member to developer
   */
  @Post(':id/team')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'DEVELOPER_ADMIN')
  async addTeamMember(
    @Param('id') developerId: string,
    @Body() dto: AddTeamMemberDto,
  ): Promise<{ message: string }> {
    await this.developersService.addTeamMember(
      developerId,
      dto.userId,
      dto.role,
    );
    return { message: 'Team member added successfully' };
  }

  /**
   * Remove team member from developer
   */
  @Delete(':id/team/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'DEVELOPER_ADMIN')
  async removeTeamMember(
    @Param('id') developerId: string,
    @Param('userId') userId: string,
  ): Promise<{ message: string }> {
    await this.developersService.removeTeamMember(developerId, userId);
    return { message: 'Team member removed successfully' };
  }

  /**
   * Update developer statistics (admin only - for manual recalculation)
   */
  @Post(':id/update-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateStatistics(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.developersService.updateStatistics(id);
    return { message: 'Statistics updated successfully' };
  }
}
