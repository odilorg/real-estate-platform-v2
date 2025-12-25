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

@Controller('developer-crm/tasks')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req: any) {
    const developerId = req.user.developerId;
    return this.tasksService.create(developerId, createTaskDto);
  }

  @Get()
  async findAll(@Query() query: QueryTasksDto, @Request() req: any) {
    const developerId = req.user.developerId;
    return this.tasksService.findAll(developerId, query);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    const developerId = req.user.developerId;
    return this.tasksService.getStats(developerId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const developerId = req.user.developerId;
    return this.tasksService.findOne(developerId, id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: any,
  ) {
    const developerId = req.user.developerId;
    return this.tasksService.update(developerId, id, updateTaskDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const developerId = req.user.developerId;
    return this.tasksService.remove(developerId, id);
  }
}
