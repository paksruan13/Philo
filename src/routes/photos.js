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
<<<<<<< HEAD
=======

router.post('/upload', authenticationToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      url: photoUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});
>>>>>>> origin/Coach/Admin

module.exports = router;