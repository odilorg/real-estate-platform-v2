import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { LeadsService } from './leads.service';
import {
  CreateLeadDto,
  UpdateLeadDto,
  AssignLeadDto,
  UpdateLeadStatusDto,
  ConvertLeadDto,
} from '@repo/shared';

@Controller('developer-projects/:developerId/leads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DEVELOPER_ADMIN', 'DEVELOPER_SALES_AGENT')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Post()
  async createLead(
    @Param('developerId') developerId: string,
    @Body() dto: CreateLeadDto,
  ) {
    return this.leadsService.createLead(developerId, dto);
  }

  @Get()
  async getLeads(
    @Param('developerId') developerId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('projectId') projectId?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const filters = {
      status,
      priority: priority ? parseInt(priority) : undefined,
      projectId,
      assignedToId,
      search,
    };

    return this.leadsService.getLeads(
      developerId,
      filters,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':leadId')
  async getLead(
    @Param('developerId') developerId: string,
    @Param('leadId') leadId: string,
  ) {
    return this.leadsService.getLead(developerId, leadId);
  }

  @Put(':leadId')
  async updateLead(
    @Param('developerId') developerId: string,
    @Param('leadId') leadId: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.updateLead(developerId, leadId, dto);
  }

  @Patch(':leadId/assign')
  async assignLead(
    @Param('developerId') developerId: string,
    @Param('leadId') leadId: string,
    @Body() dto: AssignLeadDto,
  ) {
    return this.leadsService.assignLead(developerId, leadId, dto);
  }

  @Patch(':leadId/status')
  async updateLeadStatus(
    @Param('developerId') developerId: string,
    @Param('leadId') leadId: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.leadsService.updateLeadStatus(developerId, leadId, dto);
  }

  @Patch(':leadId/convert')
  async convertLead(
    @Param('developerId') developerId: string,
    @Param('leadId') leadId: string,
    @Body() dto: ConvertLeadDto,
  ) {
    return this.leadsService.convertLead(developerId, leadId, dto);
  }

  @Patch(':leadId/follow-up')
  async scheduleFollowUp(
    @Param('developerId') developerId: string,
    @Param('leadId') leadId: string,
    @Body() dto: { nextFollowUpAt: string },
  ) {
    return this.leadsService.scheduleFollowUp(
      developerId,
      leadId,
      new Date(dto.nextFollowUpAt),
    );
  }

  @Delete(':leadId')
  async deleteLead(
    @Param('developerId') developerId: string,
    @Param('leadId') leadId: string,
  ) {
    return this.leadsService.deleteLead(developerId, leadId);
  }
}
