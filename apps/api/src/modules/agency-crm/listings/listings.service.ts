import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all listings (properties) created by agency members
   */
  async findAll(agencyId: string, memberId?: string) {
    // Get all agency members
    const members = await this.prisma.agencyMember.findMany({
      where: { agencyId },
      select: { userId: true },
    });

    const memberUserIds = members.map((m: any) => m.userId);

    // Find all properties created by these members
    return this.prisma.property.findMany({
      where: {
        userId: { in: memberUserIds },
        ...(memberId && { userId: memberId }), // Filter by specific member if provided
      },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a single listing by ID
   */
  async findOne(agencyId: string, listingId: string) {
    const members = await this.prisma.agencyMember.findMany({
      where: { agencyId },
      select: { userId: true },
    });

    const memberUserIds = members.map((m: any) => m.userId);

    const listing = await this.prisma.property.findUnique({
      where: { id: listingId },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        amenities: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Verify listing belongs to an agency member
    if (!memberUserIds.includes(listing.userId)) {
      throw new ForbiddenException('Listing does not belong to this agency');
    }

    return listing;
  }

  /**
   * Create a new listing (property)
   */
  async create(userId: string, agencyId: string, data: any) {
    // Verify user is an agency member
    const member = await this.prisma.agencyMember.findFirst({
      where: {
        agencyId,
        userId,
        isActive: true,
      },
    });

    if (!member) {
      throw new ForbiddenException('User is not a member of this agency');
    }

    // Create property
    return this.prisma.property.create({
      data: {
        ...data,
        userId,
        amenities: data.amenities
          ? {
              create: data.amenities.map((amenity: string) => ({ amenity })),
            }
          : undefined,
      },
      include: {
        images: true,
        amenities: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Update a listing
   */
  async update(userId: string, agencyId: string, listingId: string, data: any) {
    const listing = await this.prisma.property.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Verify user owns this listing
    if (listing.userId !== userId) {
      throw new ForbiddenException('You do not own this listing');
    }

    // Verify user is still an agency member
    const member = await this.prisma.agencyMember.findFirst({
      where: {
        agencyId,
        userId,
        isActive: true,
      },
    });

    if (!member) {
      throw new ForbiddenException('User is not a member of this agency');
    }

    // Update amenities if provided
    if (data.amenities) {
      await this.prisma.propertyAmenity.deleteMany({
        where: { propertyId: listingId },
      });

      await this.prisma.propertyAmenity.createMany({
        data: data.amenities.map((amenity: string) => ({
          propertyId: listingId,
          amenity,
        })),
      });
    }

    const { amenities, ...updateData } = data;

    return this.prisma.property.update({
      where: { id: listingId },
      data: updateData,
      include: {
        images: true,
        amenities: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Delete a listing
   */
  async remove(userId: string, _agencyId: string, listingId: string) {
    const listing = await this.prisma.property.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Verify user owns this listing
    if (listing.userId !== userId) {
      throw new ForbiddenException('You do not own this listing');
    }

    await this.prisma.property.delete({
      where: { id: listingId },
    });

    return { message: 'Listing deleted successfully' };
  }

  /**
   * Mark listing as sold
   */
  async markSold(
    userId: string,
    _agencyId: string,
    listingId: string,
    _soldPrice: number,
    _soldDate: Date,
  ) {
    const listing = await this.prisma.property.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Verify user owns this listing
    if (listing.userId !== userId) {
      throw new ForbiddenException('You do not own this listing');
    }

    return this.prisma.property.update({
      where: { id: listingId },
      data: {
        status: 'SOLD',
      },
      include: {
        images: true,
        amenities: true,
      },
    });
  }
}
