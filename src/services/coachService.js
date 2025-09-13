const { prisma } = require('../config/lambdaDatabase');

const getCoachTeam = async (coachId) => {
  return await prisma.team.findFirst({
    where: {coachId: coachId},
    include: {
      members: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
};

const getPendingSubmissions = async (teamId) => {
  return await prisma.activitySubmission.findMany({
    where: {
      status: 'PENDING',
      user: { teamId: teamId }
    },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          description: true,
          points: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

module.exports = {
  getCoachTeam,
  getPendingSubmissions
};