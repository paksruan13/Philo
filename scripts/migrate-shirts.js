const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateShirtData() {
  console.log('🔄 Migrating shirt data to new product system...');

  try {
    // Create shirt product if it doesn't exist
    const existingShirt = await prisma.product.findFirst({
      where: { type: 'SHIRT' }
    });

    let shirtProduct;
    if (!existingShirt) {
      // Get current shirt config for price/points
      const shirtConfig = await prisma.shirtConfig.findFirst();
      
      shirtProduct = await prisma.product.create({
        data: {
          name: 'Team Shirt',
          type: 'SHIRT',
          price: shirtConfig?.price || 15.00,
          points: shirtConfig?.pointsPerShirt || 10,
          isActive: true
        }
      });
      
      console.log('✅ Created shirt product:', shirtProduct.name);

      // Migrate shirt inventory to product inventory
      const shirtInventory = await prisma.shirtInventory.findMany();
      
      for (const inv of shirtInventory) {
        await prisma.productInventory.upsert({
          where: {
            productId_size: {
              productId: shirtProduct.id,
              size: inv.size
            }
          },
          update: {
            quantity: inv.quantity
          },
          create: {
            productId: shirtProduct.id,
            size: inv.size,
            quantity: inv.quantity
          }
        });
      }
      
      console.log(`✅ Migrated ${shirtInventory.length} shirt inventory records`);

      // Migrate shirt sales to product sales
      const shirtSales = await prisma.shirtSale.findMany();
      
      for (const sale of shirtSales) {
        await prisma.productSale.create({
          data: {
            productId: shirtProduct.id,
            size: sale.shirtSize,
            quantity: sale.quantity,
            userId: sale.userId,
            teamId: sale.teamId,
            paymentMethod: sale.paymentMethod,
            amountPaid: sale.amountPaid,
            coachId: sale.coachId,
            soldAt: sale.soldAt
          }
        });
      }
      
      console.log(`✅ Migrated ${shirtSales.length} shirt sales records`);
    } else {
      console.log('ℹ️ Shirt product already exists, skipping migration');
    }

    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrateShirtData()
  .catch((e) => {
    console.error('❌ Error during migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
