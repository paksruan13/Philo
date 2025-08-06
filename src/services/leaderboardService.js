const { prisma } = require('../config/database');

const calculateLeaderboard = async () => {
  const teams = await prisma.team.findMany({
    include: {
      donations: { select: { amount: true } },
      shirtSales: { select: { quantity: true } },
      photos: { select: { approved: true } },
      manualPoints: { select: { points: true } },
      // Add this to include activity submissions
      activitySubmissions: {
        where: { status: 'APPROVED' },
        select: { pointsAwarded: true }
      },
      _count: {
        select: {
          donations: true,
          shirtSales: true,
          photos: true,
          manualPoints: true,
          activitySubmissions: true
        }
      }
    }
  });

  const leaderboard = await Promise.all(teams.map(async team => {
    const totalDonations = team.donations.reduce((sum, donation) => sum + donation.amount, 0);
    const totalShirtPoints = team.shirtSales.reduce((sum, sale) => sum + (sale.quantity * 10), 0);
    const approvedPhotos = team.photos.filter(photo => photo.approved);
    const totalPhotoPoints = approvedPhotos.length * 50;
    const totalManualPoints = team.manualPoints.reduce((sum, mp) => sum + mp.points, 0);
    
    // Add activity points calculation
    const totalActivityPoints = team.activitySubmissions.reduce((sum, submission) => 
      sum + (submission.pointsAwarded || 0), 0);
    
    // Include activity points in total score
    const totalScore = totalDonations + totalShirtPoints + totalPhotoPoints + 
                      totalManualPoints + totalActivityPoints;
    
    const memberCount = await prisma.user.count({
      where: { teamId: team.id },
    });

    return {
      id: team.id,
      name: team.name,
      totalScore,
      totalDonations,
      totalShirtPoints,
      donationCount: team._count.donations,
      shirtSaleCount: team._count.shirtSales,
      totalPhotoPoints,
      approvedPhotosCount: approvedPhotos.length,
      photoCount: team._count.photos,
      totalManualPoints,
      manualPointsCount: team._count.manualPoints,
      totalActivityPoints, // Add this
      activitySubmissionsCount: team._count.activitySubmissions, // Add this
      memberCount,
      createdAt: team.createdAt
    };
  }));

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
    console.log('Leaderboard update emitted to clients');
  } catch (err) {
    console.error('Error emitting leaderboard update:', err);
  }
};

module.exports = {
  calculateLeaderboard,
  emitLeaderboardUpdate
};