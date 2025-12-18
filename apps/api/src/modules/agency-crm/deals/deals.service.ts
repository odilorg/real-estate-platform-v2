import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateDealDto, UpdateDealDto, CloseDealDto } from './dto/create-deal.dto';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  async create(agencyId: string, memberId: string, createDealDto: CreateDealDto): Promise<any> {
    // Verify lead exists and belongs to agency
    const lead = await this.prisma.agencyLead.findFirst({
      where: { id: createDealDto.leadId, agencyId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Check if lead already has a deal
    const existingDeal = await this.prisma.agencyDeal.findUnique({
      where: { leadId: createDealDto.leadId },
    });

    if (existingDeal) {
      throw new BadRequestException('Lead already has a deal');
    }

    // Verify owner exists and belongs to agency
    const owner = await this.prisma.agencyMember.findFirst({
      where: { id: createDealDto.ownerId, agencyId, isActive: true },
    });

    if (!owner) {
      throw new NotFoundException('Deal owner not found or inactive');
    }

    // Get agency default commission rate if not provided
    let commissionRate = createDealDto.commissionRate;
    if (!commissionRate) {
      const agencyCRM = await this.prisma.agencyCRM.findUnique({
        where: { agencyId },
      });
      commissionRate = agencyCRM?.defaultCommissionRate || 3.0;
    }

    // Calculate commission amount
    const commissionAmount = (createDealDto.dealValue * commissionRate) / 100;

    // Create deal
    const deal = await this.prisma.agencyDeal.create({
      data: {
        ...createDealDto,
        agencyId,
        commissionRate,
        commissionAmount,
        stage: createDealDto.stage || 'QUALIFIED',
        status: createDealDto.status || 'ACTIVE',
        probability: createDealDto.probability || 50,
        currency: createDealDto.currency || ('YE' as any),
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        owner: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            propertyType: true,
          },
        },
      },
    });

    // Update lead status to converted
    await this.prisma.agencyLead.update({
      where: { id: createDealDto.leadId },
      data: {
        status: 'CONVERTED',
        convertedAt: new Date(),
        convertedToDealId: deal.id,
        conversionValue: createDealDto.dealValue,
      },
    });

    // Log activity
    await this.prisma.agencyActivity.create({
      data: {
        agencyId,
        leadId: lead.id,
        dealId: deal.id,
        type: 'STATUS_CHANGE',
        title: 'Lead converted to deal',
        description: `Deal created with value ${deal.dealValue} ${deal.currency}`,
        memberId,
      },
    });

    return deal;
  }

  async findAll(agencyId: string, memberId: string, role: string, query: any): Promise<any> {
    const { stage, status, ownerId, page = 1, limit = 20 } = query;

    const where: any = { agencyId };

    // Regular agents can only see their own deals
    if (role === 'AGENT') {
      where.ownerId = memberId;
    } else if (ownerId) {
      // Admins/owners can filter by specific owner
      where.ownerId = ownerId;
    }

    if (stage) where.stage = stage;
    if (status) where.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [deals, total] = await Promise.all([
      this.prisma.agencyDeal.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          owner: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          property: {
            select: {
              id: true,
              title: true,
              price: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.agencyDeal.count({ where }),
    ]);

    return {
      data: deals,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(agencyId: string, memberId: string, role: string, id: string): Promise<any> {
    const deal = await this.prisma.agencyDeal.findFirst({
      where: { id, agencyId },
      include: {
        lead: true,
        owner: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        property: true,
        activities: {
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
        },
        commissions: {
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
        },
        tasks: {
          where: {
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
          },
          include: {
            assignedTo: {
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
        },
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    // Regular agents can only see their own deals
    if (role === 'AGENT' && deal.ownerId !== memberId) {
      throw new ForbiddenException('You can only view your own deals');
    }

    return deal;
  }

  async update(agencyId: string, memberId: string, role: string, id: string, updateDealDto: UpdateDealDto): Promise<any> {
    const deal = await this.prisma.agencyDeal.findFirst({
      where: { id, agencyId },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    // Regular agents can only update their own deals
    if (role === 'AGENT' && deal.ownerId !== memberId) {
      throw new ForbiddenException('You can only update your own deals');
    }

    // If dealValue or commissionRate changed, recalculate commission
    const dealValue = updateDealDto.dealValue ?? deal.dealValue;
    const commissionRate = updateDealDto.commissionRate ?? deal.commissionRate;
    const commissionAmount = (dealValue * commissionRate) / 100;

    const updateData: any = {};
    if (updateDealDto.propertyId !== undefined) updateData.propertyId = updateDealDto.propertyId;
    if (updateDealDto.dealType !== undefined) updateData.dealType = updateDealDto.dealType;
    if (updateDealDto.dealValue !== undefined) updateData.dealValue = updateDealDto.dealValue;
    if (updateDealDto.currency !== undefined) updateData.currency = updateDealDto.currency;
    if (updateDealDto.stage !== undefined) updateData.stage = updateDealDto.stage;
    if (updateDealDto.status !== undefined) updateData.status = updateDealDto.status;
    if (updateDealDto.probability !== undefined) updateData.probability = updateDealDto.probability;
    if (updateDealDto.expectedCloseDate !== undefined) updateData.expectedCloseDate = updateDealDto.expectedCloseDate;
    if (updateDealDto.actualCloseDate !== undefined) updateData.actualCloseDate = updateDealDto.actualCloseDate;
    if (updateDealDto.ownerId !== undefined) updateData.ownerId = updateDealDto.ownerId;
    if (updateDealDto.commissionRate !== undefined) updateData.commissionRate = updateDealDto.commissionRate;
    if (updateDealDto.commissionAmount !== undefined) updateData.commissionAmount = updateDealDto.commissionAmount;
    if (updateDealDto.commissionSplit !== undefined) updateData.commissionSplit = updateDealDto.commissionSplit;
    if (updateDealDto.notaryScheduled !== undefined) updateData.notaryScheduled = updateDealDto.notaryScheduled;
    if (updateDealDto.notaryCompleted !== undefined) updateData.notaryCompleted = updateDealDto.notaryCompleted;
    if (updateDealDto.registrationId !== undefined) updateData.registrationId = updateDealDto.registrationId;
    if (updateDealDto.registrationDate !== undefined) updateData.registrationDate = updateDealDto.registrationDate;
    if (updateDealDto.closeReason !== undefined) updateData.closeReason = updateDealDto.closeReason;
    if (updateDealDto.notes !== undefined) updateData.notes = updateDealDto.notes;
    updateData.commissionAmount = commissionAmount;

    const updatedDeal = await this.prisma.agencyDeal.update({
      where: { id },
      data: updateData,
      include: {
        lead: true,
        owner: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        property: true,
      },
    });

    // Log activity if stage changed
    if (updateDealDto.stage && updateDealDto.stage !== deal.stage) {
      await this.prisma.agencyActivity.create({
        data: {
          agencyId,
          leadId: deal.leadId,
          dealId: deal.id,
          type: 'STATUS_CHANGE',
          title: `Deal stage changed to ${updateDealDto.stage}`,
          memberId,
        },
      });
    }

    return updatedDeal;
  }

  async close(agencyId: string, memberId: string, role: string, id: string, closeDealDto: CloseDealDto): Promise<any> {
    const deal = await this.prisma.agencyDeal.findFirst({
      where: { id, agencyId },
      include: {
        lead: true,
        owner: true,
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    // Regular agents can only close their own deals
    if (role === 'AGENT' && deal.ownerId !== memberId) {
      throw new ForbiddenException('You can only close your own deals');
    }

    // Validate close reason for LOST deals
    if (closeDealDto.status === 'LOST' && !closeDealDto.closeReason) {
      throw new BadRequestException('Close reason is required for lost deals');
    }

    const actualCloseDate = closeDealDto.actualCloseDate ? new Date(closeDealDto.actualCloseDate) : new Date();

    // Update deal
    const closedDeal = await this.prisma.agencyDeal.update({
      where: { id },
      data: {
        status: closeDealDto.status,
        stage: closeDealDto.status === 'WON' ? 'CLOSED_WON' : 'CLOSED_LOST',
        actualCloseDate,
        closeReason: closeDealDto.closeReason,
      },
      include: {
        lead: true,
        owner: {
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

    // Create commission if deal won
    if (closeDealDto.status === 'WON') {
      await this.createCommission(agencyId, deal);
    }

    // Log activity
    await this.prisma.agencyActivity.create({
      data: {
        agencyId,
        leadId: deal.leadId,
        dealId: deal.id,
        type: 'STATUS_CHANGE',
        title: `Deal closed - ${closeDealDto.status}`,
        description: closeDealDto.closeReason,
        memberId,
      },
    });

    // Update lead status
    await this.prisma.agencyLead.update({
      where: { id: deal.leadId },
      data: {
        status: closeDealDto.status === 'WON' ? 'CONVERTED' : 'LOST',
      },
    });

    return closedDeal;
  }

  async delete(agencyId: string, _memberId: string, role: string, id: string): Promise<any> {
    const deal = await this.prisma.agencyDeal.findFirst({
      where: { id, agencyId },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    // Only admins/owners can delete deals
    if (role === 'AGENT') {
      throw new ForbiddenException('Only admins can delete deals');
    }

    await this.prisma.agencyDeal.delete({
      where: { id },
    });

    return { success: true };
  }

  async getPipeline(agencyId: string, memberId: string, role: string): Promise<any> {
    const where: any = { agencyId, status: 'ACTIVE' };

    // Regular agents can only see their own pipeline
    if (role === 'AGENT') {
      where.ownerId = memberId;
    }

    const deals = await this.prisma.agencyDeal.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        owner: {
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

    // Group by stage
    const pipeline: any = {};
    const stages = [
      'QUALIFIED',
      'VIEWING_SCHEDULED',
      'VIEWING_COMPLETED',
      'OFFER_MADE',
      'NEGOTIATION',
      'AGREEMENT_REACHED',
      'NOTARY_SCHEDULED',
      'DOCUMENTS_PENDING',
      'REGISTRATION_PENDING',
    ];

    stages.forEach((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      pipeline[stage] = {
        count: stageDeals.length,
        totalValue: stageDeals.reduce((sum, d) => sum + d.dealValue, 0),
        deals: stageDeals,
      };
    });

    return pipeline;
  }

  private async createCommission(agencyId: string, deal: any): Promise<void> {
    // Get agency fee percentage
    const agencyCRM = await this.prisma.agencyCRM.findUnique({
      where: { agencyId },
    });

    const agencyFeePercent = agencyCRM?.agencyFeePercent || 0;
    const grossAmount = deal.commissionAmount;
    const agencyFee = (grossAmount * agencyFeePercent) / 100;
    const netAmount = grossAmount - agencyFee;

    // Check if commission split exists
    if (deal.commissionSplit && Array.isArray(deal.commissionSplit)) {
      // Create commission for each member in split
      for (const split of deal.commissionSplit) {
        const splitGross = (grossAmount * split.percent) / 100;
        const splitFee = (splitGross * agencyFeePercent) / 100;
        const splitNet = splitGross - splitFee;

        await this.prisma.agencyCommission.create({
          data: {
            agencyId,
            dealId: deal.id,
            memberId: split.memberId,
            grossAmount: splitGross,
            agencyFee: splitFee,
            netAmount: splitNet,
            currency: deal.currency,
            status: 'PENDING',
          },
        });
      }
    } else {
      // Single commission for deal owner
      await this.prisma.agencyCommission.create({
        data: {
          agencyId,
          dealId: deal.id,
          memberId: deal.ownerId,
          grossAmount,
          agencyFee,
          netAmount,
          currency: deal.currency,
          status: 'PENDING',
        },
      });
    }
  }
}
