const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticationToken } = require('../middleware/auth');

router.post(
  '/teams/:teamId/announcements',
  authenticationToken,
  announcementController.createAnnouncement
);

router.get(
  '/teams/:teamId/announcements',
  authenticationToken,
  announcementController.getTeamAnnouncements
);

router.delete(
  '/announcements/:announcementId',
  authenticationToken,
  announcementController.deleteAnnouncement
);

module.exports = router;
