const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticationToken, requireRole } = require('../middleware/auth');


router.get('/', authenticationToken, activityController.getActivities);
router.get('/:id', authenticationToken, activityController.getActivityForSubmission);


router.get('/submission/my', authenticationToken, requireRole(['STUDENT']), activityController.getMySubmissions);
router.get('/:id/submit', authenticationToken, requireRole(['STUDENT']), activityController.getActivityForSubmission);
router.post('/:id/submit', authenticationToken, requireRole(['STUDENT']), activityController.submitActivityResponse);
router.put('/submission/:submissionId', authenticationToken, requireRole(['STUDENT']), activityController.updateActivitySubmission);
router.delete('/:id', authenticationToken, requireRole(['ADMIN']), activityController.deleteActivity);

module.exports = router;