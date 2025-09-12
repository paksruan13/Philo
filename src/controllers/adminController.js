const userService = require('../services/userService');
const teamService = require('../services/teamService');
const activityService = require('../services/activityService');

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsersWithDetails();
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllTeams = async (req, res) => {
  try {
    const teams = await teamService.getTeamsWithDetails();
    
    // Debug logging
    console.log('🔍 Admin getAllTeams - number of teams:', teams.length);
    teams.forEach((team, index) => {
      console.log(`🏀 Team ${index + 1} (${team.name}):`, {
        members: team.members ? `${team.members.length} members` : 'NO MEMBERS',
        stats: team.stats ? `stats: ${JSON.stringify(team.stats)}` : 'NO STATS',
        donations: team.donations ? `${team.donations.length} donations` : 'NO DONATIONS'
      });
    });
    
    res.json(teams);
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
};

const createTeam = async (req, res) => {
  try {
    const { name, coachId, groupMeLink } = req.body;
    console.log('🔍 Creating team with data:', { name, coachId, groupMeLink });
    const team = await teamService.createTeamWithCode({ 
      name, 
      coachId: coachId || null,
      groupMeLink: groupMeLink || null
    });

    res.status(201).json({
      message: 'Team created successfully',
      team,
    });
  } catch (err) {
    console.error('Error creating team:', err);
    res.status(500).json({ error: 'Failed to create team' });
  }
};

const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, coachId, isActive, groupMeLink } = req.body;
    console.log('🔍 Updating team with data:', { id, name, coachId, isActive, groupMeLink });
    
    const team = await teamService.updateTeam(id, {
      name,
      coachId: coachId || null,
      isActive,
      groupMeLink: groupMeLink || null
    });

    res.json({
      message: 'Team updated successfully',
      team,
    });
  } catch (err) {
    console.error('Error updating team:', err);
    res.status(500).json({ error: 'Failed to update team' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, teamId, isActive } = req.body;

    const user = await userService.updateUser(id, {
      role,
      teamId: teamId || null,
      isActive
    });

    res.json({
      message: 'User updated successfully',
      user,
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

const getCoaches = async (req, res) => {
  try {
    const coaches = await userService.getCoaches();
    res.json(coaches);
  } catch (err) {
    console.error('Error fetching coaches:', err);
    res.status(500).json({ error: 'Failed to fetch coaches' });
  }
};

const getActivityCategories = async (req, res) => {
  try {
    const categories = await activityService.getAllCategories();
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

const createActivityCategory = async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    const category = await activityService.createCategory({
      name,
      description,
      color,
      icon
    });
    res.status(201).json(category);
  } catch (err) {
    console.error('Error creating category:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Category Name Already Exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
};

const getAllActivities = async (req, res) => {
  try {
    const activities = await activityService.getAllActivities();
    res.json(activities);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

const createActivity = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      points, 
      type, 
      categoryId, 
      categoryType, 
      requirements, 
      isPublished, 
      allowOnlinePurchase, 
      allowPhotoUpload,
      startDate,
      endDate 
    } = req.body;
    
    const activity = await activityService.createActivity({
      title,
      description,
      points,
      type,
      categoryId,
      categoryType,
      requirements: requirements || {},
      isPublished: isPublished || false,
      allowOnlinePurchase: allowOnlinePurchase || false,
      allowPhotoUpload: allowPhotoUpload || false,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    }, req.user.id);

    res.status(201).json(activity);
  } catch (err) {
    console.error('Error creating activity:', err);
    res.status(500).json({ error: 'Failed to create activity' });
  }
};

const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      points, 
      type, 
      categoryId, 
      categoryType, 
      requirements, 
      isPublished, 
      isActive, 
      allowOnlinePurchase, 
      allowPhotoUpload,
      startDate,
      endDate 
    } = req.body;

    const activity = await activityService.updateActivity(id, {
      title,
      description,
      points,
      type,
      categoryId,
      categoryType,
      requirements,
      isPublished,
      isActive,
      allowOnlinePurchase: allowOnlinePurchase || false,
      allowPhotoUpload: allowPhotoUpload || false,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    });

    res.json(activity);
  } catch (err) {
    console.error('Error updating activity:', err);
    res.status(500).json({ error: 'Failed to update activity' });
  }
};

const resetTeamPoints = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { prisma } = require('../config/database');
    const { emitLeaderboardUpdate } = require('../services/leaderboardService');

    const result = await prisma.$transaction(async (tx) => {
      // Check if team exists
      const team = await tx.team.findUnique({
        where: { id: teamId }
      });

      if (!team) {
        throw new Error('Team not found');
      }

      // Delete all manual points awards for this team
      await tx.manualPointsAward.deleteMany({
        where: { teamId: teamId }
      });

      // Reset team points to 0
      await tx.team.update({
        where: { id: teamId },
        data: { totalPoints: 0 }
      });

      return team;
    });

    await emitLeaderboardUpdate();
    res.json({
      message: 'Team points reset successfully',
      team: result
    });
  } catch (error) {
    console.error('Error resetting team points:', error);
    if (error.message === 'Team not found') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'An error occurred while resetting team points' });
  }
};

const getConfig = async (req, res) => {
  try {
    const { prisma } = require('../config/database');
    const configs = await prisma.appConfig.findMany();
    const configObj = {};
    configs.forEach(config => {
      configObj[config.key] = config.value;
    });
    res.json(configObj);
  } catch (err) {
    console.error('Error fetching config:', err);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
};

const updateConfig = async (req, res) => {
  try {
    const { key, value } = req.body;
    const { prisma } = require('../config/database');
    
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    const config = await prisma.appConfig.upsert({
      where: { key },
      update: { 
        value: value.toString(),
        updatedBy: req.user.id 
      },
      create: { 
        key,
        value: value.toString(), 
        updatedBy: req.user.id 
      }
    });

    res.json({ message: 'Configuration updated successfully', config });
  } catch (err) {
    console.error('Error updating config:', err);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
};

module.exports = {
  getAllUsers,
  getAllTeams,
  createTeam,
  updateTeam,
  updateUser,
  getCoaches,
  getActivityCategories,
  createActivityCategory,
  getAllActivities,
  createActivity,
  updateActivity,
  resetTeamPoints,
  getConfig,
  updateConfig
};