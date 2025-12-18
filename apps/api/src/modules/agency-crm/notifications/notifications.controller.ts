import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AgencyOwnershipGuard } from '../guards/agency-ownership.guard';

@Controller('agency-crm/notifications')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Get all notifications for current user
   */
  @Get()
  async findAll(@Request() req: any, @Query() query: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.memberId;

    const filters: any = {};

    if (query.isRead !== undefined) {
      filters.isRead = query.isRead === 'true';
    }

    if (query.type) {
      filters.type = query.type;
    }

    if (query.limit) {
      filters.limit = parseInt(query.limit);
    }

    const notifications = await this.notificationsService.findAllForMember(
      agencyId,
      memberId,
      filters,
    );

    return { notifications };
  }

  /**
   * Get unread count
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.memberId;

    const count = await this.notificationsService.getUnreadCount(agencyId, memberId);

    return { count };
  }

  /**
   * Mark notification as read
   */
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.memberId;

    return this.notificationsService.markAsRead(agencyId, memberId, id);
  }

  /**
   * Mark all notifications as read
   */
  @Patch('mark-all-read')
  async markAllAsRead(@Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.memberId;

    return this.notificationsService.markAllAsRead(agencyId, memberId);
  }

  /**
   * Delete notification
   */
  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any): Promise<any> {
    const agencyId = req.user.agencyId;
    const memberId = req.user.memberId;

    await this.notificationsService.delete(agencyId, memberId, id);

    return { message: 'Notification deleted' };
  }
}
