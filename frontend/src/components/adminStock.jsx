import { useState, useEffect } from 'react';

const AdminInventoryManager = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restockData, setRestockData] = useState({
    size: 'S',
    quantity: 0
  });

  const sizes = ['S', 'M', 'L', 'XL'];

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://localhost:4243/inventory/shirts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setInventory(data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const handleRestock = async () => {
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4243/inventory/shirts/restock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(restockData)
      });

      if (response.ok) {
        await fetchInventory();
        setRestockData({ size: 'S', quantity: 0 });
        alert('Inventory restocked successfully!');
      } else {
        alert('Failed to restock inventory');
      }
    } catch (err) {
      console.error('Error restocking:', err);
      alert('Error restocking inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSetInventory = async (size, newQuantity) => {
    try {
      const response = await fetch(`http://localhost:4243/inventory/shirts/${size}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (response.ok) {
        await fetchInventory();
      } else {
        alert('Failed to update inventory');
      }
    } catch (err) {
      console.error('Error updating inventory:', err);
    }
  };

  const getInventoryForSize = (size) => {
    return inventory.find(item => item.size === size) || { quantity: 0, reserved: 0 };
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Shirt Inventory Management</h2>

      {/* Current Inventory Display */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Current Inventory</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sizes.map(size => {
            const item = getInventoryForSize(size);
            const available = item.quantity - item.reserved;
            return (
              <div key={size} className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{size}</div>
                <div className="text-sm text-gray-600 mt-2">
                  <div>Total: {item.quantity}</div>
                  <div>Reserved: {item.reserved}</div>
                  <div className={`font-semibold ${available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Available: {available}
                  </div>
                </div>
                
                {/* Quick set quantity */}
                <div className="mt-3">
                  <input
                    type="number"
                    min="0"
                    defaultValue={item.quantity}
                    className="w-full p-1 border rounded text-sm"
                    onBlur={(e) => {
                      const newQuantity = parseInt(e.target.value) || 0;
                      if (newQuantity !== item.quantity) {
                        handleSetInventory(size, newQuantity);
                      }
                    }}
                  />
                  <div className="text-xs text-gray-500 mt-1">Set total quantity</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Restock Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Stock</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Size</label>
            <select
              value={restockData.size}
              onChange={(e) => setRestockData({ ...restockData, size: e.target.value })}
              className="w-full p-2 border rounded"
            >
              {sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Quantity to Add</label>
            <input
              type="number"
              min="1"
              value={restockData.quantity}
              onChange={(e) => setRestockData({ ...restockData, quantity: parseInt(e.target.value) || 0 })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <button
            onClick={handleRestock}
            disabled={loading || restockData.quantity <= 0}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Adding...' : 'Add Stock'}
          </button>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium">Total Shirts:</div>
            <div className="text-lg">{inventory.reduce((sum, item) => sum + item.quantity, 0)}</div>
          </div>
          <div>
            <div className="font-medium">Total Reserved:</div>
            <div className="text-lg">{inventory.reduce((sum, item) => sum + item.reserved, 0)}</div>
          </div>
          <div>
            <div className="font-medium">Total Available:</div>
            <div className="text-lg">{inventory.reduce((sum, item) => sum + (item.quantity - item.reserved), 0)}</div>
          </div>
          <div>
            <div className="font-medium">Out of Stock:</div>
            <div className="text-lg">{sizes.filter(size => {
              const item = getInventoryForSize(size);
              return (item.quantity - item.reserved) <= 0;
            }).length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInventoryManager;