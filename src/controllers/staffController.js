const staffService = require('../services/staffService');

const staffController = {
  // Get staff dashboard data
  getDashboard: async (req, res) => {
    try {
      const [teams, students, products] = await Promise.all([
        staffService.getAllTeams(),
        staffService.getAllActiveStudentsWithTeams(),
        staffService.getActiveProducts()
      ]);

      res.json({
        teams,
        students,
        products,
        stats: {
          totalTeams: teams.length,
          totalStudents: students.length,
          totalProducts: products.length
        }
      });
    } catch (error) {
      console.error('Staff dashboard error:', error);
      res.status(500).json({ error: 'Failed to load dashboard data' });
    }
  },

  // Award points to a student
  awardPoints: async (req, res) => {
    try {
      const { userId, teamId, points, activityDescription } = req.body;
      const staffId = req.user.id;

      const pointsAward = await staffService.awardPointsToStudent(
        userId, 
        teamId, 
        points, 
        activityDescription, 
        staffId
      );

      res.json({
        message: 'Points awarded successfully',
        pointsAward
      });
    } catch (error) {
      console.error('Award points error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get manual points history
  getManualPointsHistory: async (req, res) => {
    try {
      const staffId = req.user.id;
      const pointsHistory = await staffService.getStaffPointsHistory(staffId);
      res.json(pointsHistory);
    } catch (error) {
      console.error('Points history error:', error);
      res.status(500).json({ error: 'Failed to get points history' });
    }
  },

  // Sell product to student
  sellProduct: async (req, res) => {
    try {
      const { productId, userId, teamId, size, quantity, paymentMethod, amountPaid } = req.body;
      const staffId = req.user.id;

      const sale = await staffService.sellProductToStudent(
        productId,
        userId,
        teamId,
        size,
        quantity,
        paymentMethod,
        amountPaid,
        staffId
      );

      res.json({
        message: 'Product sold successfully',
        sale
      });
    } catch (error) {
      console.error('Sell product error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get sales made by staff
  getSales: async (req, res) => {
    try {
      const staffId = req.user.id;
      const sales = await staffService.getStaffSales(staffId);
      res.json(sales);
    } catch (error) {
      console.error('Get sales error:', error);
      res.status(500).json({ error: 'Failed to get sales data' });
    }
  }
};

module.exports = staffController;
