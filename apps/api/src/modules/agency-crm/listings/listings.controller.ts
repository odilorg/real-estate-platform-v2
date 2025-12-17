import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';
import { ListingsService } from './listings.service';
import { CreateListingDto, UpdateListingDto, DeactivateListingDto, MarkSoldDto } from './dto/listing.dto';

@Controller('agency-crm/listings')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  async create(@Body() createListingDto: CreateListingDto, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    return this.listingsService.create(agencyId, memberId, createListingDto);
  }

  @Get()
  async findAll(@Query() query: any, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    const role = req.user.role;
    return this.listingsService.findAll(agencyId, memberId, role, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    const role = req.user.role;
    return this.listingsService.findOne(agencyId, memberId, role, id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateListingDto: UpdateListingDto,
    @Request() req: any,
  ): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    const role = req.user.role;
    return this.listingsService.update(agencyId, memberId, role, id, updateListingDto);
  }

  @Post(':id/deactivate')
  async deactivate(
    @Param('id') id: string,
    @Body() deactivateListingDto: DeactivateListingDto,
    @Request() req: any,
  ): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    const role = req.user.role;
    return this.listingsService.deactivate(agencyId, memberId, role, id, deactivateListingDto);
  }

  @Post(':id/mark-sold')
  async markSold(
    @Param('id') id: string,
    @Body() markSoldDto: MarkSoldDto,
    @Request() req: any,
  ): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    const role = req.user.role;
    return this.listingsService.markSold(agencyId, memberId, role, id, markSoldDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    const role = req.user.role;
    return this.listingsService.delete(agencyId, memberId, role, id);
  }
}
