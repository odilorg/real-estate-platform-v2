import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalProperties,
      activeProperties,
      pendingProperties,
      totalViewings,
      totalFavorites,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.property.count(),
      this.prisma.property.count({ where: { status: 'ACTIVE' } }),
      this.prisma.property.count({ where: { status: 'PENDING' } }),
      this.prisma.viewing.count(),
      this.prisma.favorite.count(),
    ]);

    // Get registrations over time (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRegistrations = await this.prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    const recentProperties = await this.prisma.property.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    return {
      totalUsers,
      totalProperties,
      activeProperties,
      pendingProperties,
      totalViewings,
      totalFavorites,
      recentRegistrations,
      recentProperties,
    };
  }

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          banned: true,
          banReason: true,
          createdAt: true,
          _count: {
            select: { properties: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async banUser(adminId: string, userId: string, reason: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Cannot ban admin users');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { banned: true, banReason: reason },
    });

    await this.logAction(adminId, 'BAN_USER', 'user', userId, { reason });

    return { success: true };
  }

  async unbanUser(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { banned: false, banReason: null },
    });

    await this.logAction(adminId, 'UNBAN_USER', 'user', userId, {});

    return { success: true };
  }

  async updateUserRole(adminId: string, userId: string, role: 'USER' | 'AGENT' | 'ADMIN') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    await this.logAction(adminId, 'UPDATE_ROLE', 'user', userId, { newRole: role });

    return { success: true };
  }

  async getProperties(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as 'ACTIVE' | 'PENDING' | 'SOLD' | 'RENTED' } : {};

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          images: {
            take: 1,
            where: { isPrimary: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      items: properties,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async approveProperty(adminId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    await this.prisma.property.update({
      where: { id: propertyId },
      data: { status: 'ACTIVE' },
    });

    await this.logAction(adminId, 'APPROVE_PROPERTY', 'property', propertyId, {});

    return { success: true };
  }

  async rejectProperty(adminId: string, propertyId: string, reason: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    await this.prisma.property.update({
      where: { id: propertyId },
      data: { status: 'INACTIVE' },
    });

    await this.logAction(adminId, 'REJECT_PROPERTY', 'property', propertyId, { reason });

    return { success: true };
  }

  async featureProperty(adminId: string, propertyId: string, featured: boolean) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    await this.prisma.property.update({
      where: { id: propertyId },
      data: { featured },
    });

    await this.logAction(adminId, featured ? 'FEATURE_PROPERTY' : 'UNFEATURE_PROPERTY', 'property', propertyId, {});

    return { success: true };
  }

  async deleteProperty(adminId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    await this.prisma.property.delete({
      where: { id: propertyId },
    });

    await this.logAction(adminId, 'DELETE_PROPERTY', 'property', propertyId, {});

    return { success: true };
  }

  async getAdminLogs(page = 1, limit = 50): Promise<{
    items: Array<Record<string, unknown>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.adminLog.findMany({
        include: {
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.adminLog.count(),
    ]);

    return {
      items: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async logAction(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    details: Record<string, unknown>,
  ) {
    await this.prisma.adminLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        details: details as Record<string, never>,
      },
    });
  }

  // Agent Management Methods
  async getAgents(
    page = 1,
    limit = 20,
    search?: string,
    verified?: boolean,
    superAgent?: boolean,
  ) {
    const skip = (page - 1) * limit;

    const where: {
      verified?: boolean;
      superAgent?: boolean;
      OR?: Array<{ firstName?: { contains: string; mode: 'insensitive' }; lastName?: { contains: string; mode: 'insensitive' }; email?: { contains: string; mode: 'insensitive' } }>;
    } = {};

    if (verified !== undefined) where.verified = verified;
    if (superAgent !== undefined) where.superAgent = superAgent;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [agents, total] = await Promise.all([
      this.prisma.agent.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              firstName: true,
              lastName: true,
            },
          },
          agency: {
            select: {
              id: true,
              name: true,
              verified: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: [
          { superAgent: 'desc' },
          { verified: 'desc' },
          { rating: 'desc' },
        ],
      }),
      this.prisma.agent.count({ where }),
    ]);

    return {
      agents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createAgent(adminId: string, data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    agencyId?: string;
    bio?: string;
    specializations?: string[];
    languages?: string[];
  }) {
    // Check if user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ForbiddenException('User with this email already exists');
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user and agent in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user with AGENT role
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: 'AGENT',
        },
      });

      // Create agent profile
      const agent = await tx.agent.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          agencyId: data.agencyId,
          bio: data.bio,
          specializations: data.specializations || [],
          languages: data.languages || [],
          verified: false,
          superAgent: false,
          rating: 0,
          reviewCount: 0,
          yearsExperience: 0,
          totalDeals: 0,
          showPhone: true,
          showEmail: true,
        },
      });

      return { user, agent };
    });

    // Log the action
    await this.logAction(adminId, 'CREATE_AGENT', 'agent', result.agent.id, {
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
    });

    return result.agent;
  }

  async verifyAgent(adminId: string, agentId: string, verified: boolean) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const updatedAgent = await this.prisma.agent.update({
      where: { id: agentId },
      data: { verified },
    });

    await this.logAction(adminId, verified ? 'VERIFY_AGENT' : 'UNVERIFY_AGENT', 'agent', agentId, {
      verified,
    });

    return updatedAgent;
  }

  async setSuperAgent(adminId: string, agentId: string, superAgent: boolean) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const updatedAgent = await this.prisma.agent.update({
      where: { id: agentId },
      data: { superAgent },
    });

    await this.logAction(adminId, superAgent ? 'SET_SUPER_AGENT' : 'UNSET_SUPER_AGENT', 'agent', agentId, {
      superAgent,
    });

    return updatedAgent;
  }

  async assignAgency(adminId: string, agentId: string, agencyId: string | null) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // If agencyId is provided, verify it exists
    if (agencyId) {
      const agency = await this.prisma.agency.findUnique({
        where: { id: agencyId },
      });

      if (!agency) {
        throw new NotFoundException('Agency not found');
      }
    }

    const updatedAgent = await this.prisma.agent.update({
      where: { id: agentId },
      data: { agencyId },
    });

    await this.logAction(adminId, 'ASSIGN_AGENCY', 'agent', agentId, {
      agencyId,
    });

    return updatedAgent;
  }

  async deleteAgent(adminId: string, agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        user: true,
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete agent profile
      await tx.agent.delete({
        where: { id: agentId },
      });

      // Downgrade user role to USER
      await tx.user.update({
        where: { id: agent.userId },
        data: { role: 'USER' },
      });
    });

    await this.logAction(adminId, 'DELETE_AGENT', 'agent', agentId, {
      userId: agent.userId,
      firstName: agent.firstName,
      lastName: agent.lastName,
    });

    return { message: 'Agent deleted successfully' };
  }
}
