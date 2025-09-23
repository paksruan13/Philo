const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticationToken } = require('../middleware/auth');


router.get('/global', announcementController.getGlobalAnnouncements);
router.post('/global', authenticationToken, announcementController.createGlobalAnnouncement);
router.delete('/global/:announcementId', authenticationToken, announcementController.deleteGlobalAnnouncement);


router.get('/teams/:teamId', announcementController.getTeamAnnouncements);
router.post('/teams/:teamId', authenticationToken, announcementController.createAnnouncement);
router.delete('/teams/:teamId/:announcementId', authenticationToken, announcementController.deleteAnnouncement);

module.exports = router;
