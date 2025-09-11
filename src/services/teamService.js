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
      },
      shirtSales: {
        select: {
          id: true,
          quantity: true,
          shirtSize: true,
          amountPaid: true,
          soldAt: true,
          userId: true,
          user: { select: { name: true } }
        },
        orderBy: { soldAt: 'desc' }
      },
      productSales: {
        select: {
          id: true,
          quantity: true,
          size: true,
          amountPaid: true,
          soldAt: true,
          userId: true,
          user: { select: { name: true } },
          product: { select: { name: true, type: true, points: true } }
        },
        orderBy: { soldAt: 'desc' }
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
  const shirtSales = teamData.shirtSales || [];
  const productSales = teamData.productSales || [];

  const totalDonations = donations.reduce((sum, donation) => sum + donation.amount, 0);
  const totalPoints = activitySubmissions.reduce((sum, submission) => sum + submission.activity.points, 0);
  const photoCount = photos.length;
  const activityCount = activitySubmissions.length;
  
  // Calculate shirt sales stats
  const totalShirtsSold = shirtSales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalShirtRevenue = shirtSales.reduce((sum, sale) => sum + sale.amountPaid, 0);
  
  // Calculate product sales stats
  const totalProductsSold = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalProductRevenue = productSales.reduce((sum, sale) => sum + sale.amountPaid, 0);

  return {
    totalDonations,
    totalPoints,
    photoCount,
    activityCount,
    memberCount: members.length,
    totalShirtsSold,
    totalShirtRevenue,
    totalProductsSold,
    totalProductRevenue
  };
};

const calculateMemberContributions = (teamData) => {
  const members = teamData.members || [];
  const donations = teamData.donations || [];
  const activitySubmissions = teamData.activitySubmissions || [];
  const shirtSales = teamData.shirtSales || [];
  const productSales = teamData.productSales || [];

  return members.map(member => {
    const memberDonations = teamData.donations
      .filter(d => d.userId === member.id)
      .reduce((sum, d) => sum + d.amount, 0);
    
    const memberActivities = teamData.activitySubmissions
      .filter(s => s.userId === member.id);
    
    const memberPoints = memberActivities
      .reduce((sum, s) => sum + s.activity.points, 0);

    // Calculate member shirt purchases
    const memberShirtPurchases = teamData.shirtSales
      .filter(s => s.userId === member.id);
    
    const memberShirtQuantity = memberShirtPurchases
      .reduce((sum, s) => sum + s.quantity, 0);
    
    const memberShirtSpent = memberShirtPurchases
      .reduce((sum, s) => sum + s.amountPaid, 0);

    // Calculate member product purchases
    const memberProductPurchases = teamData.productSales
      .filter(s => s.userId === member.id);
    
    const memberProductQuantity = memberProductPurchases
      .reduce((sum, s) => sum + s.quantity, 0);
    
    const memberProductSpent = memberProductPurchases
      .reduce((sum, s) => sum + s.amountPaid, 0);

    // Calculate total purchases (shirts + products)
    const totalPurchasesSpent = memberShirtSpent + memberProductSpent;

    return {
      ...member,
      contributions: {
        donations: memberDonations,
        activities: memberActivities.length,
        points: memberPoints,
        photos: 0,
        shirtsPurchased: memberShirtQuantity,
        shirtSpent: memberShirtSpent,
        productsPurchased: memberProductQuantity,
        productSpent: memberProductSpent,
        totalPurchasesSpent: totalPurchasesSpent,
        purchases: [...memberShirtPurchases, ...memberProductPurchases]
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

  // Get team with full details including shirt sales
  const fullTeamData = await getTeamWithDetails(user.teamId);
  
  if (!fullTeamData) {
    throw new Error('Team not found');
  }

  // Calculate team stats and member contributions
  const stats = calculateTeamStats(fullTeamData);
  const membersWithContributions = calculateMemberContributions(fullTeamData);
  
  // Get team ranking
  const ranking = await getTeamRanking(user.teamId);
  
  const recentDonations = await prisma.donation.findMany({
    where: {teamId: fullTeamData.id},
    orderBy: {createdAt: 'desc'},
    take: 5,
    include: {
      user: {
        select: {name: true}
      }
    }
  });

  const recentPhotos = await prisma.photo.findMany({
    where: { teamId: fullTeamData.id, approved: true},
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

  return {
    team: {
      id: fullTeamData.id,
      name: fullTeamData.name,
      teamCode: fullTeamData.teamCode,
      coach: fullTeamData.coach,
      groupMeLink: fullTeamData.groupMeLink,
      members: membersWithContributions, // Include contributions with shirt purchases
    },
    stats: {
      totalPoints: fullTeamData.totalPoints,
      rank: ranking.rank,
      totalTeams: ranking.totalTeams,
      memberCount: membersWithContributions.length,
      totalDonations: stats.totalDonations,
      photoCount: stats.photoCount,
      activityCount: stats.activityCount,
      totalShirtsSold: stats.totalShirtsSold,
      totalShirtRevenue: stats.totalShirtRevenue
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