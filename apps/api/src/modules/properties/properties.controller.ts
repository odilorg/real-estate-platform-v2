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
  NotFoundException,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { LocationService } from './location.service';
import { PriceHistoryService } from './price-history.service';
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
  constructor(
    private propertiesService: PropertiesService,
    private locationService: LocationService,
    private priceHistoryService: PriceHistoryService,
  ) {}

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
  async findAll(@Query() query: Record<string, string | undefined>) {
    // Parse all filter parameters
    const filters = PropertyFilterDto.parse({
      // Full-text search
      search: query.search || undefined,

      // Location
      city: query.city || undefined,
      district: query.district || undefined,
      nearestMetro: query.nearestMetro || undefined,

      // Geo-location
      latitude: query.latitude ? parseFloat(query.latitude) : undefined,
      longitude: query.longitude ? parseFloat(query.longitude) : undefined,
      radius: query.radius ? parseFloat(query.radius) : undefined,

      // Property type
      propertyType: query.propertyType || undefined,
      listingType: query.listingType || undefined,
      status: query.status || undefined,

      // Price range
      minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,

      // Area range
      minArea: query.minArea ? parseFloat(query.minArea) : undefined,
      maxArea: query.maxArea ? parseFloat(query.maxArea) : undefined,

      // Rooms
      bedrooms: query.bedrooms ? parseInt(query.bedrooms) : undefined,
      minBedrooms: query.minBedrooms ? parseInt(query.minBedrooms) : undefined,
      maxBedrooms: query.maxBedrooms ? parseInt(query.maxBedrooms) : undefined,
      rooms: query.rooms ? parseInt(query.rooms) : undefined,
      minRooms: query.minRooms ? parseInt(query.minRooms) : undefined,
      maxRooms: query.maxRooms ? parseInt(query.maxRooms) : undefined,

      // Floor
      floor: query.floor ? parseInt(query.floor) : undefined,
      minFloor: query.minFloor ? parseInt(query.minFloor) : undefined,
      maxFloor: query.maxFloor ? parseInt(query.maxFloor) : undefined,
      notFirstFloor: query.notFirstFloor === 'true' || undefined,
      notLastFloor: query.notLastFloor === 'true' || undefined,

      // Building
      buildingClass: query.buildingClass || undefined,
      buildingType: query.buildingType || undefined,
      renovation: query.renovation || undefined,
      parkingType: query.parkingType || undefined,

      // Year
      minYearBuilt: query.minYearBuilt ? parseInt(query.minYearBuilt) : undefined,
      maxYearBuilt: query.maxYearBuilt ? parseInt(query.maxYearBuilt) : undefined,

      // Amenities (comma-separated string)
      amenities: query.amenities ? query.amenities.split(',') : undefined,

      // Boolean features
      hasBalcony: query.hasBalcony === 'true' || undefined,
      hasConcierge: query.hasConcierge === 'true' || undefined,
      hasGatedArea: query.hasGatedArea === 'true' || undefined,

      // Listing options
      featured: query.featured === 'true' ? true : query.featured === 'false' ? false : undefined,
      verified: query.verified === 'true' ? true : query.verified === 'false' ? false : undefined,

      // Pagination & sorting
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    });

    return this.propertiesService.findAll(filters);
  }

  @Get('suggestions')
  @Public()
  async getSearchSuggestions(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.propertiesService.getSearchSuggestions(
      query,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('filters')
  @Public()
  async getFilterOptions() {
    return this.propertiesService.getFilterOptions();
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

  @Get(':id/location-data')
  @Public()
  async getLocationData(@Param('id') id: string) {
    const property = await this.propertiesService.findOne(id);

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    if (!property.latitude || !property.longitude) {
      throw new NotFoundException('Property does not have location coordinates');
    }

    return this.locationService.getPropertyLocationData(
      property.latitude,
      property.longitude,
    );
  }

  @Get(':id/price-history')
  @Public()
  async getPriceHistory(@Param('id') id: string) {
    const property = await this.propertiesService.findOne(id);

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    const history = await this.priceHistoryService.getPriceHistory(id);
    const stats = await this.priceHistoryService.getPriceStats(id);

    return {
      history,
      stats,
    };
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
