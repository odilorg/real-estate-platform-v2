import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(agencyId: string, memberId: string, role: string, query: any): Promise<any> {
    const { status, page = 1, limit = 20 } = query;

    const where: any = { agencyId };

    // Regular agents can only see their own commissions
    if (role === 'AGENT') {
      where.memberId = memberId;
    } else if (query.memberId) {
      // Admins/owners can filter by specific member
      where.memberId = query.memberId;
    }

    if (status) where.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [commissions, total] = await Promise.all([
      this.prisma.agencyCommission.findMany({
        where,
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
          deal: {
            include: {
              lead: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
              property: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.agencyCommission.count({ where }),
    ]);

    return {
      data: commissions,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(agencyId: string, memberId: string, role: string, id: string): Promise<any> {
    const commission = await this.prisma.agencyCommission.findFirst({
      where: { id, agencyId },
      include: {
        member: {
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
        deal: {
          include: {
            lead: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            property: {
              select: {
                id: true,
                title: true,
                price: true,
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
        },
      },
    });

    if (!commission) {
      throw new NotFoundException('Commission not found');
    }

    // Regular agents can only see their own commissions
    if (role === 'AGENT' && commission.memberId !== memberId) {
      throw new ForbiddenException('You can only view your own commissions');
    }

    return commission;
  }

  async approve(agencyId: string, role: string, id: string): Promise<any> {
    // Only admins/owners can approve commissions
    if (role === 'AGENT') {
      throw new ForbiddenException('Only admins can approve commissions');
    }

    const commission = await this.prisma.agencyCommission.findFirst({
      where: { id, agencyId },
    });

    if (!commission) {
      throw new NotFoundException('Commission not found');
    }

    if (commission.status !== 'PENDING') {
      throw new ForbiddenException('Only pending commissions can be approved');
    }

    return this.prisma.agencyCommission.update({
      where: { id },
      data: {
        status: 'APPROVED',
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

  async markAsPaid(agencyId: string, role: string, id: string, paymentData: any): Promise<any> {
    // Only admins/owners can mark commissions as paid
    if (role === 'AGENT') {
      throw new ForbiddenException('Only admins can mark commissions as paid');
    }

    const commission = await this.prisma.agencyCommission.findFirst({
      where: { id, agencyId },
    });

    if (!commission) {
      throw new NotFoundException('Commission not found');
    }

    if (commission.status === 'PAID') {
      throw new ForbiddenException('Commission is already paid');
    }

    return this.prisma.agencyCommission.update({
      where: { id },
      data: {
        status: 'PAID',
        paidDate: paymentData.paidDate ? new Date(paymentData.paidDate) : new Date(),
        paymentMethod: paymentData.paymentMethod,
        paymentNotes: paymentData.paymentNotes,
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

  async getSummary(agencyId: string, memberId: string, role: string, query: any): Promise<any> {
    const where: any = { agencyId };

    // Regular agents can only see their own summary
    if (role === 'AGENT') {
      where.memberId = memberId;
    } else if (query.memberId) {
      where.memberId = query.memberId;
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [commissions, totalStats] = await Promise.all([
      this.prisma.agencyCommission.findMany({
        where,
        select: {
          status: true,
          grossAmount: true,
          netAmount: true,
          currency: true,
        },
      }),
      this.prisma.agencyCommission.aggregate({
        where,
        _sum: {
          grossAmount: true,
          netAmount: true,
        },
        _count: true,
      }),
    ]);

    // Group by status
    const byStatus = commissions.reduce(
      (acc, comm) => {
        const status = comm.status;
        if (!acc[status]) {
          acc[status] = { count: 0, total: 0 };
        }
        acc[status].count += 1;
        acc[status].total += comm.netAmount;
        return acc;
      },
      {} as Record<string, { count: number; total: number }>
    );

    return {
      total: totalStats._sum.netAmount || 0,
      gross: totalStats._sum.grossAmount || 0,
      count: totalStats._count,
      pending: byStatus['PENDING'] || { count: 0, total: 0 },
      approved: byStatus['APPROVED'] || { count: 0, total: 0 },
      paid: byStatus['PAID'] || { count: 0, total: 0 },
      disputed: byStatus['DISPUTED'] || { count: 0, total: 0 },
    };
  }
}
