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

const createGlobalAnnouncement = async (req, res) => {
  await announcementService.createGlobal(req, res);
};

const getGlobalAnnouncements = async (req, res) => {
  await announcementService.getGlobal(req, res);
};

const deleteGlobalAnnouncement = async (req, res) => {
  await announcementService.deleteGlobal(req, res);
};

module.exports = {
  createAnnouncement,
  getTeamAnnouncements,
  deleteAnnouncement,
  createGlobalAnnouncement,
  getGlobalAnnouncements,
  deleteGlobalAnnouncement,
};
