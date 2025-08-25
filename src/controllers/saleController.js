const saleService = require('../services/saleService');
const { prisma } = require('../config/database');

const createSale = async (req, res) => {
  const { shirtSize, quantity, teamId, paymentMethod } = req.body;
  const coachId = req.user.id;

  if (!shirtSize || !quantity || !teamId || !paymentMethod) {
    return res.status(400).json({
      error: 'shirtSize, quantity, teamId, and paymentMethod are required fields'
    });
  }
  
  if (!['CASH', 'VENMO'].includes(paymentMethod)) {
    return res.status(400).json({
      error: "paymentMethod must be either CASH or VENMO"
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

  const sale = await saleService.processSale(shirtSize, quantity, teamId, paymentMethod, coachId);
  res.status(201).json(sale);
  } catch (error) {
    console.error('Error creating shirt sale:', error);
    res.status(500).json({ error: 'Internal server error' }); 
  }
 };

const getAllSales = async (req, res) => {
  try {
    const sales = await saleService.getAllSales();
    res.json(sales);
  } catch (err) {
    console.error('Error fetching shirt sales:', err);
    res.status(500).json({ error: 'Internal server error' });
    }
};

const getTeamSales = async (req, res) => {
  const { teamId } = req.params;
  try {
    const sales = await saleService.getTeamSales(teamId);
    res.json(sales);
  } catch (err) {
    console.error('Error fetching team sales:', err);
    res.status(500).json({ error: err.message });
  }
}

const getRecentSales = async (req, res) => {
  try {
    const sales = await saleService.getRecentSales();
    res.json(sales);
  } catch (err) {
    console.error('Error fetching recent sales:', err);
    res.status(500).json({ error: err.message });
  }
};

const getShirtInventory = async (req, res) => {
  try {
    const inventory = await saleService.getShirtInventory();
    const currentPrice = await saleService.getCurrentPrice();
    res.json({
      inventory, currentPrice
    });
  } catch (err) {
    console.error('Error fetching shirt inventory:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateInventory = async (req, res) => {
  const { size, quantity } = req.body;
  if (!size || quantity === undefined) {
    return res.status(400).json({ error: 'size and quantity are required fields' });
  };

  try {
    const updatedInventory = await saleService.updateInventory(size, parseInt(quantity));
    res.json(updatedInventory);
    } catch (err) {
      console.error('Error updating shirt inventory:', err);
      res.status(500).json({ error: err.message });
    }
}

const updatePrice = async (req, res) => {
  const { price } = req.body;
  const userId = req.user.id;
  if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
    return res.status(400).json({
      error: 'A valid price greater than 0 is required'
    });
  }
  try {
    const updatedPrice = await saleService.updatePrice(parseFloat(price), userId);
    res.json(updatedPrice);
  } catch (err) {
    console.error('Error updating shirt price:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createSale,
  getAllSales,
  updatePrice,
  getTeamSales,
  getRecentSales,
  getShirtInventory,
  updateInventory,
};