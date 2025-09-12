const { prisma } = require('../config/database');

/**
 * Product Sale Service - Handles all product sale-related database operations
 */

// Get all sales for a specific coach
const getCoachSales = async (coachId) => {
  const sales = await prisma.productSale.findMany({
    where: { coachId },
    include: {
      product: {
        select: { name: true, type: true, points: true }
      },
      user: {
        select: { 
          name: true,
          team: {
            select: { name: true }
          }
        }
      },
      team: {
        select: { name: true }
      }
    },
    orderBy: { soldAt: 'desc' }
  });

  // Format sales to include customer info for both internal and external sales
  return sales.map(sale => ({
    ...sale,
    customerName: sale.isExternalSale ? sale.externalCustomerName : sale.user?.name,
    customerEmail: sale.isExternalSale ? sale.externalCustomerEmail : sale.user?.email,
    teamName: sale.team?.name || 'No Team'
  }));
};

// Get all product sales (admin view)
const getAllProductSales = async () => {
  return await prisma.productSale.findMany({
    include: {
      product: true,
      user: {
        select: { name: true }
      },
      team: {
        select: { name: true }
      },
      coach: {
        select: { name: true }
      }
    },
    orderBy: { soldAt: 'desc' }
  });
};

// Get user by ID with team
const getUserWithTeam = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: { team: true }
  });
};

// Get user by email with team
const getUserByEmailWithTeam = async (email) => {
  return await prisma.user.findUnique({
    where: { email },
    include: { team: true }
  });
};

