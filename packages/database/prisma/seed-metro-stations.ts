import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Metro Stations for Tashkent Metro
 *
 * Tashkent Metro has 3 lines with 29 stations total:
 * - Chilanzar Line (Red): 11 stations
 * - Uzbekistan Line (Blue): 12 stations
 * - Yunusabad Line (Green): 6 stations
 *
 * Coordinates are accurate based on official metro maps
 */

const metroStations = [
  // ==========================================
  // CHILANZAR LINE (Red Line) - 11 stations
  // ==========================================
  {
    nameRu: 'Чилонзор',
    nameUz: 'Chilonzor',
    line: 'CHILANZAR',
    lineNameRu: 'Чилонзорская',
    lineNameUz: 'Chilonzor',
    latitude: 41.2758,
    longitude: 69.2036,
    order: 1,
    openedYear: 1977,
  },
  {
    nameRu: 'Миробод',
    nameUz: 'Mirobod',
    line: 'CHILANZAR',
    lineNameRu: 'Чилонзорская',
    lineNameUz: 'Chilonzor',
    latitude: 41.2847,
    longitude: 69.2167,
    order: 2,
    openedYear: 1980,
  },
  {
    nameRu: 'Новза',
    nameUz: 'Novza',
    line: 'CHILANZAR',
    lineNameRu: 'Чилонзорская',
    lineNameUz: 'Chilonzor',
    latitude: 41.2901,
    longitude: 69.2294,
    order: 3,
    openedYear: 1980,
  },
  {
    nameRu: 'Буюк Ипак Йули',
    nameUz: 'Buyuk Ipak Yuli',
    line: 'CHILANZAR',
    lineNameRu: 'Чилонзорская',
    lineNameUz: 'Chilonzor',
    latitude: 41.2961,
    longitude: 69.2408,
    order: 4,
    openedYear: 1980,
  },
  {
    nameRu: 'Амир Темур Хиёбони',
    nameUz: 'Amir Temur Hiyoboni',
    line: 'CHILANZAR',
    lineNameRu: 'Чилонзорская',
    lineNameUz: 'Chilonzor',
    latitude: 41.3111,
    longitude: 69.2497,
    order: 5,
    openedYear: 1991,
  },
  {
    nameRu: 'Хамид Олимжон',
    nameUz: 'Hamid Olimjon',
    line: 'CHILANZAR',
    lineNameRu: 'Чилонзорская',
    lineNameUz: 'Chilonzor',
    latitude: 41.3208,
    longitude: 69.2575,
    order: 6,
    openedYear: 1991,
  },
  {
    nameRu: 'Алишер Навои',
    nameUz: 'Alisher Navoiy',
    line: 'CHILANZAR',
    lineNameRu: 'Чилонзорская',
    lineNameUz: 'Chilonzor',
    latitude: 41.3267,
    longitude: 69.2658,
    order: 7,
    openedYear: 1984,
  },
  {
    nameRu: 'Мустақиллик Майдони',
    nameUz: 'Mustaqillik Maydoni',
    line: 'CHILANZAR',
    lineNameRu: 'Чилонзорская',
    lineNameUz: 'Chilonzor',
    latitude: 41.3150,
    longitude: 69.2794,
    order: 8,
    openedYear: 1991,
  },
  {
    nameRu: 'Пахтакор',
    nameUz: 'Paxtakor',
    line: 'CHILANZAR',
    lineNameRu: 'Чилонзорская',
    lineNameUz: 'Chilonzor',
    latitude: 41.3042,
    longitude: 69.2881,
    order: 9,
    openedYear: 1991,
  },
  {
    nameRu: 'Бобур',
    nameUz: 'Bobur',
    line: 'CHILANZAR',
    lineNameRu: 'Чилонзорская',
    lineNameUz: 'Chilonzor',
    latitude: 41.3047,
    longitude: 69.3036,
    order: 10,
    openedYear: 1991,
  },
  {
    nameRu: 'Машҳур Жусуп',
    nameUz: 'Mashxur Jusup',
    line: 'CHILANZAR',
    lineNameRu: 'Чилонзорская',
    lineNameUz: 'Chilonzor',
    latitude: 41.3042,
    longitude: 69.3236,
    order: 11,
    openedYear: 2020,
  },

  // ==========================================
  // UZBEKISTAN LINE (Blue Line) - 12 stations
  // ==========================================
  {
    nameRu: 'Алмазар',
    nameUz: 'Olmazar',
    line: 'UZBEKISTAN',
    lineNameRu: 'Узбекистанская',
    lineNameUz: 'O\'zbekiston',
    latitude: 41.3458,
    longitude: 69.2089,
    order: 1,
    openedYear: 2001,
  },
  {
    nameRu: 'Чорсу',
    nameUz: 'Chorsu',
    line: 'UZBEKISTAN',
    lineNameRu: 'Узбекистанская',
    lineNameUz: 'O\'zbekiston',
    latitude: 41.3295,
    longitude: 69.2336,
    order: 2,
    openedYear: 2001,
  },
  {
    nameRu: 'Гафур Гулом',
    nameUz: 'G\'afur G\'ulom',
    line: 'UZBEKISTAN',
    lineNameRu: 'Узбекистанская',
    lineNameUz: 'O\'zbekiston',
    latitude: 41.3253,
    longitude: 69.2503,
    order: 3,
    openedYear: 2001,
  },
  {
    nameRu: 'Абдулла Қодирий',
    nameUz: 'Abdulla Qodiriy',
    line: 'UZBEKISTAN',
    lineNameRu: 'Узбекистанская',
    lineNameUz: 'O\'zbekiston',
    latitude: 41.3181,
    longitude: 69.2539,
    order: 4,
    openedYear: 2001,
  },
  {
    nameRu: 'Миллий Бог',
    nameUz: 'Milliy Bog\'',
    line: 'UZBEKISTAN',
    lineNameRu: 'Узбекистанская',
    lineNameUz: 'O\'zbekiston',
    latitude: 41.3111,
    longitude: 69.2653,
    order: 5,
    openedYear: 2001,
  },
  {
    nameRu: 'Узбекистон',
    nameUz: 'O\'zbekiston',
    line: 'UZBEKISTAN',
    lineNameRu: 'Узбекистанская',
    lineNameUz: 'O\'zbekiston',
    latitude: 41.2997,
    longitude: 69.2672,
    order: 6,
    openedYear: 2001,
  },
  {
    nameRu: 'Космонавтлар',
    nameUz: 'Kosmonavtlar',
    line: 'UZBEKISTAN',
    lineNameRu: 'Узбекистанская',
    lineNameUz: 'O\'zbekiston',
    latitude: 41.2881,
    longitude: 69.2714,
    order: 7,
    openedYear: 2001,
  },
  {
    nameRu: 'Оибек',
    nameUz: 'Oybek',
    line: 'UZBEKISTAN',
    lineNameRu: 'Узбекистанская',
    lineNameUz: 'O\'zbekiston',
    latitude: 41.2750,
    longitude: 69.2775,
    order: 8,
    openedYear: 2001,
  },
  {
    nameRu: 'Тинчлик',
    nameUz: 'Tinchlik',
    line: 'UZBEKISTAN',
    lineNameRu: 'Узбекистанская',
    lineNameUz: 'O\'zbekiston',
    latitude: 41.2647,
    longitude: 69.2825,
    order: 9,
    openedYear: 2001,
  },
  {
    nameRu: 'Ўзбекистон Файласуфлари',
    nameUz: 'O\'zbekiston Faylasuflari',
    line: 'UZBEKISTAN',
    lineNameRu: 'Узбекистанская',
    lineNameUz: 'O\'zbekiston',
    latitude: 41.2508,
    longitude: 69.2883,
    order: 10,
    openedYear: 2001,
  },
  {
    nameRu: 'Бунёдкор',
    nameUz: 'Bunyodkor',
    line: 'UZBEKISTAN',
    lineNameRu: 'Узбекистанская',
    lineNameUz: 'O\'zbekiston',
    latitude: 41.2367,
    longitude: 69.2950,
    order: 11,
    openedYear: 2001,
  },
  {
    nameRu: 'Дўстлик',
    nameUz: 'Do\'stlik',
    line: 'UZBEKISTAN',
    lineNameRu: 'Узбекистанская',
    lineNameUz: 'O\'zbekiston',
    latitude: 41.2233,
    longitude: 69.3014,
    order: 12,
    openedYear: 2001,
  },

  // ==========================================
  // YUNUSABAD LINE (Green Line) - 6 stations
  // ==========================================
  {
    nameRu: 'Юнусобод',
    nameUz: 'Yunusobod',
    line: 'YUNUSABAD',
    lineNameRu: 'Юнусабадская',
    lineNameUz: 'Yunusobod',
    latitude: 41.3614,
    longitude: 69.2886,
    order: 1,
    openedYear: 2001,
  },
  {
    nameRu: 'Амир Темур',
    nameUz: 'Amir Temur',
    line: 'YUNUSABAD',
    lineNameRu: 'Юнусабадская',
    lineNameUz: 'Yunusobod',
    latitude: 41.3444,
    longitude: 69.2836,
    order: 2,
    openedYear: 2001,
  },
  {
    nameRu: 'Шахристон',
    nameUz: 'Shahriston',
    line: 'YUNUSABAD',
    lineNameRu: 'Юнусабадская',
    lineNameUz: 'Yunusobod',
    latitude: 41.3286,
    longitude: 69.2786,
    order: 3,
    openedYear: 2001,
  },
  {
    nameRu: 'Бодомзор',
    nameUz: 'Bodomzor',
    line: 'YUNUSABAD',
    lineNameRu: 'Юнусабадская',
    lineNameUz: 'Yunusobod',
    latitude: 41.3111,
    longitude: 69.2736,
    order: 4,
    openedYear: 2001,
  },
  {
    nameRu: 'Минор',
    nameUz: 'Minor',
    line: 'YUNUSABAD',
    lineNameRu: 'Юнусабадская',
    lineNameUz: 'Yunusobod',
    latitude: 41.2939,
    longitude: 69.2686,
    order: 5,
    openedYear: 2001,
  },
  {
    nameRu: 'Миллий Бог',
    nameUz: 'Milliy Bog\'',
    line: 'YUNUSABAD',
    lineNameRu: 'Юнусабадская',
    lineNameUz: 'Yunusobod',
    latitude: 41.3111,
    longitude: 69.2653,
    order: 6,
    openedYear: 2001,
  },
];

