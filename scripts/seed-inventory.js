const { PrismaClient } = require('@prisma/client');

async function seedInventory() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🌱 Seeding shirt inventory...');

    // Standard shirt sizes
    const standardSizes = [
      { size: 'XS', quantity: 0 },
      { size: 'S', quantity: 20 },
      { size: 'M', quantity: 30 },
      { size: 'L', quantity: 25 },
      { size: 'XL', quantity: 15 },
      { size: 'XXL', quantity: 10 }
    ];

    // Check if inventory already exists
    const existingInventory = await prisma.shirtInventory.findMany();
    
    if (existingInventory.length > 0) {
      console.log('📦 Inventory already exists. Current inventory:');
      existingInventory.forEach(item => {
        console.log(`  - Size ${item.size}: ${item.quantity} available`);
      });
      
      // Ask if user wants to reset (in production, you'd handle this differently)
      console.log('\n💡 To update inventory quantities, use the Admin Dashboard');
      return;
    }

    // Create inventory items
    for (const item of standardSizes) {
      await prisma.shirtInventory.create({
        data: {
          size: item.size,
          quantity: item.quantity
        }
      });
      console.log(`✅ Created inventory for size ${item.size}: ${item.quantity} units`);
    }

    // Set default config if it doesn't exist
    const existingConfig = await prisma.shirtConfig.findFirst();
    if (!existingConfig) {
      // Create a dummy admin user for the config record (you'll need to update this with a real admin ID)
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });

      if (adminUser) {
        await prisma.shirtConfig.create({
          data: {
            price: 15.00,
            pointsPerShirt: 10,
            updatedBy: adminUser.id
          }
        });
        console.log('💰 Set default shirt config: $15.00, 10 points per shirt');
      } else {
        console.log('⚠️  No admin user found. Please create an admin user first, then set the shirt config.');
      }
    }

    console.log('🎉 Inventory seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - ${standardSizes.length} shirt sizes created`);
    console.log(`  - Total initial inventory: ${standardSizes.reduce((sum, item) => sum + item.quantity, 0)} shirts`);
    console.log('  - Default config: $15.00, 10 points per shirt');

  } catch (error) {
    console.error('❌ Error seeding inventory:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedInventory()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedInventory };
