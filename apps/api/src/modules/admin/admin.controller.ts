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
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@repo/database';
import { z } from 'zod';

const BanUserDto = z.object({
  reason: z.string().min(1),
});

const UpdateRoleDto = z.object({
  role: z.enum(['USER', 'AGENT', 'ADMIN']),
});

const RejectPropertyDto = z.object({
  reason: z.string().min(1),
});

const FeaturePropertyDto = z.object({
  featured: z.boolean(),
});

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
  }

  @Post('users/:id/ban')
  banUser(
    @Param('id') id: string,
    @CurrentUser() admin: User,
    @Body() dto: any,
  ) {
    const validated = BanUserDto.parse(dto);
    return this.adminService.banUser(admin.id, id, validated.reason);
  }

  @Post('users/:id/unban')
  unbanUser(@Param('id') id: string, @CurrentUser() admin: User) {
    return this.adminService.unbanUser(admin.id, id);
  }

  @Put('users/:id/role')
  updateUserRole(
    @Param('id') id: string,
    @CurrentUser() admin: User,
    @Body() dto: any,
  ) {
    const validated = UpdateRoleDto.parse(dto);
    return this.adminService.updateUserRole(admin.id, id, validated.role);
  }

  @Get('properties')
  getProperties(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getProperties(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status,
    );
  }

  @Post('properties/:id/approve')
  approveProperty(@Param('id') id: string, @CurrentUser() admin: User) {
    return this.adminService.approveProperty(admin.id, id);
  }

  @Post('properties/:id/reject')
  rejectProperty(
    @Param('id') id: string,
    @CurrentUser() admin: User,
    @Body() dto: any,
  ) {
    const validated = RejectPropertyDto.parse(dto);
    return this.adminService.rejectProperty(admin.id, id, validated.reason);
  }

  @Put('properties/:id/feature')
  featureProperty(
    @Param('id') id: string,
    @CurrentUser() admin: User,
    @Body() dto: any,
  ) {
    const validated = FeaturePropertyDto.parse(dto);
    return this.adminService.featureProperty(admin.id, id, validated.featured);
  }

  @Delete('properties/:id')
  deleteProperty(@Param('id') id: string, @CurrentUser() admin: User) {
    return this.adminService.deleteProperty(admin.id, id);
  }

  @Get('logs')
  getAdminLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAdminLogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
