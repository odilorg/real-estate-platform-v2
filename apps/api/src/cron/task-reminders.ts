import { PrismaService } from '../common/prisma/prisma.service';

const prisma = new PrismaService();

interface TaskReminder {
  id: string;
  title: string;
  dueDate: Date;
  assignedToId: string;
  assignedTo: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  agencyId: string;
}

/**
 * Check for tasks that need reminders and send notifications
 * Run this every 15 minutes via cron
 */
export async function sendTaskReminders() {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  console.log('[Task Reminders] Checking for tasks needing reminders...');

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
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    console.log(`[Task Reminders] Found ${upcomingTasks.length} tasks needing reminders`);

    for (const task of upcomingTasks) {
      await sendReminder(task as any as TaskReminder);
      
      // Mark as reminded
      await prisma.agencyTask.update({
        where: { id: task.id },
        data: { reminderSent: true },
      });
    }

    // Find overdue tasks
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
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    console.log(`[Task Reminders] Found ${overdueTasks.length} overdue tasks`);

    for (const task of overdueTasks) {
      await sendReminder(task as any as TaskReminder, true);
      
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

async function sendReminder(task: TaskReminder, isOverdue = false) {
  const { assignedTo } = task;
  const userName = `${assignedTo.user.firstName} ${assignedTo.user.lastName}`;
  
  console.log(
    `[Task Reminders] Sending ${isOverdue ? 'overdue' : 'upcoming'} reminder for task "${task.title}" to ${userName}`
  );

  // Send email notification
  console.log(`  → Email notification to ${assignedTo.user.email} (TODO: implement)`);

  // Create in-app notification
  try {
    await prisma.agencyNotification.create({
      data: {
        agencyId: task.agencyId,
        recipientId: task.assignedToId,
        type: isOverdue ? 'TASK_OVERDUE' : 'TASK_DUE_SOON',
        title: isOverdue ? 'Overdue Task' : 'Task Due Soon',
        message: `Task "${task.title}" is ${isOverdue ? 'overdue' : 'due within 1 hour'}`,
        taskId: task.id,
      },
    });
    console.log(`  → In-app notification created`);
  } catch (error) {
    console.error('  → Failed to create in-app notification:', error);
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
