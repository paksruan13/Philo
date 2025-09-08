const { prisma } = require('../config/database');

// Get all products with their inventory
const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        inventory: {
          orderBy: { size: 'asc' }
        }
      },
      orderBy: { type: 'asc' }
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Update product inventory
const updateProductInventory = async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;

    if (!productId || !size || quantity === undefined) {
      return res.status(400).json({ error: 'Product ID, size, and quantity are required' });
    }

    const inventory = await prisma.productInventory.upsert({
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

    res.json({
      message: 'Inventory updated successfully',
      inventory
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    const { name, type, price, points, sizes } = req.body;

    if (!name || !type || !price) {
      return res.status(400).json({ error: 'Name, type, and price are required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create the product
      const product = await tx.product.create({
        data: {
          name,
          type,
          price: parseFloat(price),
          points: parseInt(points) || 10,
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

    res.status(201).json({
      message: 'Product created successfully',
      product: result
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// Update product details
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, price, points, isActive } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(price && { price: parseFloat(price) }),
        ...(points && { points: parseInt(points) }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Get product sales history
const getProductSales = async (req, res) => {
  try {
    const sales = await prisma.productSale.findMany({
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

    res.json(sales);
  } catch (error) {
    console.error('Error fetching product sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
};

module.exports = {
  getAllProducts,
  updateProductInventory,
  createProduct,
  updateProduct,
  getProductSales
};
