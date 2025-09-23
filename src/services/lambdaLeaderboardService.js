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

leaderboard.sort((a, b) => b.totalScore - a.totalScore);
leaderboard.forEach((team, index) => {
  team.rank = index + 1;
});

return leaderboard;
};

const emitLeaderboardUpdate = async (io = null) => {
  try {
    const leaderboard = await calculateLeaderboard();
    return leaderboard;
  } catch (err) {
    console.error(' Error calculating leaderboard update:', err);
    throw err;
  }
};

const getStatistics = async () => {
  try {
    const totalDonationsResult = await prisma.donation.aggregate({
      _sum: {
        amount: true
      }
    });

    const totalProductSalesResult = await prisma.productSale.aggregate({
      _sum: {
        amountPaid: true
      }
    });

    const totalShirtSalesResult = await prisma.shirtSale.aggregate({
      _sum: {
        quantity: true
      }
    });

    const totalTeams = await prisma.team.count();

    const totalMembers = await prisma.user.count();

    const totalPhotos = await prisma.photo.count({
      where: {
        approved: true
      }
    });

    // Get donation goal from app config
    const donationGoalConfig = await prisma.appConfig.findUnique({
      where: {
        key: 'donationGoal'
      }
    });

    return {
      totalDonations: totalDonationsResult._sum.amount || 0,
      totalProductSales: totalProductSalesResult._sum.amountPaid || 0,
      totalShirtSales: totalShirtSalesResult._sum.quantity || 0,
      totalRaised: totalDonationsResult._sum.amount || 0, 
      totalTeams,
      totalMembers,
      totalPhotos,
      donationGoal: donationGoalConfig ? parseInt(donationGoalConfig.value) : 50000
    };
  } catch (error) {
    console.error(' Error fetching statistics:', error);
    throw error;
  }
};

module.exports = {
  calculateLeaderboard,
  emitLeaderboardUpdate,
  getStatistics
};