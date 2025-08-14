const express = require('express');
const { authenticationToken, requireRole } = require('../middleware/auth');
const router = express.Router();
const coachController = require('../controllers/coachController');
const coachAuth = [authenticationToken, requireRole(['COACH'])];

// Award points to a user
router.post('/award-points', coachAuth, coachController.awardManualPoints);

// Get all pending submissions
router.get('/pending-submissions', coachAuth, coachController.getPendingSubmissions);
router.post('/submissions/:id/approve', coachAuth, coachController.approveSubmission);
router.post('/submissions/:id/reject', coachAuth, coachController.rejectSubmission);

module.exports = router;