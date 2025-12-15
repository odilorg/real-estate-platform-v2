import { Controller, UseGuards } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';

@Controller('agency-crm/commissions')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}
}
