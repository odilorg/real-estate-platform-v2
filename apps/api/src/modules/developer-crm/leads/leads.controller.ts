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
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { ImportLeadsDto } from './dto/import-leads.dto';
import { BulkDeleteDto, BulkAssignDto } from './dto/bulk-operations.dto';
import { EmailService } from '../../email/email.service';
import { SmsService } from '../../sms/sms.service';

@Controller('developer-crm/leads')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  // Static routes MUST come before dynamic :id routes
  @Post('import')
  async importLeads(
    @Body() importLeadsDto: ImportLeadsDto,
    @Request() req: any,
  ) {
    const developerId = req.user.developerId;
    return this.leadsService.importFromCSV(developerId, importLeadsDto);
  }

  @Get('export')
  async exportLeads(@Query() query: QueryLeadsDto, @Request() req: any) {
    const developerId = req.user.developerId;
    return this.leadsService.exportToCSV(developerId, query);
  }

  @Post('bulk-delete')
  async bulkDelete(@Body() bulkDeleteDto: BulkDeleteDto, @Request() req: any) {
    const developerId = req.user.developerId;
    return this.leadsService.bulkDelete(developerId, bulkDeleteDto);
  }

  @Post('bulk-assign')
  async bulkAssign(@Body() bulkAssignDto: BulkAssignDto, @Request() req: any) {
    const developerId = req.user.developerId;
    return this.leadsService.bulkAssign(developerId, bulkAssignDto);
  }

  @Post()
  async create(@Body() createLeadDto: CreateLeadDto, @Request() req: any) {
    const developerId = req.user.developerId; // From AgencyOwnershipGuard
    return this.leadsService.create(developerId, createLeadDto);
  }

  @Get()
  async findAll(@Query() query: QueryLeadsDto, @Request() req: any) {
    const developerId = req.user.developerId;
    return this.leadsService.findAll(developerId, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any): Promise<any> {
    const developerId = req.user.developerId;
    return this.leadsService.findOne(developerId, id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @Request() req: any,
  ) {
    const developerId = req.user.developerId;
    return this.leadsService.update(developerId, id, updateLeadDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const developerId = req.user.developerId;
    return this.leadsService.remove(developerId, id);
  }

  @Put(':id/assign')
  async assign(
    @Param('id') id: string,
    @Body('memberId') memberId: string,
    @Request() req: any,
  ) {
    const developerId = req.user.developerId;
    return this.leadsService.assign(developerId, id, memberId);
  }

  @Post(':id/send-email')
  async sendEmail(
    @Param('id') id: string,
    @Body() body: { subject: string; message: string },
    @Request() req: any,
  ) {
    const developerId = req.user.developerId;

    // Get lead details
    const lead = await this.leadsService.findOne(developerId, id);

    if (!lead.email) {
      return { success: false, message: 'Lead has no email address' };
    }

    // Send email
    const sent = await this.emailService.sendEmail({
      to: lead.email,
      subject: body.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>Здравствуйте, ${lead.firstName} ${lead.lastName}!</p>
          <div style="margin: 20px 0;">
            ${body.message.replace(/\n/g, '<br>')}
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            С уважением,<br>Real Estate Platform
          </p>
        </div>
      `,
    });

    return { success: sent, message: sent ? 'Email sent successfully' : 'Failed to send email' };
  }

  @Post(':id/send-sms')
  async sendSms(
    @Param('id') id: string,
    @Body() body: { message: string },
    @Request() req: any,
  ) {
    const developerId = req.user.developerId;

    // Get lead details
    const lead = await this.leadsService.findOne(developerId, id);

    if (!lead.phone) {
      return { success: false, message: 'Lead has no phone number' };
    }

    // Send SMS
    const sent = await this.smsService.sendCustomSms(lead.phone, body.message);

    return { success: sent, message: sent ? 'SMS sent successfully' : 'Failed to send SMS' };
  }
}