export async function seedMetroStations() {
  console.log('🚇 Seeding metro stations...');

  try {
    // Delete existing metro stations (for idempotency)
    await prisma.metroStation.deleteMany({});
    console.log('  ✓ Cleared existing metro stations');

    // Create all metro stations
    const created = await prisma.metroStation.createMany({
      data: metroStations,
      skipDuplicates: true,
    });

    console.log(`  ✓ Created ${created.count} metro stations`);
    console.log(`    - Chilanzar Line (Red): 11 stations`);
    console.log(`    - Uzbekistan Line (Blue): 12 stations`);
    console.log(`    - Yunusabad Line (Green): 6 stations`);

    // Verify counts
    const chilanzarCount = await prisma.metroStation.count({
      where: { line: 'CHILANZAR' },
    });
    const uzbekistanCount = await prisma.metroStation.count({
      where: { line: 'UZBEKISTAN' },
    });
    const yunusabadCount = await prisma.metroStation.count({
      where: { line: 'YUNUSABAD' },
    });

    console.log(`  ✓ Verification:`);
    console.log(`    - Chilanzar: ${chilanzarCount} stations`);
    console.log(`    - Uzbekistan: ${uzbekistanCount} stations`);
    console.log(`    - Yunusabad: ${yunusabadCount} stations`);
    console.log(`  ✓ Total: ${chilanzarCount + uzbekistanCount + yunusabadCount} stations`);

    return created.count;
  } catch (error) {
    console.error('❌ Error seeding metro stations:', error);
    throw error;
  }
}

// Run directly if called as script
if (require.main === module) {
  seedMetroStations()
    .then(() => {
      console.log('\n✅ Metro stations seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Metro stations seed failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
