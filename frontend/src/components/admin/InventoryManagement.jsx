import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';

const InventoryManagement = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inventoryUpdates, setInventoryUpdates] = useState({});
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    type: 'HOODIE',
    price: '',
    points: '',
    sizes: {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
      ONESIZE: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch all products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ROUTES.products.list, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        setError('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Create new product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_ROUTES.products.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: productForm.name,
          type: productForm.type,
          price: parseFloat(productForm.price),
          points: parseInt(productForm.points),
          sizes: productForm.sizes
        })
      });

      if (response.ok) {
        setSuccess('Product created successfully!');
        setProductForm({ 
          name: '', 
          type: 'HOODIE', 
          price: '', 
          points: '',
          sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, ONESIZE: 0 }
        });
        setShowProductForm(false);
        fetchProducts();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setError('Failed to create product');
    }
  };

  // Select product to manage
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setInventoryUpdates({});
  };

  // Update inventory
  const handleUpdateInventory = async (productId, size) => {
    const newQuantity = inventoryUpdates[`${productId}-${size}`];
    if (newQuantity === undefined) return;

    try {
      const response = await fetch(API_ROUTES.products.inventory, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId,
          size,
          quantity: parseInt(newQuantity)
        })
      });

      if (response.ok) {
        setSuccess('Inventory updated successfully!');
        fetchProducts();
        // Update selected product
        if (selectedProduct && selectedProduct.id === productId) {
          const updatedProduct = products.find(p => p.id === productId);
          if (updatedProduct) {
            setSelectedProduct(updatedProduct);
          }
        }
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update inventory');
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      setError('Failed to update inventory');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Product Inventory Management</h2>
            <p className="text-gray-600">Manage product inventory, pricing, and create new products.</p>
          </div>
          <button
            onClick={() => setShowProductForm(!showProductForm)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {showProductForm ? 'Cancel' : 'Add New Product'}
          </button>
        </div>

        {/* Create Product Form */}
        {showProductForm && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Create New Product</h3>
            <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Product Name"
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <select
                value={productForm.type}
                onChange={(e) => setProductForm(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="HOODIE">Hoodie</option>
                <option value="PANTS">Pants</option>
                <option value="SHIRT">Shirt</option>
                <option value="TICKET">Ticket</option>
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Price ($)"
                value={productForm.price}
                onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <input
                type="number"
                placeholder="Points"
                value={productForm.points}
                onChange={(e) => setProductForm(prev => ({ ...prev, points: e.target.value }))}
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              
              {/* Size Inventory Inputs */}
              <div className="md:col-span-4 mt-4">
                {productForm.type === 'TICKET' ? (
                  <div>
                    <h4 className="text-md font-semibold mb-3">Initial Ticket Quantity</h4>
                    <div className="w-48">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Quantity</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={productForm.sizes.ONESIZE || 0}
                        onChange={(e) => setProductForm(prev => ({
                          ...prev,
                          sizes: { ONESIZE: parseInt(e.target.value) || 0 }
                        }))}
                        className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-md font-semibold mb-3">Initial Inventory by Size</h4>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                        <div key={size} className="flex flex-col">
                          <label className="text-sm font-medium text-gray-700 mb-1">{size}</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={productForm.sizes[size]}
                            onChange={(e) => setProductForm(prev => ({
                              ...prev,
                              sizes: { ...prev.sizes, [size]: parseInt(e.target.value) || 0 }
                            }))}
                            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="md:col-span-4 mt-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Product Selection */}
      {products.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Select Product to Manage</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products.map(product => (
              <button
                key={product.id}
                onClick={() => handleProductSelect(product)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedProduct?.id === product.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h4 className="font-semibold">{product.name}</h4>
                <p className="text-sm text-gray-600">
                  {product.type} • ${product.price} • {product.points} points
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Total Stock: {product.inventory?.reduce((sum, inv) => sum + inv.quantity, 0) || 0}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Management */}
      {selectedProduct && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Manage Inventory: {selectedProduct.name}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {selectedProduct.inventory?.map(inv => (
              <div key={inv.size} className="border rounded-lg p-4">
                <div className="text-center">
                  <h4 className="font-semibold text-lg">{inv.size}</h4>
                  <p className="text-sm text-gray-600 mb-3">Current: {inv.quantity}</p>
                  
                  <div className="space-y-2">
                    <input
                      type="number"
                      min="0"
                      value={inventoryUpdates[`${selectedProduct.id}-${inv.size}`] ?? inv.quantity}
                      onChange={(e) => setInventoryUpdates(prev => ({
                        ...prev,
                        [`${selectedProduct.id}-${inv.size}`]: e.target.value
                      }))}
                      className="w-full px-2 py-1 border rounded text-center"
                    />
                    <button
                      onClick={() => handleUpdateInventory(selectedProduct.id, inv.size)}
                      className="w-full bg-green-600 text-white py-1 px-2 rounded text-sm hover:bg-green-700"
                      disabled={inventoryUpdates[`${selectedProduct.id}-${inv.size}`] === undefined}
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {products.length === 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products available</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first product.</p>
            <button
              onClick={() => setShowProductForm(true)}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Create First Product
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;