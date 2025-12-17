import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';
import { CommissionsService } from './commissions.service';

@Controller('agency-crm/commissions')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  async findAll(@Query() query: any, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    const role = req.user.role;
    return this.commissionsService.findAll(agencyId, memberId, role, query);
  }

  @Get('summary')
  async getSummary(@Query() query: any, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    const role = req.user.role;
    return this.commissionsService.getSummary(agencyId, memberId, role, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.agencyMemberId;
    const role = req.user.role;
    return this.commissionsService.findOne(agencyId, memberId, role, id);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const role = req.user.role;
    return this.commissionsService.approve(agencyId, role, id);
  }

  @Post(':id/pay')
  async markAsPaid(@Param('id') id: string, @Body() paymentData: any, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const role = req.user.role;
    return this.commissionsService.markAsPaid(agencyId, role, id, paymentData);
  }
}
