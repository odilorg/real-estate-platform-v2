import { Controller, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';

@Controller('agency-crm/members')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  // TODO: Implement member management endpoints (Phase 2)
}
