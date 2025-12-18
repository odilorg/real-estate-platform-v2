import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminAgenciesService } from './admin-agencies.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CreateAgencyDto } from './dto/create-agency.dto';

@Controller('admin/agencies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'DEVELOPER_ADMIN')
export class AdminAgenciesController {
  constructor(private readonly adminAgenciesService: AdminAgenciesService) {}

  @Post()
  async create(@Body() createAgencyDto: CreateAgencyDto): Promise<any> {
    return this.adminAgenciesService.createAgency(createAgencyDto);
  }

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<any> {
    return this.adminAgenciesService.findAll(
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 20,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<any> {
    return this.adminAgenciesService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAgencyDto: Partial<CreateAgencyDto>,
  ): Promise<any> {
    return this.adminAgenciesService.update(id, updateAgencyDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<any> {
    return this.adminAgenciesService.remove(id);
  }
}
