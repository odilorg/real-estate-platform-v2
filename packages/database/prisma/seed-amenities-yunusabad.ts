import { PrismaClient, AmenityType } from '@prisma/client';

const prisma = new PrismaClient();

// Amenities near Yunusabad area (around 41.46, 69.36)
const amenities = [
  // Metro stations in Yunusabad area
  {
    name: 'Yunusabad Metro Station',
    type: AmenityType.METRO,
    latitude: 41.459722,
    longitude: 69.358889,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Chilanzar Metro Station',
    type: AmenityType.METRO,
    latitude: 41.275856,
    longitude: 69.203144,
    address: 'Chilanzar, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Minor Metro Station',
    type: AmenityType.METRO,
    latitude: 41.465556,
    longitude: 69.354722,
    address: 'Minor Street, Tashkent',
    city: 'Tashkent',
  },

  // Bus stops
  {
    name: 'Yunusabad Bus Stop 1',
    type: AmenityType.BUS_STOP,
    latitude: 41.461,
    longitude: 69.359,
    address: 'Yunusabad Street, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Yunusabad Bus Stop 2',
    type: AmenityType.BUS_STOP,
    latitude: 41.458,
    longitude: 69.362,
    address: 'Amir Temur Avenue, Tashkent',
    city: 'Tashkent',
  },

  // Schools
  {
    name: 'School #98',
    type: AmenityType.SCHOOL,
    latitude: 41.462,
    longitude: 69.357,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'School #156',
    type: AmenityType.SCHOOL,
    latitude: 41.457,
    longitude: 69.363,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'International School of Tashkent',
    type: AmenityType.SCHOOL,
    latitude: 41.464,
    longitude: 69.355,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Westminster International University',
    type: AmenityType.SCHOOL,
    latitude: 41.468,
    longitude: 69.352,
    address: 'Istiqbol Street, Tashkent',
    city: 'Tashkent',
  },

  // Kindergartens
  {
    name: 'Kindergarten #241',
    type: AmenityType.KINDERGARTEN,
    latitude: 41.461,
    longitude: 69.361,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Kindergarten #189',
    type: AmenityType.KINDERGARTEN,
    latitude: 41.458,
    longitude: 69.358,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Happy Kids Kindergarten',
    type: AmenityType.KINDERGARTEN,
    latitude: 41.463,
    longitude: 69.364,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },

  // Hospitals
  {
    name: 'Yunusabad District Hospital',
    type: AmenityType.HOSPITAL,
    latitude: 41.465,
    longitude: 69.359,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'City Clinical Hospital #1',
    type: AmenityType.HOSPITAL,
    latitude: 41.457,
    longitude: 69.355,
    address: 'Amir Temur Avenue, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Family Medical Center',
    type: AmenityType.HOSPITAL,
    latitude: 41.462,
    longitude: 69.363,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },

  // Pharmacies
  {
    name: 'Dorixona Pharmacy Yunusabad',
    type: AmenityType.PHARMACY,
    latitude: 41.460,
    longitude: 69.360,
    address: 'Yunusabad Street, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Neman Pharmacy',
    type: AmenityType.PHARMACY,
    latitude: 41.459,
    longitude: 69.362,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Samruk Pharmacy',
    type: AmenityType.PHARMACY,
    latitude: 41.463,
    longitude: 69.358,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Shifo Pharmacy',
    type: AmenityType.PHARMACY,
    latitude: 41.458,
    longitude: 69.361,
    address: 'Amir Temur Avenue, Tashkent',
    city: 'Tashkent',
  },

  // Supermarkets
  {
    name: 'Korzinka Supermarket Yunusabad',
    type: AmenityType.SUPERMARKET,
    latitude: 41.461,
    longitude: 69.359,
    address: 'Yunusabad Street, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Havas Supermarket',
    type: AmenityType.SUPERMARKET,
    latitude: 41.459,
    longitude: 69.361,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Makro Supermarket',
    type: AmenityType.SUPERMARKET,
    latitude: 41.463,
    longitude: 69.357,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Carrefour Express',
    type: AmenityType.SUPERMARKET,
    latitude: 41.457,
    longitude: 69.363,
    address: 'Amir Temur Avenue, Tashkent',
    city: 'Tashkent',
  },

  // Shopping Malls
  {
    name: 'Compass Shopping Mall',
    type: AmenityType.SHOPPING_MALL,
    latitude: 41.462,
    longitude: 69.360,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Next Shopping Mall',
    type: AmenityType.SHOPPING_MALL,
    latitude: 41.465,
    longitude: 69.356,
    address: 'Amir Temur Street, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Samarkand Darvoza Shopping Center',
    type: AmenityType.SHOPPING_MALL,
    latitude: 41.458,
    longitude: 69.364,
    address: 'Samarkand Street, Tashkent',
    city: 'Tashkent',
  },

  // Restaurants
  {
    name: 'Osh Markazi Restaurant',
    type: AmenityType.RESTAURANT,
    latitude: 41.460,
    longitude: 69.361,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Caravan Restaurant',
    type: AmenityType.RESTAURANT,
    latitude: 41.461,
    longitude: 69.358,
    address: 'Amir Temur Avenue, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Bella Italia Yunusabad',
    type: AmenityType.RESTAURANT,
    latitude: 41.463,
    longitude: 69.362,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Korean House Restaurant',
    type: AmenityType.RESTAURANT,
    latitude: 41.459,
    longitude: 69.359,
    address: 'Yunusabad Street, Tashkent',
    city: 'Tashkent',
  },

  // Cafes
  {
    name: 'Bon Coffee Yunusabad',
    type: AmenityType.CAFE,
    latitude: 41.460,
    longitude: 69.360,
    address: 'Yunusabad Street, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Fresh Coffee',
    type: AmenityType.CAFE,
    latitude: 41.462,
    longitude: 69.361,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Coffee Room',
    type: AmenityType.CAFE,
    latitude: 41.458,
    longitude: 69.362,
    address: 'Amir Temur Avenue, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Starbucks Yunusabad',
    type: AmenityType.CAFE,
    latitude: 41.464,
    longitude: 69.359,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },

  // Parks
  {
    name: 'Yunusabad Park',
    type: AmenityType.PARK,
    latitude: 41.463,
    longitude: 69.361,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Friendship Park',
    type: AmenityType.PARK,
    latitude: 41.457,
    longitude: 69.357,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Children\'s Park',
    type: AmenityType.PARK,
    latitude: 41.465,
    longitude: 69.363,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },

  // Gyms
  {
    name: 'Fitness Zone Yunusabad',
    type: AmenityType.GYM,
    latitude: 41.461,
    longitude: 69.360,
    address: 'Yunusabad Street, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Planet Fitness',
    type: AmenityType.GYM,
    latitude: 41.459,
    longitude: 69.358,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Gold\'s Gym',
    type: AmenityType.GYM,
    latitude: 41.464,
    longitude: 69.362,
    address: 'Amir Temur Avenue, Tashkent',
    city: 'Tashkent',
  },

  // Banks
  {
    name: 'Kapitalbank Yunusabad',
    type: AmenityType.BANK,
    latitude: 41.460,
    longitude: 69.359,
    address: 'Yunusabad Street, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Ipoteka Bank',
    type: AmenityType.BANK,
    latitude: 41.462,
    longitude: 69.362,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'NBU Bank Yunusabad',
    type: AmenityType.BANK,
    latitude: 41.458,
    longitude: 69.361,
    address: 'Amir Temur Avenue, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Asaka Bank',
    type: AmenityType.BANK,
    latitude: 41.463,
    longitude: 69.358,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
];

async function main() {
  console.log('Starting Yunusabad amenities seed...');

  for (const amenity of amenities) {
    await prisma.nearbyAmenity.upsert({
      where: {
        id: `${amenity.name}-${amenity.latitude}-${amenity.longitude}`.replace(/\s/g, '-').toLowerCase(),
      },
      update: amenity,
      create: amenity,
    });
  }

  console.log(`Seeded ${amenities.length} amenities in Yunusabad area successfully!`);
}

main()
  .catch((e) => {
    console.error('Error seeding amenities:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
