import { PrismaClient } from '@repo/database';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createDeveloperUser() {
  const passwordHash = await bcrypt.hash('Test123!', 10);

  // Find or create Tashkent City developer
  let developer = await prisma.developer.findUnique({
    where: { slug: 'tashkent-city' },
  });

  if (!developer) {
    console.error('Tashkent City developer not found. Run seed-developers.ts first');
    process.exit(1);
  }

  // Create developer admin user
  const user = await prisma.user.upsert({
    where: { email: 'developer@tashkent-city.uz' },
    update: {},
    create: {
      email: 'developer@tashkent-city.uz',
      passwordHash,
      firstName: 'Test',
      lastName: 'Developer',
      role: 'DEVELOPER_ADMIN',
      developerId: developer.id,
    },
  });

  console.log('✅ Developer user created:');
  console.log('   Email: developer@tashkent-city.uz');
  console.log('   Password: Test123!');
  console.log('   Role: DEVELOPER_ADMIN');
  console.log('   Developer: Tashkent City');
}

createDeveloperUser()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
