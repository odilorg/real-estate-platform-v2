import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AgencyService } from './agency.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateAgencyProfileDto } from './dto/update-agency-profile.dto';

@Controller('agency')
@UseGuards(JwtAuthGuard)
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  /**
   * GET /agency/profile
   * Get current user's agency profile
   */
  @Get('profile')
  async getMyAgency(@Request() req: any): Promise<any> {
    return this.agencyService.getMyAgency(req.user.id);
  }

  /**
   * GET /agency/stats
   * Get agency statistics
   */
  @Get('stats')
  async getAgencyStats(@Request() req: any): Promise<any> {
    return this.agencyService.getAgencyStats(req.user.id);
  }

  /**
   * PUT /agency/profile
   * Update agency profile
   */
  @Put('profile')
  async updateAgencyProfile(
    @Request() req: any,
    @Body() updateDto: UpdateAgencyProfileDto,
  ): Promise<any> {
    return this.agencyService.updateAgencyProfile(req.user.id, updateDto);
  }

  /**
   * POST /agency/logo
   * Upload agency logo (expects { logo: "url" })
   */
  @Post('logo')
  async uploadLogo(
    @Request() req: any,
    @Body() body: { logo: string },
  ): Promise<any> {
    return this.agencyService.uploadLogo(req.user.id, body.logo);
  }
}
