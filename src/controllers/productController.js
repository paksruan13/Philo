const productService = require('../services/productService');
const productSaleService = require('../services/productSaleService');

// Get all products with their inventory
const getAllProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts();
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

    const inventory = await productService.updateProductInventory(productId, size, quantity);

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
    const { name, type, price, points, sizes, imageUrl, description } = req.body;

    if (!name || !type || !price) {
      return res.status(400).json({ error: 'Name, type, and price are required' });
    }

    const result = await productService.createProduct(
      { name, type, price, points, imageUrl, description },
      sizes
    );

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

    const product = await productService.updateProduct(id, {
      name, type, price, points, isActive
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
    const sales = await productSaleService.getAllProductSales();
    res.json(sales);
  } catch (error) {
    console.error('Error fetching product sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await productService.deleteProduct(id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting product:', error);
    if (error.message.includes('not found') || error.message.includes('Cannot delete')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

module.exports = {
  getAllProducts,
  updateProductInventory,
  createProduct,
  updateProduct,
  getProductSales,
  deleteProduct
};
