import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(developerId: string, memberId: string, createActivityDto: CreateActivityDto): Promise<any> {
    // Verify lead belongs to agency
    const lead = await this.prisma.developerLead.findFirst({
      where: { id: createActivityDto.leadId, developerId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Verify member belongs to agency
    const member = await this.prisma.developerMember.findFirst({
      where: { id: memberId, developerId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.developerActivity.create({
      data: {
        ...createActivityDto,
        developerId,
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

  async findByLead(developerId: string, leadId: string): Promise<any[]> {
    // Verify lead belongs to agency
    const lead = await this.prisma.developerLead.findFirst({
      where: { id: leadId, developerId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return this.prisma.developerActivity.findMany({
      where: { leadId, developerId },
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

  async delete(developerId: string, id: string): Promise<any> {
    const activity = await this.prisma.developerActivity.findFirst({
      where: { id, developerId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return this.prisma.developerActivity.delete({
      where: { id },
    });
  }
}
