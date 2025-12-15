import { Controller, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';

@Controller('agency-crm/tasks')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}
}
