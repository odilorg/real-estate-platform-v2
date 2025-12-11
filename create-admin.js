const { PrismaClient } = require('./packages/database/dist/index.js');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if admin user exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log('   Email:', existingAdmin.email);
      console.log('   Name:', existingAdmin.firstName, existingAdmin.lastName);
      console.log('\nYou can login with this account to access the admin panel at http://localhost:3000/admin');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@realtor.uz',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        phone: '+998901234567',
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Email: admin@realtor.uz');
    console.log('   Password: admin123');
    console.log('\nYou can now login at http://localhost:3000/auth/login');
    console.log('Then navigate to http://localhost:3000/admin to access the admin panel');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
