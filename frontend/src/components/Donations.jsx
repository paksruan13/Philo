import { useEffect, useState } from "react";
import { API_ROUTES } from "../services/api";

const Donations = () => {
  const [products, setProducts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showTicketPurchase, setShowTicketPurchase] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    email: '',
    name: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ROUTES.products.public);
      
      if (response.ok) {
        const data = await response.json();
        // Separate tickets from other products
        const productList = data.filter(product => product.type !== 'TICKET');
        const ticketList = data.filter(product => product.type === 'TICKET');
        
        setProducts(productList);
        setTickets(ticketList);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketPurchase = async (ticket) => {
    try {
      const response = await fetch(API_ROUTES.products.purchaseTicket, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketId: ticket.id,
          email: ticketForm.email,
          name: ticketForm.name
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Ticket purchased successfully! ${result.pointsAwarded} points added to your team.`);
        setShowTicketPurchase(false);
        setTicketForm({ email: '', name: '' });
        // Refresh products to update inventory
        fetchProducts();
      } else {
        const errorData = await response.json();
        alert(`Purchase failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      alert('Failed to purchase ticket. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-16 lg:px-32 space-y-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Team Store</h1>
        <p className="text-lg text-gray-600">Browse our available products and tickets. Contact your coach to make a purchase!</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tickets Section */}
      {tickets.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🎫 Event Tickets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map(ticket => (
              <div key={ticket.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-2">{ticket.name}</h3>
                <div className="space-y-2 mb-4">
                  <p className="text-lg font-medium text-green-600">${ticket.price}</p>
                  <p className="text-sm text-purple-600">{ticket.points} points earned</p>
                  <p className="text-sm text-gray-600">
                    Available: {ticket.inventory?.find(inv => inv.size === 'ONESIZE')?.quantity || 0}
                  </p>
                </div>
                <button
                  onClick={() => setShowTicketPurchase(ticket)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                  disabled={!ticket.inventory?.find(inv => inv.size === 'ONESIZE')?.quantity}
                >
                  {ticket.inventory?.find(inv => inv.size === 'ONESIZE')?.quantity ? 'Buy Online' : 'Sold Out'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products Section */}
      {products.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">👕 Available Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{product.type}</p>
                <div className="space-y-2 mb-4">
                  <p className="text-lg font-medium text-green-600">${product.price}</p>
                  <p className="text-sm text-purple-600">{product.points} points earned</p>
                  
                  {/* Size availability */}
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Available Sizes:</p>
                    <div className="flex flex-wrap gap-2">
                      {product.inventory?.map(inv => (
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
                
                <button
                  onClick={() => setSelectedProduct(product)}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No products message */}
      {products.length === 0 && tickets.length === 0 && !loading && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products available</h3>
          <p className="text-gray-600">Check back later for new products!</p>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">Type: {selectedProduct.type}</p>
                <p className="text-2xl font-bold text-green-600">${selectedProduct.price}</p>
                <p className="text-lg text-purple-600">{selectedProduct.points} points earned per purchase</p>
                
                <div>
                  <h3 className="font-semibold mb-2">Size Availability:</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedProduct.inventory?.map(inv => (
                      <div 
                        key={inv.size}
                        className={`p-3 rounded text-center ${
                          inv.quantity > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        <div className="font-semibold">{inv.size}</div>
                        <div className="text-sm">
                          {inv.quantity > 0 ? `${inv.quantity} available` : 'Out of Stock'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded">
                  <p className="text-blue-800 font-medium">How to Purchase:</p>
                  <p className="text-blue-700 text-sm mt-1">
                    Contact your coach to purchase this item. They can process the sale and you'll earn points for your team!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Purchase Modal */}
      {showTicketPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Purchase Ticket</h2>
                <button
                  onClick={() => setShowTicketPurchase(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{showTicketPurchase.name}</h3>
                  <p className="text-green-600 font-medium">${showTicketPurchase.price}</p>
                </div>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleTicketPurchase(showTicketPurchase);
                }}>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={ticketForm.name}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={ticketForm.email}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition-colors"
                    >
                      Purchase Ticket
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donations;