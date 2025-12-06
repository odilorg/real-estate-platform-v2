/**
 * Database Seed Script
 *
 * Run with: pnpm --filter @repo/database db:seed
 *
 * Creates test data for development and manual testing.
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (in reverse order of dependencies)
  console.log('Cleaning existing data...');
  await prisma.adminLog.deleteMany();
  await prisma.agentReview.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.agency.deleteMany();
  await prisma.recentlyViewed.deleteMany();
  await prisma.viewing.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.propertyAmenity.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  const agent = await prisma.user.create({
    data: {
      email: 'agent@example.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Agent',
      role: 'AGENT',
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'user1@example.com',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Johnson',
      role: 'USER',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@example.com',
      passwordHash,
      firstName: 'Bob',
      lastName: 'Smith',
      role: 'USER',
    },
  });

  console.log(`Created ${4} users`);

  // Create agency
  console.log('Creating agency...');
  const agency = await prisma.agency.create({
    data: {
      name: 'Premium Realty',
      slug: 'premium-realty',
      description: 'Leading real estate agency in Tashkent',
      email: 'info@premiumrealty.uz',
      phone: '+998901234567',
      city: 'Tashkent',
      verified: true,
      yearsOnPlatform: 5,
    },
  });

  // Create agent profile
  console.log('Creating agent profile...');
  await prisma.agent.create({
    data: {
      userId: agent.id,
      agencyId: agency.id,
      firstName: 'John',
      lastName: 'Agent',
      phone: '+998901234568',
      email: 'john@premiumrealty.uz',
      bio: 'Experienced real estate agent with 10 years in the market.',
      licenseNumber: 'RE-12345',
      specializations: ['residential', 'luxury'],
      languages: ['en', 'ru', 'uz'],
      areasServed: ['Tashkent', 'Sergeli', 'Yunusabad'],
      yearsExperience: 10,
      totalDeals: 150,
      verified: true,
      superAgent: true,
      rating: 4.8,
      reviewCount: 45,
    },
  });

  // Create properties
  console.log('Creating properties...');
  const properties = await Promise.all([
    prisma.property.create({
      data: {
        userId: agent.id,
        title: 'Modern 3-Bedroom Apartment in Yunusabad',
        description: 'Spacious apartment with panoramic views. Recently renovated with modern finishes. Close to metro and schools.',
        price: 150000,
        propertyType: 'APARTMENT',
        listingType: 'SALE',
        status: 'ACTIVE',
        address: '15 Amir Temur Street',
        city: 'Tashkent',
        district: 'Yunusabad',
        country: 'Uzbekistan',
        latitude: 41.3111,
        longitude: 69.2797,
        nearestMetro: 'Yunusabad',
        metroDistance: 5,
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        livingArea: 85,
        kitchenArea: 15,
        rooms: 4,
        yearBuilt: 2020,
        floor: 8,
        totalFloors: 12,
        ceilingHeight: 2.8,
        parking: 1,
        parkingType: 'UNDERGROUND',
        balcony: 2,
        buildingType: 'MONOLITHIC',
        buildingClass: 'BUSINESS',
        renovation: 'EURO',
        windowView: 'PANORAMIC',
        furnished: 'FULL',
        views: 245,
        featured: true,
        verified: true,
        images: {
          create: [
            { url: 'https://placehold.co/800x600?text=Living+Room', order: 0, isPrimary: true },
            { url: 'https://placehold.co/800x600?text=Kitchen', order: 1 },
            { url: 'https://placehold.co/800x600?text=Bedroom', order: 2 },
          ],
        },
        amenities: {
          create: [
            { amenity: 'Air Conditioning' },
            { amenity: 'Dishwasher' },
            { amenity: 'Gym' },
            { amenity: 'Pool' },
          ],
        },
      },
    }),
    prisma.property.create({
      data: {
        userId: agent.id,
        title: 'Cozy Studio for Rent in Sergeli',
        description: 'Perfect starter apartment. All utilities included. Great for students or young professionals.',
        price: 400,
        propertyType: 'APARTMENT',
        listingType: 'RENT',
        status: 'ACTIVE',
        address: '45 Sergeli Street',
        city: 'Tashkent',
        district: 'Sergeli',
        country: 'Uzbekistan',
        latitude: 41.2278,
        longitude: 69.2186,
        bedrooms: 0,
        bathrooms: 1,
        area: 35,
        rooms: 1,
        yearBuilt: 2015,
        floor: 3,
        totalFloors: 9,
        buildingType: 'PANEL',
        buildingClass: 'ECONOMY',
        renovation: 'COSMETIC',
        furnished: 'FULL',
        views: 89,
        images: {
          create: [
            { url: 'https://placehold.co/800x600?text=Studio', order: 0, isPrimary: true },
          ],
        },
        amenities: {
          create: [
            { amenity: 'Internet' },
            { amenity: 'Washing Machine' },
          ],
        },
      },
    }),
    prisma.property.create({
      data: {
        userId: user1.id,
        title: 'Luxury Villa with Pool',
        description: 'Stunning villa with private pool and garden. 6 bedrooms, perfect for large families.',
        price: 850000,
        propertyType: 'HOUSE',
        listingType: 'SALE',
        status: 'ACTIVE',
        address: '7 Mirzo Ulugbek',
        city: 'Tashkent',
        district: 'Mirzo Ulugbek',
        country: 'Uzbekistan',
        latitude: 41.3389,
        longitude: 69.3350,
        bedrooms: 6,
        bathrooms: 4,
        area: 450,
        yearBuilt: 2018,
        parking: 3,
        parkingType: 'GARAGE',
        buildingType: 'BRICK',
        buildingClass: 'ELITE',
        renovation: 'DESIGNER',
        hasGatedArea: true,
        views: 567,
        featured: true,
        verified: true,
        images: {
          create: [
            { url: 'https://placehold.co/800x600?text=Villa+Exterior', order: 0, isPrimary: true },
            { url: 'https://placehold.co/800x600?text=Pool', order: 1 },
            { url: 'https://placehold.co/800x600?text=Garden', order: 2 },
          ],
        },
        amenities: {
          create: [
            { amenity: 'Pool' },
            { amenity: 'Garden' },
            { amenity: 'Security' },
            { amenity: 'Smart Home' },
          ],
        },
      },
    }),
    prisma.property.create({
      data: {
        userId: user2.id,
        title: 'Commercial Space in City Center',
        description: 'Prime location for retail or office. High foot traffic area.',
        price: 5000,
        propertyType: 'COMMERCIAL',
        listingType: 'RENT',
        status: 'ACTIVE',
        address: '1 Navoi Street',
        city: 'Tashkent',
        district: 'Shaykhantahur',
        country: 'Uzbekistan',
        area: 200,
        floor: 1,
        totalFloors: 5,
        ceilingHeight: 4,
        buildingClass: 'BUSINESS',
        views: 123,
        images: {
          create: [
            { url: 'https://placehold.co/800x600?text=Commercial+Space', order: 0, isPrimary: true },
          ],
        },
      },
    }),
  ]);

  console.log(`Created ${properties.length} properties`);

  // Create favorites
  console.log('Creating favorites...');
  await prisma.favorite.createMany({
    data: [
      { userId: user1.id, propertyId: properties[0].id },
      { userId: user1.id, propertyId: properties[1].id },
      { userId: user2.id, propertyId: properties[0].id },
    ],
  });

  // Create reviews
  console.log('Creating reviews...');
  await prisma.review.createMany({
    data: [
      {
        propertyId: properties[0].id,
        userId: user1.id,
        rating: 5,
        comment: 'Excellent apartment! The views are amazing and the location is perfect.',
      },
      {
        propertyId: properties[0].id,
        userId: user2.id,
        rating: 4,
        comment: 'Very nice place. A bit pricey but worth it for the quality.',
      },
    ],
  });

  // Create a conversation
  console.log('Creating conversations...');
  const conversation = await prisma.conversation.create({
    data: {
      propertyId: properties[0].id,
      participant1Id: user1.id,
      participant2Id: agent.id,
      messages: {
        create: [
          {
            senderId: user1.id,
            content: 'Hi, I am interested in this apartment. Is it still available?',
          },
          {
            senderId: agent.id,
            content: 'Hello! Yes, it is still available. Would you like to schedule a viewing?',
            read: true,
          },
          {
            senderId: user1.id,
            content: 'Yes, that would be great. How about this Saturday at 2pm?',
          },
        ],
      },
    },
  });

  // Create a viewing
  console.log('Creating viewings...');
  await prisma.viewing.create({
    data: {
      propertyId: properties[0].id,
      requesterId: user1.id,
      ownerId: agent.id,
      date: new Date('2025-12-14'),
      time: '14:00',
      status: 'CONFIRMED',
      message: 'Looking forward to seeing the apartment!',
    },
  });

  // Create saved search
  console.log('Creating saved searches...');
  await prisma.savedSearch.create({
    data: {
      userId: user1.id,
      name: 'Apartments in Yunusabad',
      filters: {
        city: 'Tashkent',
        district: 'Yunusabad',
        propertyType: 'APARTMENT',
        minPrice: 100000,
        maxPrice: 200000,
        bedrooms: 3,
      },
      notificationsEnabled: true,
    },
  });

  console.log('');
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('Test accounts:');
  console.log('  Admin: admin@example.com / password123');
  console.log('  Agent: agent@example.com / password123');
  console.log('  User1: user1@example.com / password123');
  console.log('  User2: user2@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
