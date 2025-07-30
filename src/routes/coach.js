const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const { authenticationToken, requireRole } = require('../middleware/auth');

router.post(
  '/manual-points',
  authenticationToken,
  requireRole(['COACH', 'ADMIN']),
  coachController.awardManualPoints
);

router.get(
  '/manual-points-history',
  authenticationToken,
  requireRole(['COACH', 'ADMIN']),
  coachController.getManualPointsHistory
);

module.exports = router;
