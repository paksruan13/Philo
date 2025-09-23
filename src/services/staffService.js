const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const staffService = {
  
  getAllTeams: async () => {
    return await prisma.team.findMany({
      include: {
        members: {
          where: { role: 'STUDENT', isActive: true },
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { members: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  },

  
  getAllActiveStudentsWithTeams: async () => {
    return await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        isActive: true,
        team: { isNot: null }
      },
      include: {
        team: {
          select: { id: true, name: true, teamCode: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  },

  
  getActiveProducts: async () => {
    return await prisma.product.findMany({
      where: { isActive: true },
      include: {
        inventory: true
      },
      orderBy: { name: 'asc' }
    });
  },

  
  validateStudent: async (userId, teamId) => {
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: { team: true }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    if (student.role !== 'STUDENT') {
      throw new Error('Can only perform operations on students');
    }

    if (!student.team || student.team.id !== teamId) {
      throw new Error('Student must belong to the specified team');
    }

    return student;
  },

  
  awardPointsToStudent: async (userId, teamId, points, activityDescription, staffId) => {
    
    if (!userId || !teamId || !points || !activityDescription) {
      throw new Error('All fields are required');
    }

    if (points <= 0) {
      throw new Error('Points must be greater than 0');
    }

    
    await staffService.validateStudent(userId, teamId);

    
    return await prisma.$transaction(async (tx) => {
      const pointsAward = await tx.manualPointsAward.create({
        data: {
          userId,
          teamId,
          points: parseInt(points),
          activityDescription,
          awardedById: staffId
        },
        include: {
          user: { select: { name: true } },
          team: { select: { name: true } },
          awardedBy: { select: { name: true } }
        }
      });

      
      await tx.team.update({
        where: { id: teamId },
        data: {
          totalPoints: {
            increment: parseInt(points)
          }
        }
      });

      return pointsAward;
    });
  },

  
  getStaffPointsHistory: async (staffId) => {
    return await prisma.manualPointsAward.findMany({
      where: {
        awardedById: staffId
      },
      include: {
        user: { select: { name: true, email: true } },
        team: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  
  validateProductSale: async (productId, size, quantity) => {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true }
    });

    if (!product || !product.isActive) {
      throw new Error('Product not found or inactive');
    }

    const inventory = product.inventory.find(inv => inv.size === size);
    if (!inventory || inventory.quantity < quantity) {
      throw new Error('Insufficient inventory');
    }

    return { product, inventory };
  },

  
  sellProductToStudent: async (productId, userId, teamId, size, quantity, paymentMethod, amountPaid, staffId) => {
    
    if (!productId || !userId || !teamId || !size || !quantity || !paymentMethod) {
      throw new Error('All fields are required');
    }

    
    await staffService.validateStudent(userId, teamId);

    
    const { product, inventory } = await staffService.validateProductSale(productId, size, quantity);

    
    return await prisma.$transaction(async (tx) => {
      
      const sale = await tx.productSale.create({
        data: {
          productId,
          userId,
          teamId,
          size,
          quantity: parseInt(quantity),
          paymentMethod,
          amountPaid: parseFloat(amountPaid || product.price * quantity),
          coachId: staffId 
        },
        include: {
          product: { select: { name: true, points: true } },
          user: { select: { name: true } },
          team: { select: { name: true } }
        }
      });

      
      await tx.productInventory.update({
        where: { id: inventory.id },
        data: {
          quantity: { decrement: parseInt(quantity) }
        }
      });

      
      const pointsToAward = product.points * parseInt(quantity);
      await tx.team.update({
        where: { id: teamId },
        data: {
          totalPoints: { increment: pointsToAward }
        }
      });

      return sale;
    });
  },

  
  getStaffSales: async (staffId) => {
    return await prisma.productSale.findMany({
      where: {
        coachId: staffId 
      },
      include: {
        product: { select: { name: true } },
        user: { select: { name: true } },
        team: { select: { name: true } }
      },
      orderBy: { soldAt: 'desc' }
    });
  }
};

module.exports = staffService;
