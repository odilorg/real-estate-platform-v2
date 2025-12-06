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
    const where = status ? { status: status as any } : {};

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
    items: any[];
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
    details: Record<string, any>,
  ) {
    await this.prisma.adminLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        details,
      },
    });
  }
}
