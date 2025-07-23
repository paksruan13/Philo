const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');
const upload = require('../middleware/upload');
const { authenticationToken } = require('../middleware/auth');

router.post('/', authenticationToken, upload.single('file'), photoController.uploadPhoto);
router.get('/', authenticationToken, photoController.getAllPhotos);
router.get('/pending', authenticationToken, photoController.getPendingPhotos);
router.get('/approved', authenticationToken, photoController.getApprovedPhotos);
router.put('/:id/approve', authenticationToken, photoController.approvePhoto);
router.put('/:id/reject', authenticationToken, photoController.rejectPhoto);

module.exports = router;