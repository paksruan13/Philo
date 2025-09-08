const { status } = require('express/lib/response');
const coachService = require('../services/coachService');
const pointsService = require('../services/pointsService');
const { prisma } = require('../config/database');
const { emitLeaderboardUpdate } = require('../services/leaderboardService');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client } = require('../config/s3');

const awardManualPoints = async (req, res) => {
  try {
    const { userId, points, activityDescription } = req.body;
    const coachId = req.user.id;

    if (!userId || !points) {
      return res.status(400).json({ error: 'User ID and points are required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { team: true }
      });
      if (!user) {
        throw new Error ('User not found');
      }
      if (!user.team) {
        throw new Error('User does not belong to a team');
      }
      const teamId = user.team.id;
      
      // Allow any coach or admin to award points to any student
      // No need to check if they are the coach of that specific team
      
      const manualPointsAward = await tx.manualPointsAward.create({
        data: {
          points,
          activityDescription,
          user: { connect: { id: userId }},
          team: { connect: { id: teamId }},
          awardedBy: { connect: { id: coachId } }
        },
        include: {
          user: true,
          team: true
        }
      });
      
      const updatedTeam = await tx.team.update({
        where: { id: teamId },
        data:{ 
          totalPoints: { increment: points },
        }
      });
      
      return {manualPointsAward, team: updatedTeam};
    });

      await emitLeaderboardUpdate(req.app.get('io'));
      res.status(201).json({
        message: 'Points awarded successfully',
        ...result
      });
  } catch (error) {
    console.error('Error awarding manual points:', error);
    if (error.message === 'User not found' || error.message === 'User does not belong to a team') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'An error occurred while awarding points' });
  }
};

const getManualPointsHistory = async (req, res) => {
  try {
    const user = req.user;
    
    // Coaches and admins can see all manual points history
    const pointsHistory = await prisma.manualPointsAward.findMany({
      include: {
        user: {
          select: { name: true }
        },
        team: {
          select: { name: true }
        },
        awardedBy: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(pointsHistory);
  } catch (error) {
    console.error('Error fetching manual points history:', error);
    res.status(500).json({ error: 'Failed to fetch points history' });
  }
};

const deleteManualPoints = async (req, res) => {
  try {
    const coachId = req.user.id;
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      // Find the manual points award
      const pointsAward = await tx.manualPointsAward.findUnique({
        where: { id },
        include: { team: true }
      });

      if (!pointsAward) {
        throw new Error('Points award not found');
      }

      // Check if the coach has permission to delete this award
      if (pointsAward.awardedById !== coachId) {
        throw new Error('You can only delete points awards you created');
      }

      // Delete the points award
      await tx.manualPointsAward.delete({
        where: { id }
      });

      // Update team points (subtract the points)
      await tx.team.update({
        where: { id: pointsAward.teamId },
        data: {
          totalPoints: { decrement: pointsAward.points }
        }
      });

      return pointsAward;
    });

    await emitLeaderboardUpdate(req.app.get('io'));
    res.json({
      message: 'Points award deleted successfully',
      deletedAward: result
    });
  } catch (error) {
    console.error('Error deleting manual points:', error);
    if (error.message === 'Points award not found' || error.message === 'You can only delete points awards you created') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'An error occurred while deleting points award' });
  }
};

