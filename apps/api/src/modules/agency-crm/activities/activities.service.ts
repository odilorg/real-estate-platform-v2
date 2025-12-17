import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(agencyId: string, memberId: string, createActivityDto: CreateActivityDto): Promise<any> {
    // Verify lead belongs to agency
    const lead = await this.prisma.agencyLead.findFirst({
      where: { id: createActivityDto.leadId, agencyId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Verify member belongs to agency
    const member = await this.prisma.agencyMember.findFirst({
      where: { id: memberId, agencyId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.agencyActivity.create({
      data: {
        ...createActivityDto,
        agencyId,
        memberId,
      },
      include: {
        member: {
          include: {
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

  async findByLead(agencyId: string, leadId: string): Promise<any[]> {
    // Verify lead belongs to agency
    const lead = await this.prisma.agencyLead.findFirst({
      where: { id: leadId, agencyId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return this.prisma.agencyActivity.findMany({
      where: { leadId, agencyId },
      include: {
        member: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(agencyId: string, id: string): Promise<any> {
    const activity = await this.prisma.agencyActivity.findFirst({
      where: { id, agencyId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return this.prisma.agencyActivity.delete({
      where: { id },
    });
  }
}
