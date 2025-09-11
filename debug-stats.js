const { getStatistics } = require('./src/services/leaderboardService');

async function testStatistics() {
  try {
    console.log('Testing statistics calculation...');
    const stats = await getStatistics();
    console.log('Statistics result:', JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testStatistics();
