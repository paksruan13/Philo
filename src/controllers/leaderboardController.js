const { calculateLeaderboard, getStatistics } = require('../services/leaderboardService');

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await calculateLeaderboard();
    res.json(leaderboard);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: err.message });
  }
};

const getStatisticsData = async (req, res) => {
  try {
    const statistics = await getStatistics();
    res.json(statistics);
  } catch (err) {
    console.error('Error fetching statistics:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getLeaderboard,
  getStatistics: getStatisticsData
};