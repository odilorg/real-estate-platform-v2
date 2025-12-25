import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

/**
 * AgencyOwnershipGuard - Ensures user belongs to an agency and has access to it
 *
 * This guard:
 * 1. Verifies user is authenticated (requires JwtAuthGuard to run first)
 * 2. Checks if user is a member of any agency
 * 3. Attaches developerId to request for use in controllers/services
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
 */
@Injectable()
export class AgencyOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Find user's agency membership
    const membership = await this.prisma.developerMember.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
      select: {
        id: true,
        developerId: true,
        role: true,
        permissions: true,
        developer: {
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

    // Check if developer CRM subscription is active
    const crmSettings = membership.developer.crmSettings;
    if (crmSettings) {
      const now = new Date();
      if (crmSettings.subscriptionEnd && crmSettings.subscriptionEnd < now) {
        throw new ForbiddenException('Developer CRM subscription has expired');
      }
    }

    // Attach agency context to request for use in controllers
    request.user.developerId = membership.developerId;
    request.user.developerMemberId = membership.id;
    request.user.developerRole = membership.role;
    request.user.developerPermissions = membership.permissions;
    request.user.developer = membership.developer;

    return true;
  }
}
