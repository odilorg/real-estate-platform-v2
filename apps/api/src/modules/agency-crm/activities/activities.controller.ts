import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';

@Controller('agency-crm/activities')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class ActivitiesController {
  // TODO: Implement activity logging endpoints (Phase 5)
}
