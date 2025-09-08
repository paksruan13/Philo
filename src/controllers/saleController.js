const saleService = require('../services/saleService');
const { getShirtPointsConfig, updateShirtPointsConfig } = require('../services/pointsService');
const { prisma } = require('../config/database');

const createSale = async (req, res) => {
  const { shirtSize, quantity, userId, paymentMethod } = req.body;
  const coachId = req.user.id;

  if (!shirtSize || !quantity || !userId || !paymentMethod) {
    return res.status(400).json({
      error: 'shirtSize, quantity, userId, and paymentMethod are required fields'
    });
  }
  
  if (!['CASH', 'VENMO'].includes(paymentMethod)) {
    return res.status(400).json({
      error: "paymentMethod must be either CASH or VENMO"
    });
  }

  try {
    // Get the user and their team
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { team: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.team) {
      return res.status(400).json({ error: 'User is not assigned to a team' });
    }

    // No team restriction - coaches can sell to any user
    const sale = await saleService.processSale(shirtSize, quantity, userId, user.team.id, paymentMethod, coachId);
    res.status(201).json(sale);
  } catch (error) {
    console.error('Error creating shirt sale:', error);
    res.status(500).json({ error: error.message || 'Internal server error' }); 
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
    const pointsPerShirt = await getShirtPointsConfig();
    res.json({
      inventory, 
      currentPrice,
      pointsPerShirt
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

const updateShirtConfig = async (req, res) => {
  const { price, pointsPerShirt } = req.body;
  const userId = req.user.id;
  
  if (price !== undefined && (isNaN(parseFloat(price)) || parseFloat(price) <= 0)) {
    return res.status(400).json({
      error: 'Price must be a valid number greater than 0'
    });
  }
  
  if (pointsPerShirt !== undefined && (!Number.isInteger(pointsPerShirt) || pointsPerShirt < 0)) {
    return res.status(400).json({
      error: 'Points per shirt must be a valid integer greater than or equal to 0'
    });
  }
  
  if (price === undefined && pointsPerShirt === undefined) {
    return res.status(400).json({
      error: 'Either price or pointsPerShirt must be provided'
    });
  }
  
  try {
    // Get current config to use as defaults
    const currentConfig = await saleService.getCurrentShirtConfig();
    const finalPrice = price !== undefined ? parseFloat(price) : currentConfig.price;
    const finalPoints = pointsPerShirt !== undefined ? pointsPerShirt : currentConfig.pointsPerShirt;
    
    const updatedConfig = await saleService.updateShirtConfig(finalPrice, finalPoints, userId);
    res.json(updatedConfig);
  } catch (err) {
    console.error('Error updating shirt config:', err);
    res.status(500).json({ error: err.message });
  }
}

const createShirtSize = async (req, res) => {
  const { size, quantity = 0 } = req.body;
  
  if (!size || typeof size !== 'string' || size.trim().length === 0) {
    return res.status(400).json({ error: 'Valid size is required' });
  }

  try {
    const newSize = await saleService.createShirtSize(size.trim(), parseInt(quantity));
    res.status(201).json(newSize);
  } catch (err) {
    console.error('Error creating shirt size:', err);
    if (err.message.includes('already exists')) {
      res.status(409).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

const deleteShirtSize = async (req, res) => {
  const { size } = req.params;
  
  try {
    await saleService.deleteShirtSize(size);
    res.json({ message: `Size ${size} deleted successfully` });
  } catch (err) {
    console.error('Error deleting shirt size:', err);
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
    } else if (err.message.includes('cannot be deleted')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

const deleteSale = async (req, res) => {
  const { saleId } = req.params;
  const coachId = req.user.id;
  
  try {
    await saleService.deleteSale(saleId, coachId);
    res.json({ message: 'Sale deleted successfully' });
  } catch (err) {
    console.error('Error deleting sale:', err);
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
    } else if (err.message.includes('not authorized')) {
      res.status(403).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

const getTeamUsers = async (req, res) => {
  try {
    const users = await saleService.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createSale,
  getAllSales,
  updateShirtConfig,
  getTeamSales,
  getRecentSales,
  getShirtInventory,
  updateInventory,
  createShirtSize,
  deleteShirtSize,
  deleteSale,
  getTeamUsers,
};