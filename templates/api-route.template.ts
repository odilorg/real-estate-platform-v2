/**
 * Next.js API Route Template (if using Next.js API routes)
 *
 * Usage:
 * 1. Copy to apps/web/src/app/api/{endpoint}/route.ts
 * 2. Replace {Endpoint} with your endpoint name
 * 3. Implement handlers
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
// Import DTOs from @repo/shared

// ============================================
// GET - List or single item
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Single item
      const item = await prisma.{model}.findUnique({
        where: { id },
      });

      if (!item) {
        return NextResponse.json(
          { error: '{Model} not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(item);
    }

    // List items
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.{model}.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.{model}.count(),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('GET /{endpoint} error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Create item
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Validate with Zod DTO
    // const validated = Create{Model}Dto.parse(body);

    // TODO: Get user ID from auth
    // const userId = await getCurrentUserId(request);

    const item = await prisma.{model}.create({
      data: {
        ...body,
        // userId,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('POST /{endpoint} error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Update item
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if exists
    const existing = await prisma.{model}.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: '{Model} not found' },
        { status: 404 }
      );
    }

    // TODO: Check ownership
    // if (existing.userId !== currentUserId) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const item = await prisma.{model}.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('PUT /{endpoint} error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Remove item
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await prisma.{model}.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: '{Model} not found' },
        { status: 404 }
      );
    }

    // TODO: Check ownership

    await prisma.{model}.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /{endpoint} error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
