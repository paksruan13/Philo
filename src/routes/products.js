const express = require('express');
const { authenticationToken, requireRole } = require('../middleware/auth');
const router = express.Router();
const productController = require('../controllers/productController');
const productSaleController = require('../controllers/productSaleController');

const adminAuth = [authenticationToken, requireRole(['ADMIN'])];
const coachAdminAuth = [authenticationToken, requireRole(['COACH', 'ADMIN', 'STAFF'])];

// Public endpoint to get all products (for donations page)
router.get('/public', productController.getAllProducts);

// Get all products with inventory (authenticated)
router.get('/', coachAdminAuth, productController.getAllProducts);

// Purchase ticket (public endpoint)
router.post('/purchase-ticket', productSaleController.purchaseTicket);

// Sell product
router.post('/sell', coachAdminAuth, productSaleController.sellProduct);

// Get coach's sales
router.get('/sales/coach', coachAdminAuth, productSaleController.getCoachSales);

// Delete a sale (coach only for their own sales)
router.delete('/sales/:saleId', coachAdminAuth, productSaleController.deleteSale);

// Update product inventory (admin only)
router.put('/inventory', adminAuth, productController.updateProductInventory);

// Create new product (admin only)
router.post('/', adminAuth, productController.createProduct);

// Update product details (admin only)
router.put('/:id', adminAuth, productController.updateProduct);

// Delete product (admin only)
router.delete('/:id', adminAuth, productController.deleteProduct);

// Get product sales history
router.get('/sales', coachAdminAuth, productController.getProductSales);

module.exports = router;
