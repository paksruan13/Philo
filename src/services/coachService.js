const { prisma } = require('../config/database');

const awardPoints = async (req, res) => {
  const { userId, activityDescription, points, notes } = req.body;

  if (!userId || !activityDescription || !points) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const submission = await prisma.manualPoint.create({
      data: {
        userId,
        points: Number(points),
        submissionData: {
          description: activityDescription,
          notes: notes || '',
        },
        createdById: req.user.id,
      },
    });

    return res.status(201).json(submission);
  } catch (err) {
    console.error('Error awarding points:', err);
    return res.status(500).json({ error: 'Failed to award points' });
  }
};

const getPointsHistory = async (req, res) => {
  try {
    const history = await prisma.manualPoint.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
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
