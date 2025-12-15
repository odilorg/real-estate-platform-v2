import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { LeadStatus } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(agencyId: string, createLeadDto: CreateLeadDto) {
    return this.prisma.agencyLead.create({
      data: {
        agencyId,
        ...createLeadDto,
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
      },
    });
  }

  async findAll(agencyId: string, query: QueryLeadsDto) {
    const { status, assignedToId, source, priority, search, skip = 0, take = 20 } = query;

    // Build where clause
    const where: any = { agencyId };

    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    if (source) where.source = source;
    if (priority) where.priority = priority;

    // Search across multiple fields
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      this.prisma.agencyLead.findMany({
        where,
        skip,
        take,
        orderBy: [
          { priority: 'asc' }, // URGENT first
          { createdAt: 'desc' }, // Newest first
        ],
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
        },
      }),
      this.prisma.agencyLead.count({ where }),
    ]);

    return {
      leads,
      total,
      skip,
      take,
    };
  }

  async findOne(agencyId: string, id: string) {
    const lead = await this.prisma.agencyLead.findUnique({
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
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            member: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        tasks: {
          where: {
            status: { not: 'COMPLETED' },
          },
          orderBy: { dueDate: 'asc' },
          include: {
            assignedTo: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    // Security: verify lead belongs to this agency
    if (lead.agencyId !== agencyId) {
      throw new ForbiddenException('Access denied');
    }

    return lead;
  }

  async update(agencyId: string, id: string, updateLeadDto: UpdateLeadDto) {
    // Verify ownership
    await this.findOne(agencyId, id);

    return this.prisma.agencyLead.update({
      where: { id },
      data: updateLeadDto,
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
      },
    });
  }

  async remove(agencyId: string, id: string) {
    // Verify ownership
    await this.findOne(agencyId, id);

    return this.prisma.agencyLead.delete({
      where: { id },
    });
  }

  async assign(agencyId: string, leadId: string, memberId: string) {
    // Verify ownership
    await this.findOne(agencyId, leadId);

    // Verify member belongs to this agency
    const member = await this.prisma.agencyMember.findFirst({
      where: {
        id: memberId,
        agencyId,
        isActive: true,
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found or inactive`);
    }

    return this.prisma.agencyLead.update({
      where: { id: leadId },
      data: {
        assignedToId: memberId,
        assignedAt: new Date(),
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
      },
    });
  }
}
