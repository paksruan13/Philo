const coachService = require('../services/coachService');

const awardManualPoints = async (req, res) => {
  await coachService.awardPoints(req, res);
};

const getManualPointsHistory = async (req, res) => {
  await coachService.getPointsHistory(req, res);
};

module.exports = {
  awardManualPoints,
  getManualPointsHistory,
};
