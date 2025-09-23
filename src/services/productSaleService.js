const { prisma } = require('../config/lambdaDatabase');


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

  
  return sales.map(sale => ({
    ...sale,
    customerName: sale.isExternalSale ? sale.externalCustomerName : sale.user?.name,
    customerEmail: sale.isExternalSale ? sale.externalCustomerEmail : sale.user?.email,
    teamName: sale.team?.name || 'No Team'
  }));
};


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


const getUserWithTeam = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: { team: true }
  });
};


const getUserByEmailWithTeam = async (email) => {
  return await prisma.user.findUnique({
    where: { email },
    include: { team: true }
  });
};


const createInternalSale = async (saleData) => {
  return await prisma.$transaction(async (tx) => {
    
    const product = await tx.product.findUnique({
      where: { id: saleData.productId }
    });

    if (!product || !product.isActive) {
      throw new Error('Product not found or inactive');
    }

    
    const user = await tx.user.findUnique({
      where: { id: saleData.userId },
      include: { team: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const teamId = user.team?.id || null;

    
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


const createExternalSale = async (saleData) => {
  return await prisma.$transaction(async (tx) => {
    
    const product = await tx.product.findUnique({
      where: { id: saleData.productId }
    });

    if (!product || !product.isActive) {
      throw new Error('Product not found or inactive');
    }

    
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


const createTicketSale = async (saleData) => {
  return await prisma.$transaction(async (tx) => {
    
    const ticket = await tx.product.findUnique({
      where: { id: saleData.ticketId },
      include: { inventory: true }
    });

    if (!ticket || !ticket.isActive || ticket.type !== 'TICKET') {
      throw new Error('Ticket not found or inactive');
    }

    
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

    
    const sale = await tx.productSale.create({
      data: {
        productId: saleData.ticketId,
        size: 'ONESIZE',
        quantity: 1,
        userId: user.id,
        teamId: user.team.id,
        paymentMethod: 'ONLINE',
        amountPaid: parseFloat(ticket.price),
        coachId: null 
      },
      include: {
        product: true,
        user: { select: { name: true } },
        team: { select: { name: true } }
      }
    });

    
    await tx.donation.create({
      data: {
        amount: parseFloat(ticket.price),
        userId: user.id,
        teamId: user.team.id,
        currency: 'usd'
      }
    });

    
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


const getSaleById = async (saleId) => {
  return await prisma.productSale.findUnique({
    where: { id: saleId },
    include: {
      product: true,
      user: { include: { team: true } }
    }
  });
};


const deleteSale = async (saleId, coachId) => {
  return await prisma.$transaction(async (tx) => {
    
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

    
    if (sale.coachId !== coachId) {
      throw new Error('You can only delete sales you made');
    }

    
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

    
    if (sale.userId && sale.teamId) {
      
      const donationToDelete = await tx.donation.findFirst({
        where: {
          userId: sale.userId,
          teamId: sale.teamId,
          amount: sale.amountPaid,
          createdAt: {
            gte: new Date(sale.soldAt.getTime() - 60000), 
            lte: new Date(sale.soldAt.getTime() + 60000)  
          }
        }
      });

      if (donationToDelete) {
        await tx.donation.delete({
          where: { id: donationToDelete.id }
        });
      }
    } else if (sale.isExternalSale) {
      
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