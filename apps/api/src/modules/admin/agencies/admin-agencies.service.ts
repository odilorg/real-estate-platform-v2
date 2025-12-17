import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminAgenciesService {
  constructor(private prisma: PrismaService) {}

  async createAgency(dto: CreateAgencyDto): Promise<any> {
    // Check if agency with same name exists
    const existingAgency = await this.prisma.agency.findFirst({
      where: { name: dto.name },
    });

    if (existingAgency) {
      throw new ConflictException('Agency with this name already exists');
    }

    // Generate slug from name
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // If owner info provided, create user + agency + member in transaction
    if (dto.owner) {
      // Check if user email exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.owner.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const passwordHash = await bcrypt.hash(dto.owner.password, 10);

      // Create agency + owner user + agency member in transaction
      return this.prisma.$transaction(async (tx) => {
        // Create agency
        const agency = await tx.agency.create({
          data: {
            name: dto.name,
            slug,
            description: dto.description,
            phone: dto.phone,
            email: dto.email,
            website: dto.website,
            address: dto.address,
          },
        });

        // Create owner user
        const user = await tx.user.create({
          data: {
            email: dto.owner!.email,
            passwordHash,
            firstName: dto.owner!.firstName,
            lastName: dto.owner!.lastName,
            phone: dto.owner!.phone,
          },
        });

        // Create agency member with OWNER role
        const member = await tx.agencyMember.create({
          data: {
            agencyId: agency.id,
            userId: user.id,
            role: 'OWNER',
            agentType: 'GENERAL',
            isActive: true,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        });

        return {
          agency,
          owner: member,
        };
      });
    }

    // If no owner provided, just create agency
    const agency = await this.prisma.agency.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        phone: dto.phone,
        email: dto.email,
        website: dto.website,
        address: dto.address,
      },
    });

    return { agency, owner: null };
  }

  async findAll(skip = 0, take = 20): Promise<any> {
    const [agencies, total] = await Promise.all([
      this.prisma.agency.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              members: true,
              agents: true,
              leads: true,
            },
          },
        },
      }),
      this.prisma.agency.count(),
    ]);

    return { agencies, total, skip, take };
  }

  async findOne(id: string): Promise<any> {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            agents: true,
            leads: true,
          },
        },
      },
    });

    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    return agency;
  }

  async update(id: string, dto: Partial<CreateAgencyDto>): Promise<any> {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
    });

    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    return this.prisma.agency.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        phone: dto.phone,
        email: dto.email,
        website: dto.website,
        address: dto.address,
      },
    });
  }

  async remove(id: string): Promise<any> {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
    });

    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    // Delete the agency (cascade will remove related members, leads, etc.)
    return this.prisma.agency.delete({
      where: { id },
    });
  }
}
