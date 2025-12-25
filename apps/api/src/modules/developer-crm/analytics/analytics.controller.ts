import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';
import { AnalyticsService } from './analytics.service';

@Controller('developer-crm/analytics')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboard(@Query() query: any, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    const memberId = req.user.developerMemberId;
    const role = req.user.role;
    return this.analyticsService.getDashboard(developerId, memberId, role, query);
  }

  @Get('leads')
  async getLeadAnalytics(@Query() query: any, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    return this.analyticsService.getLeadAnalytics(developerId, query);
  }

  @Get('deals')
  async getDealAnalytics(@Query() query: any, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    return this.analyticsService.getDealAnalytics(developerId, query);
  }

  @Get('agents')
  async getAgentPerformance(@Query() query: any, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    return this.analyticsService.getAgentPerformance(developerId, query);
  }

  @Get('revenue')
  async getRevenueAnalytics(@Query() query: any, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    return this.analyticsService.getRevenueAnalytics(developerId, query);
  }
}
