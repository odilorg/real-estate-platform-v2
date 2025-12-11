import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { RegisterAgentDto, UpdateAgentDto } from '@repo/shared';
import { Agent } from '@repo/database';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Register a user as an agent
   * - User must not already be an agent
   * - Updates user role to AGENT
   */
  async register(userId: string, dto: RegisterAgentDto): Promise<Agent> {
    // Check if user is already an agent
    const existingAgent = await this.prisma.agent.findUnique({
      where: { userId },
    });

    if (existingAgent) {
      throw new ConflictException('User is already registered as an agent');
    }

    // Verify agency exists if provided
    if (dto.agencyId) {
      const agency = await this.prisma.agency.findUnique({
        where: { id: dto.agencyId },
      });
      if (!agency) {
        throw new NotFoundException('Agency not found');
      }
    }

    // Create agent profile and update user role in a transaction
    const agent = await this.prisma.$transaction(async (tx) => {
      // Update user role to AGENT
      await tx.user.update({
        where: { id: userId },
        data: { role: 'AGENT' },
      });

      // Create agent profile
      return tx.agent.create({
        data: {
          userId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          email: dto.email,
          bio: dto.bio,
          photo: dto.photo,
          whatsapp: dto.whatsapp,
          telegram: dto.telegram,
          licenseNumber: dto.licenseNumber,
          specializations: dto.specializations || [],
          languages: dto.languages || [],
          areasServed: dto.areasServed || [],
          yearsExperience: dto.yearsExperience || 0,
          agencyId: dto.agencyId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          agency: true,
        },
      });
    });

    return agent;
  }

  /**
   * Get agent profile by user ID
   */
  async getByUserId(userId: string): Promise<Agent> {
    const agent = await this.prisma.agent.findUnique({
      where: { userId },
      include: {
        agency: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent profile not found');
    }

    return agent;
  }

  /**
   * Get agent profile by agent ID (public)
   */
  async getById(id: string): Promise<Agent> {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        agency: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            city: true,
            verified: true,
          },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Filter contact info based on privacy settings
    if (!agent.showPhone) {
      agent.phone = null;
    }
    if (!agent.showEmail) {
      agent.email = null;
    }

    return agent;
  }

  /**
   * Update agent profile
   */
  async update(userId: string, dto: UpdateAgentDto): Promise<Agent> {
    // Verify agent exists
    const existingAgent = await this.getByUserId(userId);

    const updatedAgent = await this.prisma.agent.update({
      where: { id: existingAgent.id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.email && { email: dto.email }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.photo !== undefined && { photo: dto.photo }),
        ...(dto.whatsapp !== undefined && { whatsapp: dto.whatsapp }),
        ...(dto.telegram !== undefined && { telegram: dto.telegram }),
        ...(dto.licenseNumber !== undefined && {
          licenseNumber: dto.licenseNumber,
        }),
        ...(dto.specializations && { specializations: dto.specializations }),
        ...(dto.languages && { languages: dto.languages }),
        ...(dto.areasServed && { areasServed: dto.areasServed }),
        ...(dto.yearsExperience !== undefined && {
          yearsExperience: dto.yearsExperience,
        }),
        ...(dto.showPhone !== undefined && { showPhone: dto.showPhone }),
        ...(dto.showEmail !== undefined && { showEmail: dto.showEmail }),
      },
      include: {
        agency: true,
      },
    });

    return updatedAgent;
  }

  /**
   * Get all agents with pagination and filters
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    city?: string;
    agencyId?: string;
    verified?: boolean;
    superAgent?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: {
      areasServed?: { has: string };
      agencyId?: string;
      verified?: boolean;
      superAgent?: boolean;
    } = {};
    if (params.city) where.areasServed = { has: params.city };
    if (params.agencyId) where.agencyId = params.agencyId;
    if (params.verified !== undefined) where.verified = params.verified;
    if (params.superAgent !== undefined) where.superAgent = params.superAgent;

    const [agents, total] = await Promise.all([
      this.prisma.agent.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { superAgent: 'desc' },
          { verified: 'desc' },
          { rating: 'desc' },
        ],
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          agency: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              verified: true,
            },
          },
        },
      }),
      this.prisma.agent.count({ where }),
    ]);

    // Filter contact info based on privacy settings
    const filteredAgents = agents.map((agent) => {
      if (!agent.showPhone) agent.phone = null;
      if (!agent.showEmail) agent.email = null;
      return agent;
    });

    return {
      agents: filteredAgents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete agent profile (admin only or self-removal)
   */
  async delete(
    userId: string,
    targetUserId: string,
  ): Promise<{ message: string }> {
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!requestingUser) {
      throw new NotFoundException('User not found');
    }

    // Only allow if admin or deleting own profile
    if (requestingUser.role !== 'ADMIN' && userId !== targetUserId) {
      throw new ForbiddenException(
        'You can only delete your own agent profile',
      );
    }

    const agent = await this.prisma.agent.findUnique({
      where: { userId: targetUserId },
    });

    if (!agent) {
      throw new NotFoundException('Agent profile not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete agent profile
      await tx.agent.delete({
        where: { id: agent.id },
      });

      // Downgrade user role to USER
      await tx.user.update({
        where: { id: targetUserId },
        data: { role: 'USER' },
      });
    });

    return { message: 'Agent profile deleted successfully' };
  }
}
