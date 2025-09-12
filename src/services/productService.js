const { prisma } = require('../config/database');

/**
 * Product Service - Handles all product-related database operations
 */

// Get all active products with their inventory
const getAllProducts = async () => {
  return await prisma.product.findMany({
    where: { isActive: true },
    include: {
      inventory: {
        orderBy: { size: 'asc' }
      }
    },
    orderBy: { type: 'asc' }
  });
};

// Get product by ID with inventory
const getProductById = async (productId) => {
  return await prisma.product.findUnique({
    where: { id: productId },
    include: {
      inventory: true
    }
  });
};

// Get product with inventory check for specific size
const getProductWithInventory = async (productId, size) => {
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product || !product.isActive) {
    throw new Error('Product not found or inactive');
  }

  const inventory = await prisma.productInventory.findUnique({
    where: {
      productId_size: {
        productId,
        size
      }
    }
  });

  return { product, inventory };
};

// Update product inventory
const updateProductInventory = async (productId, size, quantity) => {
  return await prisma.productInventory.upsert({
    where: {
      productId_size: {
        productId,
        size
      }
    },
    update: {
      quantity: parseInt(quantity)
    },
    create: {
      productId,
      size,
      quantity: parseInt(quantity)
    },
    include: {
      product: true
    }
  });
};

// Decrement product inventory
const decrementProductInventory = async (productId, size, quantity, tx = prisma) => {
  return await tx.productInventory.update({
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
};

// Increment product inventory (for refunds/cancellations)
const incrementProductInventory = async (productId, size, quantity, tx = prisma) => {
  return await tx.productInventory.upsert({
    where: {
      productId_size: {
        productId,
        size
      }
    },
    update: {
      quantity: { increment: quantity }
    },
    create: {
      productId,
      size,
      quantity
    }
  });
};

// Create new product with inventory
const createProduct = async (productData, sizes) => {
  return await prisma.$transaction(async (tx) => {
    // Create the product
    const product = await tx.product.create({
      data: {
        name: productData.name,
        type: productData.type,
        price: parseFloat(productData.price),
        points: parseInt(productData.points) || 10,
        imageUrl: productData.imageUrl || null,
        description: productData.description || null,
        isActive: true
      }
    });

    // Create inventory records for each size
    if (sizes && typeof sizes === 'object') {
      const inventoryData = Object.entries(sizes)
        .filter(([size, quantity]) => quantity > 0)
        .map(([size, quantity]) => ({
          productId: product.id,
          size,
          quantity: parseInt(quantity)
        }));

      if (inventoryData.length > 0) {
        await tx.productInventory.createMany({
          data: inventoryData
        });
      }
    }

    // Return product with inventory
    return await tx.product.findUnique({
      where: { id: product.id },
      include: {
        inventory: true
      }
    });
  });
};

// Update product details
const updateProduct = async (productId, updateData) => {
  const data = {};
  
  if (updateData.name) data.name = updateData.name;
  if (updateData.type) data.type = updateData.type;
  if (updateData.price) data.price = parseFloat(updateData.price);
  if (updateData.points) data.points = parseInt(updateData.points);
  if (updateData.isActive !== undefined) data.isActive = updateData.isActive;

  return await prisma.product.update({
    where: { id: productId },
    data
  });
};

// Delete product with safety checks
const deleteProduct = async (productId) => {
  // Check if product exists and has sales history
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      inventory: true,
      sales: true
    }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  if (product.sales && product.sales.length > 0) {
    throw new Error('Cannot delete product with sales history. Please deactivate instead.');
  }

  // Delete product inventory first, then product
  await prisma.$transaction(async (tx) => {
    await tx.productInventory.deleteMany({
      where: { productId }
    });

    await tx.product.delete({
      where: { id: productId }
    });
  });

  return { message: 'Product deleted successfully' };
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductWithInventory,
  updateProductInventory,
  decrementProductInventory,
  incrementProductInventory,
  createProduct,
  updateProduct,
  deleteProduct
};