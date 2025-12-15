import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';

@Controller('agency-crm/deals')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class DealsController {
  // TODO: Implement deal pipeline endpoints (Phase 3)
}
