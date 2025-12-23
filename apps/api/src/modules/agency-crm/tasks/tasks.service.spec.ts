import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { TaskStatus, TaskPriority, TaskType, Currency } from '@repo/database';

// Extended mock PrismaService with Agency CRM models
const mockPrismaService = {
  agencyTask: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  agencyMember: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  agencyLead: {
    findFirst: jest.fn(),
  },
  agencyDeal: {
    findFirst: jest.fn(),
  },
};

describe('TasksService', () => {
  let service: TasksService;
  let prisma: typeof mockPrismaService;

  // Mock factory functions
  const createMockTask = (overrides = {}) => ({
    id: 'task-123',
    agencyId: 'agency-123',
    title: 'Follow up call',
    description: 'Call the client about property viewing',
    type: 'CALL' as TaskType,
    priority: 'MEDIUM' as TaskPriority,
    status: 'PENDING' as TaskStatus,
    assignedToId: 'member-123',
    leadId: null,
    dealId: null,
    dueDate: new Date('2024-12-25'),
    completedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });

  const createMockMember = (overrides = {}) => ({
    id: 'member-123',
    agencyId: 'agency-123',
    userId: 'user-123',
    role: 'AGENT',
    isActive: true,
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      firstName: 'Agent',
      lastName: 'Smith',
      phone: '+998901234567',
      email: 'agent@example.com',
    },
    ...overrides,
  });

  const createMockLead = (overrides = {}) => ({
    id: 'lead-123',
    agencyId: 'agency-123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+998909876543',
    email: 'john@example.com',
    ...overrides,
  });

  const createMockDeal = (overrides = {}) => ({
    id: 'deal-123',
    agencyId: 'agency-123',
    dealValue: 100000,
    currency: Currency.YE,
    stage: 'NEGOTIATION',
    status: 'ACTIVE',
    ...overrides,
  });

  beforeEach(async () => {
    // Reset all mocks
    Object.values(mockPrismaService).forEach((service) => {
      Object.values(service).forEach((method) => {
        if (jest.isMockFunction(method)) {
          method.mockReset();
        }
      });
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = mockPrismaService;
  });

  describe('create', () => {
    const agencyId = 'agency-123';
    const createDto = {
      title: 'Call client',
      description: 'Follow up on property inquiry',
      type: 'CALL' as TaskType,
      priority: 'HIGH' as TaskPriority,
      assignedToId: 'member-123',
      dueDate: '2024-12-25',
    };

    it('should create a task successfully', async () => {
      const mockMember = createMockMember();
      const mockTask = createMockTask({
        title: createDto.title,
        description: createDto.description,
        assignedTo: mockMember,
      });

      prisma.agencyMember.findFirst.mockResolvedValue(mockMember);
      prisma.agencyTask.create.mockResolvedValue(mockTask);

      const result = await service.create(agencyId, createDto);

      expect(result).toEqual(mockTask);
      expect(prisma.agencyMember.findFirst).toHaveBeenCalledWith({
        where: { id: createDto.assignedToId, agencyId },
      });
      expect(prisma.agencyTask.create).toHaveBeenCalledWith({
        data: {
          agencyId,
          title: createDto.title,
          description: createDto.description,
          type: createDto.type,
          priority: createDto.priority,
          assignedToId: createDto.assignedToId,
          leadId: undefined,
          dealId: undefined,
          dueDate: new Date(createDto.dueDate),
          status: 'PENDING',
        },
        include: expect.objectContaining({
          assignedTo: expect.any(Object),
          lead: expect.any(Object),
          deal: expect.any(Object),
        }),
      });
    });

    it('should create task with default MEDIUM priority', async () => {
      const dtoWithoutPriority = {
        ...createDto,
        priority: undefined,
      };

      prisma.agencyMember.findFirst.mockResolvedValue(createMockMember());
      prisma.agencyTask.create.mockResolvedValue(createMockTask());

      await service.create(agencyId, dtoWithoutPriority as any);

      expect(prisma.agencyTask.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: 'MEDIUM',
          }),
        }),
      );
    });

    it('should throw ForbiddenException if assigned member not found', async () => {
      prisma.agencyMember.findFirst.mockResolvedValue(null);

      await expect(service.create(agencyId, createDto)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.create(agencyId, createDto)).rejects.toThrow(
        'Assigned member not found in this agency',
      );
      expect(prisma.agencyTask.create).not.toHaveBeenCalled();
    });

    it('should create task with lead association', async () => {
      const dtoWithLead = {
        ...createDto,
        leadId: 'lead-123',
      };

      prisma.agencyMember.findFirst.mockResolvedValue(createMockMember());
      prisma.agencyLead.findFirst.mockResolvedValue(createMockLead());
      prisma.agencyTask.create.mockResolvedValue(
        createMockTask({ leadId: 'lead-123' }),
      );

      await service.create(agencyId, dtoWithLead);

      expect(prisma.agencyLead.findFirst).toHaveBeenCalledWith({
        where: { id: dtoWithLead.leadId, agencyId },
      });
      expect(prisma.agencyTask.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadId: 'lead-123',
          }),
        }),
      );
    });

    it('should throw ForbiddenException if lead not found in agency', async () => {
      const dtoWithLead = {
        ...createDto,
        leadId: 'lead-123',
      };

      prisma.agencyMember.findFirst.mockResolvedValue(createMockMember());
      prisma.agencyLead.findFirst.mockResolvedValue(null);

      await expect(service.create(agencyId, dtoWithLead)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.create(agencyId, dtoWithLead)).rejects.toThrow(
        'Lead not found in this agency',
      );
    });

    it('should create task with deal association', async () => {
      const dtoWithDeal = {
        ...createDto,
        dealId: 'deal-123',
      };

      prisma.agencyMember.findFirst.mockResolvedValue(createMockMember());
      prisma.agencyDeal.findFirst.mockResolvedValue(createMockDeal());
      prisma.agencyTask.create.mockResolvedValue(
        createMockTask({ dealId: 'deal-123' }),
      );

      await service.create(agencyId, dtoWithDeal);

      expect(prisma.agencyDeal.findFirst).toHaveBeenCalledWith({
        where: { id: dtoWithDeal.dealId, agencyId },
      });
      expect(prisma.agencyTask.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dealId: 'deal-123',
          }),
        }),
      );
    });

    it('should throw ForbiddenException if deal not found in agency', async () => {
      const dtoWithDeal = {
        ...createDto,
        dealId: 'deal-123',
      };

      prisma.agencyMember.findFirst.mockResolvedValue(createMockMember());
      prisma.agencyDeal.findFirst.mockResolvedValue(null);

      await expect(service.create(agencyId, dtoWithDeal)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.create(agencyId, dtoWithDeal)).rejects.toThrow(
        'Deal not found in this agency',
      );
    });

    it('should set status to PENDING by default', async () => {
      prisma.agencyMember.findFirst.mockResolvedValue(createMockMember());
      prisma.agencyTask.create.mockResolvedValue(createMockTask());

      await service.create(agencyId, createDto);

      expect(prisma.agencyTask.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    const agencyId = 'agency-123';

    it('should return paginated tasks with default values', async () => {
      const mockTasks = Array.from({ length: 3 }, (_, i) =>
        createMockTask({
          id: `task-${i}`,
          title: `Task ${i}`,
        }),
      );

      prisma.agencyTask.findMany.mockResolvedValue(mockTasks);
      prisma.agencyTask.count.mockResolvedValue(50);

      const result = await service.findAll(agencyId, {});

      expect(result.tasks).toEqual(mockTasks);
      expect(result.total).toBe(50);
      expect(result.skip).toBe(0);
      expect(result.take).toBe(20);
      expect(prisma.agencyTask.findMany).toHaveBeenCalledWith({
        where: { agencyId },
        skip: 0,
        take: 20,
        orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
        include: expect.objectContaining({
          assignedTo: expect.any(Object),
          lead: expect.any(Object),
          deal: expect.any(Object),
        }),
      });
    });

    it('should handle pagination correctly', async () => {
      prisma.agencyTask.findMany.mockResolvedValue([]);
      prisma.agencyTask.count.mockResolvedValue(100);

      const result = await service.findAll(agencyId, {
        skip: 20,
        take: 10,
      });

      expect(result.skip).toBe(20);
      expect(result.take).toBe(10);
      expect(prisma.agencyTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });

    it('should filter by status', async () => {
      prisma.agencyTask.findMany.mockResolvedValue([]);
      prisma.agencyTask.count.mockResolvedValue(0);

      await service.findAll(agencyId, { status: 'COMPLETED' as TaskStatus });

      expect(prisma.agencyTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            status: 'COMPLETED',
          }),
        }),
      );
    });

    it('should filter by priority', async () => {
      prisma.agencyTask.findMany.mockResolvedValue([]);
      prisma.agencyTask.count.mockResolvedValue(0);

      await service.findAll(agencyId, { priority: 'URGENT' as TaskPriority });

      expect(prisma.agencyTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            priority: 'URGENT',
          }),
        }),
      );
    });

    it('should filter by type', async () => {
      prisma.agencyTask.findMany.mockResolvedValue([]);
      prisma.agencyTask.count.mockResolvedValue(0);

      await service.findAll(agencyId, { type: 'CALL' as TaskType });

      expect(prisma.agencyTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            type: 'CALL',
          }),
        }),
      );
    });

    it('should filter by assignedToId', async () => {
      prisma.agencyTask.findMany.mockResolvedValue([]);
      prisma.agencyTask.count.mockResolvedValue(0);

      await service.findAll(agencyId, { assignedToId: 'member-123' });

      expect(prisma.agencyTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            assignedToId: 'member-123',
          }),
        }),
      );
    });

    it('should filter by leadId', async () => {
      prisma.agencyTask.findMany.mockResolvedValue([]);
      prisma.agencyTask.count.mockResolvedValue(0);

      await service.findAll(agencyId, { leadId: 'lead-123' });

      expect(prisma.agencyTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            leadId: 'lead-123',
          }),
        }),
      );
    });

    it('should filter by dealId', async () => {
      prisma.agencyTask.findMany.mockResolvedValue([]);
      prisma.agencyTask.count.mockResolvedValue(0);

      await service.findAll(agencyId, { dealId: 'deal-123' });

      expect(prisma.agencyTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            dealId: 'deal-123',
          }),
        }),
      );
    });

    it('should search across title and description', async () => {
      prisma.agencyTask.findMany.mockResolvedValue([]);
      prisma.agencyTask.count.mockResolvedValue(0);

      await service.findAll(agencyId, { search: 'follow up' });

      expect(prisma.agencyTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            OR: [
              { title: { contains: 'follow up', mode: 'insensitive' } },
              { description: { contains: 'follow up', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should combine multiple filters', async () => {
      prisma.agencyTask.findMany.mockResolvedValue([]);
      prisma.agencyTask.count.mockResolvedValue(0);

      await service.findAll(agencyId, {
        status: 'PENDING' as TaskStatus,
        priority: 'HIGH' as TaskPriority,
        type: 'CALL' as TaskType,
        assignedToId: 'member-123',
      });

      expect(prisma.agencyTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agencyId,
            status: 'PENDING',
            priority: 'HIGH',
            type: 'CALL',
            assignedToId: 'member-123',
          }),
        }),
      );
    });

    it('should order by priority (asc) then dueDate (asc)', async () => {
      prisma.agencyTask.findMany.mockResolvedValue([]);
      prisma.agencyTask.count.mockResolvedValue(0);

      await service.findAll(agencyId, {});

      expect(prisma.agencyTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
        }),
      );
    });

    it('should return empty array when no tasks exist', async () => {
      prisma.agencyTask.findMany.mockResolvedValue([]);
      prisma.agencyTask.count.mockResolvedValue(0);

      const result = await service.findAll(agencyId, {});

      expect(result.tasks).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    const agencyId = 'agency-123';
    const taskId = 'task-123';

    it('should return task with details', async () => {
      const mockTask = createMockTask({
        id: taskId,
        agencyId,
        assignedTo: createMockMember(),
        lead: createMockLead(),
        deal: createMockDeal(),
      });

      prisma.agencyTask.findUnique.mockResolvedValue(mockTask);

      const result = await service.findOne(agencyId, taskId);

      expect(result).toEqual(mockTask);
      expect(prisma.agencyTask.findUnique).toHaveBeenCalledWith({
        where: { id: taskId },
        include: expect.objectContaining({
          assignedTo: expect.any(Object),
          lead: expect.any(Object),
          deal: expect.any(Object),
        }),
      });
    });

    it('should throw NotFoundException if task does not exist', async () => {
      prisma.agencyTask.findUnique.mockResolvedValue(null);

      await expect(service.findOne(agencyId, taskId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(agencyId, taskId)).rejects.toThrow(
        'Task not found',
      );
    });

    it('should throw ForbiddenException if task belongs to different agency', async () => {
      const mockTask = createMockTask({
        id: taskId,
        agencyId: 'different-agency',
      });

      prisma.agencyTask.findUnique.mockResolvedValue(mockTask);

      await expect(service.findOne(agencyId, taskId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOne(agencyId, taskId)).rejects.toThrow(
        'Task does not belong to this agency',
      );
    });
  });

  describe('update', () => {
    const agencyId = 'agency-123';
    const taskId = 'task-123';
    const updateDto = {
      title: 'Updated task',
      description: 'Updated description',
      status: 'IN_PROGRESS' as TaskStatus,
      priority: 'URGENT' as TaskPriority,
    };

    it('should update task successfully', async () => {
      const existingTask = createMockTask({ id: taskId, agencyId });
      const updatedTask = createMockTask({
        id: taskId,
        agencyId,
        ...updateDto,
      });

      prisma.agencyTask.findUnique.mockResolvedValue(existingTask);
      prisma.agencyTask.update.mockResolvedValue(updatedTask);

      const result = await service.update(agencyId, taskId, updateDto);

      expect(result).toEqual(updatedTask);
      expect(prisma.agencyTask.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: expect.objectContaining(updateDto),
        include: expect.objectContaining({
          assignedTo: expect.any(Object),
          lead: expect.any(Object),
          deal: expect.any(Object),
        }),
      });
    });

    it('should set completedAt when status changes to COMPLETED', async () => {
      const existingTask = createMockTask({
        id: taskId,
        agencyId,
        status: 'PENDING' as TaskStatus,
      });

      prisma.agencyTask.findUnique.mockResolvedValue(existingTask);
      prisma.agencyTask.update.mockResolvedValue(createMockTask());

      await service.update(agencyId, taskId, {
        status: 'COMPLETED' as TaskStatus,
      });

      expect(prisma.agencyTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
            completedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should clear completedAt when status changes from COMPLETED', async () => {
      const existingTask = createMockTask({
        id: taskId,
        agencyId,
        status: 'COMPLETED' as TaskStatus,
        completedAt: new Date(),
      });

      prisma.agencyTask.findUnique.mockResolvedValue(existingTask);
      prisma.agencyTask.update.mockResolvedValue(createMockTask());

      await service.update(agencyId, taskId, {
        status: 'IN_PROGRESS' as TaskStatus,
      });

      expect(prisma.agencyTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'IN_PROGRESS',
            completedAt: null,
          }),
        }),
      );
    });

    it('should convert dueDate string to Date', async () => {
      const existingTask = createMockTask({ id: taskId, agencyId });

      prisma.agencyTask.findUnique.mockResolvedValue(existingTask);
      prisma.agencyTask.update.mockResolvedValue(createMockTask());

      await service.update(agencyId, taskId, {
        dueDate: '2024-12-31' as any,
      });

      expect(prisma.agencyTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dueDate: new Date('2024-12-31'),
          }),
        }),
      );
    });

    it('should verify new assignee belongs to agency', async () => {
      const existingTask = createMockTask({ id: taskId, agencyId });
      const newMember = createMockMember({ id: 'member-456' });

      prisma.agencyTask.findUnique.mockResolvedValue(existingTask);
      prisma.agencyMember.findFirst.mockResolvedValue(newMember);
      prisma.agencyTask.update.mockResolvedValue(createMockTask());

      await service.update(agencyId, taskId, {
        assignedToId: 'member-456',
      });

      expect(prisma.agencyMember.findFirst).toHaveBeenCalledWith({
        where: { id: 'member-456', agencyId },
      });
    });

    it('should throw ForbiddenException if new assignee not found', async () => {
      const existingTask = createMockTask({ id: taskId, agencyId });

      prisma.agencyTask.findUnique.mockResolvedValue(existingTask);
      prisma.agencyMember.findFirst.mockResolvedValue(null);

      await expect(
        service.update(agencyId, taskId, {
          assignedToId: 'member-456',
        }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update(agencyId, taskId, {
          assignedToId: 'member-456',
        }),
      ).rejects.toThrow('Assigned member not found in this agency');
    });

    it('should handle partial updates', async () => {
      const existingTask = createMockTask({ id: taskId, agencyId });

      prisma.agencyTask.findUnique.mockResolvedValue(existingTask);
      prisma.agencyTask.update.mockResolvedValue(createMockTask());

      await service.update(agencyId, taskId, { title: 'New title only' });

      expect(prisma.agencyTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New title only',
          }),
        }),
      );
    });
  });

  describe('remove', () => {
    const agencyId = 'agency-123';
    const taskId = 'task-123';

    it('should delete task successfully', async () => {
      const mockTask = createMockTask({ id: taskId, agencyId });

      prisma.agencyTask.findUnique.mockResolvedValue(mockTask);
      prisma.agencyTask.delete.mockResolvedValue(mockTask);

      const result = await service.remove(agencyId, taskId);

      expect(result).toEqual({ success: true });
      expect(prisma.agencyTask.delete).toHaveBeenCalledWith({
        where: { id: taskId },
      });
    });

    it('should verify task exists before deleting', async () => {
      prisma.agencyTask.findUnique.mockResolvedValue(null);

      await expect(service.remove(agencyId, taskId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.agencyTask.delete).not.toHaveBeenCalled();
    });

    it('should verify task belongs to agency before deleting', async () => {
      const mockTask = createMockTask({
        id: taskId,
        agencyId: 'different-agency',
      });

      prisma.agencyTask.findUnique.mockResolvedValue(mockTask);

      await expect(service.remove(agencyId, taskId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.agencyTask.delete).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    const agencyId = 'agency-123';

    it('should return task statistics', async () => {
      prisma.agencyTask.count.mockResolvedValueOnce(100); // total
      prisma.agencyTask.count.mockResolvedValueOnce(30); // pending
      prisma.agencyTask.count.mockResolvedValueOnce(20); // in progress
      prisma.agencyTask.count.mockResolvedValueOnce(50); // completed
      prisma.agencyTask.count.mockResolvedValueOnce(10); // overdue

      const result = await service.getStats(agencyId);

      expect(result).toEqual({
        totalTasks: 100,
        pendingTasks: 30,
        inProgressTasks: 20,
        completedTasks: 50,
        overdueTasks: 10,
      });
    });

    it('should count overdue tasks correctly', async () => {
      prisma.agencyTask.count.mockResolvedValue(0);

      await service.getStats(agencyId);

      // Last call should be for overdue tasks
      const lastCall = prisma.agencyTask.count.mock.calls[4][0];
      expect(lastCall.where).toMatchObject({
        agencyId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: expect.any(Date) },
      });
    });

    it('should return zero stats when no tasks exist', async () => {
      prisma.agencyTask.count.mockResolvedValue(0);

      const result = await service.getStats(agencyId);

      expect(result).toEqual({
        totalTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
      });
    });
  });
});
