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
  UsePipes,
} from '@nestjs/common';
import { AgenciesService } from './agencies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, Agency } from '@repo/database';
import { CreateAgencyDto, UpdateAgencyDto } from '@repo/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  /**
   * Create new agency (admin only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(CreateAgencyDto))
  create(@CurrentUser() user: User, @Body() dto: CreateAgencyDto): Promise<Agency> {
    return this.agenciesService.create(user.id, dto);
  }

  /**
   * Get all agencies (public, with pagination)
   */
  @Get()
  @Public()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('city') city?: string,
    @Query('verified') verified?: string,
  ) {
    return this.agenciesService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      city,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
    });
  }

  /**
   * Get agency by slug (public)
   */
  @Get('slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string): Promise<Agency> {
    return this.agenciesService.findBySlug(slug);
  }

  /**
   * Get agency by ID (public)
   */
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string): Promise<Agency> {
    return this.agenciesService.findById(id);
  }

  /**
   * Update agency (admin or agency member)
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(UpdateAgencyDto))
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateAgencyDto,
  ): Promise<Agency> {
    return this.agenciesService.update(id, user.id, dto);
  }

  /**
   * Delete agency (admin only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  delete(@Param('id') id: string, @CurrentUser() user: User): Promise<{ message: string }> {
    return this.agenciesService.delete(id, user.id);
  }
}
