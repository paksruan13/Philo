const express = require('express');
const router = express.Router();
const { authenticationToken, requireRole } = require('../middleware/auth');
const staffController = require('../controllers/staffController');


router.use(authenticationToken);
router.use(requireRole(['STAFF', 'ADMIN'])); 


router.get('/dashboard', staffController.getDashboard);


router.post('/award-points', staffController.awardPoints);
router.get('/manual-points-history', staffController.getManualPointsHistory);


router.post('/sell-product', staffController.sellProduct);
router.get('/sales', staffController.getSales);

module.exports = router;
