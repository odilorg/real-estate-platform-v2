import { Controller, UseGuards } from '@nestjs/common';
import { DealsService } from './deals.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';

@Controller('agency-crm/deals')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}
}
