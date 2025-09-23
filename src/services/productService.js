const { prisma } = require('../config/lambdaDatabase');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client } = require('../config/s3');
const { GetObjectCommand } = require('@aws-sdk/client-s3');


const getProductImageSignedUrl = async (imageKey) => {
  if (!imageKey) return null;
  
  try {
    const bucketName = process.env.S3_BUCKET_NAME;
    const getObjectParams = {
      Bucket: bucketName,
      Key: imageKey,
    };

    const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand(getObjectParams), {
      expiresIn: 604800, 
    });

    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL for product image:', error);
    return null;
  }
};


const getAllProducts = async () => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      inventory: {
        orderBy: { size: 'asc' }
      }
    },
    orderBy: { type: 'asc' }
  });

  
  const productsWithSignedUrls = await Promise.all(
    products.map(async (product) => {
      const imageUrl = product.imageUrl ? await getProductImageSignedUrl(product.imageUrl) : null;
      return {
        ...product,
        imageUrl
      };
    })
  );

  return productsWithSignedUrls;
};


const getProductById = async (productId) => {
  return await prisma.product.findUnique({
    where: { id: productId },
    include: {
      inventory: true
    }
  });
};


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


const createProduct = async (productData, sizes) => {
  return await prisma.$transaction(async (tx) => {
    
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

    
    return await tx.product.findUnique({
      where: { id: product.id },
      include: {
        inventory: true
      }
    });
  });
};


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


const deleteProduct = async (productId) => {
  
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