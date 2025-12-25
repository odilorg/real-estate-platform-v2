import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AgencyRole } from '@repo/database';

/**
 * AgencyPermissionGuard - Role-based access control for developer CRM
 *
 * This guard checks if user has required role(s) to access a resource
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, AgencyOwnershipGuard, AgencyPermissionGuard)
 * @RequireAgencyRoles(AgencyRole.OWNER, AgencyRole.ADMIN)
 * async deleteAgent() { ... }
 */

export const REQUIRE_AGENCY_ROLES_KEY = 'requireAgencyRoles';
export const RequireAgencyRoles = (...roles: AgencyRole[]) =>
  SetMetadata(REQUIRE_AGENCY_ROLES_KEY, roles);

@Injectable()
export class AgencyPermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AgencyRole[]>(
      REQUIRE_AGENCY_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.agencyRole) {
      throw new ForbiddenException('Agency role not found');
    }

    const hasRole = requiredRoles.includes(user.agencyRole);

    if (!hasRole) {
      throw new ForbiddenException(
        `This action requires one of the following roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}

/**
 * Role hierarchy (from highest to lowest permissions):
 * OWNER > ADMIN > SENIOR_AGENT > AGENT > COORDINATOR
 *
 * Common role combinations:
 * - Management: OWNER, ADMIN
 * - All Agents: OWNER, ADMIN, SENIOR_AGENT, AGENT
 * - Support Staff: COORDINATOR
 */
export const ROLE_MANAGEMENT = [AgencyRole.OWNER, AgencyRole.ADMIN];
export const ROLE_ALL_AGENTS = [
  AgencyRole.OWNER,
  AgencyRole.ADMIN,
  AgencyRole.SENIOR_AGENT,
  AgencyRole.AGENT,
];
export const ROLE_OWNER_ONLY = [AgencyRole.OWNER];
