import { PrismaClient, AmenityType } from '@prisma/client';

const prisma = new PrismaClient();

// Sample amenities for Tashkent, Uzbekistan
const amenities = [
  // Metro stations
  {
    name: 'Chilanzar Metro Station',
    type: AmenityType.METRO,
    latitude: 41.275856,
    longitude: 69.203144,
    address: 'Chilanzar, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Oybek Metro Station',
    type: AmenityType.METRO,
    latitude: 41.328889,
    longitude: 69.281111,
    address: 'Oybek Street, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Amir Temur Hiyoboni Metro Station',
    type: AmenityType.METRO,
    latitude: 41.311111,
    longitude: 69.279722,
    address: 'Amir Temur Street, Tashkent',
    city: 'Tashkent',
  },

  // Bus stops
  {
    name: 'Chorsu Bazaar Bus Stop',
    type: AmenityType.BUS_STOP,
    latitude: 41.325278,
    longitude: 69.233889,
    address: 'Chorsu, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Alisher Navoi Bus Stop',
    type: AmenityType.BUS_STOP,
    latitude: 41.311667,
    longitude: 69.240833,
    address: 'Alisher Navoi Avenue, Tashkent',
    city: 'Tashkent',
  },

  // Schools
  {
    name: 'School #45',
    type: AmenityType.SCHOOL,
    latitude: 41.310556,
    longitude: 69.245833,
    address: 'Mirabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'School #98',
    type: AmenityType.SCHOOL,
    latitude: 41.315833,
    longitude: 69.250278,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'International School of Tashkent',
    type: AmenityType.SCHOOL,
    latitude: 41.323056,
    longitude: 69.289722,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },

  // Kindergartens
  {
    name: 'Kindergarten #24',
    type: AmenityType.KINDERGARTEN,
    latitude: 41.308333,
    longitude: 69.238333,
    address: 'Mirabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Kindergarten #156',
    type: AmenityType.KINDERGARTEN,
    latitude: 41.313889,
    longitude: 69.248611,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },

  // Hospitals
  {
    name: 'Tashkent Medical Academy Hospital',
    type: AmenityType.HOSPITAL,
    latitude: 41.311389,
    longitude: 69.288333,
    address: 'Farkhad Street, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Republican Clinical Hospital',
    type: AmenityType.HOSPITAL,
    latitude: 41.314722,
    longitude: 69.292778,
    address: 'Qoratosh Street, Tashkent',
    city: 'Tashkent',
  },

  // Pharmacies
  {
    name: 'Dorixona Pharmacy',
    type: AmenityType.PHARMACY,
    latitude: 41.311944,
    longitude: 69.241111,
    address: 'Amir Temur Street, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Neman Pharmacy',
    type: AmenityType.PHARMACY,
    latitude: 41.308611,
    longitude: 69.244167,
    address: 'Mirabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Samruk Pharmacy',
    type: AmenityType.PHARMACY,
    latitude: 41.315278,
    longitude: 69.246944,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },

  // Supermarkets
  {
    name: 'Korzinka Supermarket',
    type: AmenityType.SUPERMARKET,
    latitude: 41.312222,
    longitude: 69.242778,
    address: 'Amir Temur Street, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Makro Supermarket',
    type: AmenityType.SUPERMARKET,
    latitude: 41.309444,
    longitude: 69.239722,
    address: 'Mirabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Havas Supermarket',
    type: AmenityType.SUPERMARKET,
    latitude: 41.316111,
    longitude: 69.251389,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },

  // Shopping Malls
  {
    name: 'Next Shopping Mall',
    type: AmenityType.SHOPPING_MALL,
    latitude: 41.314167,
    longitude: 69.282778,
    address: 'Amir Temur Street, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Mega Planet',
    type: AmenityType.SHOPPING_MALL,
    latitude: 41.289167,
    longitude: 69.286667,
    address: 'Sergeli District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Samarkand Darvoza',
    type: AmenityType.SHOPPING_MALL,
    latitude: 41.303056,
    longitude: 69.239167,
    address: 'Samarkand Street, Tashkent',
    city: 'Tashkent',
  },

  // Restaurants
  {
    name: 'Caravan Restaurant',
    type: AmenityType.RESTAURANT,
    latitude: 41.311389,
    longitude: 69.279722,
    address: 'Amir Temur Square, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Central Asian Plov Center',
    type: AmenityType.RESTAURANT,
    latitude: 41.323333,
    longitude: 69.289167,
    address: 'Osh Street, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Bella Italia',
    type: AmenityType.RESTAURANT,
    latitude: 41.310278,
    longitude: 69.240556,
    address: 'Mirabad District, Tashkent',
    city: 'Tashkent',
  },

  // Cafes
  {
    name: 'Bon Coffee',
    type: AmenityType.CAFE,
    latitude: 41.312500,
    longitude: 69.243056,
    address: 'Amir Temur Street, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Fresh Coffee',
    type: AmenityType.CAFE,
    latitude: 41.308889,
    longitude: 69.238889,
    address: 'Mirabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Coffee Room',
    type: AmenityType.CAFE,
    latitude: 41.316667,
    longitude: 69.252222,
    address: 'Yunusabad District, Tashkent',
    city: 'Tashkent',
  },

  // Parks
  {
    name: 'Alisher Navoi National Park',
    type: AmenityType.PARK,
    latitude: 41.311944,
    longitude: 69.253333,
    address: 'Alisher Navoi Avenue, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Japan Park',
    type: AmenityType.PARK,
    latitude: 41.322500,
    longitude: 69.286944,
    address: 'Buyuk Ipak Yoli, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Milliy Bog Park',
    type: AmenityType.PARK,
    latitude: 41.326111,
    longitude: 69.290556,
    address: 'Mirzo Ulugbek District, Tashkent',
    city: 'Tashkent',
  },

  // Gyms
  {
    name: 'Fitness Zone',
    type: AmenityType.GYM,
    latitude: 41.313056,
    longitude: 69.244444,
    address: 'Amir Temur Street, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Planet Fitness',
    type: AmenityType.GYM,
    latitude: 41.309722,
    longitude: 69.240278,
    address: 'Mirabad District, Tashkent',
    city: 'Tashkent',
  },

  // Banks
  {
    name: 'Kapitalbank',
    type: AmenityType.BANK,
    latitude: 41.312778,
    longitude: 69.243611,
    address: 'Amir Temur Street, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'Ipoteka Bank',
    type: AmenityType.BANK,
    latitude: 41.309167,
    longitude: 69.239444,
    address: 'Mirabad District, Tashkent',
    city: 'Tashkent',
  },
  {
    name: 'NBU Bank',
    type: AmenityType.BANK,
    latitude: 41.314444,
    longitude: 69.280556,
    address: 'Shakhrisabz Street, Tashkent',
    city: 'Tashkent',
  },
];

async function main() {
  console.log('Starting amenities seed...');

  for (const amenity of amenities) {
    await prisma.nearbyAmenity.upsert({
      where: {
        // Using a composite unique constraint based on name and coordinates
        id: `${amenity.name}-${amenity.latitude}-${amenity.longitude}`.replace(/\s/g, '-').toLowerCase(),
      },
      update: amenity,
      create: amenity,
    });
  }

  console.log(`Seeded ${amenities.length} amenities successfully!`);
}

main()
  .catch((e) => {
    console.error('Error seeding amenities:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
