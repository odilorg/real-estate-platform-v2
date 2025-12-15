import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';

/**
 * Test utilities for common testing operations
 */

/**
 * Clean up database tables before/after tests
 */
export const cleanupDatabase = async (prisma: PrismaService) => {
  // Delete in order to respect foreign key constraints
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.viewing.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.propertyAmenity.deleteMany();
  await prisma.propertyPOI.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.propertyView.deleteMany();
  await prisma.propertyAnalytics.deleteMany();
  await prisma.recentlyViewed.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.property.deleteMany();
  await prisma.agentReview.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.agency.deleteMany();
  await prisma.adminLog.deleteMany();
  await prisma.user.deleteMany();
};

/**
 * Create a test user and return with JWT token
 */
export const createAuthenticatedUser = async (
  app: INestApplication,
  userOverrides?: any,
) => {
  const prisma = app.get(PrismaService);
  const jwtService = app.get(JwtService);

  // Hash password using bcrypt
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      email: `test${Date.now()}@example.com`,
      passwordHash: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      ...userOverrides,
    },
  });

  const token = jwtService.sign({ sub: user.id, email: user.email });

  return { user, token };
};

/**
 * Make an authenticated request
 */
export const authenticatedRequest = (
  app: INestApplication,
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  url: string,
  token: string,
) => {
  return request(app.getHttpServer())
    [method](url)
    .set('Authorization', `Bearer ${token}`);
};

/**
 * Create a test property
 */
export const createTestProperty = async (
  prisma: PrismaService,
  userId: string,
  overrides?: any,
) => {
  return prisma.property.create({
    data: {
      userId,
      propertyType: 'APARTMENT',
      listingType: 'SALE',
      title: 'Test Property',
      description: 'A beautiful test property for testing purposes',
      price: 100000,
      currency: 'YE',
      address: '123 Test Street',
      city: 'Ташкент',
      latitude: 41.311081,
      longitude: 69.240562,
      area: 75.5,
      status: 'ACTIVE',
      ...overrides,
    },
  });
};

/**
 * Wait for a condition to be true (useful for async operations)
 */
export const waitFor = async (
  condition: () => Promise<boolean> | boolean,
  timeout = 5000,
  interval = 100,
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
};

/**
 * Mock console methods to prevent noisy test output
 */
export const mockConsole = () => {
  const originalConsole = { ...console };

  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });
};

/**
 * Extract validation errors from response
 */
export const getValidationErrors = (response: any): Record<string, string[]> => {
  if (response.body.errors && Array.isArray(response.body.errors)) {
    const errors: Record<string, string[]> = {};
    for (const error of response.body.errors) {
      const path = error.path?.join('.') || 'unknown';
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(error.message);
    }
    return errors;
  }
  return {};
};
