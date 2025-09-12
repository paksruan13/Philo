const express = require('express');
const router = express.Router();
const { authenticationToken, requireRole } = require('../middleware/auth');
const staffController = require('../controllers/staffController');

// All staff routes require STAFF role
router.use(authenticationToken);
router.use(requireRole(['STAFF', 'ADMIN'])); // Allow ADMIN access too

// Staff dashboard routes
router.get('/dashboard', staffController.getDashboard);

// Points management
router.post('/award-points', staffController.awardPoints);
router.get('/manual-points-history', staffController.getManualPointsHistory);

// Product sales
router.post('/sell-product', staffController.sellProduct);
router.get('/sales', staffController.getSales);

module.exports = router;
