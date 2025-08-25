import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const SellShirt = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [inventoryData, setInventoryData] = useState({ inventory: [], currentPrice: 15.00 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [saleForm, setSaleForm] = useState({
    shirtSize: '',
    quantity: 1,
    teamId: '',
    paymentMethod: 'CASH'
  });
  
  const [recentSales, setRecentSales] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch teams
        const teamsResponse = await fetch('http://localhost:4243/api/teams', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const teamsData = await teamsResponse.json();
        
        // Fetch inventory and price
        const inventoryResponse = await fetch('http://localhost:4243/api/sales/inventory/shirts', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const inventoryData = await inventoryResponse.json();
        
        // Fetch recent sales
        const salesResponse = await fetch('http://localhost:4243/api/sales/recent', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const salesData = await salesResponse.json();
        
        setTeams(teamsData);
        setInventoryData(inventoryData);
        setRecentSales(salesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSaleForm({
      ...saleForm,
      [name]: name === 'quantity' ? parseInt(value) : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:4243/api/sales/shirts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(saleForm)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create sale');
      }
      
      const saleData = await response.json();
      
      // Update inventory
      setInventoryData(prev => ({
        ...prev,
        inventory: prev.inventory.map(item => 
          item.size === saleForm.shirtSize
            ? { ...item, quantity: item.quantity - saleForm.quantity }
            : item
        )
      }));
      
      setRecentSales([saleData, ...recentSales]);
      
      // Reset form
      setSaleForm({
        shirtSize: '',
        quantity: 1,
        teamId: '',
        paymentMethod: 'CASH'
      });
      
      alert('Sale completed successfully!');
    } catch (err) {
      console.error('Error creating sale:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateTotal = () => {
    if (!saleForm.quantity || !inventoryData.currentPrice) return 0;
    return saleForm.quantity * inventoryData.currentPrice;
  };
  
  if (loading && inventoryData.inventory.length === 0) {
    return <div className="p-6">Loading...</div>;
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sell Shirts</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sale Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">New Sale</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team
                </label>
                <select
                  name="teamId"
                  value={saleForm.teamId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shirt Size
                </label>
                <select
                  name="shirtSize"
                  value={saleForm.shirtSize}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a size</option>
                  {inventoryData.inventory.map(item => (
                    <option key={item.id} value={item.size} disabled={item.quantity === 0}>
                      {item.size} ({item.quantity} available)
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
                  value={saleForm.quantity}
                  onChange={handleInputChange}
                  min="1"
                  max={inventoryData.inventory.find(i => i.size === saleForm.shirtSize)?.quantity || 1}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH"
                      checked={saleForm.paymentMethod === 'CASH'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">Cash</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="VENMO"
                      checked={saleForm.paymentMethod === 'VENMO'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">Venmo</span>
                  </label>
                </div>
              </div>
              
              {/* Sale Summary */}
              <div className="mt-4 bg-blue-50 p-3 rounded">
                <div className="flex justify-between font-medium">
                  <span>Current Price:</span>
                  <span>${inventoryData.currentPrice?.toFixed(2)}/shirt</span>
                </div>
                {saleForm.quantity > 0 && saleForm.shirtSize && (
                  <div className="flex justify-between mt-1 font-bold">
                    <span>Total:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading || !saleForm.shirtSize || !saleForm.teamId}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                >
                  {loading ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Inventory */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md h-full">
            <h2 className="text-xl font-semibold mb-4">Current Inventory</h2>
            
            <div className="space-y-2">
              {inventoryData.inventory.map(item => (
                <div 
                  key={item.id} 
                  className={`p-3 rounded ${
                    item.quantity === 0 
                      ? 'bg-red-50 border border-red-200' 
                      : item.quantity < 5 
                        ? 'bg-yellow-50 border border-yellow-200' 
                        : 'bg-green-50 border border-green-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{item.size}</span>
                    <span className={`${
                      item.quantity === 0 
                        ? 'text-red-600' 
                        : item.quantity < 5 
                          ? 'text-yellow-600' 
                          : 'text-green-600'
                    }`}>
                      {item.quantity} available
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Recent Sales */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md h-full">
            <h2 className="text-xl font-semibold mb-4">Recent Sales</h2>
            
            {recentSales.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentSales.slice(0, 10).map(sale => (
                  <div key={sale.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">
                          {sale.quantity} × {sale.shirtSize} shirts
                        </p>
                        <p className="text-xs text-gray-600">
                          Team: {sale.team.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(sale.soldAt).toLocaleDateString()} via {sale.paymentMethod}
                        </p>
                      </div>
                      <span className="font-semibold text-green-600">
                        ${sale.amountPaid.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent sales</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellShirt;