import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';

@Controller('agency-crm/tasks')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class TasksController {
  // TODO: Implement task management endpoints (Phase 6)
}
