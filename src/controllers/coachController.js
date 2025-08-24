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
      const team = await tx.team.findUnique({
        where: {
          id: teamId,
          coachId: coachId
        }
      });
      if (!team) {
        throw new Error('Team not found or you are not the coach of this team');
      }
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
      await tx.team.update({
        where: { id: teamId },
        data:{ 
          totalPoints: { increment: points },
        }
      })
      return {manualPointsAward, team};
    });

      await emitLeaderboardUpdate();
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
      console.log(`Photo URL in submission: ${photoUrl}`);
      
      // Try to find the photo in the database
      const photoRecord = await prisma.photo.findFirst({
        where: {
          url: photoUrl,
          teamId: submission.user.teamId
        }
      });
      
      // Update the photo if found
      if (photoRecord) {
        console.log(`Found photo record: ${photoRecord.id}`);
        await prisma.photo.update({
          where: { id: photoRecord.id },
          data: {
            approved: true,
            status: 'APPROVED',
          }
        });
        console.log(`Updated photo approval status to approved`);
      } else {
        console.log(`No matching photo record found in database`);
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
      
      console.log(`Awarded ${points} points to team ${updatedSubmission.user.team.name}`);
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

module.exports = {
  awardManualPoints,
  getPendingSubmissions,
  approveSubmission,
  rejectSubmission
}