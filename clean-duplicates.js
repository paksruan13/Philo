const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDuplicates() {
  try {
    console.log('=== Cleaning Duplicate Donation Records ===');
    
    // Get all donations and product sales
    const donations = await prisma.donation.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    const productSales = await prisma.productSale.findMany({
      orderBy: { soldAt: 'desc' }
    });
    
    console.log(`Found ${donations.length} donations and ${productSales.length} product sales`);
    
    // Find and remove duplicate donations that match product sales
    let removed = 0;
    
    for (const donation of donations) {
      // Check if this donation matches a product sale (same amount, user, team, and similar timestamp)
      const matchingSale = productSales.find(sale => {
        const sameAmount = Math.abs(sale.amountPaid - donation.amount) < 0.01;
        const sameUser = sale.userId === donation.userId;
        const sameTeam = sale.teamId === donation.teamId;
        const sameTime = Math.abs(new Date(sale.soldAt).getTime() - new Date(donation.createdAt).getTime()) < 120000; // Within 2 minutes
        
        return sameAmount && sameUser && sameTeam && sameTime;
      });
      
      if (matchingSale) {
        console.log(`Removing duplicate donation: $${donation.amount} (matches ProductSale ${matchingSale.id})`);
        
        await prisma.donation.delete({
          where: { id: donation.id }
        });
        
        removed++;
      }
    }
    
    console.log(`\nRemoved ${removed} duplicate donation records`);
    
    // Check final state
    const remainingDonations = await prisma.donation.findMany();
    const totalRemaining = remainingDonations.reduce((sum, d) => sum + d.amount, 0);
    
    console.log(`\nFinal state: ${remainingDonations.length} donations totaling $${totalRemaining}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDuplicates();
