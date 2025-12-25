import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';
import { CommissionsService } from './commissions.service';

@Controller('developer-crm/commissions')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  async findAll(@Query() query: any, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    const memberId = req.user.developerMemberId;
    const role = req.user.role;
    return this.commissionsService.findAll(developerId, memberId, role, query);
  }

  @Get('summary')
  async getSummary(@Query() query: any, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    const memberId = req.user.developerMemberId;
    const role = req.user.role;
    return this.commissionsService.getSummary(developerId, memberId, role, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    const memberId = req.user.developerMemberId;
    const role = req.user.role;
    return this.commissionsService.findOne(developerId, memberId, role, id);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    const role = req.user.role;
    return this.commissionsService.approve(developerId, role, id);
  }

  @Post(':id/pay')
  async markAsPaid(@Param('id') id: string, @Body() paymentData: any, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    const role = req.user.role;
    return this.commissionsService.markAsPaid(developerId, role, id, paymentData);
  }
}
