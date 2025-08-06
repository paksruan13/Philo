const { prisma } = require('../config/database');

const awardPoints = async (req, res) => {
  const { userId, activityDescription, points, notes } = req.body;

  if (!userId || !activityDescription || !points) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Fix: Use 'manualPoints' (lowercase) instead of 'manualPoint'
    const submission = await prisma.manualPoints.create({
      data: {
        userId,
        coachId: req.user.id,
        points: Number(points),
        activityDescription,
        notes: notes || '',
        teamId: req.user.teamId || null
      },
      include: {
        student: { select: { name: true, email: true } },
        coach: { select: { name: true } }
      }
    });

    return res.status(201).json(submission);
  } catch (err) {
    console.error('Error awarding points:', err);
    return res.status(500).json({ error: 'Failed to award points' });
  }
};

const getPointsHistory = async (req, res) => {
  try {
    const coachId = req.user.id;
    
    const history = await prisma.manualPoints.findMany({
      where: { coachId },
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { name: true, email: true } }
      }
    });

    return res.json(history);
  } catch (err) {
    console.error('Error fetching history:', err);
    return res.status(500).json({ error: 'Failed to fetch points history' });
  }
};

module.exports = {
  awardPoints,
  getPointsHistory,
};
