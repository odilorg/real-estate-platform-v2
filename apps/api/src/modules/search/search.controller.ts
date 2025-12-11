import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Advanced property search with Elasticsearch' })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Search query (full-text)',
  })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'propertyType', required: false })
  @ApiQuery({ name: 'listingType', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'bedrooms', required: false, type: Number })
  @ApiQuery({ name: 'bathrooms', required: false, type: Number })
  @ApiQuery({ name: 'minArea', required: false, type: Number })
  @ApiQuery({ name: 'maxArea', required: false, type: Number })
  @ApiQuery({ name: 'buildingClass', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['relevance', 'price_asc', 'price_desc', 'date_desc', 'date_asc'],
  })
  async search(@Query() filters: any) {
    return this.searchService.searchProperties({
      query: filters.query,
      city: filters.city,
      propertyType: filters.propertyType,
      listingType: filters.listingType,
      minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
      bedrooms: filters.bedrooms ? parseInt(filters.bedrooms) : undefined,
      bathrooms: filters.bathrooms ? parseFloat(filters.bathrooms) : undefined,
      minArea: filters.minArea ? parseFloat(filters.minArea) : undefined,
      maxArea: filters.maxArea ? parseFloat(filters.maxArea) : undefined,
      buildingClass: filters.buildingClass,
      page: filters.page ? parseInt(filters.page) : 1,
      limit: filters.limit ? parseInt(filters.limit) : 20,
      sortBy: filters.sortBy || 'relevance',
    });
  }

  @Get('suggestions')
  @Public()
  @ApiOperation({ summary: 'Get search suggestions/autocomplete' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSuggestions(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const suggestions = await this.searchService.getSuggestions(
      query,
      limit ? parseInt(limit) : 5,
    );
    return { suggestions };
  }

  @Post('reindex')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reindex all properties (Admin only)' })
  async reindexProperties() {
    const result = await this.searchService.reindexAllProperties();
    return {
      message: result.success
        ? `Successfully reindexed ${result.count} properties`
        : 'Reindexing failed',
      ...result,
    };
  }

  @Post('initialize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initialize Elasticsearch index (Admin only)' })
  async initializeIndex() {
    await this.searchService.initializeIndex();
    return { message: 'Index initialization completed' };
  }
}
