import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { NotificationType } from '@repo/database';
import { EmailService } from '../../email/email.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => EmailService))
    private emailService: EmailService,
  ) {}

  /**
   * Create a notification
   */
  async create(data: {
    agencyId: string;
    recipientId: string;
    type: NotificationType;
    title: string;
    message: string;
    taskId?: string;
    leadId?: string;
    dealId?: string;
  }): Promise<any> {
    return this.prisma.agencyNotification.create({
      data,
    });
  }

  /**
   * Get all notifications for a member
   */
  async findAllForMember(
    agencyId: string,
    memberId: string,
    filters?: {
      isRead?: boolean;
      type?: NotificationType;
      limit?: number;
    },
  ): Promise<any> {
    const where: any = {
      agencyId,
      recipientId: memberId,
    };

    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    return this.prisma.agencyNotification.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            status: true,
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        deal: {
          select: {
            id: true,
            dealValue: true,
            currency: true,
            stage: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 50,
    });
  }

  /**
   * Get unread count for a member
   */
  async getUnreadCount(agencyId: string, memberId: string): Promise<number> {
    return this.prisma.agencyNotification.count({
      where: {
        agencyId,
        recipientId: memberId,
        isRead: false,
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    agencyId: string,
    memberId: string,
    notificationId: string,
  ): Promise<any> {
    const notification = await this.prisma.agencyNotification.findFirst({
      where: {
        id: notificationId,
        agencyId,
        recipientId: memberId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.agencyNotification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a member
   */
  async markAllAsRead(agencyId: string, memberId: string): Promise<any> {
    return this.prisma.agencyNotification.updateMany({
      where: {
        agencyId,
        recipientId: memberId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Delete notification
   */
  async delete(
    agencyId: string,
    memberId: string,
    notificationId: string,
  ): Promise<void> {
    const notification = await this.prisma.agencyNotification.findFirst({
      where: {
        id: notificationId,
        agencyId,
        recipientId: memberId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.agencyNotification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Check for overdue tasks and create notifications
   */
  async notifyOverdueTasks(agencyId: string): Promise<number> {
    const now = new Date();

    // Find tasks that are overdue and haven't sent a reminder yet
    const overdueTasks = await this.prisma.agencyTask.findMany({
      where: {
        agencyId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: now },
        reminderSent: false,
      },
      include: {
        assignedTo: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    let notificationsCreated = 0;

    for (const task of overdueTasks) {
      // Create notification
      await this.create({
        agencyId: task.agencyId,
        recipientId: task.assignedToId,
        type: 'TASK_OVERDUE',
        title: 'Просроченная задача',
        message: `Задача "${task.title}" просрочена. Срок: ${task.dueDate.toLocaleDateString('ru-RU')}`,
        taskId: task.id,
      });

      // Send email notification if user has email
      if (task.assignedTo?.user?.email) {
        const assigneeName = `${task.assignedTo.user.firstName || ''} ${task.assignedTo.user.lastName || ''}`.trim();
        await this.emailService.sendTaskOverdueEmail(
          task.assignedTo.user.email,
          assigneeName,
          task.title,
          task.dueDate,
          task.id,
        );
      }

      // Mark reminder as sent
      await this.prisma.agencyTask.update({
        where: { id: task.id },
        data: { reminderSent: true },
      });

      notificationsCreated++;
    }

    return notificationsCreated;
  }

  /**
   * Check for tasks due soon (within 24 hours) and create notifications
   */
  async notifyTasksDueSoon(agencyId: string): Promise<number> {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);

    const tasksDueSoon = await this.prisma.agencyTask.findMany({
      where: {
        agencyId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: {
          gte: now,
          lte: tomorrow,
        },
        reminderSent: false,
      },
      include: {
        assignedTo: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    let notificationsCreated = 0;

    for (const task of tasksDueSoon) {
      // Create notification
      await this.create({
        agencyId: task.agencyId,
        recipientId: task.assignedToId,
        type: 'TASK_DUE_SOON',
        title: 'Задача скоро истекает',
        message: `Задача "${task.title}" истекает ${task.dueDate.toLocaleString('ru-RU')}`,
        taskId: task.id,
      });

      // Send email notification if user has email
      if (task.assignedTo?.user?.email) {
        const assigneeName = `${task.assignedTo.user.firstName || ''} ${task.assignedTo.user.lastName || ''}`.trim();
        await this.emailService.sendTaskDueSoonEmail(
          task.assignedTo.user.email,
          assigneeName,
          task.title,
          task.dueDate,
          task.id,
        );
      }

      // Mark reminder as sent
      await this.prisma.agencyTask.update({
        where: { id: task.id },
        data: { reminderSent: true },
      });

      notificationsCreated++;
    }

    return notificationsCreated;
  }

  /**
   * Notify when task is assigned
   */
  async notifyTaskAssigned(task: any): Promise<void> {
    // Create notification
    await this.create({
      agencyId: task.agencyId,
      recipientId: task.assignedToId,
      type: 'TASK_ASSIGNED',
      title: 'Новая задача назначена',
      message: `Вам назначена задача: "${task.title}". Срок: ${new Date(task.dueDate).toLocaleDateString('ru-RU')}`,
      taskId: task.id,
    });

    // Send email notification if user has email
    if (task.assignedTo?.user?.email) {
      const assigneeName = `${task.assignedTo.user.firstName || ''} ${task.assignedTo.user.lastName || ''}`.trim();
      await this.emailService.sendTaskAssignedEmail(
        task.assignedTo.user.email,
        assigneeName,
        task.title,
        task.description || '',
        new Date(task.dueDate),
        task.priority,
        task.id,
      );
    }
  }

  /**
   * Notify when task is completed (notify creator if different from assignee)
   */
  async notifyTaskCompleted(_task: any, _completedBy: string): Promise<void> {
    // For now, we'll skip this as we don't track task creator
    // In the future, you can add a createdById field to AgencyTask
    // and notify the creator when task is completed
  }
}
