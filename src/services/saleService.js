const { prisma } = require('../config/database');
const { updateTeamPoints } = require('./pointsService');

const createSale = async (saleData) => {
  return await prisma.shirtSale.create({
    data: saleData,
    include: {
      team: { select: { id: true, name: true } },
    },
  });
};

const getAllSales = async () => {
  return await prisma.shirtSale.findMany({
    include: {
      team: {
        select: {
          name: true
        }
      },
      coach: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      soldAt: 'desc'
    }
  });
};

const getTeamSales = async (teamId) => {
  return await prisma.shirtSale.findMany({
    where: { teamId },
    include: {
      coach: {
        select: {
          name: true
        }
      }
    },
    orderBy:{
      soldAt: 'desc'
    }
  });
};

const getRecentSales = async () => {
  const thirtyDaysago = new Date();
  thirtyDaysago.setDate(thirtyDaysago.getDate() - 30);

  return await prisma.shirtSale.findMany({
    where: {
      soldAt: {
        gte: thirtyDaysago
      }
    },
    include: {
      team: {
        select: {
          id: true,
          name: true
        }
      },
      user: {
        select: {
          id: true,
          name: true
        }
      },
      coach: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      soldAt: 'desc'
    }
  });
};

const getShirtInventory = async () => { 
  return await prisma.shirtInventory.findMany({
    orderBy: {
      size: 'asc'
    }
  });
};

const updateInventory = async (size, quantity) => {
  return await prisma.shirtInventory.upsert({
    where: {size},
    update: {quantity},
    create: {size, quantity}
  });
};

const updateShirtConfig = async (price, pointsPerShirt, userId) => {
  return await prisma.shirtConfig.create({
    data: {
      price, 
      pointsPerShirt,
      updatedBy: userId
    }
  });
};

const getCurrentPrice = async () => {
  const configRecord = await prisma.shirtConfig.findFirst({
    orderBy: { updatedAt: 'desc' } 
  });
  return configRecord?.price || 15.00;
}

const getCurrentShirtConfig = async () => {
  const configRecord = await prisma.shirtConfig.findFirst({
    orderBy: { updatedAt: 'desc' } 
  });
  return configRecord || { price: 15.00, pointsPerShirt: 10 };
}

const processSale = async(shirtSize, quantity, userId, teamId, paymentMethod, coachId) => {
  return await prisma.$transaction(async (tx) => {
    const inventory = await tx.shirtInventory.findUnique({
      where: { size: shirtSize }
    });
    if (!inventory) {
      throw new Error(`No inventory found for size: ${shirtSize}`);
    }
    if (inventory.quantity < quantity) {
      throw new Error(`Not Enough inventory for size: ${shirtSize}`);
    }
    const price = await getCurrentPrice();
    const totalAmount = price * quantity;
    await tx.shirtInventory.update({
      where: { size: shirtSize },
      data: { quantity: { decrement: quantity }}
    });
    const sale = await tx.shirtSale.create({
      data: {
        shirtSize, 
        quantity, 
        userId,
        teamId, 
        coachId, 
        paymentMethod, 
        amountPaid: totalAmount, 
        soldAt: new Date()
      },
      include: {
        team: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Update team points after successful sale
    await updateTeamPoints(teamId);
    
    return sale;
  });
};

const createShirtSize = async (size, quantity = 0) => {
  // Check if size already exists
  const existingSize = await prisma.shirtInventory.findUnique({
    where: { size }
  });

  if (existingSize) {
    throw new Error(`Shirt size ${size} already exists`);
  }

  return await prisma.shirtInventory.create({
    data: {
      size,
      quantity: Math.max(0, quantity)
    }
  });
};

const deleteShirtSize = async (size) => {
  // Check if size exists
  const existingSize = await prisma.shirtInventory.findUnique({
    where: { size }
  });

  if (!existingSize) {
    throw new Error(`Shirt size ${size} not found`);
  }

  // Check if there are any sales for this size
  const salesCount = await prisma.shirtSale.count({
    where: { shirtSize: size }
  });

  if (salesCount > 0) {
    throw new Error(`Size ${size} cannot be deleted because it has sales history`);
  }

  return await prisma.shirtInventory.delete({
    where: { size }
  });
};

const deleteSale = async (saleId, coachId) => {
  return await prisma.$transaction(async (tx) => {
    // Find the sale
    const sale = await tx.shirtSale.findUnique({
      where: { id: saleId },
      include: { team: true }
    });

    if (!sale) {
      throw new Error('Sale not found');
    }

    // Check if coach has permission to delete this sale
    if (sale.coachId !== coachId) {
      throw new Error('You are not authorized to delete this sale');
    }

    // Restore inventory
    await tx.shirtInventory.update({
      where: { size: sale.shirtSize },
      data: { quantity: { increment: sale.quantity } }
    });

    // Delete the sale
    await tx.shirtSale.delete({
      where: { id: saleId }
    });

    // Update team points
    await updateTeamPoints(sale.teamId);

    return { message: 'Sale deleted successfully' };
  });
};

const getAllUsers = async () => {
  // Get all users with teams (not restricted to coach's teams)
  const users = await prisma.user.findMany({
    where: {
      teamId: {
        not: null // Only users that are assigned to a team
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      team: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [
      { team: { name: 'asc' } },
      { name: 'asc' }
    ]
  });

  return users;
};

module.exports = {
  createSale,
  getAllSales,
  getTeamSales,
  getRecentSales,
  getShirtInventory,
  updateInventory,
  updateShirtConfig,
  getCurrentPrice,
  getCurrentShirtConfig,
  processSale,
  createShirtSize,
  deleteShirtSize,
  deleteSale,
  getAllUsers
};