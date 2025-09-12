const express = require('express');
const { authenticationToken, requireRole } = require('../middleware/auth');
const router = express.Router();
const coachController = require('../controllers/coachController');
const coachAuth = [authenticationToken, requireRole(['COACH', 'STAFF'])];
const coachAdminAuth = [authenticationToken, requireRole(['COACH', 'ADMIN', 'STAFF'])];

// Award points to a user (allow both coaches and admins)
router.post('/award-points', coachAdminAuth, coachController.awardManualPoints);

// Get manual points history
router.get('/manual-points-history', coachAdminAuth, coachController.getManualPointsHistory);

// Delete manual points award
router.delete('/manual-points/:id', coachAdminAuth, coachController.deleteManualPoints);

// Get all pending submissions
router.get('/pending-submissions', coachAdminAuth, coachController.getPendingSubmissions);

// Get all approved submissions
router.get('/approved-submissions', coachAdminAuth, coachController.getApprovedSubmissions);

// Submission management
router.post('/submissions/:id/approve', coachAdminAuth, coachController.approveSubmission);
router.post('/submissions/:id/reject', coachAdminAuth, coachController.rejectSubmission);
router.post('/submissions/:id/unapprove', coachAdminAuth, coachController.unapproveSubmission);
router.delete('/submissions/:id', coachAdminAuth, coachController.deleteSubmission);

// Get all students
router.get('/students', coachAdminAuth, coachController.getAllStudents);

module.exports = router;