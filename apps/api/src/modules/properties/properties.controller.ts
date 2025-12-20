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
  NotFoundException,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { LocationService } from './location.service';
import { PriceHistoryService } from './price-history.service';
import { POIService } from './poi.service';
import { AnalyticsService } from './analytics.service';
import { RecommendationService } from './recommendation.service';
import { StatusHistoryService } from './status-history.service';
import { ValuationService, ValuationResult } from './valuation.service';
import { TelegramShareService } from './telegram-share.service';
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
    private poiService: POIService,
    private analyticsService: AnalyticsService,
    private recommendationService: RecommendationService,
    private statusHistoryService: StatusHistoryService,
    private valuationService: ValuationService,
    private telegramShareService: TelegramShareService,
  ) {}

  @Post()
  @Public() // TEMPORARY: Auth removed for testing
  // @UseGuards(JwtAuthGuard) // TODO: Re-enable after testing
  async create(
    @CurrentUser() user: User | null, // Allow null for testing
    @Body(new ZodValidationPipe(CreatePropertyDto)) dto: CreatePropertyDto,
  ) {
    // TEMPORARY: Use dummy user ID if not authenticated
    const userId = user?.id || 'test-user-id-temporary';
    return this.propertiesService.create(userId, dto);
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
      marketType: query.marketType || undefined,
      status: query.status || undefined,

      // Price range
      minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,

      // Area range
      minArea: query.minArea ? parseFloat(query.minArea) : undefined,
      maxArea: query.maxArea ? parseFloat(query.maxArea) : undefined,

      // Rooms
      bedrooms: query.bedrooms
        ? query.bedrooms.includes(',')
          ? query.bedrooms.split(',').map((b) => parseInt(b.trim()))
          : parseInt(query.bedrooms)
        : undefined,
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
      minYearBuilt: query.minYearBuilt
        ? parseInt(query.minYearBuilt)
        : undefined,
      maxYearBuilt: query.maxYearBuilt
        ? parseInt(query.maxYearBuilt)
        : undefined,

      // Amenities (comma-separated string)
      amenities: query.amenities ? query.amenities.split(',') : undefined,

      // Boolean features
      hasBalcony: query.hasBalcony === 'true' || undefined,
      hasConcierge: query.hasConcierge === 'true' || undefined,
      hasGatedArea: query.hasGatedArea === 'true' || undefined,

      // Listing options
      featured:
        query.featured === 'true'
          ? true
          : query.featured === 'false'
            ? false
            : undefined,
      verified:
        query.verified === 'true'
          ? true
          : query.verified === 'false'
            ? false
            : undefined,

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
      throw new NotFoundException(
        'Property does not have location coordinates',
      );
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

  @Get(':id/pois')
  @Public()
  async getPOIs(@Param('id') id: string) {
    const property = await this.propertiesService.findOne(id);

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return this.poiService.getPOIsForProperty(id);
  }

  @Get(':id/similar')
  @Public()
  async getSimilarProperties(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const property = await this.propertiesService.findOne(id);

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return this.recommendationService.findSimilarProperties(
      id,
      limit ? parseInt(limit) : 6,
    );
  }

  @Get('my/analytics')
  @UseGuards(JwtAuthGuard)
  async getMyPropertiesAnalytics(
    @CurrentUser() user: User,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getUserPropertiesAnalytics(
      user.id,
      days ? parseInt(days) : 30,
    );
  }

  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard)
  async getPropertyAnalytics(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query('days') days?: string,
  ) {
    const property = await this.propertiesService.findOne(id);

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // Only property owner can view analytics
    if (property.userId !== user.id) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return this.analyticsService.getPropertyAnalytics(
      id,
      days ? parseInt(days) : 30,
    );
  }

  @Post(':id/track-view')
  @Public()
  async trackView(
    @Param('id') id: string,
    @CurrentUser() user: User | null,
    @Query('ip') ipAddress?: string,
    @Query('userAgent') userAgent?: string,
    @Query('referrer') referrer?: string,
  ) {
    const property = await this.propertiesService.findOne(id);

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    await this.analyticsService.trackView(
      id,
      user?.id,
      ipAddress,
      userAgent,
      referrer,
    );

    return { success: true };
  }

  @Post('valuation')
  @Public()
  async calculateValuation(
    @Body() input: Record<string, unknown>,
  ): Promise<ValuationResult> {
    try {
      return await this.valuationService.calculateValuation(input as any);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Valuation failed';
      throw new NotFoundException(message);
    }
  }

  @Get(':id/valuation')
  @Public()
  async getPropertyValuation(
    @Param('id') id: string,
  ): Promise<ValuationResult> {
    const property = await this.propertiesService.findOne(id);

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    const input = {
      propertyType: property.propertyType,
      listingType: property.listingType,
      city: property.city,
      district: property.district || undefined,
      area: property.area || 0,
      bedrooms: property.bedrooms || undefined,
      bathrooms: property.bathrooms || undefined,
      floor: property.floor || undefined,
      totalFloors: property.totalFloors || undefined,
      yearBuilt: property.yearBuilt || undefined,
      buildingClass: property.buildingClass || undefined,
      renovation: property.renovation || undefined,
      hasBalcony: (property.balcony || 0) > 0,
      parkingType: property.parkingType || undefined,
      latitude: property.latitude || undefined,
      longitude: property.longitude || undefined,
    };

    try {
      return await this.valuationService.calculateValuation(input);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Valuation failed';
      throw new NotFoundException(message);
    }
  }

  @Get(':id/status-history')
  @Public()
  async getStatusHistory(@Param('id') id: string) {
    const property = await this.propertiesService.findOne(id);

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return this.statusHistoryService.getPropertyStatusHistory(id);
  }

  @Get(':id/timeline')
  @Public()
  async getTimeline(@Param('id') id: string) {
    const property = await this.propertiesService.findOne(id);

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return this.statusHistoryService.getPropertyTimeline(id);
  }

  @Get(':id/status-stats')
  @Public()
  async getStatusStats(@Param('id') id: string) {
    const property = await this.propertiesService.findOne(id);

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return this.statusHistoryService.getStatusStats(id);
  }

  @Post(':id/telegram')
  @UseGuards(JwtAuthGuard)
  async shareToTelegram(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    const property = await this.propertiesService.findOne(id);

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // Only property owner can share to Telegram
    if (property.userId !== user.id) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return this.telegramShareService.sharePropertyToTelegram(id);
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async partialUpdate(
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
