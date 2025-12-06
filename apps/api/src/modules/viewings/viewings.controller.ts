import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ViewingsService } from './viewings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@repo/database';
import { z } from 'zod';

const RequestViewingDto = z.object({
  propertyId: z.string(),
  date: z.string().transform((s) => new Date(s)),
  time: z.string(),
  message: z.string().optional(),
});

const RespondViewingDto = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED']),
  notes: z.string().optional(),
});

@Controller('viewings')
@UseGuards(JwtAuthGuard)
export class ViewingsController {
  constructor(private readonly viewingsService: ViewingsService) {}

  @Post()
  requestViewing(@CurrentUser() user: User, @Body() dto: any) {
    const validated = RequestViewingDto.parse(dto);
    return this.viewingsService.requestViewing(user.id, validated.propertyId, {
      date: validated.date,
      time: validated.time,
      message: validated.message,
    });
  }

  @Get('my-requests')
  getMyViewingRequests(@CurrentUser() user: User) {
    return this.viewingsService.getMyViewingRequests(user.id);
  }

  @Get('property-requests')
  getPropertyViewingRequests(@CurrentUser() user: User) {
    return this.viewingsService.getPropertyViewingRequests(user.id);
  }

  @Put(':id/respond')
  respondToViewing(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: any,
  ) {
    const validated = RespondViewingDto.parse(dto);
    return this.viewingsService.respondToViewing(
      id,
      user.id,
      validated.status,
      validated.notes,
    );
  }

  @Delete(':id')
  cancelViewing(@Param('id') id: string, @CurrentUser() user: User) {
    return this.viewingsService.cancelViewing(id, user.id);
  }

  @Put(':id/complete')
  completeViewing(@Param('id') id: string, @CurrentUser() user: User) {
    return this.viewingsService.completeViewing(id, user.id);
  }
}
