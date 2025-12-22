import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../modules/email/email.service';
import { TelegramNotificationService } from '../modules/agency-crm/notifications/telegram-notification.service';
import { ConfigService } from '@nestjs/config';

const prisma = new PrismaService();

// Initialize services for standalone script usage
const configService = new ConfigService();
const emailService = new EmailService();
const telegramService = new TelegramNotificationService(configService);

interface TaskWithRelations {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date;
  assignedToId: string;
  agencyId: string;
  assignedTo: {
    telegram: string | null;
    user: {
      firstName: string;
      lastName: string;
      email: string | null;
    };
  };
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

/**
 * Check for tasks that need reminders and send notifications
 * Run this every 15 minutes via cron
 *
 * Sends notifications via:
 * - Email (if user has email)
 * - Telegram (if user has telegram set)
 * - In-app notification (always)
 */
export async function sendTaskReminders() {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  console.log('[Task Reminders] Checking for tasks needing reminders...');
  console.log(`[Task Reminders] Current time: ${now.toISOString()}`);

  try {
    // Find tasks due within the next hour that haven't been reminded yet
    const upcomingTasks = await prisma.agencyTask.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
        dueDate: {
          gte: now,
          lte: oneHourFromNow,
        },
        reminderSent: false,
      },
      include: {
        assignedTo: {
          select: {
            telegram: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log(`[Task Reminders] Found ${upcomingTasks.length} tasks due within 1 hour`);

    for (const task of upcomingTasks) {
      await sendReminder(task as unknown as TaskWithRelations, false);

      // Mark as reminded
      await prisma.agencyTask.update({
        where: { id: task.id },
        data: { reminderSent: true },
      });
    }

    // Find overdue tasks that haven't been reminded
    const overdueTasks = await prisma.agencyTask.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
        dueDate: {
          lt: now,
        },
        reminderSent: false,
      },
      include: {
        assignedTo: {
          select: {
            telegram: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log(`[Task Reminders] Found ${overdueTasks.length} overdue tasks`);

    for (const task of overdueTasks) {
      await sendReminder(task as unknown as TaskWithRelations, true);

      // Mark as reminded
      await prisma.agencyTask.update({
        where: { id: task.id },
        data: { reminderSent: true },
      });
    }

    console.log('[Task Reminders] Finished sending reminders');
  } catch (error) {
    console.error('[Task Reminders] Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function sendReminder(task: TaskWithRelations, isOverdue: boolean) {
  const { assignedTo, lead } = task;
  const userName = `${assignedTo.user.firstName} ${assignedTo.user.lastName}`;
  const leadName = lead ? `${lead.firstName} ${lead.lastName}` : undefined;

  console.log(
    `[Task Reminders] Sending ${isOverdue ? 'OVERDUE' : 'DUE SOON'} reminder for task "${task.title}" to ${userName}`,
  );

  // 1. Send Email notification
  if (assignedTo.user.email) {
    try {
      if (isOverdue) {
        await emailService.sendTaskOverdueEmail(
          assignedTo.user.email,
          userName,
          task.title,
          task.dueDate,
          task.id,
        );
        console.log(`  Email sent to ${assignedTo.user.email}`);
      } else {
        await emailService.sendTaskDueSoonEmail(
          assignedTo.user.email,
          userName,
          task.title,
          task.dueDate,
          task.id,
        );
        console.log(`  Email sent to ${assignedTo.user.email}`);
      }
    } catch (error) {
      console.error(`  Failed to send email: ${error}`);
    }
  } else {
    console.log(`  No email for user, skipping email notification`);
  }

  // 2. Send Telegram notification
  if (assignedTo.telegram) {
    try {
      let success: boolean;
      if (isOverdue) {
        success = await telegramService.sendTaskOverdueNotification(
          assignedTo.telegram,
          userName,
          task.title,
          task.dueDate,
          task.id,
          leadName,
        );
      } else {
        success = await telegramService.sendTaskDueSoonNotification(
          assignedTo.telegram,
          userName,
          task.title,
          task.dueDate,
          task.id,
          leadName,
        );
      }
      if (success) {
        console.log(`  Telegram sent to ${assignedTo.telegram}`);
      } else {
        console.log(`  Telegram notification skipped/failed for ${assignedTo.telegram}`);
      }
    } catch (error) {
      console.error(`  Failed to send Telegram: ${error}`);
    }
  } else {
    console.log(`  No telegram for user, skipping Telegram notification`);
  }

  // 3. Create in-app notification (always)
  try {
    await prisma.agencyNotification.create({
      data: {
        agencyId: task.agencyId,
        recipientId: task.assignedToId,
        type: isOverdue ? 'TASK_OVERDUE' : 'TASK_DUE_SOON',
        title: isOverdue ? 'Задача просрочена' : 'Задача скоро истекает',
        message: `Задача "${task.title}" ${isOverdue ? 'просрочена' : 'истекает в течение часа'}`,
        taskId: task.id,
      },
    });
    console.log(`  In-app notification created`);
  } catch (error) {
    console.error(`  Failed to create in-app notification: ${error}`);
  }
}

// Allow running as standalone script
if (require.main === module) {
  sendTaskReminders()
    .then(() => {
      console.log('[Task Reminders] Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Task Reminders] Fatal error:', error);
      process.exit(1);
    });
}
