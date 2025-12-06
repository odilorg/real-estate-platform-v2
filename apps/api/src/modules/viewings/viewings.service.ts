import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';

@Injectable()
export class ViewingsService {
  constructor(private prisma: PrismaService) {}

  async requestViewing(
    requesterId: string,
    propertyId: string,
    data: { date: Date; time: string; message?: string },
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { userId: true, title: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.userId === requesterId) {
      throw new BadRequestException('Cannot request viewing for your own property');
    }

    // Check for existing pending viewing
    const existingViewing = await this.prisma.viewing.findFirst({
      where: {
        propertyId,
        requesterId,
        status: 'PENDING',
      },
    });

    if (existingViewing) {
      throw new BadRequestException('You already have a pending viewing request for this property');
    }

    return this.prisma.viewing.create({
      data: {
        propertyId,
        requesterId,
        ownerId: property.userId,
        date: data.date,
        time: data.time,
        message: data.message,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
          },
        },
      },
    });
  }

  async getMyViewingRequests(userId: string) {
    return this.prisma.viewing.findMany({
      where: { requesterId: userId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            images: {
              take: 1,
              where: { isPrimary: true },
            },
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPropertyViewingRequests(userId: string) {
    return this.prisma.viewing.findMany({
      where: { ownerId: userId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respondToViewing(
    viewingId: string,
    ownerId: string,
    status: 'CONFIRMED' | 'CANCELLED',
    notes?: string,
  ) {
    const viewing = await this.prisma.viewing.findUnique({
      where: { id: viewingId },
    });

    if (!viewing) {
      throw new NotFoundException('Viewing not found');
    }

    if (viewing.ownerId !== ownerId) {
      throw new ForbiddenException('Access denied');
    }

    if (viewing.status !== 'PENDING') {
      throw new BadRequestException('Viewing has already been responded to');
    }

    return this.prisma.viewing.update({
      where: { id: viewingId },
      data: { status, notes },
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async cancelViewing(viewingId: string, userId: string) {
    const viewing = await this.prisma.viewing.findUnique({
      where: { id: viewingId },
    });

    if (!viewing) {
      throw new NotFoundException('Viewing not found');
    }

    if (viewing.requesterId !== userId && viewing.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (viewing.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel completed viewing');
    }

    return this.prisma.viewing.update({
      where: { id: viewingId },
      data: { status: 'CANCELLED' },
    });
  }

  async completeViewing(viewingId: string, ownerId: string) {
    const viewing = await this.prisma.viewing.findUnique({
      where: { id: viewingId },
    });

    if (!viewing) {
      throw new NotFoundException('Viewing not found');
    }

    if (viewing.ownerId !== ownerId) {
      throw new ForbiddenException('Access denied');
    }

    if (viewing.status !== 'CONFIRMED') {
      throw new BadRequestException('Only confirmed viewings can be completed');
    }

    return this.prisma.viewing.update({
      where: { id: viewingId },
      data: { status: 'COMPLETED' },
    });
  }
}
