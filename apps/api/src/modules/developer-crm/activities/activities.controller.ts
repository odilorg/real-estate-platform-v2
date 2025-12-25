import { Controller, Get, Post, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Controller('developer-crm/activities')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  async create(@Body() createActivityDto: CreateActivityDto, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    const memberId = req.user.developerMemberId;
    return this.activitiesService.create(developerId, memberId, createActivityDto);
  }

  @Get('lead/:leadId')
  async findByLead(@Param('leadId') leadId: string, @Request() req: any): Promise<any[]> {
    const developerId = req.user.developerId;
    return this.activitiesService.findByLead(developerId, leadId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    return this.activitiesService.delete(developerId, id);
  }
}
