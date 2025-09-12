const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDefaultAdmin() {
  try {
    console.log('🔧 Creating default admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Default admin credentials
    const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@admin.com';
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!';
    const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: 'Default Admin',
        email: defaultAdminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        mustChangePassword: true, // Force password change on first login
        isActive: true
      }
    });

    console.log('✅ Default admin user created successfully!');
    console.log('📧 Email:', defaultAdminEmail);
    console.log('🔑 Password:', defaultAdminPassword);
    console.log('⚠️  IMPORTANT: Change password on first login!');
    
    return admin;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

async function main() {
  try {
    await createDefaultAdmin();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createDefaultAdmin };
