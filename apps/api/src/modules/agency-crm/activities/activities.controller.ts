import { Controller, UseGuards } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';

@Controller('agency-crm/activities')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}
}
