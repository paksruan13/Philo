const saleService = require('../services/saleService');

const createSale = async (req, res) => {
  const { shirtSize, quantity, teamId } = req.body;
  const coachId = req.user.id;

  if (!shirtSize || !quantity || !teamId) {
    return res.status(400).json({
      error: 'shirtSize, quantity, and teamId are required fields'
    });
  }
  try { 
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
        coachId
      }
    });
    if (!team) {
      return res.status(403).json({ error: 'You do not have permission to sell shirts for this team' });
    }
    const sale = await saleService.processSale(shirtSize, quantity, teamId);
    res.stat
  }
 };

const getAllSales = async (req, res) => {
  try {
    const sales = await saleService.getAllSales();
    res.json(sales);
  } catch (err) {
    console.error('Error fetching shirt sales:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createSale,
  getAllSales
};