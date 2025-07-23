const { prisma } = require('../config/database');

const getAllCategories = async () => {
  return await prisma.activityCategory.findMany({
    include: {
      activities: {
        select: { id: true, title: true, isPublished: true }
      }
    },
    orderBy: { name: 'asc' }
  });
};

const createCategory = async (categoryData) => {
  return await prisma.activityCategory.create({
    data: categoryData
  });
};

const getAllActivities = async () => {
  const activities = await prisma.activity.findMany({
    include: {
      category: true,
      createdBy: {
        select: { id: true, name: true }
      },
      submission: {
        select: { id: true, status: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return activities.map(activity => ({
    ...activity,
    submissionCount: activity.submission.length,
    pendingCount: activity.submission.filter(s => s.status === 'PENDING').length,
    approvedCount: activity.submission.filter(s => s.status === 'APPROVED').length
  }));
};

const createActivity = async (activityData, createdById) => {
  return await prisma.activity.create({
    data: {
      ...activityData,
      createdById
    },
    include: {
      category: true,
      createdBy: {
        select: { id: true, name: true }
      }
    }
  });
};

const updateActivity = async (activityId, updateData) => {
  return await prisma.activity.update({
    where: { id: activityId },
    data: updateData,
    include: {
      category: true,
      createdBy: {
        select: { id: true, name: true }
      }
    }
  });
};

const getPublishedActivities = async (userId) => {
  return await prisma.activity.findMany({
    where: {
      isPublished: true,
      isActive: true
    },
    include: {
      category: true,
      submission: {
        where: { userId },
        select: { id: true, status: true, pointsAwarded: true, createdAt: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const getActivityById = async (activityId, userId = null) => {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      createdBy: {
        select: { name: true, email: true }
      },
      category: {
        select: { name: true, description: true }
      }
    }
  });

  if(!activity) { 
    throw new Error('No Activity Has Been Set Yet!');
  }

let submission = null;
if (userId) {
    submission = await prisma.activitySubmission.findFirst({
      where: {
        activityId,
        userId
      },
      select: {
        id: true,
        status: true,
        submissionData: true,
        notes: true,
        createdAt: true,
        reviewedAt: true,
        reviewedBy: {
          select: { name: true }
        }
      }
    });
  }

  return {
    ...activity, submission
  };
};

const submitActivity = async (activityId, userId, submissionData, notes = null, teamId) => {
  const activity = await prisma.activity.findUnique({
    where: { id:  activityId },
    select: { id: true, title: true, points: true, isPublished: true }
  });

  if(!activity){ 
    throw new Error('Activity not found');
  }

  if(!activity.isPublished) {
    throw new Error('Activity is not published');
  }

  const existingSubmission = await prisma.activitySubmission.findFirst({
    where: {
      activityId,
      userId
    }
  });

  if(existingSubmission) {
    throw new Error('You have already submitted this activity');
  }

  const submission = await prisma.activitySubmission.create({
    data: {
      activityId, userId, submissionData, notes, status: 'PENDING',
    },
    include: {
      activity: {
        select: { title: true, points: true }
      },
      user: {
        select: { name: true, email: true }
      }
    }
  });

  return submission;
}

const updateSubmission = async(submissionId, userId, submissionData, notes = null, status = 'PENDING') => {
  if(!submissionId) {
    throw new Error('Submission ID is required');
  }
  
  const existingSubmission = await prisma.activitySubmission.findFirst({
    where: {
      id: submissionId, userId, status: { in: ['PENDING', 'REJECTED'] }
    }
  });

  if (!existingSubmission) {
    throw new Error('Submission not found or cannot be updated');
  }

  const updatedSubmission = await prisma.activitySubmission.update({
    where: { id: submissionId },
    data: {
      submissionData, notes, status
    },
    include: {
      activity: {
        select: { title: true, points: true }
      }
    }
  });

  return updatedSubmission;
}

const getUserSubmissions = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const submissions = await prisma.activitySubmission.findMany({
    where: { userId },
    include: {
      activity: {
        select: { id: true, title: true, description: true, points: true}
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit
  });

  const total = await prisma.activitySubmission.count({
    where: { userId}
  });

  return {
    submissions, pagination: {
      page,limit, total, totalPages: Math.ceil(total / limit)
    }
  }
}


const validateSubmissionData = (activity, submissionData) => {
  const errors = [];
  if(!submissionData || typeof submissionData !== 'object') {
    errors.push('Submission data is required');
    return errors;
  }

  let requirements = {};
  if (activity.requirements) {
    try {
      requirements = typeof activity.requirements === 'string'
        ? JSON.parse(activity.requirements)
        : activity.requirements;
    } catch (e) {
      return errors;
    }
  }

  if(requirements.fields) {
    requirements.fields.forEach(field => {
      if(field.required && !submissionData[field.name]) {
        const photoUrl = submissionData[field.name];
        if(!photoUrl.startsWith('http') && !photoUrl.startsWith('/uploads/')) {
          errors.push(`${field.label || field.name} must be a valid photo URL`);
        }
      }

      if(field.type === 'number' && submissionData[field.name]) {
        const value = Number(submissionData[field.name]);
        if(isNaN(value)) {
          errors.push(`${field.label || field.name} must be a number`)
        }
        if(field.min !== undefined && value < field.min) {
          errors.push(`${field.label || field.name} must be at least ${field.min}`);
        }
        if(field.max !== undefined && value > field.max) {
          errors.push(`${field.label || field.name} must be at most ${field.max}`);
        }
      }
    });
  }

  return errors;
}



module.exports = {
  getAllCategories,
  createCategory,
  getAllActivities,
  createActivity,
  updateActivity,
  getPublishedActivities,
  getActivityById,
  submitActivity,
  updateSubmission,
  getUserSubmissions,
  validateSubmissionData
};