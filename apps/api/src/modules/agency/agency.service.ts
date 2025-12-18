import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateAgencyProfileDto } from './dto/update-agency-profile.dto';

@Injectable()
export class AgencyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get current user's agency profile
   */
  async getMyAgency(userId: string): Promise<any> {
    // Find agency where user is a member
    const member = await this.prisma.agencyMember.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        agency: {
          include: {
            _count: {
              select: {
                members: true,
                agents: true,
                leads: true,
              },
            },
          },
        },
      },
    });

    if (!member || !member.agency) {
      throw new NotFoundException('You are not associated with any agency');
    }

    return {
      agency: member.agency,
      role: member.role,
    };
  }

  /**
   * Get agency statistics
   */
  async getAgencyStats(userId: string): Promise<any> {
    const { agency } = await this.getMyAgency(userId);

    const [totalLeads, activeLeads, totalMembers, activeMembers] =
      await Promise.all([
        this.prisma.agencyLead.count({
          where: { agencyId: agency.id },
        }),
        this.prisma.agencyLead.count({
          where: {
            agencyId: agency.id,
            status: { in: ['NEW', 'CONTACTED', 'QUALIFIED'] },
          },
        }),
        this.prisma.agencyMember.count({
          where: { agencyId: agency.id },
        }),
        this.prisma.agencyMember.count({
          where: { agencyId: agency.id, isActive: true },
        }),
      ]);

    return {
      leads: {
        total: totalLeads,
        active: activeLeads,
      },
      members: {
        total: totalMembers,
        active: activeMembers,
      },
    };
  }

  /**
   * Update agency profile
   */
  async updateAgencyProfile(
    userId: string,
    dto: UpdateAgencyProfileDto,
  ): Promise<any> {
    const { agency, role } = await this.getMyAgency(userId);

    // Only OWNER or ADMIN can update agency profile
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only agency owners or admins can update agency profile',
      );
    }

    // Update slug if name changes
    let slug = agency.slug;
    if (dto.name && dto.name !== agency.name) {
      slug = dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const updatedAgency = await this.prisma.agency.update({
      where: { id: agency.id },
      data: {
        name: dto.name,
        description: dto.description,
        phone: dto.phone,
        email: dto.email,
        website: dto.website,
        address: dto.address,
        logo: dto.logo,
        slug,
      },
      include: {
        _count: {
          select: {
            members: true,
            agents: true,
            leads: true,
          },
        },
      },
    });

    return updatedAgency;
  }

  /**
   * Upload agency logo
   */
  async uploadLogo(userId: string, logoUrl: string): Promise<any> {
    const { agency, role } = await this.getMyAgency(userId);

    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only agency owners or admins can update agency logo',
      );
    }

    const updatedAgency = await this.prisma.agency.update({
      where: { id: agency.id },
      data: { logo: logoUrl },
    });

    return { logo: updatedAgency.logo };
  }
}
