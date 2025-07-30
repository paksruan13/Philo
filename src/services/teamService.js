const { prisma } = require('../config/database');

const getAllTeams = async () => {
  return await prisma.team.findMany({
    include: {
      coach: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { members: true, donations: true, shirtSales: true, photos: true },
      }
    },
    orderBy: { name: 'desc' }
  });
};

const getTeamScore = async (teamId) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      donations: { select: { amount: true } },
      shirtSales: { select: { quantity: true } },
    },
  });

  if (!team) return null;

  const donationSum = team.donations.reduce((sum, d) => sum + d.amount, 0);
  const shirtPoints = team.shirtSales.reduce((sum, s) => sum + s.quantity, 0);
  
  return {
    teamId,
    score: donationSum + shirtPoints
  };
};

const createTeam = async (teamData) => {
  return await prisma.team.create({
    data: teamData,
  });
};

const createTeamWithCode = async (teamData) => {
  const generateTeamCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  let teamCode;
  let isUnique = false;
  while (!isUnique) {
    teamCode = generateTeamCode();
    const existingTeam = await prisma.team.findUnique({ where: { teamCode } });
    if (!existingTeam) {
      isUnique = true;
    }
  }

  return await prisma.team.create({
    data: {
      ...teamData,
      teamCode
    },
    include: {
      coach: {
        select: { id: true, name: true, email: true },
      }
    }
  });
};

const updateTeam = async (teamId, updateData) => {
  return await prisma.team.update({
    where: { id: teamId },
    data: updateData,
    include: {
      coach: {
        select: { id: true, name: true, email: true },
      },
      members: {
        select: { id: true, name: true, email: true, role: true },
      }
    }
  });
};

const getTeamsWithDetails = async () => {
  return await prisma.team.findMany({
    include: {
      members: {
        select: { id: true, name: true, email: true, role: true },
      },
      coach: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: {
          members: true,
          donations: true,
          shirtSales: true,
          photos: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
};

const findTeamByCode = async (teamCode) => {
  return await prisma.team.findUnique({
    where: { teamCode },
    select: { id: true, name: true, isActive: true },
  });
};

const getUserTeamWithDetails = async (userId) => {
  const user = await prisma.user.findUnique({
    where: {id: userId},
    select: {teamId: true}
  });

  if(!user?.teamId) {
    throw new Error('User does not belong to any team');
  }

  return await getTeamsWithDetails(user.teamId);
};

const getTeamWithDetails = async (teamId) => {
  return await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      coach: {
        select: { id: true, name: true, email: true }
      },
      members: {
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { name: 'asc' }
      },
      donations: {
        select: { 
          id: true, 
          amount: true, 
          createdAt: true, 
          userId: true, 
          user: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      },
      photos: {
        select: {
          id: true,
          url: true,
          uploadedAt: true,
          approved: true,
        },
        orderBy: { uploadedAt: 'desc' },
        take: 10
      },
      activitySubmissions: {
        where: { status: 'APPROVED' },
        select: {
          id: true,
          createdAt: true,
          userId: true,
          user: { select: { name: true } },
          activity: { select: { title: true, points: true } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
};

const calculateTeamStats = (teamData) => {
  const totalDonations = teamData.donations.reduce((sum, donation) => sum + donation.amount, 0);
  const totalPoints = teamData.activitySubmissions.reduce((sum, submission) => sum + submission.activity.points, 0);
  const photoCount = teamData.photos.length;
  const activityCount = teamData.activitySubmissions.length;

  return {
    totalDonations,
    totalPoints,
    photoCount,
    activityCount,
    memberCount: teamData.members.length
  };
};

const calculateMemberContributions = (teamData) => {
  return teamData.members.map(member => {
    const memberDonations = teamData.donations
      .filter(d => d.userId === member.id)
      .reduce((sum, d) => sum + d.amount, 0);
    
    const memberActivities = teamData.activitySubmissions
      .filter(s => s.userId === member.id);
    
    const memberPoints = memberActivities
      .reduce((sum, s) => sum + s.activity.points, 0);

    return {
      ...member,
      contributions: {
        donations: memberDonations,
        activities: memberActivities.length,
        points: memberPoints,
        photos: 0 
      }
    };
  });
};

const getTeamRanking = async (teamId) => {
  const allTeams = await prisma.team.findMany({
    select: { id: true, name: true }
  });

  const teamScores = await Promise.all(
    allTeams.map(async (team) => {
      const score = await calculateTeamScore(team.id);
      return {
        teamId: team.id,
        score
      };
    })
  );

  teamScores.sort((a, b) => b.score - a.score);
  const teamRank = teamScores.findIndex(t => t.teamId === teamId) + 1;

  return {
    rank: teamRank,
    totalTeams: allTeams.length,
    scores: teamScores
  };
};

const calculateTeamScore = async (teamId) => {
  // Get donations total
  const donationsTotal = await prisma.donation.aggregate({
    where: { teamId },
    _sum: { amount: true }
  });

  // Get activity points total
  const submissions = await prisma.activitySubmission.findMany({
    where: {
      user: { teamId },
      status: 'APPROVED'
    },
    include: {
      activity: { select: { points: true } }
    }
  });

  const pointsTotal = submissions.reduce((sum, submission) => 
    sum + (submission.activity.points || 0), 0);

  return (donationsTotal._sum.amount || 0) + pointsTotal * 10;
};

const getActivitiesWithSubmissionStatus = async (userId) => {
  const activities = await prisma.activity.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      description: true,
      points: true,
      createdBy: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const submissions = await prisma.activitySubmission.findMany({
    where: {
      userId,
      activityId: { in: activities.map(a => a.id) }
    },
    select: {
      activityId: true,
      status: true,
      createdAt: true,
      reviewedAt: true
    }
  });

  return activities.map(activity => {
    const submission = submissions.find(s => s.activityId === activity.id);
    return {
      ...activity,
      submissionStatus: submission?.status || 'NOT_SUBMITTED',
      submittedAt: submission?.createdAt || null,
      reviewedAt: submission?.reviewedAt || null
    };
  });
};

const getDashboardData = async (userId) => {
  const teamData = await getUserTeamWithDetails(userId);
  
  if (!teamData) {
    throw new Error('Team not found');
  }

  const stats = calculateTeamStats(teamData);
  const members = calculateMemberContributions(teamData);
  const ranking = await getTeamRanking(teamData.id);

  return {
    team: {
      id: teamData.id,
      name: teamData.name,
      teamCode: teamData.teamCode,
      coach: teamData.coach,
      createdAt: teamData.createdAt
    },
    stats: {
      ...stats,
      rank: ranking.rank,
      totalTeams: ranking.totalTeams
    },
    members,
    recentDonations: teamData.donations.slice(0, 5),
    recentPhotos: teamData.photos.slice(0, 5),
    recentActivities: teamData.activitySubmissions.slice(0, 5)
  };
};


module.exports = {
  getAllTeams,
  getTeamScore,
  createTeam,
  createTeamWithCode,
  updateTeam,
  getTeamsWithDetails,
  findTeamByCode,
  getUserTeamWithDetails,
  getTeamWithDetails,
  calculateTeamStats,
  calculateMemberContributions,
  getTeamRanking,
  calculateTeamScore,
  getActivitiesWithSubmissionStatus,
  getDashboardData
};