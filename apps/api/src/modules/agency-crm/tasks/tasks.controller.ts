import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

@Controller('agency-crm/tasks')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req: any) {
    const agencyId = req.user.agencyId;
    return this.tasksService.create(agencyId, createTaskDto);
  }

  @Get()
  async findAll(@Query() query: QueryTasksDto, @Request() req: any) {
    const agencyId = req.user.agencyId;
    return this.tasksService.findAll(agencyId, query);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    const agencyId = req.user.agencyId;
    return this.tasksService.getStats(agencyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const agencyId = req.user.agencyId;
    return this.tasksService.findOne(agencyId, id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: any,
  ) {
    const agencyId = req.user.agencyId;
    return this.tasksService.update(agencyId, id, updateTaskDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const agencyId = req.user.agencyId;
    return this.tasksService.remove(agencyId, id);
  }
}
