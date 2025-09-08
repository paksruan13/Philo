const { prisma } = require('../config/database');
const { emitLeaderboardUpdate } = require('../services/leaderboardService');

const sellProduct = async (req, res) => {
  try {
    const { productId, size, quantity, userId, paymentMethod, amountPaid } = req.body;
    const coachId = req.user.id;

    if (!productId || !size || !quantity || !userId || !paymentMethod || !amountPaid) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get product details
      const product = await tx.product.findUnique({
        where: { id: productId }
      });

      if (!product || !product.isActive) {
        throw new Error('Product not found or inactive');
      }

      // Get user and their team
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { team: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.team) {
        throw new Error('User does not belong to a team');
      }

      // Check inventory
      const inventory = await tx.productInventory.findUnique({
        where: {
          productId_size: {
            productId,
            size
          }
        }
      });

      if (!inventory || inventory.quantity < quantity) {
        throw new Error('Insufficient inventory');
      }

      // Update inventory
      await tx.productInventory.update({
        where: {
          productId_size: {
            productId,
            size
          }
        },
        data: {
          quantity: { decrement: quantity }
        }
      });

      // Create sale record
      const sale = await tx.productSale.create({
        data: {
          productId,
          size,
          quantity,
          userId,
          teamId: user.team.id,
          paymentMethod,
          amountPaid: parseFloat(amountPaid),
          coachId
        },
        include: {
          product: true,
          user: { select: { name: true } },
          team: { select: { name: true } }
        }
      });

      // Create a donation record for the product purchase
      await tx.donation.create({
        data: {
          amount: parseFloat(amountPaid),
          userId,
          teamId: user.team.id,
          currency: 'usd'
        }
      });

      // Award points to team
      const totalPoints = product.points * quantity;
      await tx.team.update({
        where: { id: user.team.id },
        data: {
          totalPoints: { increment: totalPoints }
        }
      });

      return { sale, pointsAwarded: totalPoints };
    });

    // Emit leaderboard update
    await emitLeaderboardUpdate(req.app.get('io'));

    res.status(201).json({
      message: 'Product sold successfully',
      ...result
    });

  } catch (error) {
    console.error('Error selling product:', error);
    if (error.message.includes('not found') || error.message.includes('Insufficient')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to process sale' });
  }
};

// Get sales by coach
const getCoachSales = async (req, res) => {
  try {
    const coachId = req.user.id;
    
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

    res.json(sales);
  } catch (error) {
    console.error('Error fetching coach sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
};

// Delete a sale (with inventory restoration and points removal)
const deleteSale = async (req, res) => {
  try {
    const { saleId } = req.params;
    const coachId = req.user.id;

    const result = await prisma.$transaction(async (tx) => {
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

      // Remove points from team
      const pointsToRemove = sale.product.points * sale.quantity;
      await tx.team.update({
        where: { id: sale.teamId },
        data: {
          totalPoints: { decrement: pointsToRemove }
        }
      });

      // Remove the corresponding donation record
      // Find and delete donation with matching amount, user, and team from around the same time
      const donationToDelete = await tx.donation.findFirst({
        where: {
          userId: sale.userId,
          teamId: sale.teamId,
          amount: sale.amountPaid,
          // Look for donations created within 1 minute of the sale
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

      // Delete the sale
      await tx.productSale.delete({
        where: { id: saleId }
      });

      return { pointsRemoved: pointsToRemove, sale };
    });

    // Emit leaderboard update
    await emitLeaderboardUpdate(req.app.get('io'));

    res.json({
      message: 'Sale deleted successfully',
      pointsRemoved: result.pointsRemoved
    });

  } catch (error) {
    console.error('Error deleting sale:', error);
    if (error.message.includes('not found') || error.message.includes('can only delete')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete sale' });
  }
};

// Purchase ticket (public endpoint)
const purchaseTicket = async (req, res) => {
  try {
    const { ticketId, email, name } = req.body;

    if (!ticketId || !email || !name) {
      return res.status(400).json({ error: 'Ticket ID, email, and name are required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get ticket details
      const ticket = await tx.product.findUnique({
        where: { id: ticketId },
        include: { inventory: true }
      });

      if (!ticket || !ticket.isActive || ticket.type !== 'TICKET') {
        throw new Error('Ticket not found or inactive');
      }

      // Find user by email
      const user = await tx.user.findUnique({
        where: { email },
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
            productId: ticketId,
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
            productId: ticketId,
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
          productId: ticketId,
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

      // Create a donation record for the ticket purchase
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

    // Emit leaderboard update
    await emitLeaderboardUpdate(req.app.get('io'));

    res.status(201).json({
      message: 'Ticket purchased successfully',
      ...result
    });

  } catch (error) {
    console.error('Error purchasing ticket:', error);
    if (error.message.includes('not found') || error.message.includes('sold out')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to process ticket purchase' });
  }
};

module.exports = {
  sellProduct,
  getCoachSales,
  deleteSale,
  purchaseTicket
};
