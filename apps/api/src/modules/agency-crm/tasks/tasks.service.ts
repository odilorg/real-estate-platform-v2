import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { TaskStatus } from '@repo/database';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(agencyId: string, dto: CreateTaskDto) {
    // Verify assignee belongs to agency
    const member = await this.prisma.agencyMember.findFirst({
      where: { id: dto.assignedToId, agencyId },
    });
    if (!member) {
      throw new ForbiddenException('Assigned member not found in this agency');
    }

    // Verify lead belongs to agency if provided
    if (dto.leadId) {
      const lead = await this.prisma.agencyLead.findFirst({
        where: { id: dto.leadId, agencyId },
      });
      if (!lead) {
        throw new ForbiddenException('Lead not found in this agency');
      }
    }

    // Verify deal belongs to agency if provided
    if (dto.dealId) {
      const deal = await this.prisma.agencyDeal.findFirst({
        where: { id: dto.dealId, agencyId },
      });
      if (!deal) {
        throw new ForbiddenException('Deal not found in this agency');
      }
    }

    return this.prisma.agencyTask.create({
      data: {
        agencyId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        priority: dto.priority || 'MEDIUM',
        assignedToId: dto.assignedToId,
        leadId: dto.leadId,
        dealId: dto.dealId,
        dueDate: new Date(dto.dueDate),
        status: 'PENDING',
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
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
        deal: {
          select: {
            id: true,
            dealValue: true,
            currency: true,
          },
        },
      },
    });
  }

  async findAll(agencyId: string, query: QueryTasksDto) {
    const { status, priority, type, assignedToId, leadId, dealId, search, skip = 0, take = 20 } = query;

    const where: any = { agencyId };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    if (assignedToId) where.assignedToId = assignedToId;
    if (leadId) where.leadId = leadId;
    if (dealId) where.dealId = dealId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      this.prisma.agencyTask.findMany({
        where,
        skip,
        take,
        orderBy: [
          { priority: 'asc' }, // URGENT first
          { dueDate: 'asc' }, // Earliest due date first
        ],
        include: {
          assignedTo: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
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
          deal: {
            select: {
              id: true,
              dealValue: true,
              currency: true,
            },
          },
        },
      }),
      this.prisma.agencyTask.count({ where }),
    ]);

    return { tasks, total, skip, take };
  }

  async findOne(agencyId: string, id: string) {
    const task = await this.prisma.agencyTask.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
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
            phone: true,
            email: true,
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
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.agencyId !== agencyId) {
      throw new ForbiddenException('Task does not belong to this agency');
    }

    return task;
  }

  async update(agencyId: string, id: string, dto: UpdateTaskDto) {
    const task = await this.findOne(agencyId, id);

    // If status changed to COMPLETED, set completedAt
    const updateData: any = { ...dto };
    if (dto.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }
    // If status changed from COMPLETED to something else, clear completedAt
    if (dto.status && dto.status !== TaskStatus.COMPLETED && task.status === TaskStatus.COMPLETED) {
      updateData.completedAt = null;
    }

    // Convert dueDate string to Date if provided
    if (dto.dueDate) {
      updateData.dueDate = new Date(dto.dueDate);
    }

    // Verify new assignee belongs to agency if provided
    if (dto.assignedToId) {
      const member = await this.prisma.agencyMember.findFirst({
        where: { id: dto.assignedToId, agencyId },
      });
      if (!member) {
        throw new ForbiddenException('Assigned member not found in this agency');
      }
    }

    return this.prisma.agencyTask.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
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
        deal: {
          select: {
            id: true,
            dealValue: true,
            currency: true,
          },
        },
      },
    });
  }

  async remove(agencyId: string, id: string) {
    await this.findOne(agencyId, id); // Verify exists and belongs to agency

    await this.prisma.agencyTask.delete({ where: { id } });

    return { success: true };
  }

  async getStats(agencyId: string) {
    const now = new Date();

    const [totalTasks, pendingTasks, inProgressTasks, completedTasks, overdueTasks] = await Promise.all([
      this.prisma.agencyTask.count({ where: { agencyId } }),
      this.prisma.agencyTask.count({ where: { agencyId, status: 'PENDING' } }),
      this.prisma.agencyTask.count({ where: { agencyId, status: 'IN_PROGRESS' } }),
      this.prisma.agencyTask.count({ where: { agencyId, status: 'COMPLETED' } }),
      this.prisma.agencyTask.count({
        where: {
          agencyId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lt: now },
        },
      }),
    ]);

    return {
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
    };
  }
}
