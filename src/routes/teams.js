const express = require('express');
const router  = express.Router();

// point at the correct file and remove the unused destructuring
const teamController = require('../controllers/teamController');
const { authenticationToken, requireRole } = require('../middleware/auth');


//Student Routes
router.get('/my-team', authenticationToken, requireRole(['STUDENT']), teamController.getMyTeamDashboard);
router.get('/my-team/activities', authenticationToken, requireRole(['STUDENT']), teamController.getMyTeamActivities);


//Public Routes
router.get('/', teamController.getAllTeams);
router.get('/:id/score', teamController.getTeamScore);

//Admin Routes
router.get('/admin', authenticationToken, requireRole(['ADMIN']), teamController.getAdminTeams);
router.post('/', authenticationToken, requireRole(['ADMIN']), teamController.createTeam);
router.put('/admin/:id', authenticationToken, requireRole(['ADMIN']), teamController.updateAdminTeam);
router.put('/:teamId/coach', authenticationToken, requireRole(['ADMIN']), teamController.assignCoach);


module.exports = router;