import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';
import { DealsService } from './deals.service';
import { CreateDealDto, UpdateDealDto, CloseDealDto } from './dto/create-deal.dto';

@Controller('developer-crm/deals')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  async create(@Body() createDealDto: CreateDealDto, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    const memberId = req.user.developerMemberId;
    return this.dealsService.create(developerId, memberId, createDealDto);
  }

  @Get()
  async findAll(@Query() query: any, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    const memberId = req.user.developerMemberId;
    const role = req.user.role;
    return this.dealsService.findAll(developerId, memberId, role, query);
  }

  @Get('pipeline')
  async getPipeline(@Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    const memberId = req.user.developerMemberId;
    const role = req.user.role;
    return this.dealsService.getPipeline(developerId, memberId, role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    const memberId = req.user.developerMemberId;
    const role = req.user.role;
    return this.dealsService.findOne(developerId, memberId, role, id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDealDto: UpdateDealDto,
    @Request() req: any,
  ): Promise<any> {
    const developerId = req.user.developerId;
    const memberId = req.user.developerMemberId;
    const role = req.user.role;
    return this.dealsService.update(developerId, memberId, role, id, updateDealDto);
  }

  @Post(':id/close')
  async close(
    @Param('id') id: string,
    @Body() closeDealDto: CloseDealDto,
    @Request() req: any,
  ): Promise<any> {
    const developerId = req.user.developerId;
    const memberId = req.user.developerMemberId;
    const role = req.user.role;
    return this.dealsService.close(developerId, memberId, role, id, closeDealDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    const memberId = req.user.developerMemberId;
    const role = req.user.role;
    return this.dealsService.delete(developerId, memberId, role, id);
  }
}
