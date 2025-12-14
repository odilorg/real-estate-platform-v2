import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /api/analytics/developer/overview
   * Get developer analytics overview (KPIs, trends, pipeline)
   */
  @Get('developer/overview')
  @Roles('DEVELOPER_ADMIN', 'DEVELOPER_SALES_AGENT')
  async getOverview(
    @Request() req: any,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
    @Query('projectId') projectId?: string,
  ) {
    const developerId = req.user.developerId;
    if (!developerId) {
      throw new ForbiddenException('User is not associated with a developer');
    }

    return this.analyticsService.getOverview(developerId, days, projectId);
  }

  /**
   * GET /api/analytics/developer/leads
   * Get lead analytics (funnel, sources, recent activity)
   */
  @Get('developer/leads')
  @Roles('DEVELOPER_ADMIN', 'DEVELOPER_SALES_AGENT')
  async getLeadAnalytics(
    @Request() req: any,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
    @Query('projectId') projectId?: string,
  ) {
    const developerId = req.user.developerId;
    if (!developerId) {
      throw new ForbiddenException('User is not associated with a developer');
    }

    return this.analyticsService.getLeadAnalytics(developerId, days, projectId);
  }

  /**
   * GET /api/analytics/developer/properties
   * Get property performance analytics
   */
  @Get('developer/properties')
  @Roles('DEVELOPER_ADMIN', 'DEVELOPER_SALES_AGENT')
  async getPropertyPerformance(
    @Request() req: any,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('projectId') projectId?: string,
  ) {
    const developerId = req.user.developerId;
    if (!developerId) {
      throw new ForbiddenException('User is not associated with a developer');
    }

    return this.analyticsService.getPropertyPerformance(
      developerId,
      days,
      projectId,
      limit,
    );
  }

  /**
   * GET /api/analytics/developer/agents
   * Get sales agent performance analytics
   */
  @Get('developer/agents')
  @Roles('DEVELOPER_ADMIN', 'DEVELOPER_SALES_AGENT')
  async getAgentPerformance(
    @Request() req: any,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    const developerId = req.user.developerId;
    if (!developerId) {
      throw new ForbiddenException('User is not associated with a developer');
    }

    return this.analyticsService.getAgentPerformance(developerId, days);
  }
}
