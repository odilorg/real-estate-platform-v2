import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { SavedSearchesService } from './saved-searches.service';
import { SavedSearchNotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, SavedSearch } from '@repo/database';
import { CreateSavedSearchDto, UpdateSavedSearchDto } from '@repo/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const ToggleNotificationsDto = z.object({
  enabled: z.boolean(),
});
type ToggleNotificationsDto = z.infer<typeof ToggleNotificationsDto>;

@Controller('saved-searches')
@UseGuards(JwtAuthGuard)
export class SavedSearchesController {
  constructor(
    private readonly savedSearchesService: SavedSearchesService,
    private readonly notificationsService: SavedSearchNotificationsService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(CreateSavedSearchDto)) dto: CreateSavedSearchDto,
  ): Promise<SavedSearch> {
    return this.savedSearchesService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User): Promise<SavedSearch[]> {
    return this.savedSearchesService.findAllByUser(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<SavedSearch> {
    return this.savedSearchesService.findOne(id, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(UpdateSavedSearchDto)) dto: UpdateSavedSearchDto,
  ): Promise<SavedSearch> {
    return this.savedSearchesService.update(id, user.id, dto);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    return this.savedSearchesService.delete(id, user.id);
  }

  @Patch(':id/notifications')
  toggleNotifications(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(ToggleNotificationsDto)) dto: ToggleNotificationsDto,
  ): Promise<SavedSearch> {
    return this.savedSearchesService.toggleNotifications(
      id,
      user.id,
      dto.enabled,
    );
  }

  @Get('stats/count')
  getCount(@CurrentUser() user: User): Promise<number> {
    return this.savedSearchesService.getCount(user.id);
  }

  @Post(':id/send-notification')
  async sendNotification(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    // Verify ownership
    await this.savedSearchesService.findOne(id, user.id);

    await this.notificationsService.sendImmediateNotification(id);
    return { message: 'Notification sent successfully' };
  }

  @Post('test-notification')
  async testNotification(
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.notificationsService.sendTestNotification(user.id);
    return { message: 'Test notification sent successfully' };
  }
}
