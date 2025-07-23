const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticationToken, requireRole } = require('../middleware/auth');


//General Routes
router.get('/', authenticationToken, activityController.getActivities);
router.get('/:id', authenticationToken, activityController.getActivityForSubmission);


//Activity Submission Routes
router.get('/submission/my', authenticationToken, requireRole(['STUDENT']), activityController.getMySubmissions);
router.get('/:id/submit', authenticationToken, requireRole(['STUDENT']), activityController.getActivityForSubmission);
router.post('/:id/submit', authenticationToken, requireRole(['STUDENT']), activityController.submitActivityResponse);
router.put('/submission/:submissionId', authenticationToken, requireRole(['STUDENT']), activityController.updateActivitySubmission);

module.exports = router;