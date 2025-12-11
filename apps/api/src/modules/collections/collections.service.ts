import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
  AddPropertyToCollectionDto,
} from '@repo/shared';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCollectionDto) {
    return this.prisma.collection.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        color: dto.color,
        icon: dto.icon,
      },
      include: {
        properties: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                price: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.collection.findMany({
      where: { userId },
      include: {
        _count: {
          select: { properties: true },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string, userId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id, userId },
      include: {
        properties: {
          include: {
            property: {
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
            },
          },
          orderBy: { addedAt: 'desc' },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return collection;
  }

  async update(id: string, userId: string, dto: UpdateCollectionDto) {
    // Verify ownership
    const collection = await this.prisma.collection.findFirst({
      where: { id, userId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.isDefault && dto.name) {
      throw new ForbiddenException('Cannot rename default collection');
    }

    return this.prisma.collection.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, userId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id, userId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.isDefault) {
      throw new ForbiddenException('Cannot delete default collection');
    }

    await this.prisma.collection.delete({
      where: { id },
    });

    return { message: 'Collection deleted successfully' };
  }

  async addProperty(
    collectionId: string,
    userId: string,
    dto: AddPropertyToCollectionDto,
  ) {
    // Verify collection ownership
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    // Verify property exists
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Check if already exists
    const existing = await this.prisma.collectionProperty.findFirst({
      where: {
        collectionId,
        propertyId: dto.propertyId,
      },
    });

    if (existing) {
      // Update notes if provided
      if (dto.notes !== undefined) {
        return this.prisma.collectionProperty.update({
          where: { id: existing.id },
          data: { notes: dto.notes },
        });
      }
      return existing;
    }

    return this.prisma.collectionProperty.create({
      data: {
        collectionId,
        propertyId: dto.propertyId,
        notes: dto.notes,
      },
    });
  }

  async removeProperty(
    collectionId: string,
    propertyId: string,
    userId: string,
  ) {
    // Verify collection ownership
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    const collectionProperty = await this.prisma.collectionProperty.findFirst({
      where: {
        collectionId,
        propertyId,
      },
    });

    if (!collectionProperty) {
      throw new NotFoundException('Property not in collection');
    }

    await this.prisma.collectionProperty.delete({
      where: { id: collectionProperty.id },
    });

    return { message: 'Property removed from collection' };
  }

  async getOrCreateDefaultCollection(userId: string) {
    let defaultCollection = await this.prisma.collection.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    if (!defaultCollection) {
      defaultCollection = await this.prisma.collection.create({
        data: {
          userId,
          name: 'Избранное',
          isDefault: true,
        },
      });
    }

    return defaultCollection;
  }
}
