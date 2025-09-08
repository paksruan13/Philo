const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedProducts() {
  console.log('🌱 Seeding products...');

  // Create products
  const hoodie = await prisma.product.upsert({
    where: { id: 'hoodie-1' },
    update: {},
    create: {
      id: 'hoodie-1',
      name: 'Team Hoodie',
      type: 'HOODIE',
      price: 45.00,
      points: 25,
      isActive: true
    }
  });

  const pants = await prisma.product.upsert({
    where: { id: 'pants-1' },
    update: {},
    create: {
      id: 'pants-1',
      name: 'Team Sweatpants',
      type: 'PANTS',
      price: 35.00,
      points: 20,
      isActive: true
    }
  });

  console.log('✅ Created products:', hoodie.name, pants.name);

  // Seed inventory for both products
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const defaultQuantity = 50;

  for (const product of [hoodie, pants]) {
    console.log(`🏷️ Seeding inventory for ${product.name}...`);
    
    for (const size of sizes) {
      await prisma.productInventory.upsert({
        where: { 
          productId_size: {
            productId: product.id,
            size: size
          }
        },
        update: {},
        create: {
          productId: product.id,
          size: size,
          quantity: defaultQuantity
        }
      });
    }
    
    console.log(`✅ Seeded ${sizes.length} sizes for ${product.name}`);
  }

  console.log('🎉 Product seeding completed!');
}

seedProducts()
  .catch((e) => {
    console.error('❌ Error seeding products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
