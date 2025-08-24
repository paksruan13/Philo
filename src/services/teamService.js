const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { prisma } = require('../config/database');
const photoService = require('./photoService');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

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

  return await getTeamWithDetails(user.teamId);
};

const getTeamWithDetails = async (teamId) => {
  console.log('🔍 Fetching team with ID:', teamId);
  
  const team = await prisma.team.findUnique({
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

  console.log('🔍 Raw team data:', {
    id: team?.id,
    name: team?.name,
    donations: Array.isArray(team?.donations) ? team.donations.length : 'NOT_ARRAY',
    photos: Array.isArray(team?.photos) ? team.photos.length : 'NOT_ARRAY',
    activitySubmissions: Array.isArray(team?.activitySubmissions) ? team.activitySubmissions.length : 'NOT_ARRAY',
    members: Array.isArray(team?.members) ? team.members.length : 'NOT_ARRAY'
  });

  return team;
};

const calculateTeamStats = (teamData) => {

  const donations = teamData.donations || [];
  const activitySubmissions = teamData.activitySubmissions || [];
  const photos = teamData.photos || [];
  const members = teamData.members || [];

  const totalDonations = donations.reduce((sum, donation) => sum + donation.amount, 0);
  const totalPoints = activitySubmissions.reduce((sum, submission) => sum + submission.activity.points, 0);
  const photoCount = photos.length;
  const activityCount = activitySubmissions.length;

  return {
    totalDonations,
    totalPoints,
    photoCount,
    activityCount,
    memberCount: members.length
  };
};

const calculateMemberContributions = (teamData) => {
  const members = teamData.members || [];
  const donations = teamData.donations || [];
  const activitySubmissions = teamData.activitySubmissions || [];

  return members.map(member => {
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
  try {
    const team = await prisma.team.findUnique({
      where: {id: teamId},
      select: {totalPoints: true}
    });
    return team?.totalPoints || 0;
  }   catch (error) {
    console.error('Error calculating team score:', error);
    return 0;
  }
};

const getActivitiesWithSubmissionStatus = async (userId) => {
  const activities = await prisma.activity.findMany({
    where: { isPublished: true, isActive: true },
    select: {
      id: true,
      title: true,
      description: true,
      points: true,
      allowOnlinePurchase: true,
      allowPhotoUpload: true,
      categoryType: true,
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
  const user = await prisma.user.findUnique({
    where: {id: userId},
    include: {team: true}
  });
  if (!user?.team) {
    throw new Error('User is not part of a team');
  }

  const team = await prisma.team.findUnique({
    where: {id: user.teamId},
    include: {
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        }
      },
      coach: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          donations: true,
          photos: {where: {approved: true}},
          activitySubmissions: {where: {status: 'APPROVED'}}
        }
      }
    }
  });

  const recentDonations = await prisma.donation.findMany({
    where: {teamId: team.id},
    orderBy: {createdAt: 'desc'},
    take: 5,
    include: {
      user: {
        select: {name: true}
      }
    }
  });

  const recentPhotos = await prisma.photo.findMany({
    where: { teamId: team.id, approved: true},
    orderBy: { uploadedAt: 'desc' },
    take: 6
  });

  const photosWithUrls = await Promise.all(
    recentPhotos.map(async (photo) => {
      try {
        const command = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: photo.fileName
        });
        const presignedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 3600
        });
        return {
          ...photo,
          url: presignedUrl
        };
      } catch (err) {
        console.error('Error generating presigned URL:', err);
        return null;
      }
    })
  );

  const validPhotos = photosWithUrls.filter(photo => photo !== null);

  const allTeams = await prisma.team.findMany({
    where: {isActive: true},
    select:{ 
      id: true,
      totalPoints: true,
    },
    orderBy: {totalPoints: 'desc'}
  });
  const rank = allTeams.findIndex(t => t.id === team.id) + 1;

  const donationTotal = await prisma.donation.aggregate({
    where: {teamId: team.id},
    _sum: {amount: true}
  });

  return {
    team: {
      id: team.id,
      name: team.name,
      teamCode: team.teamCode,
      coach: team.coach,
      members: team.members,
    },
    stats: {
      totalPoints: team.totalPoints,
      rank,
      totalTeams: allTeams.length,
      membercount: team.members.length,
      totalDonations: donationTotal._sum.amount || 0,
      photoCount: team._count.photos,
      activityCount: team._count.activitySubmissions
    },
    recentDonations,
    photos: validPhotos
  }
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
  getDashboardData,
};