const getPendingSubmissions = async (req, res) => {
  try {
    const coachId = req.user.id;
    const coachTeams = await prisma.team.findMany({
      where: {coachId: coachId}
    });
    if (!coachTeams || coachTeams.length === 0) {
      return res.json([]);
    }
    const teamId = coachTeams.map(team => team.id);
    const submissions = await prisma.activitySubmission.findMany({
      where: {
        user: {
          teamId: { in: teamId }
        },
        status: 'PENDING'
      },
      include: {
        activity: true,
        user: {
          include: {team: true}
        }
      },
      orderBy: {createdAt: 'desc'}
    });

    const processedSubmissions = await Promise.all(submissions.map(async submission => {
      if (submission.submissionData?.photo) {
        try {
          const urlParts = submission.submissionData.photo.split('.amazonaws.com/');
          if (urlParts.length >= 2) {
            const photoKey = urlParts[1];
            const command = new GetObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: photoKey
            });
            const presignedUrl = await getSignedUrl(s3Client, command, {expiresIn: 3600});
            return {
              ...submission,
              submissionData: {
                ...submission.submissionData,
                photo: presignedUrl,
                originalPhoto: submission.submissionData.photo
              }
            };
          }
        } catch (error) {
          console.error('Error generating presigned URL:', error);
        }
      }
      return submission;
    }));
    res.json(processedSubmissions);
  } catch (error) {
    console.error('Error fetching pending submissions:', error);
    res.status(500).json({ error: 'An error occurred while fetching pending submissions' });
  }
};

const approveSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { pointsAwarded, reviewNotes } = req.body;
    
    // Get the submission with activity and user details
    const submission = await prisma.activitySubmission.findUnique({
      where: { id },
      include: {
        activity: true,
        user: {
          include: { team: true }
        }
      }
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // 1. Handle photo approval if this is a photo submission
    if (submission.activity.allowPhotoUpload && 
        submission.submissionData?.photo) {
      
      // Get the photo URL from submission data
      const photoUrl = submission.submissionData.photo;
      // Try to find the photo in the database
      const photoRecord = await prisma.photo.findFirst({
        where: {
          url: photoUrl,
          teamId: submission.user.teamId
        }
      });
      
      // Update the photo if found
      if (photoRecord) {
        await prisma.photo.update({
          where: { id: photoRecord.id },
          data: {
            approved: true,
            status: 'APPROVED',
          }
        });
      } else {
      }
    }
    
    // 2. Update submission status
    const updatedSubmission = await prisma.activitySubmission.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedById: req.user.id,
        pointsAwarded: pointsAwarded || submission.activity.points,
        reviewNotes: reviewNotes || 'Approved by coach'
      },
      include: {
        activity: true,
        user: {
          include: { team: true }
        }
      }
    });
    
    // 3. Award points to the team
    if (updatedSubmission.user?.teamId) {
      const points = pointsAwarded || updatedSubmission.activity.points;
      const reason = `Activity: ${updatedSubmission.activity.title}`;
      
      await pointsService.addPoints(
        updatedSubmission.user.teamId,
        points,
        reason
      );
    }
    
    return res.json(updatedSubmission);
  } catch (error) {
    console.error('Error approving submission:', error);
    return res.status(500).json({ error: 'Failed to approve submission' });
  }
};

const rejectSubmission = async (req, res) => {
  try {
    const {id: submissionid} = req.params;
    const {reviewNotes} = req.body;
    const coachId = req.user.id;

    const submission = await prisma.activitySubmission.findUnique({
      where: {id: submissionid},
      include: {
        user: {include: {team: true}},
      }
    });
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.user.team?.coachId !== coachId) {
      return res.status(403).json({ error: 'You can only reject submissions from your own team' });
    }

    const updatedSubmission = await prisma.activitySubmission.update({
      where: {id: submissionid},
      data: {
        status: 'REJECTED',
        reviewNotes: reviewNotes,
        reviewedById: coachId,
        reviewedAt: new Date()
      }
    });

    res.json({
      message: 'Submission rejected',
      submission: updatedSubmission
    });
  } catch (error) {
    console.error('Error rejecting submission:', error);
    res.status(500).json({ error: 'An error occurred while rejecting the submission' });
  }
};

