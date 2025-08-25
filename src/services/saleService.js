const { prisma } = require('../config/database');

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

const updatePrice = async (price, userId) => {
  return await prisma.shirtPrice.create({
    data: {
      price, updatedBy: userId
    }
  });
};

const getCurrentPrice = async () => {
  const priceRecord = await prisma.shirtPrice.findFirst({
    orderBy: { updatedAt: 'desc' } 
  });
  return priceRecord?.price || 30.00;
}

const processSale = async(shirtSize, quantity, teamId, paymentMethod, coachId) => {
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
        shirtSize, quantity, teamId, coachId, paymentMethod, amountPaid: totalAmount, soldAt: new Date()
      },
      include: {
        team: {
          select: {
            name: true
          }
        }
      }
    });
    return sale;
  });
};

module.exports = {
  createSale,
  getAllSales,
  getTeamSales,
  getRecentSales,
  getShirtInventory,
  updateInventory,
  updatePrice,
  getCurrentPrice,
  processSale
};