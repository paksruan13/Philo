const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDonations() {
  try {
    console.log('Checking donations in database...');
    
    // Get all donations
    const donations = await prisma.donation.findMany({
      select: {
        id: true,
        amount: true,
        currency: true,
        createdAt: true,
        team: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`Found ${donations.length} donations:`);
    donations.forEach((donation) => {
      console.log(`- $${donation.amount} from ${donation.user?.name || 'Unknown'} to team ${donation.team.name} on ${donation.createdAt}`);
    });

    // Get aggregate total
    const totalResult = await prisma.donation.aggregate({
      _sum: {
        amount: true
      }
    });

    console.log(`\nTotal donations: $${totalResult._sum.amount || 0}`);

    // Check team stats
    const teams = await prisma.team.findMany({
      select: {
        name: true,
        donations: {
          select: {
            amount: true
          }
        }
      }
    });

    console.log('\nTeam donation totals:');
    teams.forEach(team => {
      const total = team.donations.reduce((sum, d) => sum + d.amount, 0);
      console.log(`- ${team.name}: $${total}`);
    });

  } catch (error) {
    console.error('Error checking donations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDonations();
