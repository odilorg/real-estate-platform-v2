import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';
import { ListingsService } from './listings.service';

@Controller('agency-crm/listings')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  async findAll(@Request() req: any) {
    const agencyId = req.user.agencyId;
    return this.listingsService.findAll(agencyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const agencyId = req.user.agencyId;
    return this.listingsService.findOne(agencyId, id);
  }

  @Post()
  async create(@Body() data: any, @Request() req: any) {
    const userId = req.user.userId;
    const agencyId = req.user.agencyId;
    return this.listingsService.create(userId, agencyId, data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    const agencyId = req.user.agencyId;
    return this.listingsService.update(userId, agencyId, id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.userId;
    const agencyId = req.user.agencyId;
    return this.listingsService.remove(userId, agencyId, id);
  }

  @Post(':id/mark-sold')
  async markSold(
    @Param('id') id: string,
    @Body() data: { soldPrice: number; soldDate: string },
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    const agencyId = req.user.agencyId;
    return this.listingsService.markSold(
      userId,
      agencyId,
      id,
      data.soldPrice,
      new Date(data.soldDate),
    );
  }
}
