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
  Request,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';

@Controller('agency-crm/leads')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  async create(@Body() createLeadDto: CreateLeadDto, @Request() req: any) {
    const agencyId = req.user.agencyId; // From AgencyOwnershipGuard
    return this.leadsService.create(agencyId, createLeadDto);
  }

  @Get()
  async findAll(@Query() query: QueryLeadsDto, @Request() req: any) {
    const agencyId = req.user.agencyId;
    return this.leadsService.findAll(agencyId, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    return this.leadsService.findOne(agencyId, id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @Request() req: any,
  ) {
    const agencyId = req.user.agencyId;
    return this.leadsService.update(agencyId, id, updateLeadDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const agencyId = req.user.agencyId;
    return this.leadsService.remove(agencyId, id);
  }

  @Put(':id/assign')
  async assign(
    @Param('id') id: string,
    @Body('memberId') memberId: string,
    @Request() req: any,
  ) {
    const agencyId = req.user.agencyId;
    return this.leadsService.assign(agencyId, id, memberId);
  }
}
