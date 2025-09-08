const { prisma } = require('../config/database');

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
      activityPoints,
      photoCount: team._count.photos,
      activitySubmissions: team._count.activitySubmissions,
    },
    createdAt: team.createdAt
  };
});

  leaderboard.sort((a, b) => b.totalScore - a.totalScore);
  
  return leaderboard.map((team, index) => ({
    ...team,
    rank: index + 1,
  }));
};

const emitLeaderboardUpdate = async (io) => {
  try {
    const leaderboard = await calculateLeaderboard();
    io.to('leaderboard').emit('leaderboard-update', leaderboard);
  } catch (err) {
    console.error('Error emitting leaderboard update:', err);
  }
};

module.exports = {
  calculateLeaderboard,
  emitLeaderboardUpdate
};