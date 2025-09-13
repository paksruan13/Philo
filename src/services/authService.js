const { prisma } = require('../config/lambdaDatabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (userData) => {
  const existingUser = await prisma.user.findUnique({ 
    where: { email: userData.email } 
  });
  
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(userData.password, 12);

  // Set default role to INDIVIDUAL if no team is provided
  const userRole = userData.teamId ? (userData.role || 'STUDENT') : 'STUDENT';

  const user = await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
      role: userRole,
      teamId: userData.teamId || null // Allow users without teams
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      teamId: true,
      team: { select: { id: true, name: true } },
      mustChangePassword: true
    }
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, teamId: user.teamId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user, token };
};

const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { team: true, coachedTeams: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new Error('Invalid password');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, teamId: user.teamId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team,
      coachedTeams: user.coachedTeams,
      mustChangePassword: user.mustChangePassword
    },
    token,
    mustChangePassword: user.mustChangePassword
  };
};

const registerWithTeam = async (userData) => {
  let team = null;
  let teamName = null;

  // Only look up team if teamCode is provided
  if (userData.teamCode && userData.teamCode.trim()) {
    team = await prisma.team.findUnique({
      where: { teamCode: userData.teamCode },
      select: { id: true, name: true, isActive: true },
    });

    if (!team) {
      throw new Error('Invalid team code');
    }

    if (!team.isActive) {
      throw new Error('Team registration is not active');
    }

    teamName = team.name;
  }

  const existingUser = await prisma.user.findUnique({ 
    where: { email: userData.email } 
  });
  
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(userData.password, 12);
  
  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: 'STUDENT',
      teamId: team ? team.id : null
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      team: team ? { select: { id: true, name: true, teamCode: true } } : true,
    }
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, teamId: user.teamId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user, token, teamName: teamName || 'No Team' };
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // For users who must change password, skip current password validation
  if (!user.mustChangePassword) {
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      throw new Error('Current password is incorrect');
    }
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedNewPassword,
      mustChangePassword: false
    }
  });

  return { success: true };
};

module.exports = {
  registerUser,
  loginUser,
  registerWithTeam,
  changePassword
};