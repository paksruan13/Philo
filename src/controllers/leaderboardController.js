const { calculateLeaderboard, getStatistics } = require('../services/lambdaLeaderboardService');
const { prisma } = require('../config/lambdaDatabase');

const getLeaderboard = async (req, res) => {
  try {
    
    const latestSnapshot = await prisma.leaderboardSnapshot.findFirst({
      orderBy: { calculatedAt: 'desc' },
      where: { period: 'daily' }
    });

    if (latestSnapshot) {
      
      res.json({
        leaderboard: latestSnapshot.rankings,
        lastUpdated: latestSnapshot.calculatedAt,
        nextUpdate: getNextMidnight(),
        isCached: true,
        period: latestSnapshot.period
      });
    } else {
      
      const leaderboard = await calculateLeaderboard();
      
      res.json({
        leaderboard: leaderboard,
        lastUpdated: new Date(),
        nextUpdate: getNextMidnight(),
        isCached: false,
        period: 'on-demand'
      });
    }
  } catch (err) {
    console.error(' Error fetching leaderboard:', err);
    res.status(500).json({ 
      error: err.message,
      message: 'Failed to fetch leaderboard data'
    });
  }
};


const getNextMidnight = () => {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow;
};

const getStatisticsData = async (req, res) => {
  try {
    const statistics = await getStatistics();
    res.json(statistics);
  } catch (err) {
    console.error(' Error fetching statistics:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getLeaderboard,
  getStatistics: getStatisticsData
};