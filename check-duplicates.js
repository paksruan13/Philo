const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  try {
    console.log('=== Checking Database Records ===');
    
    const donations = await prisma.donation.findMany({
      orderBy: { createdAt: 'desc' }
    });
    console.log('Donations:', donations.length);
    donations.forEach(d => console.log(`  Donation: $${d.amount} - ${d.createdAt}`));
    
    const productSales = await prisma.productSale.findMany({
      orderBy: { soldAt: 'desc' }
    });
    console.log('\nProduct Sales:', productSales.length);
    productSales.forEach(p => console.log(`  ProductSale: $${p.amountPaid} - ${p.soldAt}`));
    
    const shirtSales = await prisma.shirtSale.findMany({
      orderBy: { soldAt: 'desc' }
    });
    console.log('\nShirt Sales:', shirtSales.length);
    shirtSales.forEach(s => console.log(`  ShirtSale: $${s.amountPaid} - ${s.soldAt}`));
    
    // Calculate totals
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    const totalProductSales = productSales.reduce((sum, p) => sum + p.amountPaid, 0);
    const totalShirtSales = shirtSales.reduce((sum, s) => sum + s.amountPaid, 0);
    
    console.log('\n=== Totals ===');
    console.log(`Total Donations: $${totalDonations}`);
    console.log(`Total Product Sales: $${totalProductSales}`);
    console.log(`Total Shirt Sales: $${totalShirtSales}`);
    console.log(`Combined Total: $${totalDonations + totalProductSales + totalShirtSales}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates();
