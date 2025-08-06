const announcementService = require('../services/announcementService');

const createAnnouncement = async (req, res) => {
  await announcementService.create(req, res);
};

const getTeamAnnouncements = async (req, res) => {
  await announcementService.getTeam(req, res);
};

const deleteAnnouncement = async (req, res) => {
  await announcementService.delete(req, res);
};

module.exports = {
  createAnnouncement,
  getTeamAnnouncements,
  deleteAnnouncement,
};
