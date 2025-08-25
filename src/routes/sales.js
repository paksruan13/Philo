const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { authenticationToken, requireRole } = require('../middleware/auth'); 

router.get('/inventory/shirts', authenticationToken, saleController.getShirtInventory);
router.post('/shirts', authenticationToken, requireRole(['COACH']), saleController.createSale);
router.get('/shirts', authenticationToken, requireRole(['ADMIN', 'COACH']), saleController.getAllSales);
router.get('/team/:teamId', authenticationToken, requireRole(['ADMIN', 'COACH']), saleController.getTeamSales);
router.get('/recent', authenticationToken, requireRole(['ADMIN', 'COACH']), saleController.getRecentSales);



module.exports = router;