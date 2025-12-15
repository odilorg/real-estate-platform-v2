import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';

@Controller('agency-crm/members')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class MembersController {
  // TODO: Implement member management endpoints (Phase 2)
}