// Create internal sale (with donation and points)
const createInternalSale = async (saleData) => {
  return await prisma.$transaction(async (tx) => {
    // Get product details
    const product = await tx.product.findUnique({
      where: { id: saleData.productId }
    });

    if (!product || !product.isActive) {
      throw new Error('Product not found or inactive');
    }

    // Get user and their team
    const user = await tx.user.findUnique({
      where: { id: saleData.userId },
      include: { team: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const teamId = user.team?.id || null;

    // Check inventory
    const inventory = await tx.productInventory.findUnique({
      where: {
        productId_size: {
          productId: saleData.productId,
          size: saleData.size
        }
      }
    });

    if (!inventory || inventory.quantity < saleData.quantity) {
      throw new Error('Insufficient inventory');
    }

    // Update inventory
    await tx.productInventory.update({
      where: {
        productId_size: {
          productId: saleData.productId,
          size: saleData.size
        }
      },
      data: {
        quantity: { decrement: saleData.quantity }
      }
    });

    // Create sale record
    const sale = await tx.productSale.create({
      data: {
        productId: saleData.productId,
        size: saleData.size,
        quantity: saleData.quantity,
        paymentMethod: saleData.paymentMethod,
        amountPaid: parseFloat(saleData.amountPaid),
        coachId: saleData.coachId,
        userId: user.id,
        teamId: teamId,
        isExternalSale: false
      },
      include: {
        product: true,
        user: { select: { name: true } },
        team: teamId ? { select: { name: true } } : undefined
      }
    });

    // Create donation record
    const donationData = {
      amount: parseFloat(saleData.amountPaid),
      userId: user.id,
      currency: 'usd'
    };
    
    if (teamId) {
      donationData.teamId = teamId;
    }
    
    await tx.donation.create({
      data: donationData
    });

    // Award points to team if user belongs to a team
    let totalPoints = 0;
    if (teamId) {
      totalPoints = product.points * saleData.quantity;
      await tx.team.update({
        where: { id: teamId },
        data: {
          totalPoints: { increment: totalPoints }
        }
      });
    }

    return { sale, pointsAwarded: totalPoints };
  });
};

// Create external sale (with donation tracking)
const createExternalSale = async (saleData) => {
  return await prisma.$transaction(async (tx) => {
    // Get product details
    const product = await tx.product.findUnique({
      where: { id: saleData.productId }
    });

    if (!product || !product.isActive) {
      throw new Error('Product not found or inactive');
    }

    // Check inventory
    const inventory = await tx.productInventory.findUnique({
      where: {
        productId_size: {
          productId: saleData.productId,
          size: saleData.size
        }
      }
    });

    if (!inventory || inventory.quantity < saleData.quantity) {
      throw new Error('Insufficient inventory');
    }

    // Update inventory
    await tx.productInventory.update({
      where: {
        productId_size: {
          productId: saleData.productId,
          size: saleData.size
        }
      },
      data: {
        quantity: { decrement: saleData.quantity }
      }
    });

    // Create sale record
    const sale = await tx.productSale.create({
      data: {
        productId: saleData.productId,
        size: saleData.size,
        quantity: saleData.quantity,
        paymentMethod: saleData.paymentMethod,
        amountPaid: parseFloat(saleData.amountPaid),
        coachId: saleData.coachId,
        isExternalSale: true,
        externalCustomerName: saleData.externalCustomerName,
        externalCustomerEmail: saleData.externalCustomerEmail || null
      },
      include: {
        product: true
      }
    });

    // Create donation record linked to the product sale
    await tx.donation.create({
      data: {
        amount: parseFloat(saleData.amountPaid),
        currency: 'usd',
        productSaleId: sale.id
      }
    });

    return { sale, pointsAwarded: 0 };
  });
};

// Create ticket sale (online purchase)
const createTicketSale = async (saleData) => {
  return await prisma.$transaction(async (tx) => {
    // Get ticket details
    const ticket = await tx.product.findUnique({
      where: { id: saleData.ticketId },
      include: { inventory: true }
    });

    if (!ticket || !ticket.isActive || ticket.type !== 'TICKET') {
      throw new Error('Ticket not found or inactive');
    }

    // Find user by email
    const user = await tx.user.findUnique({
      where: { email: saleData.email },
      include: { team: true }
    });

    if (!user) {
      throw new Error('User not found. Please make sure you have an account.');
    }

    if (!user.team) {
      throw new Error('User does not belong to a team');
    }

    // Check ticket inventory (tickets use ONESIZE)
    const inventory = await tx.productInventory.findUnique({
      where: {
        productId_size: {
          productId: saleData.ticketId,
          size: 'ONESIZE'
        }
      }
    });

    if (!inventory || inventory.quantity < 1) {
      throw new Error('Ticket sold out');
    }

    // Update inventory
    await tx.productInventory.update({
      where: {
        productId_size: {
          productId: saleData.ticketId,
          size: 'ONESIZE'
        }
      },
      data: {
        quantity: { decrement: 1 }
      }
    });

    // Create sale record
    const sale = await tx.productSale.create({
      data: {
        productId: saleData.ticketId,
        size: 'ONESIZE',
        quantity: 1,
        userId: user.id,
        teamId: user.team.id,
        paymentMethod: 'ONLINE',
        amountPaid: parseFloat(ticket.price),
        coachId: null // No coach for online ticket purchases
      },
      include: {
        product: true,
        user: { select: { name: true } },
        team: { select: { name: true } }
      }
    });

    // Create donation record
    await tx.donation.create({
      data: {
        amount: parseFloat(ticket.price),
        userId: user.id,
        teamId: user.team.id,
        currency: 'usd'
      }
    });

    // Award points to team
    const totalPoints = ticket.points * 1;
    await tx.team.update({
      where: { id: user.team.id },
      data: {
        totalPoints: { increment: totalPoints }
      }
    });

    return { sale, pointsAwarded: totalPoints };
  });
};

// Get sale by ID with related data
const getSaleById = async (saleId) => {
  return await prisma.productSale.findUnique({
    where: { id: saleId },
    include: {
      product: true,
      user: { include: { team: true } }
    }
  });
};

// Delete sale and restore inventory/points
const deleteSale = async (saleId, coachId) => {
  return await prisma.$transaction(async (tx) => {
    // Get the sale details
    const sale = await tx.productSale.findUnique({
      where: { id: saleId },
      include: {
        product: true,
        user: { include: { team: true } }
      }
    });

    if (!sale) {
      throw new Error('Sale not found');
    }

    // Check if this coach made the sale
    if (sale.coachId !== coachId) {
      throw new Error('You can only delete sales you made');
    }

    // Restore inventory
    await tx.productInventory.upsert({
      where: {
        productId_size: {
          productId: sale.productId,
          size: sale.size
        }
      },
      update: {
        quantity: { increment: sale.quantity }
      },
      create: {
        productId: sale.productId,
        size: sale.size,
        quantity: sale.quantity
      }
    });

    // Remove points from team (only for internal sales)
    let pointsRemoved = 0;
    if (sale.teamId && sale.userId) {
      pointsRemoved = sale.product.points * sale.quantity;
      await tx.team.update({
        where: { id: sale.teamId },
        data: {
          totalPoints: { decrement: pointsRemoved }
        }
      });
    }

    // Remove the corresponding donation record
    if (sale.userId && sale.teamId) {
      // Internal sale - find donation with user and team
      const donationToDelete = await tx.donation.findFirst({
        where: {
          userId: sale.userId,
          teamId: sale.teamId,
          amount: sale.amountPaid,
          createdAt: {
            gte: new Date(sale.soldAt.getTime() - 60000), // 1 minute before
            lte: new Date(sale.soldAt.getTime() + 60000)  // 1 minute after
          }
        }
      });

      if (donationToDelete) {
        await tx.donation.delete({
          where: { id: donationToDelete.id }
        });
      }
    } else if (sale.isExternalSale) {
      // External sale - delete linked donation
      const donationToDelete = await tx.donation.findFirst({
        where: {
          productSaleId: sale.id
        }
      });

      if (donationToDelete) {
        await tx.donation.delete({
          where: { id: donationToDelete.id }
        });
      }
    }

    // Delete the sale
    await tx.productSale.delete({
      where: { id: saleId }
    });

    return { pointsRemoved, sale };
  });
};

module.exports = {
  getCoachSales,
  getAllProductSales,
  getUserWithTeam,
  getUserByEmailWithTeam,
  createInternalSale,
  createExternalSale,
  createTicketSale,
  getSaleById,
  deleteSale
};