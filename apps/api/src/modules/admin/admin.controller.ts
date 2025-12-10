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
  UsePipes,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@repo/database';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const BanUserDto = z.object({
  reason: z.string().min(1),
});
type BanUserDto = z.infer<typeof BanUserDto>;

const UpdateRoleDto = z.object({
  role: z.enum(['USER', 'AGENT', 'ADMIN']),
});
type UpdateRoleDto = z.infer<typeof UpdateRoleDto>;

const RejectPropertyDto = z.object({
  reason: z.string().min(1),
});
type RejectPropertyDto = z.infer<typeof RejectPropertyDto>;

const FeaturePropertyDto = z.object({
  featured: z.boolean(),
});
type FeaturePropertyDto = z.infer<typeof FeaturePropertyDto>;

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
  @UsePipes(new ZodValidationPipe(BanUserDto))
  banUser(
    @Param('id') id: string,
    @CurrentUser() admin: User,
    @Body() dto: BanUserDto,
  ) {
    return this.adminService.banUser(admin.id, id, dto.reason);
  }

  @Post('users/:id/unban')
  unbanUser(@Param('id') id: string, @CurrentUser() admin: User) {
    return this.adminService.unbanUser(admin.id, id);
  }

  @Put('users/:id/role')
  @UsePipes(new ZodValidationPipe(UpdateRoleDto))
  updateUserRole(
    @Param('id') id: string,
    @CurrentUser() admin: User,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.adminService.updateUserRole(admin.id, id, dto.role);
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
  @UsePipes(new ZodValidationPipe(RejectPropertyDto))
  rejectProperty(
    @Param('id') id: string,
    @CurrentUser() admin: User,
    @Body() dto: RejectPropertyDto,
  ) {
    return this.adminService.rejectProperty(admin.id, id, dto.reason);
  }

  @Put('properties/:id/feature')
  @UsePipes(new ZodValidationPipe(FeaturePropertyDto))
  featureProperty(
    @Param('id') id: string,
    @CurrentUser() admin: User,
    @Body() dto: FeaturePropertyDto,
  ) {
    return this.adminService.featureProperty(admin.id, id, dto.featured);
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

  // Agent Management Endpoints
  @Get('agents')
  getAgents(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('verified') verified?: string,
    @Query('superAgent') superAgent?: string,
  ) {
    return this.adminService.getAgents(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
      verified === 'true' ? true : verified === 'false' ? false : undefined,
      superAgent === 'true' ? true : superAgent === 'false' ? false : undefined,
    );
  }

  @Put('agents/:id/verify')
  verifyAgent(
    @Param('id') id: string,
    @CurrentUser() admin: User,
    @Body('verified') verified: boolean,
  ) {
    return this.adminService.verifyAgent(admin.id, id, verified);
  }

  @Put('agents/:id/super-agent')
  setSuperAgent(
    @Param('id') id: string,
    @CurrentUser() admin: User,
    @Body('superAgent') superAgent: boolean,
  ) {
    return this.adminService.setSuperAgent(admin.id, id, superAgent);
  }

  @Delete('agents/:id')
  deleteAgent(@Param('id') id: string, @CurrentUser() admin: User) {
    return this.adminService.deleteAgent(admin.id, id);
  }
}
