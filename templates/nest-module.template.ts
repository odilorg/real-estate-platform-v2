/**
 * NestJS Module Template
 *
 * Usage:
 * 1. Copy this folder structure to apps/api/src/modules/{feature}/
 * 2. Replace {Feature} with your feature name (e.g., Properties)
 * 3. Replace {feature} with lowercase (e.g., properties)
 * 4. Update imports and implement logic
 */

// ============================================
// FILE: {feature}.module.ts
// ============================================

import { Module } from '@nestjs/common';
import { {Feature}Controller } from './{feature}.controller';
import { {Feature}Service } from './{feature}.service';

@Module({
  controllers: [{Feature}Controller],
  providers: [{Feature}Service],
  exports: [{Feature}Service],
})
export class {Feature}Module {}


// ============================================
// FILE: {feature}.controller.ts
// ============================================

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { {Feature}Service } from './{feature}.service';
// Import DTOs from @repo/shared

@Controller('{feature}')
export class {Feature}Controller {
  constructor(private readonly {feature}Service: {Feature}Service) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.{feature}Service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.{feature}Service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: any, @CurrentUser() user: any) {
    return this.{feature}Service.create(dto, user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.{feature}Service.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.{feature}Service.remove(id, user.id);
  }
}


// ============================================
// FILE: {feature}.service.ts
// ============================================

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@repo/database';

@Injectable()
export class {Feature}Service {
  async findAll(query: any) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.{feature}.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.{feature}.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const item = await prisma.{feature}.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('{Feature} not found');
    }

    return item;
  }

  async create(dto: any, userId: string) {
    return prisma.{feature}.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async update(id: string, dto: any, userId: string) {
    const item = await this.findOne(id);

    if (item.userId !== userId) {
      throw new ForbiddenException('Not authorized to update this {feature}');
    }

    return prisma.{feature}.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    const item = await this.findOne(id);

    if (item.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this {feature}');
    }

    return prisma.{feature}.delete({
      where: { id },
    });
  }
}
