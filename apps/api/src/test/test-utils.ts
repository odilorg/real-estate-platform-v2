import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/prisma/prisma.service';
import { faker } from '@faker-js/faker';
import {
  PropertyType,
  ListingType,
  PropertyStatus,
  Currency,
} from '@repo/database';

/**
 * Mock ElasticsearchService for testing
 */
export const mockElasticsearchService = {
  isElasticsearchEnabled: jest.fn(),
  createIndex: jest.fn(),
  indexDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
  bulkIndex: jest.fn(),
  search: jest.fn(),
  indexExists: jest.fn(),
  deleteIndex: jest.fn(),
  getClient: jest.fn(),
};

/**
 * Mock Prisma Service for testing
 */
export const mockPrismaService = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  property: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  savedSearch: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  favorite: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  message: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  conversation: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  review: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
  viewing: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  agent: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  agency: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  propertyImage: {
    create: jest.fn(),
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  propertyAmenity: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  priceHistory: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  propertyAnalytics: {
    create: jest.fn(),
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
  $transaction: jest.fn(),
};

/**
 * Test data factories
 */
export const TestFactories = {
  createUser: (overrides = {}) => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    phone: faker.phone.number(),
    role: 'USER' as const,
    verified: true,
    banned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  createProperty: (overrides = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraphs(2),
    propertyType: PropertyType.APARTMENT,
    listingType: ListingType.SALE,
    status: PropertyStatus.ACTIVE,
    price: faker.number.int({ min: 50000, max: 500000 }),
    currency: Currency.YE,
    priceUsd: faker.number.int({ min: 50000, max: 500000 }),
    city: 'Ташкент',
    district: 'Юнусабад',
    address: faker.location.streetAddress(),
    area: faker.number.int({ min: 40, max: 200 }),
    rooms: faker.number.int({ min: 1, max: 5 }),
    bedrooms: faker.number.int({ min: 1, max: 4 }),
    bathrooms: faker.number.int({ min: 1, max: 3 }),
    floor: faker.number.int({ min: 1, max: 20 }),
    totalFloors: faker.number.int({ min: 5, max: 25 }),
    latitude: 41.2995,
    longitude: 69.2401,
    views: 0,
    featured: false,
    verified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  createSavedSearch: (overrides = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    name: faker.lorem.words(3),
    filters: {
      city: 'Ташкент',
      propertyType: PropertyType.APARTMENT,
      minPrice: 50000,
      maxPrice: 200000,
    },
    notificationsEnabled: true,
    lastNotifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  createReview: (overrides = {}) => ({
    id: faker.string.uuid(),
    propertyId: faker.string.uuid(),
    userId: faker.string.uuid(),
    rating: faker.number.int({ min: 1, max: 5 }),
    comment: faker.lorem.paragraph(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  createAgent: (overrides = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    phone: faker.phone.number(),
    email: faker.internet.email(),
    bio: faker.lorem.paragraph(),
    photo: faker.image.avatar(),
    whatsapp: faker.phone.number(),
    telegram: `@${faker.internet.username()}`,
    licenseNumber: faker.string.alphanumeric(10).toUpperCase(),
    specializations: ['Residential', 'Commercial'],
    languages: ['English', 'Uzbek'],
    areasServed: ['Ташкент', 'Самарканд'],
    yearsExperience: faker.number.int({ min: 0, max: 20 }),
    verified: false,
    superAgent: false,
    showPhone: true,
    showEmail: true,
    totalDeals: 0,
    rating: null,
    reviewCount: 0,
    agencyId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  createAgency: (overrides = {}) => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
    logo: faker.image.url(),
    description: faker.lorem.paragraph(),
    website: faker.internet.url(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(),
    city: 'Ташкент',
    verified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  createMessage: (overrides = {}) => ({
    id: faker.string.uuid(),
    conversationId: faker.string.uuid(),
    senderId: faker.string.uuid(),
    content: faker.lorem.sentence(),
    read: false,
    readAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  createConversation: (overrides = {}) => ({
    id: faker.string.uuid(),
    propertyId: faker.string.uuid(),
    participant1Id: faker.string.uuid(),
    participant2Id: faker.string.uuid(),
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};

/**
 * Create a testing module with mocked dependencies
 */
export async function createTestingModule(
  providers: any[],
  mockServices: Record<string, any> = {},
): Promise<TestingModule> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ...providers,
      {
        provide: PrismaService,
        useValue: mockServices.prisma || mockPrismaService,
      },
      ...Object.entries(mockServices)
        .filter(([key]) => key !== 'prisma')
        .map(([key, value]) => ({
          provide: key,
          useValue: value,
        })),
    ],
  }).compile();

  return module;
}

/**
 * Reset all mocks
 */
export function resetMocks() {
  Object.values(mockPrismaService).forEach((service) => {
    if (typeof service === 'object') {
      Object.values(service).forEach((method) => {
        if (jest.isMockFunction(method)) {
          method.mockReset();
        }
      });
    }
  });

  // Reset ElasticsearchService mock
  Object.values(mockElasticsearchService).forEach((method) => {
    if (jest.isMockFunction(method)) {
      method.mockReset();
    }
  });
}

/**
 * Create a mock JWT token for testing
 */
export function createMockJwtToken(payload: Record<string, any> = {}) {
  return {
    sub: faker.string.uuid(),
    email: faker.internet.email(),
    role: 'USER',
    ...payload,
  };
}

/**
 * Wait for async operations (useful for WebSocket tests)
 */
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
