import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

/**
 * AgencyOwnershipGuard - Ensures user belongs to an agency and has access to it
 *
 * This guard:
 * 1. Verifies user is authenticated (requires JwtAuthGuard to run first)
 * 2. Checks if user is a member of any agency
 * 3. Attaches agencyId to request for use in controllers/services
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
 */
@Injectable()
export class AgencyOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Find user's agency membership
    const membership = await this.prisma.agencyMember.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
      select: {
        id: true,
        agencyId: true,
        role: true,
        permissions: true,
        agency: {
          select: {
            id: true,
            name: true,
            crmSettings: {
              select: {
                subscriptionTier: true,
                subscriptionEnd: true,
              },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of any agency');
    }

    // Check if agency CRM subscription is active
    const crmSettings = membership.agency.crmSettings;
    if (crmSettings) {
      const now = new Date();
      if (crmSettings.subscriptionEnd && crmSettings.subscriptionEnd < now) {
        throw new ForbiddenException('Agency CRM subscription has expired');
      }
    }

    // Attach agency context to request for use in controllers
    request.user.agencyId = membership.agencyId;
    request.user.agencyMemberId = membership.id;
    request.user.agencyRole = membership.role;
    request.user.agencyPermissions = membership.permissions;
    request.user.agency = membership.agency;

    return true;
  }
}
