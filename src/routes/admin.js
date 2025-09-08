const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const saleController = require('../controllers/saleController');
const { authenticationToken, requireRole } = require('../middleware/auth');

// User management
router.get('/users', authenticationToken, requireRole(['ADMIN']), adminController.getAllUsers);
router.put('/users/:id', authenticationToken, requireRole(['ADMIN']), adminController.updateUser);

// Team management
router.get('/teams', authenticationToken, requireRole(['ADMIN']), adminController.getAllTeams);
router.post('/teams', authenticationToken, requireRole(['ADMIN']), adminController.createTeam);
router.put('/teams/:id', authenticationToken, requireRole(['ADMIN']), adminController.updateTeam);

// Coach management
router.get('/coaches', authenticationToken, requireRole(['ADMIN']), adminController.getCoaches);

// Activity management
router.get('/activity-categories', authenticationToken, requireRole(['ADMIN']), adminController.getActivityCategories);
router.post('/activity-categories', authenticationToken, requireRole(['ADMIN']), adminController.createActivityCategory);
router.get('/activities', authenticationToken, requireRole(['ADMIN']), adminController.getAllActivities);
router.post('/activities', authenticationToken, requireRole(['ADMIN']), adminController.createActivity);
router.put('/activities/:id', authenticationToken, requireRole(['ADMIN']), adminController.updateActivity);

// Inventory management
router.get('/inventory/shirts', authenticationToken, requireRole(['ADMIN']), saleController.getShirtInventory);
router.put('/inventory/shirts/update', authenticationToken, requireRole(['ADMIN']), saleController.updateInventory);
router.put('/inventory/shirts/config', authenticationToken, requireRole(['ADMIN']), saleController.updateShirtConfig);
router.post('/inventory/shirts/sizes', authenticationToken, requireRole(['ADMIN']), saleController.createShirtSize);
router.delete('/inventory/shirts/sizes/:size', authenticationToken, requireRole(['ADMIN']), saleController.deleteShirtSize);

// Points management
router.post('/teams/:teamId/reset-points', authenticationToken, requireRole(['ADMIN']), adminController.resetTeamPoints);

module.exports = router;