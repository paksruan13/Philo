const express = require('express');
const router = express.Router();
const { authenticationToken, requireRole } = require('../middleware/auth');
const { prisma } = require('../config/database');

// Manual points endpoints
router.post('/manual-points', authenticationToken, requireRole(['COACH']), async (req, res) => {
  try {
    const { userId, activityDescription, points, notes } = req.body;
    const coachId = req.user.id;

    // Verify coach has access to this student's team
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: { team: true }
    });

    if (!student || !student.team) {
      return res.status(404).json({ error: 'Student or team not found' });
    }

    const coachTeam = await prisma.team.findFirst({
      where: { coachId: coachId }
    });

    if (!coachTeam || coachTeam.id !== student.teamId) {
      return res.status(403).json({ error: 'Access denied to this student' });
    }

    // Create manual points record (you may need to create this model)
    const manualPoints = await prisma.manualPoints.create({
      data: {
        userId,
        coachId,
        points: parseInt(points),
        activityDescription,
        notes,
        teamId: student.teamId
      }
    });

    res.json({ success: true, manualPoints });
  } catch (error) {
    console.error('Error awarding manual points:', error);
    res.status(500).json({ error: 'Failed to award points' });
  }
});

router.get('/manual-points-history', authenticationToken, requireRole(['COACH']), async (req, res) => {
  try {
    const coachId = req.user.id;
    
    // Get coach's team
    const coachTeam = await prisma.team.findFirst({
      where: { coachId: coachId }
    });

    if (!coachTeam) {
      return res.json([]);
    }

    // Get manual points history for this team
    const history = await prisma.manualPoints.findMany({
      where: { teamId: coachTeam.id },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(history);
  } catch (error) {
    console.error('Error fetching points history:', error);
    res.status(500).json({ error: 'Failed to fetch points history' });
  }
});

// Get pending submissions for coach's team
router.get('/pending-submissions', authenticationToken, requireRole(['COACH']), async (req, res) => {
  try {
    const coachId = req.user.id;
    
    // Get coach's team
    const coachTeam = await prisma.team.findFirst({
      where: { coachId: coachId }
    });

    if (!coachTeam) {
      return res.json([]);
    }

    // Get pending submissions for this team
    const submissions = await prisma.activitySubmission.findMany({
      where: { 
        status: 'PENDING',
        user: {
          teamId: coachTeam.id
        }
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

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching pending submissions:', error);
    res.status(500).json({ error: 'Failed to fetch pending submissions' });
  }
});

// Approve submission
router.post('/submissions/:id/approve', authenticationToken, requireRole(['COACH']), async (req, res) => {
  try {
    const { id: submissionId } = req.params;
    const { pointsAwarded, reviewNotes } = req.body;
    const coachId = req.user.id;

    // Verify coach has access to this submission
    const submission = await prisma.activitySubmission.findUnique({
      where: { id: submissionId },
      include: {
        user: { include: { team: true } },
        activity: true
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check if coach owns this team
    if (submission.user.team?.coachId !== coachId) {
      return res.status(403).json({ error: 'Access denied to this submission' });
    }

    // Update submission
    const updatedSubmission = await prisma.activitySubmission.update({
      where: { id: submissionId },
      data: {
        status: 'APPROVED',
        pointsAwarded: pointsAwarded || submission.activity.points,
        reviewedById: coachId,
        reviewNotes: reviewNotes,
        reviewedAt: new Date()
      },
      include: {
        user: { select: { name: true } },
        activity: { select: { title: true, points: true } }
      }
    });

    // Emit leaderboard update
    const io = req.app.get('io');
    if (io) {
      const { emitLeaderboardUpdate } = require('../services/leaderboardService');
      await emitLeaderboardUpdate(io);
    }

    res.json({
      message: 'Submission approved successfully',
      submission: updatedSubmission
    });
  } catch (error) {
    console.error('Error approving submission:', error);
    res.status(500).json({ error: 'Failed to approve submission' });
  }
});

// Reject submission
router.post('/submissions/:id/reject', authenticationToken, requireRole(['COACH']), async (req, res) => {
  try {
    const { id: submissionId } = req.params;
    const { reviewNotes } = req.body;
    const coachId = req.user.id;

    // Verify coach has access to this submission
    const submission = await prisma.activitySubmission.findUnique({
      where: { id: submissionId },
      include: {
        user: { include: { team: true } }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check if coach owns this team
    if (submission.user.team?.coachId !== coachId) {
      return res.status(403).json({ error: 'Access denied to this submission' });
    }

    // Update submission
    const updatedSubmission = await prisma.activitySubmission.update({
      where: { id: submissionId },
      data: {
        status: 'REJECTED',
        reviewedById: coachId,
        reviewNotes: reviewNotes,
        reviewedAt: new Date()
      }
    });

    res.json({
      message: 'Submission rejected',
      submission: updatedSubmission
    });
  } catch (error) {
    console.error('Error rejecting submission:', error);
    res.status(500).json({ error: 'Failed to reject submission' });
  }
});

module.exports = router;
