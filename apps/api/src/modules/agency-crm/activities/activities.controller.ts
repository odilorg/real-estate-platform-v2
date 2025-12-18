import { Controller, Get, Post, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Controller('agency-crm/activities')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  async create(@Body() createActivityDto: CreateActivityDto, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    return this.activitiesService.create(agencyId, memberId, createActivityDto);
  }

  @Get('lead/:leadId')
  async findByLead(@Param('leadId') leadId: string, @Request() req: any): Promise<any[]> {
    const agencyId = req.user.agencyId;
    return this.activitiesService.findByLead(agencyId, leadId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    return this.activitiesService.delete(agencyId, id);
  }
}
