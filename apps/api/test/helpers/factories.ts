import { faker } from '@faker-js/faker';
import { PropertyType, ListingType, Currency, PropertyStatus } from '@prisma/client';

/**
 * Test data factories for generating mock data
 */

export const createMockUser = (overrides?: Partial<any>) => ({
  id: faker.string.uuid(),
  email: faker.internet.email().toLowerCase(),
  password: faker.internet.password(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  phone: faker.phone.number(),
  role: 'USER',
  verified: true,
  banned: false,
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

export const createMockProperty = (overrides?: Partial<any>) => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  propertyType: faker.helpers.arrayElement(Object.values(PropertyType)),
  listingType: faker.helpers.arrayElement(Object.values(ListingType)),
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraphs(2),
  price: faker.number.int({ min: 10000, max: 1000000 }),
  currency: faker.helpers.arrayElement(Object.values(Currency)),
  status: PropertyStatus.ACTIVE,

  // Location
  address: faker.location.streetAddress(),
  city: faker.location.city(),
  district: faker.location.state(),
  mahalla: faker.location.street(),
  latitude: parseFloat(faker.location.latitude()),
  longitude: parseFloat(faker.location.longitude()),

  // Basic info
  area: faker.number.float({ min: 20, max: 500, fractionDigits: 1 }),
  rooms: faker.number.int({ min: 1, max: 10 }),
  bedrooms: faker.number.int({ min: 1, max: 5 }),
  bathrooms: faker.number.float({ min: 1, max: 3, fractionDigits: 1 }),
  floor: faker.number.int({ min: 1, max: 20 }),
  totalFloors: faker.number.int({ min: 5, max: 30 }),

  // Building features
  yearBuilt: faker.number.int({ min: 1950, max: 2025 }),
  buildingType: 'BRICK',
  buildingClass: 'COMFORT',
  renovation: 'EURO',

  // Parking - Use only valid backend enum values
  parking: faker.number.int({ min: 0, max: 3 }),
  parkingType: faker.helpers.arrayElement(['STREET', 'UNDERGROUND', 'GARAGE', 'MULTI_LEVEL']),

  // Timestamps
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  viewCount: faker.number.int({ min: 0, max: 1000 }),
  featured: false,
  verified: false,

  ...overrides,
});

export const createValidPropertyDTO = (overrides?: Partial<any>) => ({
  propertyType: 'APARTMENT',
  listingType: 'SALE',
  title: faker.lorem.sentence({ min: 5, max: 10 }),
  description: faker.lorem.paragraphs(2),
  price: faker.number.int({ min: 10000, max: 1000000 }),
  currency: 'YE' as const,

  // Location (required)
  address: faker.location.streetAddress(),
  city: 'Ташкент',
  latitude: 41.311081,
  longitude: 69.240562,

  // Basic info (required)
  area: faker.number.float({ min: 20, max: 200, fractionDigits: 1 }),

  // Optional fields with valid enum values
  parkingType: faker.helpers.arrayElement(['STREET', 'UNDERGROUND', 'GARAGE', 'MULTI_LEVEL']),
  renovation: faker.helpers.arrayElement(['NONE', 'COSMETIC', 'EURO', 'DESIGNER', 'NEEDS_REPAIR']),
  bathroomType: faker.helpers.arrayElement(['COMBINED', 'SEPARATE', 'MULTIPLE']),
  windowView: faker.helpers.arrayElement(['YARD', 'STREET', 'YARD_STREET']),
  furnished: faker.helpers.arrayElement(['YES', 'NO', 'PARTIAL']),

  ...overrides,
});

export const createMockConversation = (overrides?: Partial<any>) => ({
  id: faker.string.uuid(),
  propertyId: faker.string.uuid(),
  buyerId: faker.string.uuid(),
  sellerId: faker.string.uuid(),
  lastMessageAt: faker.date.recent(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

export const createMockMessage = (overrides?: Partial<any>) => ({
  id: faker.string.uuid(),
  conversationId: faker.string.uuid(),
  senderId: faker.string.uuid(),
  recipientId: faker.string.uuid(),
  content: faker.lorem.sentences(2),
  read: false,
  createdAt: faker.date.recent(),
  ...overrides,
});

export const createMockViewing = (overrides?: Partial<any>) => ({
  id: faker.string.uuid(),
  propertyId: faker.string.uuid(),
  userId: faker.string.uuid(),
  requestedDate: faker.date.future(),
  timeSlot: faker.helpers.arrayElement(['MORNING', 'AFTERNOON', 'EVENING']),
  status: 'PENDING',
  notes: faker.lorem.sentence(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

export const createMockReview = (overrides?: Partial<any>) => ({
  id: faker.string.uuid(),
  propertyId: faker.string.uuid(),
  userId: faker.string.uuid(),
  rating: faker.number.int({ min: 1, max: 5 }),
  comment: faker.lorem.paragraph(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

/**
 * Helper to create multiple mock items
 */
export const createMockArray = <T>(factory: () => T, count: number): T[] => {
  return Array.from({ length: count }, factory);
};
