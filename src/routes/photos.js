const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');
const upload = require('../middleware/upload');
const { authenticationToken, requireRole } = require('../middleware/auth');
const adminCoachAuth = requireRole(['COACH', 'ADMIN', 'STUDENT']);

router.use(authenticationToken)

router.post('/', upload.single('file'), photoController.uploadPhoto);
router.get('/team/:teamId', photoController.getTeamPhotos);
router.get('/:id/view', photoController.getSignedUrl);

router.get('/pending', adminCoachAuth, photoController.getPendingPhotos);
router.get('/approved', adminCoachAuth, photoController.getApprovedPhotos);
router.put('/:id/approve', adminCoachAuth, photoController.approvePhoto);
router.put('/:id/reject', adminCoachAuth, photoController.rejectPhoto);

module.exports = router;