const getApprovedSubmissions = async (req, res) => {
  try {
    const coachId = req.user.id;
    const coachTeams = await prisma.team.findMany({
      where: { coachId: coachId }
    });

    if (!coachTeams || coachTeams.length === 0) {
      return res.json([]);
    }

    const teamIds = coachTeams.map(team => team.id);

    const submissions = await prisma.activitySubmission.findMany({
      where: {
        user: {
          teamId: { in: teamIds }
        },
        status: 'APPROVED',
        reviewedById: coachId // Only submissions approved by this coach
      },
      include: {
        activity: true,
        user: {
          include: { team: true }
        },
        reviewedBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { reviewedAt: 'desc' }
    });

    // Process submissions to add presigned URLs for photos
    const processedSubmissions = await Promise.all(submissions.map(async submission => {
      if (submission.submissionData?.photo) {
        try {
          const urlParts = submission.submissionData.photo.split('.amazonaws.com/');
          if (urlParts.length >= 2) {
            const photoKey = urlParts[1];
            const command = new GetObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: photoKey
            });
            const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            return {
              ...submission,
              submissionData: {
                ...submission.submissionData,
                photo: presignedUrl,
                originalPhoto: submission.submissionData.photo
              }
            };
          }
        } catch (error) {
          console.error('Error generating presigned URL:', error);
        }
      }
      return submission;
    }));

    res.json(processedSubmissions);
  } catch (error) {
    console.error('Error fetching approved submissions:', error);
    res.status(500).json({ error: 'An error occurred while fetching approved submissions' });
  }
};

const unapproveSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;
    const coachId = req.user.id;

    // Get the submission with activity and user details
    const submission = await prisma.activitySubmission.findUnique({
      where: { id },
      include: {
        activity: true,
        user: {
          include: { team: true }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check if this coach approved this submission
    if (submission.reviewedById !== coachId) {
      return res.status(403).json({ error: 'You can only unapprove submissions you approved' });
    }

    if (submission.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Submission is not approved' });
    }

    // Remove the points that were awarded for this submission
    if (submission.user?.teamId && submission.pointsAwarded) {
      const points = submission.pointsAwarded;
      const reason = `Unapproved: ${submission.activity.title}`;

      await pointsService.removePoints(
        submission.user.teamId,
        points,
        reason
      );
    }

    // Update submission status back to pending
    const updatedSubmission = await prisma.activitySubmission.update({
      where: { id },
      data: {
        status: 'PENDING',
        reviewedAt: null,
        reviewedById: null,
        pointsAwarded: null,
        reviewNotes: reviewNotes || 'Unapproved by coach'
      },
      include: {
        activity: true,
        user: {
          include: { team: true }
        }
      }
    });

    return res.json({
      message: 'Submission unapproved successfully',
      submission: updatedSubmission
    });
  } catch (error) {
    console.error('Error unapproving submission:', error);
    return res.status(500).json({ error: 'Failed to unapprove submission' });
  }
};

const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const coachId = req.user.id;

    // Get the submission with activity and user details
    const submission = await prisma.activitySubmission.findUnique({
      where: { id },
      include: {
        activity: true,
        user: {
          include: { team: true }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check if this coach has permission to delete this submission
    if (submission.reviewedById !== coachId && submission.user.team?.coachId !== coachId) {
      return res.status(403).json({ error: 'You can only delete submissions from your team or that you reviewed' });
    }

    // If the submission was approved, remove the points
    if (submission.status === 'APPROVED' && submission.user?.teamId && submission.pointsAwarded) {
      const points = submission.pointsAwarded;
      const reason = `Deleted submission: ${submission.activity.title}`;

      await pointsService.removePoints(
        submission.user.teamId,
        points,
        reason
      );
    }

    // Delete the submission
    await prisma.activitySubmission.delete({
      where: { id }
    });

    return res.json({
      message: 'Submission deleted successfully',
      deletedSubmission: submission
    });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return res.status(500).json({ error: 'Failed to delete submission' });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { 
        role: 'STUDENT',
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        email: true,
        team: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(students);
  } catch (error) {
    console.error('Error fetching all students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

module.exports = {
  awardManualPoints,
  getManualPointsHistory,
  deleteManualPoints,
  getPendingSubmissions,
  getApprovedSubmissions,
  approveSubmission,
  rejectSubmission,
  unapproveSubmission,
  deleteSubmission,
  getAllStudents
}