const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { authenticationToken, requireRole } = require('../middleware/auth'); 

router.get('/inventory/shirts', authenticationToken, saleController.getShirtInventory);
router.post('/shirts', authenticationToken, requireRole(['COACH', 'STAFF']), saleController.createSale);
router.delete('/shirts/:saleId', authenticationToken, requireRole(['COACH', 'STAFF']), saleController.deleteSale);
router.get('/shirts', authenticationToken, requireRole(['ADMIN', 'COACH', 'STAFF']), saleController.getAllSales);
router.get('/team/:teamId', authenticationToken, requireRole(['ADMIN', 'COACH', 'STAFF']), saleController.getTeamSales);
router.get('/recent', authenticationToken, requireRole(['ADMIN', 'COACH', 'STAFF']), saleController.getRecentSales);
router.get('/users', authenticationToken, requireRole(['COACH', 'STAFF']), saleController.getTeamUsers);

module.exports = router;