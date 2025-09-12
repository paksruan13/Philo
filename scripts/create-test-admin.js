const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const createTestAdmin = async () => {
  try {
    console.log('🔍 Checking for test admin account...');
    
    // Check if test admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@sigepbounce.com' }
    });

    if (existingAdmin) {
      console.log('✅ Test admin account already exists');
      return;
    }

    // Create test admin account
    const hashedPassword = await bcrypt.hash('TestAdmin123!', 12);
    
    const testAdmin = await prisma.user.create({
      data: {
        name: 'Test Admin',
        email: 'admin@sigepbounce.com',
        password: hashedPassword,
        role: 'ADMIN',
        mustChangePassword: false, // Don't force password change for testing
      }
    });

    console.log('✅ Test admin account created successfully');
    console.log('📧 Email: admin@sigepbounce.com');
    console.log('🔑 Password: TestAdmin123!');
    console.log('👤 Role: ADMIN');
    
  } catch (error) {
    console.error('❌ Error creating test admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Export the function for use in other modules
module.exports = createTestAdmin;

// Allow direct execution of script
if (require.main === module) {
  createTestAdmin()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}