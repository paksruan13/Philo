const { prisma } = require('../config/database');

const create = async (req, res) => {
  const { teamId } = req.params;
  const { title, content } = req.body;

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        teamId,
        createdById: req.user.id,
      },
      include: {
        createdBy: { select: { 
          id: true,
          name: true } },
      },
    });
    return res.status(201).json(announcement);
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
  const { teamId, announcementId } = req.params;
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId }
    });
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    await prisma.announcement.delete({ where: { id: announcementId } });
    return res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};

const createGlobal = async (req, res) => {
  const { title, content } = req.body;

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only allow ADMIN users to create global announcements
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can create global announcements' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        isGlobal: true,
        createdById: req.user.id,
      },
      include: {
        createdBy: { 
          select: { 
            id: true,
            name: true,
            role: true 
          } 
        },
      },
    });
    return res.status(201).json(announcement);
  } catch (err) {
    console.error('Error creating global announcement:', err);
    res.status(500).json({ error: 'Failed to create global announcement' });
  }
};

const getGlobal = async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { 
        isGlobal: true,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' },
      include: { 
        createdBy: { 
          select: { 
            id: true,
            name: true,
            role: true 
          } 
        } 
      },
    });
    res.json(announcements);
  } catch (err) {
    console.error('Error fetching global announcements:', err);
    res.status(500).json({ error: 'Failed to fetch global announcements' });
  }
};

const deleteGlobal = async (req, res) => {
  const { announcementId } = req.params;
  
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can delete global announcements' });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId }
    });
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    if (!announcement.isGlobal) {
      return res.status(400).json({ error: 'This is not a global announcement' });
    }

    await prisma.announcement.delete({ where: { id: announcementId } });
    return res.status(200).json({ message: 'Global announcement deleted successfully' });
  } catch (err) {
    console.error('Error deleting global announcement:', err);
    res.status(500).json({ error: 'Failed to delete global announcement' });
  }
};

module.exports = {
  create,
  getTeam,
  delete: deleteAnnouncement,
  createGlobal,
  getGlobal,
  deleteGlobal,
};
