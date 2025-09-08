const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedShirtConfig() {
  try {
    console.log('🌱 Seeding shirt configuration...');
    
    // Check if config already exists
    const existingConfig = await prisma.shirtConfig.findFirst();
    
    if (existingConfig) {
      console.log('✅ Shirt config already exists:', {
        pointsPerShirt: existingConfig.pointsPerShirt,
        updatedAt: existingConfig.updatedAt
      });
      return;
    }
    
    // Find an admin user to assign as the creator
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }
    
    // Create default shirt config
    const config = await prisma.shirtConfig.create({
      data: {
        pointsPerShirt: 10, // Default 10 points per shirt
        updatedBy: adminUser.id
      }
    });
    
    console.log('✅ Successfully created shirt config:', {
      id: config.id,
      pointsPerShirt: config.pointsPerShirt,
      updatedBy: adminUser.name
    });
    
  } catch (error) {
    console.error('❌ Error seeding shirt config:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedShirtConfig();
}

module.exports = { seedShirtConfig };
