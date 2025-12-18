import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';
import { AnalyticsService } from './analytics.service';

@Controller('agency-crm/analytics')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboard(@Query() query: any, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    const role = req.user.role;
    return this.analyticsService.getDashboard(agencyId, memberId, role, query);
  }

  @Get('leads')
  async getLeadAnalytics(@Query() query: any, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    return this.analyticsService.getLeadAnalytics(agencyId, query);
  }

  @Get('deals')
  async getDealAnalytics(@Query() query: any, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    return this.analyticsService.getDealAnalytics(agencyId, query);
  }

  @Get('agents')
  async getAgentPerformance(@Query() query: any, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    return this.analyticsService.getAgentPerformance(agencyId, query);
  }

  @Get('revenue')
  async getRevenueAnalytics(@Query() query: any, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    return this.analyticsService.getRevenueAnalytics(agencyId, query);
  }
}
