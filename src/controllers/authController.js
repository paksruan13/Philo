const authService = require('../services/authService');
const userService = require('../services/userService');
const teamService = require('../services/teamService');

const register = async (req, res) => {
  try {
    const { name, email, password, role = 'STUDENT', teamId } = req.body;
    const userData = {
      name,
      email,
      password,
      role,
      teamId: teamId || null
    };

    const { user, token } = await authService.registerUser(userData);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (err) {
    console.error('Error registering user:', err);
    if (err.message === 'User already exists') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser(email, password);

    res.json({
      message: 'Login successful',
      user,
      token,
    });
  } catch (err) {
    console.error('Error logging in:', err);
    if (err.message === 'User not found') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === 'Invalid password') {
      return res.status(401).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 5) {
      return res.status(400).json({ error: 'New password must be at least 5 characters long' });
    }

    await authService.changePassword(userId, currentPassword, newPassword);
    
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    if (err.message === 'Current password is incorrect') {
      return res.status(400).json({ error: err.message });
    }
    if (err.message === 'User not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const registerWithTeam = async (req, res) => {
  try {
    const { teamCode, name, email, password } = req.body;
    const { user, token, teamName } = await authService.registerWithTeam({
      teamCode,
      name,
      email,
      password
    });

    res.status(201).json({
      message: `Successfully joined ${teamName}`,
      user,
      token,
    });
  } catch (err) {
    console.error('Error registering with team:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const joinTeam = async (req, res) => {
  try {
    const { teamCode } = req.body;
    const userId = req.user.id;

    const team = await teamService.findTeamByCode(teamCode);
    if (!team) {
      return res.status(400).json({ error: 'Invalid team code' });
    }
    if (!team.isActive) {
      return res.status(400).json({ error: 'Team is not active' });
    }

    const user = await userService.updateUser(userId, { teamId: team.id });
    
    res.json({
      message: `Successfully joined ${team.name}`,
      user,
    });
  } catch (err) {
    console.error('Error joining team:', err);
    res.status(500).json({ error: 'Failed to join team' });
  }
};

module.exports = {
  register,
  login,
  changePassword,
  getCurrentUser,
  getMe,
  registerWithTeam,
  joinTeam
};