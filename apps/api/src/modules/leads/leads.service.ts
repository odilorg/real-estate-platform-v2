import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateLeadDto,
  UpdateLeadDto,
  AssignLeadDto,
  UpdateLeadStatusDto,
  ConvertLeadDto,
} from '@repo/shared';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async createLead(developerId: string, dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        developerId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        projectId: dto.projectId,
        propertyType: dto.propertyType,
        budget: dto.budget,
        currency: dto.currency,
        bedrooms: dto.bedrooms,
        source: dto.source,
        priority: dto.priority,
        notes: dto.notes,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getLeads(
    developerId: string,
    filters?: {
      status?: string;
      priority?: number;
      projectId?: string;
      assignedToId?: string;
      search?: string;
    },
    page: number = 1,
    limit: number = 50,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { developerId };

    if (filters?.status) where.status = filters.status;
    if (filters?.priority !== undefined) where.priority = filters.priority;
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items: leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLead(developerId: string, leadId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!lead || lead.developerId !== developerId) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async updateLead(developerId: string, leadId: string, dto: UpdateLeadDto) {
    await this.getLead(developerId, leadId);

    return this.prisma.lead.update({
      where: { id: leadId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        projectId: dto.projectId,
        propertyType: dto.propertyType,
        budget: dto.budget,
        currency: dto.currency,
        bedrooms: dto.bedrooms,
        priority: dto.priority,
        notes: dto.notes,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async assignLead(developerId: string, leadId: string, dto: AssignLeadDto) {
    await this.getLead(developerId, leadId);

    // Verify that the assigned agent is part of the developer's sales team
    if (dto.assignedToId) {
      const agent = await this.prisma.user.findUnique({
        where: { id: dto.assignedToId },
      });

      if (!agent || agent.developerId !== developerId) {
        throw new ForbiddenException('Agent not part of your sales team');
      }
    }

    return this.prisma.lead.update({
      where: { id: leadId },
      data: {
        assignedToId: dto.assignedToId || null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateLeadStatus(
    developerId: string,
    leadId: string,
    dto: UpdateLeadStatusDto,
  ) {
    const lead = await this.getLead(developerId, leadId);

    return this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status: dto.status,
        lastContactedAt:
          dto.status === 'CONTACTED' ? new Date() : lead.lastContactedAt,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async convertLead(
    developerId: string,
    leadId: string,
    dto: ConvertLeadDto,
  ) {
    await this.getLead(developerId, leadId);

    return this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'CONVERTED',
        conversionType: dto.conversionType,
        conversionValue: dto.conversionValue,
        convertedAt: new Date(),
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async deleteLead(developerId: string, leadId: string) {
    await this.getLead(developerId, leadId);

    return this.prisma.lead.delete({
      where: { id: leadId },
    });
  }

  async scheduleFollowUp(
    developerId: string,
    leadId: string,
    nextFollowUpAt: Date,
  ) {
    await this.getLead(developerId, leadId);

    return this.prisma.lead.update({
      where: { id: leadId },
      data: {
        nextFollowUpAt,
        totalContacts: {
          increment: 1,
        },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
