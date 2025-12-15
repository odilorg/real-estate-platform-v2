import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';

@Controller('agency-crm/commissions')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class CommissionsController {
  // TODO: Implement commission tracking endpoints (Phase 4)
}
