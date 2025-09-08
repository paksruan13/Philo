import React, { useState, useEffect } from 'react';
import { API_ROUTES } from '../../services/api';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(false);
  
  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    type: 'HOODIE',
    price: '',
    points: ''
  });
  
  // Inventory update state
  const [inventoryUpdates, setInventoryUpdates] = useState({});
  
  // Sell product state
  const [showSellForm, setShowSellForm] = useState(false);
  const [sellForm, setSellForm] = useState({
    productId: '',
    size: '',
    quantity: 1,
    userId: '',
    paymentMethod: 'cash',
    amountPaid: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchSales();
    fetchStudents();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ROUTES.products.list, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ROUTES.products.sales, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSales(data);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ROUTES.coach.students, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ROUTES.products.create, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productForm)
      });

      if (response.ok) {
        alert('Product created successfully!');
        setProductForm({ name: '', type: 'HOODIE', price: '', points: '' });
        setShowProductForm(false);
        fetchProducts();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInventory = async (productId, size) => {
    const key = `${productId}-${size}`;
    const quantity = inventoryUpdates[key];
    
    if (quantity === undefined) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ROUTES.products.inventory, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, size, quantity: parseInt(quantity) })
      });

      if (response.ok) {
        alert('Inventory updated successfully!');
        fetchProducts();
        setInventoryUpdates(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update inventory');
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert('Failed to update inventory');
    }
  };

  const handleSellProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ROUTES.productSales.sell, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...sellForm,
          quantity: parseInt(sellForm.quantity),
          amountPaid: parseFloat(sellForm.amountPaid)
        })
      });

      if (response.ok) {
        const result = await response.json();
        const product = products.find(p => p.id === sellForm.productId);
        const student = students.find(s => s.id === sellForm.userId);
        
        alert(`Successfully sold ${sellForm.quantity} ${product.name} (${sellForm.size}) to ${student.name}! Awarded ${result.pointsAwarded} points.`);
        
        setSellForm({
          productId: '',
          size: '',
          quantity: 1,
          userId: '',
          paymentMethod: 'cash',
          amountPaid: ''
        });
        setShowSellForm(false);
        fetchProducts();
        fetchSales();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to sell product');
      }
    } catch (error) {
      console.error('Error selling product:', error);
      alert('Failed to sell product');
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (productId) => {
    setSellForm(prev => ({ ...prev, productId, size: '', amountPaid: '' }));
    const product = products.find(p => p.id === productId);
    if (product) {
      setSellForm(prev => ({ ...prev, amountPaid: (product.price * prev.quantity).toFixed(2) }));
    }
  };

  const selectedProduct = products.find(p => p.id === sellForm.productId);
  const availableSizes = selectedProduct ? selectedProduct.inventory.filter(inv => inv.quantity > 0) : [];

  const tabs = [
    { id: 'products', label: 'Products & Inventory', icon: '📦' },
    { id: 'sell', label: 'Sell Products', icon: '🛒' },
    { id: 'sales', label: 'Sales History', icon: '📊' }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Products & Inventory Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Add New Product */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Product Management</h3>
              <button
                onClick={() => setShowProductForm(!showProductForm)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                {showProductForm ? 'Cancel' : 'Add New Product'}
              </button>
            </div>

            {showProductForm && (
              <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
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
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={productForm.price}
                  onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                  className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Points"
                    value={productForm.points}
                    onChange={(e) => setProductForm(prev => ({ ...prev, points: e.target.value }))}
                    className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Products List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold">{product.name}</h4>
                    <p className="text-sm text-gray-600">
                      {product.type} • ${product.price} • {product.points} points
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium">Inventory by Size:</h5>
                  <div className="grid grid-cols-3 gap-2">
                    {product.inventory.map(inv => (
                      <div key={inv.size} className="flex items-center gap-2">
                        <span className="w-8 text-sm font-medium">{inv.size}:</span>
                        <input
                          type="number"
                          min="0"
                          value={inventoryUpdates[`${product.id}-${inv.size}`] ?? inv.quantity}
                          onChange={(e) => setInventoryUpdates(prev => ({
                            ...prev,
                            [`${product.id}-${inv.size}`]: e.target.value
                          }))}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        />
                        <button
                          onClick={() => handleUpdateInventory(product.id, inv.size)}
                          className="text-green-600 hover:text-green-700 text-sm"
                          disabled={inventoryUpdates[`${product.id}-${inv.size}`] === undefined}
                        >
                          ✓
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sell Products Tab */}
      {activeTab === 'sell' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-6">Sell Products</h3>
          
          <form onSubmit={handleSellProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                <select
                  value={sellForm.productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Choose a product...</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.price} ({product.points} points)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size *</label>
                <select
                  value={sellForm.size}
                  onChange={(e) => setSellForm(prev => ({ ...prev, size: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={!sellForm.productId}
                  required
                >
                  <option value="">Choose a size...</option>
                  {availableSizes.map(inv => (
                    <option key={inv.size} value={inv.size}>
                      {inv.size} (Available: {inv.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={sellForm.quantity}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value);
                    setSellForm(prev => ({ ...prev, quantity: qty }));
                    if (selectedProduct) {
                      setSellForm(prev => ({ ...prev, amountPaid: (selectedProduct.price * qty).toFixed(2) }));
                    }
                  }}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select
                  value={sellForm.userId}
                  onChange={(e) => setSellForm(prev => ({ ...prev, userId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Choose a student...</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} {student.team ? `(${student.team.name})` : '(No Team)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select
                  value={sellForm.paymentMethod}
                  onChange={(e) => setSellForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="venmo">Venmo</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid *</label>
                <input
                  type="number"
                  step="0.01"
                  value={sellForm.amountPaid}
                  onChange={(e) => setSellForm(prev => ({ ...prev, amountPaid: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Sell Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sales History Tab */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-6">Sales History</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map(sale => (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sale.soldAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.team.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${sale.amountPaid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.coach.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {sales.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No sales recorded yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
