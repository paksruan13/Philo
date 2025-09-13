const { prisma } = require('../config/lambdaDatabase');

const calculateLeaderboard = async () => {
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      totalPoints: true,
      createdAt: true,
      _count:{ 
        select: {
          members: true,
          donations: true,
          photos: true,
          shirtSales: true,
          activitySubmissions: {where: {status: 'APPROVED'}}
        }
      },
      donations: {
        select: {amount: true}
      },
      shirtSales: {
        select: {quantity: true}
      },
      photos: {
        where: {approved: true}
      },
      activitySubmissions: {
        where: {status: 'APPROVED'},
        select: {pointsAwarded: true}
      }
    }
  });

const leaderboard = teams.map((team, index) => {
  const totalDonations = team.donations.reduce((sum, d) => sum + d.amount, 0);
  const donationCount = team._count.donations;
  const shirtSaleCount = team._count.shirtSales;
  const totalShirtSales = team.shirtSales.reduce((sum, s) => sum + s.quantity, 0);  
  const approvedPhotosCount = team.photos.length;
  const activityPoints = team.activitySubmissions.reduce((sum, s) => sum + (s.pointsAwarded || 0), 0);

  return {
    id: team.id,
    name: team.name,
    totalScore: team.totalPoints,
    rank: 0,
    memberCount: team._count.members,
    stats: {
      totalDonations,
      donationCount,
      shirtSaleCount,
      totalShirtSales,
      approvedPhotosCount,
      activityPoints
    }
  };
});

// Sort by total score and assign ranks
leaderboard.sort((a, b) => b.totalScore - a.totalScore);
leaderboard.forEach((team, index) => {
  team.rank = index + 1;
});

return leaderboard;
};

// Lambda-compatible version - no Socket.io emission
// Controllers can call this but it won't emit real-time updates
const emitLeaderboardUpdate = async (io = null) => {
  try {
    // Calculate leaderboard but don't emit since we're in Lambda
    const leaderboard = await calculateLeaderboard();
    
    // Log for debugging in Lambda
    console.log('📊 Leaderboard updated (Lambda mode - no real-time emission)');
    
    // Return the leaderboard data instead of emitting
    return leaderboard;
  } catch (err) {
    console.error('❌ Error calculating leaderboard update:', err);
    throw err;
  }
};

const getStatistics = async () => {
  try {
    // Get total donations (now includes both regular donations and external sales)
    const totalDonationsResult = await prisma.donation.aggregate({
      _sum: {
        amount: true
      }
    });

    // Get total product sales amount
    const totalProductSalesResult = await prisma.productSale.aggregate({
      _sum: {
        totalAmount: true
      }
    });

    // Get total shirt sales
    const totalShirtSalesResult = await prisma.shirtSale.aggregate({
      _sum: {
        quantity: true
      }
    });

    // Get total teams
    const totalTeams = await prisma.team.count();

    // Get total members
    const totalMembers = await prisma.user.count();

    // Get total approved photos
    const totalPhotos = await prisma.photo.count({
      where: {
        approved: true
      }
    });

    return {
      totalDonations: totalDonationsResult._sum.amount || 0,
      totalProductSales: totalProductSalesResult._sum.totalAmount || 0,
      totalShirtSales: totalShirtSalesResult._sum.quantity || 0,
      totalTeams,
      totalMembers,
      totalPhotos
    };
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    throw error;
  }
};

module.exports = {
  calculateLeaderboard,
  emitLeaderboardUpdate,
  getStatistics
};