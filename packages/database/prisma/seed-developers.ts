import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function seedDevelopers() {
  console.log('🏗️  Seeding developers...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Clear existing developers data
  await prisma.developerProject.deleteMany();
  await prisma.developer.deleteMany();

  // Create 5 real estate developers in Uzbekistan
  const developers = await Promise.all([
    // 1. Tashkent City - Major developer
    prisma.developer.create({
      data: {
        name: 'Tashkent City',
        nameUz: 'Toshkent Siti',
        slug: 'tashkent-city',
        logo: 'https://tashkent-city.uz/images/logo.png',
        descriptionRu: 'Крупнейший застройщик в Узбекистане. Специализируемся на строительстве элитных жилых комплексов класса А+ в центре Ташкента. Более 15 лет опыта на рынке недвижимости.',
        descriptionUz: 'O\'zbekistondagi eng yirik qurilish kompaniyasi. Toshkent markazida A+ sinf elit turar-joy majmualari qurishda ixtisoslashganmiz. 15 yildan ortiq tajriba.',
        licenseNumber: 'LC-2008-001234',
        innTin: '123456789',
        legalEntity: 'ООО "Tashkent City Development"',
        legalAddress: 'г. Ташкент, Мирабадский район, ул. Шахрисабз, 25',
        establishedYear: 2008,
        phone: '+998712345678',
        email: 'info@tashkent-city.uz',
        website: 'https://tashkent-city.uz',
        telegram: '@tashkentcity',
        whatsapp: '+998901234567',
        city: 'Ташкент',
        officeAddress: 'г. Ташкент, Мирабадский район, ул. Шахрисабз, 25, офис 101',
        verified: true,
        featured: true,
        rating: 4.8,
        reviewCount: 234,
        totalProjects: 12,
        totalUnits: 2450,
        unitsSold: 1820,
        unitsAvailable: 630,
      },
    }),

    // 2. Boulevard - Premium developer
    prisma.developer.create({
      data: {
        name: 'Boulevard',
        nameUz: 'Bulvar',
        slug: 'boulevard',
        logo: 'https://boulevard.uz/images/logo.png',
        descriptionRu: 'Boulevard - застройщик премиум класса, создающий современные жилые комплексы с развитой инфраструктурой. Наши проекты отличаются качеством строительства и комфортом проживания.',
        descriptionUz: 'Boulevard - premium sinf qurilish kompaniyasi, rivojlangan infratukturaga ega zamonaviy turar-joy majmualarini yaratmoqda. Bizning loyihalarimiz qurilish sifati va yashash qulayligi bilan ajralib turadi.',
        licenseNumber: 'LC-2010-005678',
        innTin: '234567890',
        legalEntity: 'ООО "Boulevard Development"',
        legalAddress: 'г. Ташкент, Юнусабадский район, ул. Амира Темура, 107',
        establishedYear: 2010,
        phone: '+998712345679',
        email: 'info@boulevard.uz',
        website: 'https://boulevard.uz',
        telegram: '@boulevarduz',
        whatsapp: '+998901234568',
        city: 'Ташкент',
        officeAddress: 'г. Ташкент, Юнусабадский район, ул. Амира Темура, 107',
        verified: true,
        featured: true,
        rating: 4.7,
        reviewCount: 189,
        totalProjects: 8,
        totalUnits: 1680,
        unitsSold: 1230,
        unitsAvailable: 450,
      },
    }),

    // 3. Makro Development - Mid-range developer
    prisma.developer.create({
      data: {
        name: 'Makro Development',
        nameUz: 'Makro Development',
        slug: 'makro-development',
        logo: null,
        descriptionRu: 'Строим доступное жилье комфорт-класса для семей со средним доходом. Фокусируемся на оптимальном соотношении цены и качества. Более 200 довольных семей уже живут в наших домах.',
        descriptionUz: 'O\'rtacha daromadli oilalar uchun qulay narxdagi komfort-sinf uy-joylar quramiz. Narx va sifatning optimal nisbatiga e\'tibor qaratamiz. 200 dan ortiq baxtli oilalar bizning uylarimizda yashaydi.',
        licenseNumber: 'LC-2015-009876',
        innTin: '345678901',
        legalEntity: 'ООО "Makro Development"',
        legalAddress: 'г. Ташкент, Яккасарайский район, ул. Бабура, 45',
        establishedYear: 2015,
        phone: '+998712345680',
        email: 'info@makro.uz',
        website: 'https://makro.uz',
        telegram: '@makrouz',
        whatsapp: null,
        city: 'Ташкент',
        officeAddress: 'г. Ташкент, Яккасарайский район, ул. Бабура, 45',
        verified: true,
        featured: false,
        rating: 4.5,
        reviewCount: 87,
        totalProjects: 5,
        totalUnits: 920,
        unitsSold: 658,
        unitsAvailable: 262,
      },
    }),

    // 4. Samarkand Residence - Regional developer
    prisma.developer.create({
      data: {
        name: 'Samarkand Residence',
        nameUz: 'Samarqand Residence',
        slug: 'samarkand-residence',
        logo: null,
        descriptionRu: 'Ведущий застройщик Самарканда, специализирующийся на современных жилых комплексах. Сочетаем традиционную архитектуру Самарканда с современными стандартами комфорта.',
        descriptionUz: 'Samarqandning yetakchi qurilish kompaniyasi, zamonaviy turar-joy majmualari qurishda ixtisoslashgan. Samarqandning an\'anaviy me\'morchiligini zamonaviy qulaylik standartlari bilan birlashtiramiz.',
        licenseNumber: 'LC-2018-012345',
        innTin: '456789012',
        legalEntity: 'ООО "Samarkand Residence"',
        legalAddress: 'г. Самарканд, ул. Регистан, 12',
        establishedYear: 2018,
        phone: '+998662345678',
        email: 'info@samarkand-residence.uz',
        website: null,
        telegram: '@samarkandres',
        whatsapp: '+998901234570',
        city: 'Самарканд',
        officeAddress: 'г. Самарканд, ул. Регистан, 12',
        verified: true,
        featured: false,
        rating: 4.6,
        reviewCount: 52,
        totalProjects: 3,
        totalUnits: 480,
        unitsSold: 312,
        unitsAvailable: 168,
      },
    }),

    // 5. Bukhara City - New developer
    prisma.developer.create({
      data: {
        name: 'Bukhara City',
        nameUz: 'Buxoro Siti',
        slug: 'bukhara-city',
        logo: null,
        descriptionRu: 'Новый застройщик на рынке Бухары. Строим современные жилые комплексы с применением инновационных технологий и материалов. Первый проект сдан в срок с высоким качеством.',
        descriptionUz: 'Buxoro bozoridagi yangi qurilish kompaniyasi. Innovatsion texnologiyalar va materiallardan foydalanib zamonaviy turar-joy majmualarini quramiz. Birinchi loyiha yuqori sifat bilan o\'z vaqtida topshirildi.',
        licenseNumber: 'LC-2022-015678',
        innTin: '567890123',
        legalEntity: 'ООО "Bukhara City Development"',
        legalAddress: 'г. Бухара, ул. Накшбанди, 78',
        establishedYear: 2022,
        phone: '+998652345678',
        email: 'info@bukhara-city.uz',
        website: 'https://bukhara-city.uz',
        telegram: null,
        whatsapp: '+998901234571',
        city: 'Бухара',
        officeAddress: 'г. Бухара, ул. Накшбанди, 78',
        verified: false,
        featured: false,
        rating: 4.3,
        reviewCount: 15,
        totalProjects: 2,
        totalUnits: 240,
        unitsSold: 145,
        unitsAvailable: 95,
      },
    }),
  ]);

  console.log(`✅ Created ${developers.length} developers`);

  return developers;
}

// Run if executed directly
if (require.main === module) {
  seedDevelopers()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
