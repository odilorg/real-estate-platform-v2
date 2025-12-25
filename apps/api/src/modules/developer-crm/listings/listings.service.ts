import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateListingDto, UpdateListingDto, DeactivateListingDto, MarkSoldDto } from './dto/listing.dto';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new listing for an individual owner
   */
  async create(developerId: string, memberId: string, createListingDto: CreateListingDto): Promise<any> {
    // Get member's userId to create property
    const member = await this.prisma.developerMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!member) {
      throw new ForbiddenException('Member not found');
    }

    // Create property with listing context
    const property = await this.prisma.property.create({
      data: {
        // Basic info
        userId: member.userId,
        title: createListingDto.title,
        description: createListingDto.description,
        price: createListingDto.price,
        currency: createListingDto.currency as any,
        propertyType: createListingDto.propertyType as any,
        listingType: createListingDto.listingType as any,
        marketType: createListingDto.marketType as any,
        status: 'ACTIVE',

        // Location
        address: createListingDto.address,
        city: createListingDto.city,
        district: createListingDto.district,
        mahalla: createListingDto.mahalla,
        latitude: createListingDto.latitude,
        longitude: createListingDto.longitude,
        country: 'Uzbekistan',

        // Property details
        bedrooms: createListingDto.bedrooms,
        bathrooms: createListingDto.bathrooms,
        area: createListingDto.area,
        floor: createListingDto.floor,
        totalFloors: createListingDto.totalFloors,
        buildingType: createListingDto.buildingType as any,
        buildingClass: createListingDto.buildingClass as any,
        renovation: createListingDto.renovation as any,
        yearBuilt: createListingDto.yearBuilt,

        // Listing context
        listingSource: 'INDIVIDUAL_OWNER',
        listedById: memberId,
        listingDeveloperId: developerId,

        // Individual owner details
        ownerName: createListingDto.ownerName,
        ownerPhone: createListingDto.ownerPhone,
        ownerIsAnonymous: createListingDto.ownerIsAnonymous || false,
      },
    });

    // Create property images if provided
    if (createListingDto.images && createListingDto.images.length > 0) {
      await this.prisma.propertyImage.createMany({
        data: createListingDto.images.map((url, index) => ({
          propertyId: property.id,
          url,
          order: index,
          isPrimary: index === 0,
        })),
      });
    }

    // Create property amenities if provided
    if (createListingDto.amenities && createListingDto.amenities.length > 0) {
      await this.prisma.propertyAmenity.createMany({
        data: createListingDto.amenities.map((amenity) => ({
          propertyId: property.id,
          amenity,
        })),
      });
    }

    // Log activity
    await this.prisma.developerActivity.create({
      data: {
        title: "Listing Activity",
        developerId,
        memberId,
        type: 'NOTE',
        metadata: {
      
          action: 'listing_created',
          title: property.title,
          propertyType: property.propertyType,
          price: property.price,
        },
      },
    });

    return this.findOne(developerId, memberId, null, property.id);
  }

  /**
   * Get all listings for agency (or specific agent if role=AGENT)
   */
  async findAll(developerId: string, memberId: string, role: string, query: any): Promise<any> {
    const { page = 1, limit = 20, status, propertyType, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      listingDeveloperId: developerId,
      listingSource: 'INDIVIDUAL_OWNER',
    };

    if (role === 'AGENT') {
      where.listedById = memberId;
    }

    if (status) {
      where.status = status;
    }

    if (propertyType) {
      where.propertyType = propertyType;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [listings, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          listedBy: {
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
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      data: listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single listing by ID
   */
  async findOne(developerId: string, memberId: string, role: string | null, id: string): Promise<any> {
    const listing = await this.prisma.property.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        amenities: true,
        listedBy: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        listingAgency: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.listingDeveloperId !== developerId) {
      throw new ForbiddenException('You can only view your own agency listings');
    }

    if (role === 'AGENT' && listing.listedById !== memberId) {
      throw new ForbiddenException('You can only view your own listings');
    }

    return listing;
  }

  /**
   * Update a listing
   */
  async update(
    developerId: string,
    memberId: string,
    role: string,
    id: string,
    updateListingDto: UpdateListingDto,
  ): Promise<any> {
    const listing = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.listingDeveloperId !== developerId) {
      throw new ForbiddenException('You can only update your own agency listings');
    }

    if (role === 'AGENT' && listing.listedById !== memberId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    await this.prisma.property.update({
      where: { id },
      data: {
        title: updateListingDto.title,
        description: updateListingDto.description,
        price: updateListingDto.price,
        status: updateListingDto.status as any,
        ownerName: updateListingDto.ownerName,
        ownerPhone: updateListingDto.ownerPhone,
        ownerIsAnonymous: updateListingDto.ownerIsAnonymous,
        bedrooms: updateListingDto.bedrooms,
        bathrooms: updateListingDto.bathrooms,
        area: updateListingDto.area,
      },
    });

    await this.prisma.developerActivity.create({
      data: {
        title: "Listing Activity",
        developerId,
        memberId,
        type: 'NOTE',
        metadata: {
      
          action: 'listing_updated',
          listingId: id,
          changes: Object.keys(updateListingDto),
        },
      },
    });

    return this.findOne(developerId, memberId, role, id);
  }

  /**
   * Deactivate a listing
   */
  async deactivate(
    developerId: string,
    memberId: string,
    role: string,
    id: string,
    deactivateListingDto: DeactivateListingDto,
  ): Promise<any> {
    const listing = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.listingDeveloperId !== developerId) {
      throw new ForbiddenException('You can only deactivate your own agency listings');
    }

    if (role === 'AGENT' && listing.listedById !== memberId) {
      throw new ForbiddenException('You can only deactivate your own listings');
    }

    await this.prisma.property.update({
      where: { id },
      data: {
        status: 'INACTIVE',
      },
    });

    await this.prisma.developerActivity.create({
      data: {
        title: "Listing Activity",
        developerId,
        memberId,
        type: 'NOTE',
        metadata: {
      
          action: 'listing_deactivated',
          listingId: id,
          reason: deactivateListingDto.reason,
        },
      },
    });

    return { message: 'Listing deactivated successfully' };
  }

  /**
   * Mark listing as sold
   */
  async markSold(
    developerId: string,
    memberId: string,
    role: string,
    id: string,
    markSoldDto: MarkSoldDto,
  ): Promise<any> {
    const listing = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.listingDeveloperId !== developerId) {
      throw new ForbiddenException('You can only mark your own agency listings as sold');
    }

    if (role === 'AGENT' && listing.listedById !== memberId) {
      throw new ForbiddenException('You can only mark your own listings as sold');
    }

    await this.prisma.property.update({
      where: { id },
      data: {
        status: listing.listingType === 'SALE' ? 'SOLD' : 'RENTED',
      },
    });

    await this.prisma.developerActivity.create({
      data: {
        title: "Listing Activity",
        developerId,
        memberId,
        type: 'NOTE',
        metadata: {
      
          action: listing.listingType === 'SALE' ? 'listing_sold' : 'listing_rented',
          listingId: id,
          soldPrice: markSoldDto.soldPrice,
          soldDate: markSoldDto.soldDate,
          buyerName: markSoldDto.buyerName,
          notes: markSoldDto.notes,
        },
      },
    });

    return { message: `Listing marked as ${listing.listingType === 'SALE' ? 'sold' : 'rented'} successfully` };
  }

  /**
   * Delete a listing
   */
  async delete(developerId: string, memberId: string, role: string, id: string): Promise<any> {
    const listing = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.listingDeveloperId !== developerId) {
      throw new ForbiddenException('You can only delete your own agency listings');
    }

    if (role === 'AGENT' && listing.listedById !== memberId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    await this.prisma.property.delete({
      where: { id },
    });

    await this.prisma.developerActivity.create({
      data: {
        title: "Listing Activity",
        developerId,
        memberId,
        type: 'NOTE',
        metadata: {
      
          action: 'listing_deleted',
          listingId: id,
          title: listing.title,
        },
      },
    });

    return { message: 'Listing deleted successfully' };
  }
}
