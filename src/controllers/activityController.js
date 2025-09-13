const { parse } = require('dotenv');
const activityService = require('../services/activityService');
const { emitLeaderboardUpdate } = require('../services/leaderboardService');
const { prisma } = require('../config/lambdaDatabase');

const getActivities = async (req, res) => {
  try {
    const activities = await activityService.getPublishedActivities(req.user.id);
    res.json(activities);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

const getActivityForSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const activity = await activityService.getActivityById(id, userId);
    res.json(activity);
  } catch (err) {
    console.error('Error fetching activity:', err);

    if(err.message === 'Activity not found') {
      res.status(404).json({ error: 'Activity not found' });
    }

    res.status(500).json({ error: 'Failed to fetch activity' });
  }
};

const submitActivityResponse = async (req, res) => {
  try {
    const { id: activityId } = req.params;
    const userId = req.user.id;
    const { submissionData, notes } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { team: true }
    });

    if (!user.teamId || !user.team) {
      return res.status(400).json({ error: 'User is not part of a team' });
    }

    const activity = await activityService.getActivityById(activityId);

    const validationErrors = activityService.validateSubmissionData(activity, submissionData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: validationErrors
      })
    }

    const submission = await activityService.submitActivity(
      activityId, userId, submissionData, notes, user.teamId
    );

    if (submission.status === 'APPROVED' && submission.pointsAwarded) {
      await PointsService.addPoints(
        user.teamId,
        submission.pointsAwarded,
        `Activity Completed: ${activity.title}`
      );
    }

    res.status(201).json({
      message: 'Activity Submitted Successfully',
      submission
    });
  } catch (err) {
    console.error('Error submitting activity:', err);
    if(err.message === 'Activity not found') {
      return res.status(404).json({ error: 'Activity not found' });
    }
    if(err.message === 'Activity is not available for submission') {
      return res.status(403).json({ error: 'Activity is not available for submission' });
    }

    if(err.message === 'You have already submitted this activity') {
      return res.status(409).json({ error: 'You have already submitted this activity' });
    }

    res.status(500).json({ error: 'Failed to submit activity' });
  }
};

const updateActivitySubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { submissionData, notes } = req.body;
    const userId = req.user.id;

    const submission = await activityService.updateSubmission(
      submissionId, userId, submissionData, notes
    );

    res.json({
      message: 'Submission updated subccessfully',
      submission
    });
  } catch (err) {
    console.error('Error updating submission:', err);
    if(err.message === 'Submission not found or cannot be updated') {
      return res.status(404).json({ error: 'Submission not found or cannot be updated' });
    }

    res.status(500).json({ error: 'Failed to update submission' });
  }
};

const getMySubmissions = async (req, res) => {
  try{
     const userId = req.user.id;
     const page = parseInt(req.query.page) || 1;
     const limit = parseInt(req.query.limit) || 10;

     const result = await activityService.getUserSubmissions(userId, page, limit);
     res.json(result);
  } catch (err) {
    console.error('Error fetching submission:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
}

const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedActivity = await activityService.deleteActivity(id);
    res.json({
      success: true,
      message: 'Activity deleted successfully',
      activity: deletedActivity
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    if (error.message === 'Activity not found') {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.status(500).json({ error: 'Failed to delete activity' });
  }
}

module.exports = {
  getActivities,
  getMySubmissions,
  getActivityForSubmission,
  submitActivityResponse,
  updateActivitySubmission,
  deleteActivity
};