import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';
import { DealsService } from './deals.service';
import { CreateDealDto, UpdateDealDto, CloseDealDto } from './dto/create-deal.dto';

@Controller('agency-crm/deals')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  async create(@Body() createDealDto: CreateDealDto, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    return this.dealsService.create(agencyId, memberId, createDealDto);
  }

  @Get()
  async findAll(@Query() query: any, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    const role = req.user.role;
    return this.dealsService.findAll(agencyId, memberId, role, query);
  }

  @Get('pipeline')
  async getPipeline(@Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    const role = req.user.role;
    return this.dealsService.getPipeline(agencyId, memberId, role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    const role = req.user.role;
    return this.dealsService.findOne(agencyId, memberId, role, id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDealDto: UpdateDealDto,
    @Request() req: any,
  ): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    const role = req.user.role;
    return this.dealsService.update(agencyId, memberId, role, id, updateDealDto);
  }

  @Post(':id/close')
  async close(
    @Param('id') id: string,
    @Body() closeDealDto: CloseDealDto,
    @Request() req: any,
  ): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    const role = req.user.role;
    return this.dealsService.close(agencyId, memberId, role, id, closeDealDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    const role = req.user.role;
    return this.dealsService.delete(agencyId, memberId, role, id);
  }
}
