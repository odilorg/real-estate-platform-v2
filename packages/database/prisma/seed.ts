import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.propertyView.deleteMany();
  await prisma.propertyAnalytics.deleteMany();
  await prisma.adminLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.viewing.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.recentlyViewed.deleteMany();
  await prisma.propertyAmenity.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.agency.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Hash password for all users
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@realestate.uz',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user');

  // Create Agencies
  const agencies = await Promise.all([
    prisma.agency.create({
      data: {
        name: 'Premium Real Estate',
        slug: 'premium-real-estate',
        logo: 'https://placehold.co/200x200/3b82f6/white?text=PRE',
        description: 'Leading real estate agency in Tashkent specializing in luxury properties',
        website: 'https://premium-re.uz',
        email: 'info@premium-re.uz',
        
        address: 'Amir Temur Avenue 107, Tashkent',
        city: 'Tashkent',
        verified: true,
        yearsOnPlatform: 5,
      },
    }),
    prisma.agency.create({
      data: {
        name: 'City Homes Agency',
        slug: 'city-homes-agency',
        logo: 'https://placehold.co/200x200/10b981/white?text=CHA',
        description: 'Affordable and quality homes across Uzbekistan',
        website: 'https://cityhomes.uz',
        email: 'contact@cityhomes.uz',
        
        address: 'Mustaqillik Avenue 45, Tashkent',
        city: 'Tashkent',
        verified: true,
        yearsOnPlatform: 3,
      },
    }),
    prisma.agency.create({
      data: {
        name: 'Samarkand Properties',
        slug: 'samarkand-properties',
        logo: 'https://placehold.co/200x200/f59e0b/white?text=SP',
        description: 'Exclusive properties in the historic city of Samarkand',
        website: 'https://samarkandproperties.uz',
        email: 'info@samarkandproperties.uz',
        
        city: 'Samarkand',
        verified: false,
        yearsOnPlatform: 2,
      },
    }),
  ]);

  console.log('✅ Created 3 agencies');

  // Create Regular Users (Property Owners)
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        passwordHash,
        firstName: 'John',
        lastName: 'Doe',
        
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@example.com',
        passwordHash,
        firstName: 'Jane',
        lastName: 'Smith',
        
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'ali.karimov@example.com',
        passwordHash,
        firstName: 'Ali',
        lastName: 'Karimov',
        
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'maria.garcia@example.com',
        passwordHash,
        firstName: 'Maria',
        lastName: 'Garcia',
        
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'aziz.uzbekov@example.com',
        passwordHash,
        firstName: 'Aziz',
        lastName: 'Uzbekov',
        
        role: 'USER',
      },
    }),
  ]);

  console.log('✅ Created 5 regular users');

  // Create Agent Users
  const agentUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'agent1@premium-re.uz',
        passwordHash,
        firstName: 'Rustam',
        lastName: 'Alimov',
        
        role: 'AGENT',
      },
    }),
    prisma.user.create({
      data: {
        email: 'agent2@premium-re.uz',
        passwordHash,
        firstName: 'Dilshod',
        lastName: 'Mirzoev',
        
        role: 'AGENT',
      },
    }),
    prisma.user.create({
      data: {
        email: 'agent3@cityhomes.uz',
        passwordHash,
        firstName: 'Gulnora',
        lastName: 'Rahimova',
        
        role: 'AGENT',
      },
    }),
    prisma.user.create({
      data: {
        email: 'agent4@cityhomes.uz',
        passwordHash,
        firstName: 'Sherzod',
        lastName: 'Tashkentov',
        
        role: 'AGENT',
      },
    }),
    prisma.user.create({
      data: {
        email: 'agent5@samarkandproperties.uz',
        passwordHash,
        firstName: 'Kamila',
        lastName: 'Samarkandiy',
        
        role: 'AGENT',
      },
    }),
  ]);

  console.log('✅ Created 5 agent users');

  // Create Agent Profiles
  const agents = await Promise.all([
    prisma.agent.create({
      data: {
        userId: agentUsers[0].id,
        agencyId: agencies[0].id,
        firstName: 'Rustam',
        lastName: 'Alimov',
        photo: 'https://i.pravatar.cc/200?img=12',
        bio: 'Experienced real estate professional with 10+ years in luxury properties',
        
        email: 'agent1@premium-re.uz',
        showPhone: true,
        showEmail: true,
        licenseNumber: 'RE-TAS-001',
        specializations: ['Luxury Apartments', 'Commercial', 'Investment'],
        languages: ['Uzbek', 'English', 'Russian'],
        areasServed: ['Tashkent', 'Yunusabad', 'Mirzo-Ulugbek'],
        yearsExperience: 10,
        rating: 4.8,
        reviewCount: 45,
        totalDeals: 120,
        verified: true,
        superAgent: true,
      },
    }),
    prisma.agent.create({
      data: {
        userId: agentUsers[1].id,
        agencyId: agencies[0].id,
        firstName: 'Dilshod',
        lastName: 'Mirzoev',
        photo: 'https://i.pravatar.cc/200?img=13',
        bio: 'Specialist in residential properties and first-time buyers',
        
        email: 'agent2@premium-re.uz',
        showPhone: true,
        showEmail: false,
        licenseNumber: 'RE-TAS-002',
        specializations: ['Residential', 'First-time Buyers'],
        languages: ['Uzbek', 'Russian'],
        areasServed: ['Tashkent', 'Chilanzar', 'Sergeli'],
        yearsExperience: 5,
        rating: 4.5,
        reviewCount: 28,
        totalDeals: 65,
        verified: true,
        superAgent: false,
      },
    }),
    prisma.agent.create({
      data: {
        userId: agentUsers[2].id,
        agencyId: agencies[1].id,
        firstName: 'Gulnora',
        lastName: 'Rahimova',
        photo: 'https://i.pravatar.cc/200?img=47',
        bio: 'Helping families find their dream homes',
        
        email: 'agent3@cityhomes.uz',
        showPhone: true,
        showEmail: true,
        licenseNumber: 'RE-TAS-003',
        specializations: ['Family Homes', 'Suburban Properties'],
        languages: ['Uzbek', 'English'],
        areasServed: ['Tashkent', 'Qibray', 'Zangiota'],
        yearsExperience: 7,
        rating: 4.7,
        reviewCount: 33,
        totalDeals: 88,
        verified: true,
        superAgent: false,
      },
    }),
    prisma.agent.create({
      data: {
        userId: agentUsers[3].id,
        agencyId: agencies[1].id,
        firstName: 'Sherzod',
        lastName: 'Tashkentov',
        photo: 'https://i.pravatar.cc/200?img=15',
        bio: 'Investment property specialist',
        
        email: 'agent4@cityhomes.uz',
        showPhone: false,
        showEmail: true,
        licenseNumber: 'RE-TAS-004',
        specializations: ['Investment', 'Commercial'],
        languages: ['Uzbek', 'English', 'Turkish'],
        areasServed: ['Tashkent', 'Samarkand'],
        yearsExperience: 8,
        rating: 4.6,
        reviewCount: 22,
        totalDeals: 52,
        verified: false,
        superAgent: false,
      },
    }),
    prisma.agent.create({
      data: {
        userId: agentUsers[4].id,
        agencyId: agencies[2].id,
        firstName: 'Kamila',
        lastName: 'Samarkandiy',
        photo: 'https://i.pravatar.cc/200?img=48',
        bio: 'Samarkand real estate expert',
        
        email: 'agent5@samarkandproperties.uz',
        showPhone: true,
        showEmail: true,
        licenseNumber: 'RE-SAM-001',
        specializations: ['Historic Properties', 'Tourism Rentals'],
        languages: ['Uzbek', 'Russian', 'English'],
        areasServed: ['Samarkand', 'Bukhara'],
        yearsExperience: 6,
        rating: 4.9,
        reviewCount: 18,
        totalDeals: 42,
        verified: true,
        superAgent: true,
      },
    }),
  ]);

  console.log('✅ Created 5 agent profiles');

  // Property data templates
  const tashkentDistricts = ['Yunusabad', 'Chilanzar', 'Mirzo-Ulugbek', 'Yakkasaray', 'Sergeli', 'Uchtepa', 'Shaykhontohur', 'Almazar'];
  const amenitiesList = ['Parking', 'Gym', 'Pool', 'Security', 'Playground', 'Garden', 'Elevator', 'Storage'];

  // Create 30 diverse properties
  const propertyData = [
    // Luxury Apartments
    {
      userId: agentUsers[0].id,
      title: 'Luxury 3-Bedroom Apartment with City Views',
      description: 'Stunning penthouse apartment in the heart of Tashkent with panoramic city views. Features include marble floors, high ceilings, and premium finishes throughout.',
      propertyType: 'APARTMENT',
      listingType: 'SALE',
      price: 250000,
      priceUsd: 250000,
      currency: 'YE',
      area: 145,
      bedrooms: 3,
      bathrooms: 2,
      rooms: 4,
      floor: 15,
      totalFloors: 20,
      city: 'Tashkent',
      district: 'Yunusabad',
      address: 'Amir Temur Avenue 107',
      mahalla: 'Bobur',
      nearestMetro: 'Amir Temur Hiyoboni',
      latitude: 41.311081,
      longitude: 69.240562,
      buildingClass: 'ELITE',
      buildingType: 'MONOLITHIC',
      renovation: 'EURO',
      parkingType: 'UNDERGROUND',
      balcony: 2,
      yearBuilt: 2022,
      elevatorPassenger: 2,
      hasConcierge: true,
      hasGatedArea: true,
      featured: true,
      verified: true,
      status: 'ACTIVE',
    },
    {
      userId: agentUsers[0].id,
      title: 'Modern 2-Bedroom Apartment in New Complex',
      description: 'Brand new apartment with smart home systems, premium appliances, and concierge service.',
      propertyType: 'APARTMENT',
      listingType: 'SALE',
      price: 180000,
      priceUsd: 180000,
      currency: 'YE',
      area: 95,
      bedrooms: 2,
      bathrooms: 2,
      rooms: 3,
      floor: 8,
      totalFloors: 25,
      city: 'Tashkent',
      district: 'Mirzo-Ulugbek',
      address: 'Furqat Street 123',
      mahalla: 'Akademgorodok',
      nearestMetro: 'Buyuk Ipak Yoli',
      latitude: 41.315522,
      longitude: 69.2649,
      buildingClass: 'ELITE',
      buildingType: 'MONOLITHIC',
      renovation: 'EURO',
      parkingType: 'UNDERGROUND',
      balcony: 1,
      yearBuilt: 2023,
      elevatorPassenger: 3,
      hasConcierge: true,
      hasGatedArea: true,
      featured: true,
      verified: true,
      status: 'ACTIVE',
    },
    // Mid-range Apartments
    {
      userId: users[0].id,
      title: 'Spacious 3-Room Apartment Near Metro',
      description: 'Well-maintained apartment in established neighborhood with excellent transport links.',
      propertyType: 'APARTMENT',
      listingType: 'SALE',
      price: 85000,
      priceUsd: 85000,
      currency: 'YE',
      area: 78,
      bedrooms: 2,
      bathrooms: 1,
      rooms: 3,
      floor: 5,
      totalFloors: 9,
      city: 'Tashkent',
      district: 'Chilanzar',
      address: 'Chilanzar 12, Building 45',
      mahalla: 'Chilanzar-12',
      nearestMetro: 'Chilanzar',
      latitude: 41.275311,
      longitude: 69.203629,
      buildingClass: 'COMFORT',
      buildingType: 'PANEL',
      renovation: 'COSMETIC',
      parkingType: 'STREET',
      balcony: 1,
      yearBuilt: 2010,
      elevatorPassenger: 1,
      hasConcierge: false,
      hasGatedArea: false,
      featured: false,
      verified: true,
      status: 'ACTIVE',
    },
    {
      userId: users[1].id,
      title: 'Cozy 2-Bedroom Apartment for Young Family',
      description: 'Perfect starter home with nearby schools and parks. Renovated kitchen and bathroom.',
      propertyType: 'APARTMENT',
      listingType: 'SALE',
      price: 72000,
      priceUsd: 72000,
      currency: 'YE',
      area: 65,
      bedrooms: 2,
      bathrooms: 1,
      rooms: 3,
      floor: 3,
      totalFloors: 5,
      city: 'Tashkent',
      district: 'Sergeli',
      address: 'Sergeli 5, Block 8',
      mahalla: 'Sergeli-5',
      nearestMetro: 'Sergeli',
      latitude: 41.216667,
      longitude: 69.222222,
      buildingClass: 'ECONOMY',
      buildingType: 'PANEL',
      renovation: 'COSMETIC',
      parkingType: 'STREET',
      balcony: 1,
      yearBuilt: 2005,
      elevatorPassenger: 1,
      hasConcierge: false,
      hasGatedArea: false,
      featured: false,
      verified: false,
      status: 'ACTIVE',
    },
    {
      userId: agentUsers[1].id,
      title: '1-Bedroom Studio Apartment - Great Investment',
      description: 'Compact and efficient studio perfect for students or rental investment.',
      propertyType: 'APARTMENT',
      listingType: 'SALE',
      price: 48000,
      priceUsd: 48000,
      currency: 'YE',
      area: 42,
      bedrooms: 1,
      bathrooms: 1,
      rooms: 1,
      floor: 2,
      totalFloors: 12,
      city: 'Tashkent',
      district: 'Shaykhontohur',
      address: 'Farobi Street 89',
      mahalla: 'Farobi',
      nearestMetro: 'Alisher Navoi',
      latitude: 41.311151,
      longitude: 69.28668,
      buildingClass: 'COMFORT',
      buildingType: 'BRICK',
      renovation: 'COSMETIC',
      parkingType: 'STREET',
      balcony: 0,
      yearBuilt: 2015,
      elevatorPassenger: 2,
      hasConcierge: false,
      hasGatedArea: false,
      featured: false,
      verified: true,
      status: 'ACTIVE',
    },
    // Houses
    {
      userId: users[2].id,
      title: 'Beautiful Family House with Garden',
      description: 'Spacious 4-bedroom house with large garden, fruit trees, and covered parking.',
      propertyType: 'HOUSE',
      listingType: 'SALE',
      price: 320000,
      priceUsd: 320000,
      currency: 'YE',
      area: 280,
      bedrooms: 4,
      bathrooms: 3,
      rooms: 6,
      floor: 2,
      totalFloors: 2,
      city: 'Tashkent',
      district: 'Yakkasaray',
      address: 'Bogishamol Street 67',
      mahalla: 'Bogishamol',
      latitude: 41.29674,
      longitude: 69.24141,
      buildingClass: 'ELITE',
      buildingType: 'BRICK',
      renovation: 'EURO',
      parkingType: 'GARAGE',
      balcony: 0,
      yearBuilt: 2020,
      hasGatedArea: true,
      featured: true,
      verified: true,
      status: 'ACTIVE',
    },
    {
      userId: agentUsers[2].id,
      title: 'Modern Townhouse in Gated Community',
      description: 'Contemporary 3-level townhouse with rooftop terrace and private courtyard.',
      propertyType: 'HOUSE',
      listingType: 'SALE',
      price: 285000,
      priceUsd: 285000,
      currency: 'YE',
      area: 220,
      bedrooms: 3,
      bathrooms: 3,
      rooms: 5,
      floor: 3,
      totalFloors: 3,
      city: 'Tashkent',
      district: 'Yunusabad',
      address: 'Istiqbol Complex, House 12',
      mahalla: 'Istiqbol',
      nearestMetro: 'Yuni Khiyobon',
      latitude: 41.33642,
      longitude: 69.28815,
      buildingClass: 'ELITE',
      buildingType: 'MONOLITHIC',
      renovation: 'EURO',
      parkingType: 'GARAGE',
      balcony: 2,
      yearBuilt: 2021,
      hasGatedArea: true,
      hasConcierge: true,
      featured: true,
      verified: true,
      status: 'ACTIVE',
    },
    {
      userId: users[3].id,
      title: 'Cozy Cottage with Fruit Garden',
      description: 'Charming single-story cottage perfect for retirement or weekend getaway.',
      propertyType: 'HOUSE',
      listingType: 'SALE',
      price: 95000,
      priceUsd: 95000,
      currency: 'YE',
      area: 120,
      bedrooms: 2,
      bathrooms: 1,
      rooms: 4,
      floor: 1,
      totalFloors: 1,
      city: 'Tashkent',
      district: 'Uchtepa',
      address: 'Uchtepa 18, Street 45',
      mahalla: 'Uchtepa-18',
      latitude: 41.28541,
      longitude: 69.19483,
      buildingClass: 'ECONOMY',
      buildingType: 'BRICK',
      renovation: 'COSMETIC',
      parkingType: 'STREET',
      balcony: 0,
      yearBuilt: 2008,
      hasGatedArea: false,
      featured: false,
      verified: false,
      status: 'ACTIVE',
    },
    // Rental Properties
    {
      userId: agentUsers[3].id,
      title: 'Furnished 2-Bedroom Apartment for Rent',
      description: 'Fully furnished apartment available for long-term rent. All utilities included.',
      propertyType: 'APARTMENT',
      listingType: 'RENT_LONG',
      price: 8000000,
      priceUsd: 800,
      currency: 'UZS',
      area: 70,
      bedrooms: 2,
      bathrooms: 1,
      rooms: 3,
      floor: 4,
      totalFloors: 9,
      city: 'Tashkent',
      district: 'Almazar',
      address: 'Navoi Street 234',
      mahalla: 'Navoi',
      nearestMetro: 'Novza',
      latitude: 41.34282,
      longitude: 69.2919,
      buildingClass: 'COMFORT',
      buildingType: 'PANEL',
      renovation: 'COSMETIC',
      parkingType: 'STREET',
      balcony: 1,
      yearBuilt: 2012,
      elevatorPassenger: 1,
      hasConcierge: false,
      hasGatedArea: false,
      featured: false,
      verified: true,
      status: 'ACTIVE',
    },
    {
      userId: users[4].id,
      title: 'Luxury Penthouse for Rent - Short/Long Term',
      description: 'Premium penthouse with panoramic views. Flexible rental terms available.',
      propertyType: 'APARTMENT',
      listingType: 'RENT_LONG',
      price: 25000000,
      priceUsd: 2500,
      currency: 'UZS',
      area: 180,
      bedrooms: 3,
      bathrooms: 3,
      rooms: 5,
      floor: 20,
      totalFloors: 20,
      city: 'Tashkent',
      district: 'Yunusabad',
      address: 'Amir Temur Avenue 150',
      mahalla: 'Uzbekiston',
      nearestMetro: 'Milliy Bog',
      latitude: 41.31174,
      longitude: 69.27951,
      buildingClass: 'ELITE',
      buildingType: 'MONOLITHIC',
      renovation: 'EURO',
      parkingType: 'UNDERGROUND',
      balcony: 3,
      yearBuilt: 2023,
      elevatorPassenger: 3,
      hasConcierge: true,
      hasGatedArea: true,
      featured: true,
      verified: true,
      status: 'ACTIVE',
    },
    // Samarkand Properties
    {
      userId: agentUsers[4].id,
      title: 'Historic House in Samarkand Old City',
      description: 'Traditional Samarkand house with authentic architecture and modern amenities.',
      propertyType: 'HOUSE',
      listingType: 'SALE',
      price: 150000,
      priceUsd: 150000,
      currency: 'YE',
      area: 200,
      bedrooms: 4,
      bathrooms: 2,
      rooms: 6,
      floor: 1,
      totalFloors: 1,
      city: 'Samarkand',
      district: 'Old City',
      address: 'Registan Street 89',
      mahalla: 'Registan',
      latitude: 39.654816,
      longitude: 66.974327,
      buildingClass: 'COMFORT',
      buildingType: 'BRICK',
      renovation: 'COSMETIC',
      parkingType: 'STREET',
      balcony: 0,
      yearBuilt: 1995,
      hasGatedArea: true,
      featured: true,
      verified: true,
      status: 'ACTIVE',
    },
    {
      userId: agentUsers[4].id,
      title: 'Investment Opportunity - Hotel Conversion',
      description: 'Large property suitable for boutique hotel or guesthouse conversion.',
      propertyType: 'COMMERCIAL',
      listingType: 'SALE',
      price: 450000,
      priceUsd: 450000,
      currency: 'YE',
      area: 600,
      bedrooms: 8,
      bathrooms: 6,
      rooms: 12,
      floor: 2,
      totalFloors: 2,
      city: 'Samarkand',
      district: 'Center',
      address: 'Tashkent Street 234',
      mahalla: 'Markazi',
      latitude: 39.627012,
      longitude: 66.97494,
      buildingClass: 'COMFORT',
      buildingType: 'BRICK',
      renovation: 'NEEDS_REPAIR',
      parkingType: 'STREET',
      balcony: 0,
      yearBuilt: 1985,
      hasGatedArea: false,
      featured: true,
      verified: true,
      status: 'ACTIVE',
    },
    // Additional variety properties (18 more)
    ...Array.from({ length: 18 }, (_, i) => {
      const isRental = i % 3 === 0;
      const propertyTypes = ['APARTMENT', 'HOUSE', 'CONDO', 'COMMERCIAL'];
      const type = propertyTypes[i % 4];
      const district = tashkentDistricts[i % tashkentDistricts.length];
      const owner = i % 2 === 0 ? users[i % users.length].id : agentUsers[i % agentUsers.length].id;

      const basePrice = 50000 + (i * 10000);
      const price = isRental ? basePrice / 10 * 100000 : basePrice;
      const priceUsd = isRental ? basePrice / 10 : basePrice;

      return {
        userId: owner,
        title: `${type} Property ${i + 13} in ${district}`,
        description: `Quality ${type.toLowerCase()} property with ${2 + (i % 3)} bedrooms. ${isRental ? 'Available for immediate rental.' : 'Excellent investment opportunity.'}`,
        propertyType: type,
        listingType: isRental ? 'RENT_LONG' : 'SALE',
        price,
        priceUsd,
        currency: isRental ? 'UZS' : 'YE',
        area: 60 + (i * 5),
        bedrooms: 1 + (i % 4),
        bathrooms: 1 + (i % 2),
        rooms: 2 + (i % 5),
        floor: 1 + (i % 15),
        totalFloors: 5 + (i % 20),
        city: 'Tashkent',
        district,
        address: `${district} Street ${100 + i}`,
        mahalla: `${district}-${i % 10}`,
        nearestMetro: i % 2 === 0 ? 'Chilanzar' : 'Alisher Navoi',
        latitude: 41.3 + (i * 0.01),
        longitude: 69.2 + (i * 0.01),
        buildingClass: ['ECONOMY', 'COMFORT', 'BUSINESS', 'ELITE'][i % 4],
        buildingType: ['PANEL', 'BRICK', 'MONOLITHIC'][i % 3],
        renovation: ['COSMETIC', 'EURO', 'NEEDS_REPAIR'][i % 3],
        parkingType: ['STREET', 'STREET', 'GARAGE', 'UNDERGROUND'][i % 4],
        balcony: i % 3,
        yearBuilt: 2000 + (i % 24),
        elevatorPassenger: type === 'APARTMENT' ? 1 + (i % 2) : undefined,
        hasConcierge: i % 5 === 0,
        hasGatedArea: i % 4 === 0,
        featured: i % 7 === 0,
        verified: i % 3 !== 0,
        status: 'ACTIVE',
      };
    }),
  ];

  console.log('🏗️  Creating 30 properties...');

  const properties = [];
  for (const [index, data] of propertyData.entries()) {
    const property = await prisma.property.create({
      data: {
        ...data,
        images: {
          create: [
            { url: `https://picsum.photos/seed/${index}1/800/600`, order: 0, isPrimary: true },
            { url: `https://picsum.photos/seed/${index}2/800/600`, order: 1, isPrimary: false },
            { url: `https://picsum.photos/seed/${index}3/800/600`, order: 2, isPrimary: false },
            { url: `https://picsum.photos/seed/${index}4/800/600`, order: 3, isPrimary: false },
          ],
        },
        amenities: {
          create: amenitiesList
            .filter(() => Math.random() > 0.4)
            .map((amenity) => ({ amenity })),
        },
      },
    });
    properties.push(property);
  }

  console.log('✅ Created 30 properties with images and amenities');

  // Create property views for analytics
  console.log('📊 Creating property analytics data...');

  const now = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  for (const property of properties.slice(0, 10)) {
    // Create view history for first 10 properties
    for (const date of last30Days) {
      await prisma.propertyAnalytics.create({
        data: {
          propertyId: property.id,
          date,
          views: Math.floor(Math.random() * 50) + 10,
          favorites: Math.floor(Math.random() * 10),
          unfavorites: Math.floor(Math.random() * 5),
          contacts: Math.floor(Math.random() * 8),
          price: property.price,
          priceUsd: property.priceUsd,
        },
      });
    }

    // Create individual property views
    for (let i = 0; i < 20; i++) {
      await prisma.propertyView.create({
        data: {
          propertyId: property.id,
          userId: i % 2 === 0 ? users[i % users.length].id : null,
          ipAddress: `192.168.1.${i}`,
          userAgent: 'Mozilla/5.0',
          referrer: i % 3 === 0 ? 'https://google.com' : null,
          createdAt: new Date(now.getTime() - i * 3600000),
        },
      });
    }
  }

  console.log('✅ Created analytics data for 10 properties');

  // Create favorites
  console.log('❤️  Creating favorites...');
  for (const user of users) {
    const favoriteCount = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < favoriteCount; i++) {
      const randomProperty = properties[Math.floor(Math.random() * properties.length)];
      try {
        await prisma.favorite.create({
          data: {
            userId: user.id,
            propertyId: randomProperty.id,
          },
        });
      } catch (e) {
        // Skip duplicates
      }
    }
  }

  console.log('✅ Created user favorites');

  // Create reviews
  console.log('⭐ Creating reviews...');
  const reviewTemplates = [
    'Excellent property! Very satisfied with the purchase.',
    'Great location and reasonable price.',
    'The agent was very helpful and professional.',
    'Property matched the description perfectly.',
    'Would recommend to anyone looking in this area.',
    'Good value for money.',
    'Nice neighborhood, close to everything.',
  ];

  for (const property of properties.slice(0, 15)) {
    const reviewCount = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < reviewCount; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      try {
        await prisma.review.create({
          data: {
            propertyId: property.id,
            userId: randomUser.id,
            rating: 3 + Math.floor(Math.random() * 3),
            comment: reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)],
            approved: Math.random() > 0.2,
          },
        });
      } catch (e) {
        // Skip duplicate reviews
      }
    }
  }

  console.log('✅ Created property reviews');

  // Create saved searches
  console.log('🔍 Creating saved searches...');
  for (const user of users) {
    await prisma.savedSearch.create({
      data: {
        userId: user.id,
        name: 'My Dream Apartment',
        filters: {
          city: 'Tashkent',
          propertyType: 'APARTMENT',
          minBedrooms: 2,
          maxPrice: 100000,
        },
        notificationsEnabled: true,
      },
    });
  }

  console.log('✅ Created saved searches');

  // Create conversations and messages
  console.log('💬 Creating conversations...');
  for (let i = 0; i < 5; i++) {
    const property = properties[i];
    const buyer = users[i % users.length];

    await prisma.conversation.create({
      data: {
        propertyId: property.id,
        participant1Id: buyer.id,
        participant2Id: property.userId,
        messages: {
          create: [
            {
              senderId: buyer.id,
              content: 'Hello! I am interested in this property. Is it still available?',
            },
            {
              senderId: property.userId,
              content: 'Yes, it is available! Would you like to schedule a viewing?',
            },
            {
              senderId: buyer.id,
              content: 'That would be great! How about this weekend?',
            },
          ],
        },
      },
    });
  }

  console.log('✅ Created conversations and messages');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   👤 Users: ${users.length + agentUsers.length + 1} (1 admin, ${users.length} regular, ${agentUsers.length} agents)`);
  console.log(`   🏢 Agencies: ${agencies.length}`);
  console.log(`   👔 Agents: ${agents.length}`);
  console.log(`   🏠 Properties: ${properties.length}`);
  console.log(`   📈 Analytics records: ${last30Days.length * 10}`);
  console.log(`   👁️  Property views: 200`);
  console.log(`   ❤️  Favorites: ~${users.length * 3}`);
  console.log(`   ⭐ Reviews: ~45`);
  console.log(`   🔍 Saved searches: ${users.length}`);
  console.log(`   💬 Conversations: 5`);
  console.log('\n🔑 Login Credentials:');
  console.log('   Admin: admin@realestate.uz / password123');
  console.log('   Agent: agent1@premium-re.uz / password123');
  console.log('   User: john.doe@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
