const { prisma } = require('../config/database');

const create = async (req, res) => {
  const { teamId } = req.params;
  const { title, content } = req.body;

  try {
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        teamId,
        createdById: req.user.id,
      },
      include: {
        createdBy: { select: { name: true } },
      },
    });
    res.status(201).json(announcement);
  } catch (err) {
    console.error('Error creating announcement:', err);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

const getTeam = async (req, res) => {
  const { teamId } = req.params;
  try {
    const announcements = await prisma.announcement.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { name: true } } },
    });
    res.json(announcements);
  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

const deleteAnnouncement = async (req, res) => {
  const { announcementId } = req.params;
  try {
    await prisma.announcement.delete({ where: { id: announcementId } });
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};

module.exports = {
  create,
  getTeam,
  delete: deleteAnnouncement,
};
