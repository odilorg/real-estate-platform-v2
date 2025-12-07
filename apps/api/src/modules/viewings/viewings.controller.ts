import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ViewingsService } from './viewings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@repo/database';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const RequestViewingDto = z.object({
  propertyId: z.string(),
  date: z.string().transform((s) => new Date(s)),
  time: z.string(),
  message: z.string().optional(),
});
type RequestViewingDto = z.infer<typeof RequestViewingDto>;

const RespondViewingDto = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED']),
  notes: z.string().optional(),
});
type RespondViewingDto = z.infer<typeof RespondViewingDto>;

@Controller('viewings')
@UseGuards(JwtAuthGuard)
export class ViewingsController {
  constructor(private readonly viewingsService: ViewingsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(RequestViewingDto))
  requestViewing(@CurrentUser() user: User, @Body() dto: RequestViewingDto) {
    return this.viewingsService.requestViewing(user.id, dto.propertyId, {
      date: dto.date,
      time: dto.time,
      message: dto.message,
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
  @UsePipes(new ZodValidationPipe(RespondViewingDto))
  respondToViewing(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: RespondViewingDto,
  ) {
    return this.viewingsService.respondToViewing(
      id,
      user.id,
      dto.status,
      dto.notes,
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
