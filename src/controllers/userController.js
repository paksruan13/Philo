const userService = require('../services/userService');
const { emitLeaderboardUpdate } = require('../services/leaderboardService');
const { prisma } = require('../config/lambdaDatabase');

const createUser = async (req, res) => {
  const { name, email, teamId } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and Email are required' });
  }

  try {
    const userData = {
      name,
      email,
      team: teamId ? { connect: { id: teamId } } : undefined
    };
    
    const user = await userService.createUser(userData);
    
    if (teamId) {
      await emitLeaderboardUpdate(req.app.get('io'));
    }
    
    res.status(201).json(user);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: {
          select: { 
            id: true, 
            name: true, 
            teamCode: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: err.message });
  }
};

const getAllCoaches = async (req, res) => {
  try {
    const coaches = await prisma.user.findMany({
      where: { role: 'COACH' },
      select: {
        id: true, name: true, email: true,
        team: {
          select: { id: true, name: true, teamCode: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(coaches);
  } catch (err) {
    console.error('Error fetching coaches:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, teamId, isActive } = req.body;
  try {
    const updateduser = await prisma.user.update({
      where: { id },
      data: {
        name, email, role, isActive, team: teamId ? { connect : { id: teamId } } : { disconnect: true }
      },
      include:{ 
        team: true
      }
    });

    if (role === 'COACH' && teamId) {
      await prisma.team.update({
        where: { id: teamId },
        data: { coachId : id }
      });
    }

    if (role !== 'COACH') {
      const teamsCoached = await prisma.team.findMany({
        where: { coachId: id },
        select: { id: true }
      });
      if (teamsCoached.length > 0) {
        await prisma.team.updateMany({
          where: { coachId: id },
          data: { coachId: null }
        }); 
      }
    }
    if (req.app.get('io')) {
      await emitLeaderboardUpdate(req.app.get('io'));
    }
    const finalUser = await prisma.user.findUnique({
      where: { id },
      include: {
        team: true,
        coachedTeams: true
      }
    });
    res.json(finalUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createUser,
  getAllUsers,
  getAllCoaches,
  updateUser
};