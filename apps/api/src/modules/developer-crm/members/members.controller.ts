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
  Request,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';
import { AgencyPermissionGuard, RequireAgencyRoles, ROLE_MANAGEMENT } from '../guards/agency-permission.guard';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMembersDto } from './dto/query-members.dto';

@Controller('developer-crm/members')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @UseGuards(AgencyPermissionGuard)
  @RequireAgencyRoles(...ROLE_MANAGEMENT)
  async create(@Body() createMemberDto: CreateMemberDto, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    return this.membersService.create(developerId, createMemberDto);
  }

  @Get('search-users')
  @UseGuards(AgencyPermissionGuard)
  @RequireAgencyRoles(...ROLE_MANAGEMENT)
  async searchUsers(@Query('q') query: string, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    return this.membersService.searchUsers(developerId, query);
  }

  @Get()
  async findAll(@Query() query: QueryMembersDto, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    return this.membersService.findAll(developerId, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    return this.membersService.findOne(developerId, id);
  }

  @Put(':id')
  @UseGuards(AgencyPermissionGuard)
  @RequireAgencyRoles(...ROLE_MANAGEMENT)
  async update(
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateMemberDto,
    @Request() req: any,
  ): Promise<any> {
    const developerId = req.user.developerId;
    return this.membersService.update(developerId, id, updateMemberDto);
  }

  @Delete(':id')
  @UseGuards(AgencyPermissionGuard)
  @RequireAgencyRoles(...ROLE_MANAGEMENT)
  async remove(@Param('id') id: string, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    return this.membersService.remove(developerId, id);
  }
}
