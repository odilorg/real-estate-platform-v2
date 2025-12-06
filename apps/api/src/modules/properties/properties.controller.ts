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
import { PropertiesService } from './properties.service';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  PropertyFilterDto,
} from '@repo/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators';
import { CurrentUser } from '../auth/decorators';
import { User } from '@repo/database';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('properties')
export class PropertiesController {
  constructor(private propertiesService: PropertiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(CreatePropertyDto)) dto: CreatePropertyDto,
  ) {
    return this.propertiesService.create(user.id, dto);
  }

  @Get()
  @Public()
  async findAll(@Query() query: any) {
    const filters = PropertyFilterDto.parse({
      ...query,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
      minArea: query.minArea ? parseFloat(query.minArea) : undefined,
      maxArea: query.maxArea ? parseFloat(query.maxArea) : undefined,
      bedrooms: query.bedrooms ? parseInt(query.bedrooms) : undefined,
    });
    return this.propertiesService.findAll(filters);
  }

  @Get('featured')
  @Public()
  async getFeatured(@Query('limit') limit?: string) {
    return this.propertiesService.getFeatured(limit ? parseInt(limit) : 6);
  }

  @Get('recent')
  @Public()
  async getRecent(@Query('limit') limit?: string) {
    return this.propertiesService.getRecent(limit ? parseInt(limit) : 12);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyProperties(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.propertiesService.findByUser(
      user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(UpdatePropertyDto)) dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.propertiesService.remove(id, user.id);
  }
}
