import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';

const SellProducts = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  
  const [saleForm, setSaleForm] = useState({
    productId: '',
    size: '',
    userId: '',
    paymentMethod: 'CASH',
    quantity: 1
  });
  
  const [recentSales, setRecentSales] = useState([]);
  const [coachSales, setCoachSales] = useState([]);
  const [showAllSales, setShowAllSales] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all students
      const usersResponse = await fetch(API_ROUTES.coach.students, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!usersResponse.ok) {
        throw new Error(`Failed to fetch users: ${usersResponse.status}`);
      }
      const usersData = await usersResponse.json();
      
      // Fetch all products with inventory
      const productsResponse = await fetch(API_ROUTES.products.list, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!productsResponse.ok) {
        throw new Error(`Failed to fetch products: ${productsResponse.status}`);
      }
      const productsData = await productsResponse.json();
      
      // Fetch recent sales
      try {
        const salesResponse = await fetch(API_ROUTES.sales.recent, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const salesData = await salesResponse.json();
        setRecentSales(Array.isArray(salesData) ? salesData : []);
      } catch (salesError) {
        setRecentSales([]);
      }
      
      // Fetch coach's sales
      try {
        const coachSalesResponse = await fetch(API_ROUTES.productSales.coachSales, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const coachSalesData = await coachSalesResponse.json();
        setCoachSales(Array.isArray(coachSalesData) ? coachSalesData : []);
      } catch (coachSalesError) {
        setCoachSales([]);
      }
      
      setStudents(Array.isArray(usersData) ? usersData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get selected product details
  const getSelectedProduct = () => {
    return products.find(p => p.id === saleForm.productId);
  };

  // Get available sizes for selected product
  const getAvailableSizes = () => {
    const product = getSelectedProduct();
    return product ? product.inventory.filter(inv => inv.quantity > 0) : [];
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSaleForm({
      ...saleForm,
      [name]: value
    });
    
    // Reset size and quantity when product changes
    if (name === 'productId') {
      setSaleForm(prev => ({ ...prev, size: '', quantity: 1 }));
    }
    
    // Reset quantity when size changes (to ensure it doesn't exceed available stock)
    if (name === 'size') {
      setSaleForm(prev => ({ ...prev, quantity: 1 }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!saleForm.productId || !saleForm.size || !saleForm.userId || !saleForm.quantity || saleForm.quantity < 1) {
      setError('Please fill in all required fields and ensure quantity is at least 1');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Get the selected product to get its price
      const selectedProduct = getSelectedProduct();
      if (!selectedProduct) {
        throw new Error('Product not found');
      }
      
      const response = await fetch(API_ROUTES.productSales.sell, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId: saleForm.productId,
          size: saleForm.size,
          userId: saleForm.userId,  // Changed from buyerId to userId
          paymentMethod: saleForm.paymentMethod,
          quantity: parseInt(saleForm.quantity),
          amountPaid: selectedProduct.price * saleForm.quantity  // Calculate total amount
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete sale');
      }
      
      const saleData = await response.json();
      
      // Store sale details for confirmation modal
      const saleProduct = getSelectedProduct();
      const studentName = students.find(s => s.id === saleForm.userId)?.name || 'Unknown Student';
      
      setCompletedSale({
        productName: saleProduct.name,
        size: saleForm.size,
        quantity: saleForm.quantity,
        unitPrice: saleProduct.price,
        totalPrice: saleProduct.price * saleForm.quantity,
        pointsPerItem: saleProduct.points,
        totalPoints: saleProduct.points * saleForm.quantity,
        studentName: studentName,
        paymentMethod: saleForm.paymentMethod,
        saleId: saleData.sale?.id || saleData.id
      });
      
      // Show confirmation modal
      setShowConfirmation(true);
      
      // Refresh products after successful sale
      await fetchData();
      
      // Reset form
      setSaleForm({
        productId: '',
        size: '',
        userId: '',
        paymentMethod: 'CASH',
        quantity: 1
      });
    } catch (err) {
      console.error('Error creating sale:', err);
      setError(err.message || 'Failed to complete sale');
    } finally {
      setLoading(false);
    }
  };

  // Delete a sale
  const handleDeleteSale = async (saleId) => {
    if (!window.confirm('Are you sure you want to delete this sale? This will restore inventory and remove points from the team.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(API_ROUTES.productSales.delete(saleId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete sale');
      }

      setSuccess('Sale deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Error deleting sale:', err);
      setError(err.message || 'Failed to delete sale');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sell Products</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded mb-6">
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-6">
        {/* Sale Form */}
        <div className="col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md h-full">
            <h2 className="text-xl font-semibold mb-4">New Sale</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student
                </label>
                <select
                  name="userId"
                  value={saleForm.userId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a student</option>
                  {students.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.team?.name || 'No Team'})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <select
                  name="productId"
                  value={saleForm.productId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.price} ({product.points} points)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size
                </label>
                <select
                  name="size"
                  value={saleForm.size}
                  onChange={handleInputChange}
                  required
                  disabled={!saleForm.productId}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select a size</option>
                  {getAvailableSizes().map(inv => (
                    <option key={inv.size} value={inv.size}>
                      {inv.size} ({inv.quantity} available)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  max={getAvailableSizes().find(inv => inv.size === saleForm.size)?.quantity || 1}
                  value={saleForm.quantity}
                  onChange={handleInputChange}
                  disabled={!saleForm.size}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                {saleForm.size && (
                  <p className="text-xs text-gray-500 mt-1">
                    Max available: {getAvailableSizes().find(inv => inv.size === saleForm.size)?.quantity || 0}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={saleForm.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="VENMO">Venmo</option>
                </select>
              </div>

              {saleForm.productId && (
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium text-gray-700">Order Summary:</h4>
                  <p className="text-sm text-gray-600">
                    {getSelectedProduct()?.name} - {saleForm.size} × {saleForm.quantity}
                  </p>
                  <p className="text-sm font-medium">
                    Unit Price: ${getSelectedProduct()?.price} | Points: {getSelectedProduct()?.points} each
                  </p>
                  <p className="text-sm font-bold text-blue-600">
                    Total: ${(getSelectedProduct()?.price * saleForm.quantity).toFixed(2)} | 
                    Total Points: {getSelectedProduct()?.points * saleForm.quantity}
                  </p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading || !saleForm.productId || !saleForm.size || !saleForm.userId || !saleForm.quantity || saleForm.quantity < 1}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Complete Sale'}
              </button>
            </form>
          </div>
        </div>

        {/* Available Products */}
        <div className="col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Available Products</h2>
              {products.length > 1 && (
                <button
                  onClick={() => setShowAllProducts(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  See All ({products.length})
                </button>
              )}
            </div>
            
            {products.length === 0 ? (
              <p className="text-gray-500">No products available</p>
            ) : (
              <div className="space-y-4">
                {products.slice(0, 3).map(product => (
                  <div key={product.id} className="border rounded-lg p-3">
                    <h3 className="font-semibold text-sm">{product.name}</h3>
                    <p className="text-gray-600 text-xs">{product.type}</p>
                    <p className="text-sm font-medium text-green-600">
                      ${product.price} | {product.points} points
                    </p>
                    
                    <div className="mt-2">
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Available Sizes:</h4>
                      <div className="flex flex-wrap gap-1">
                        {product.inventory.map(inv => (
                          <span
                            key={inv.size}
                            className={`px-1 py-0.5 rounded text-xs ${
                              inv.quantity > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {inv.size}: {inv.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {products.length > 3 && (
                  <div className="text-center pt-2">
                    <span className="text-gray-500 text-sm">
                      +{products.length - 1} more products
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Panel 3: Sales Management */}
        <div className="col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">My Sales</h2>
              <button
                onClick={() => setShowAllSales(true)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                See All
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {coachSales.slice(0, 5).map(sale => (
                <div key={sale.id} className="border border-gray-200 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{sale.user.name}</div>
                      <div className="text-sm text-gray-600">
                        {sale.product.name} - {sale.size}
                      </div>
                      <div className="text-sm text-gray-600">
                        {sale.paymentMethod} - ${sale.amountPaid}
                      </div>
                      <div className="text-sm text-blue-600">
                        +{sale.product.points} points
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(sale.soldAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSale(sale.id)}
                      className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {coachSales.length === 0 && (
                <div className="text-gray-500 text-center py-4 text-sm">
                  No sales yet
                </div>
              )}
            </div>
            
            {/* Sales Summary */}
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-semibold mb-3">Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-lg font-bold text-blue-600">{coachSales.length}</div>
                  <div className="text-xs text-blue-600">Total Sales</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-lg font-bold text-green-600">
                    ${coachSales.reduce((sum, sale) => sum + sale.amountPaid, 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-green-600">Revenue</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales History Hover Modal */}
      {showAllSales && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 z-50 transition-all duration-300 ease-in-out"
          onClick={() => setShowAllSales(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 max-w-5xl w-full max-h-[85vh] overflow-hidden transform transition-all duration-300 ease-out scale-100 hover:shadow-3xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Sales History</h2>
                  <p className="text-blue-100 text-sm mt-1">Manage all your product sales</p>
                </div>
                <button
                  onClick={() => setShowAllSales(false)}
                  className="text-white hover:text-red-200 transition-colors duration-200 text-2xl font-bold bg-white bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-30"
                >
                  ✕
                </button>
              </div>
              
              {/* Quick stats in header */}
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{coachSales.length}</div>
                  <div className="text-blue-100 text-sm">Total Sales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    ${coachSales.reduce((sum, sale) => sum + sale.amountPaid, 0).toFixed(2)}
                  </div>
                  <div className="text-blue-100 text-sm">Total Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {coachSales.reduce((sum, sale) => sum + (sale.product.points * sale.quantity), 0)}
                  </div>
                  <div className="text-blue-100 text-sm">Points Awarded</div>
                </div>
              </div>
            </div>
            
            {/* Scrollable content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-gray-50">
              <div className="space-y-3">
                {coachSales.map(sale => (
                  <div 
                    key={sale.id} 
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-semibold text-lg text-gray-800">{sale.user.name}</div>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {sale.user.team?.name || 'No Team'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Product:</span>
                            <div className="font-medium">{sale.product.name}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Size:</span>
                            <div className="font-medium">{sale.size}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Payment:</span>
                            <div className="font-medium">{sale.paymentMethod}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Amount:</span>
                            <div className="font-medium text-green-600">${sale.amountPaid}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-purple-600">★</span>
                            <span className="text-purple-600 font-medium">{sale.product.points} points</span>
                          </div>
                          <div className="text-gray-500">
                            {new Date(sale.soldAt).toLocaleDateString()} at {new Date(sale.soldAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteSale(sale.id)}
                        className="text-red-600 hover:text-white hover:bg-red-600 px-4 py-2 rounded-lg border border-red-300 hover:border-red-600 transition-all duration-200 font-medium text-sm ml-4"
                        disabled={loading}
                      >
                        {loading ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
                
                {coachSales.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <div className="text-gray-500 text-lg font-medium">No sales found</div>
                    <div className="text-gray-400 text-sm mt-2">Sales you make will appear here</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-100 px-6 py-4 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing {coachSales.length} total sales
                </div>
                <button
                  onClick={() => setShowAllSales(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Products Modal */}
      {showAllProducts && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 z-50 transition-all duration-300 ease-in-out"
          onClick={() => setShowAllProducts(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 max-w-5xl w-full max-h-[85vh] overflow-hidden transform transition-all duration-300 ease-out scale-100 hover:shadow-3xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">All Available Products</h2>
                  <p className="text-green-100 text-sm mt-1">View complete product catalog</p>
                </div>
                <button
                  onClick={() => setShowAllProducts(false)}
                  className="text-white hover:text-red-200 transition-colors duration-200 text-2xl font-bold bg-white bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-30"
                >
                  ✕
                </button>
              </div>
              
              {/* Quick stats */}
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{products.length}</div>
                  <div className="text-green-100 text-sm">Total Products</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {products.reduce((sum, product) => 
                      sum + product.inventory.reduce((invSum, inv) => invSum + inv.quantity, 0), 0
                    )}
                  </div>
                  <div className="text-green-100 text-sm">Items in Stock</div>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg">No products available</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map(product => (
                    <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-gray-600">{product.type}</p>
                      <p className="text-lg font-medium text-green-600 mb-3">
                        ${product.price} | {product.points} points
                      </p>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Available Sizes:</h4>
                        <div className="flex flex-wrap gap-2">
                          {product.inventory.map(inv => (
                            <span
                              key={inv.size}
                              className={`px-2 py-1 rounded text-xs ${
                                inv.quantity > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {inv.size}: {inv.quantity}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="bg-gray-100 px-6 py-4 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing {products.length} total products
                </div>
                <button
                  onClick={() => setShowAllProducts(false)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sale Confirmation Modal */}
      {showConfirmation && completedSale && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 z-50 transition-all duration-300 ease-in-out"
          onClick={() => setShowConfirmation(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 max-w-md w-full max-h-[85vh] overflow-hidden transform transition-all duration-300 ease-out scale-100"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">🎉 Sale Completed!</h2>
                  <p className="text-green-100 text-sm mt-1">Transaction processed successfully</p>
                </div>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product:</span>
                      <span className="font-medium">{completedSale.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size:</span>
                      <span className="font-medium">{completedSale.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">{completedSale.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Student:</span>
                      <span className="font-medium">{completedSale.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment:</span>
                      <span className="font-medium">{completedSale.paymentMethod}</span>
                    </div>
                    <hr className="my-3" />
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unit Price:</span>
                      <span className="font-medium">${completedSale.unitPrice}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-gray-900 font-semibold">Total Price:</span>
                      <span className="text-green-600 font-bold">${completedSale.totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-gray-900 font-semibold">Points Earned:</span>
                      <span className="text-blue-600 font-bold">{completedSale.totalPoints}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellProducts;
