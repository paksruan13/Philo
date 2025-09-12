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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-gradient-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading team store...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-100/60 via-pink-100/60 to-yellow-100/60 border-b border-purple-200/30">
        <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-white/50"></div>
        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center space-x-3 bg-card/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-card">
              <span className="text-2xl">🛒</span>
              <span className="font-medium text-foreground">Project Phi Store</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gradient-primary">
              Team Store
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Support your team and earn points! Browse our exclusive merchandise and event tickets. 
              Every purchase helps fund our mission and strengthens our community.
            </p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-12 space-y-12 max-w-7xl">
        {error && (
          <div className="card-base p-4 border-l-4 border-destructive bg-destructive/10">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚠️</span>
              <p className="text-destructive font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Products Section - Team Merchandise First */}
        {products.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xl text-white">👕</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gradient-primary">Team Merchandise</h2>
                <p className="text-muted-foreground">Show your team spirit with our exclusive gear!</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center place-items-center max-w-7xl mx-auto">
              {products.map(product => {
                const hasAvailableSizes = product.inventory?.some(inv => inv.quantity > 0);
                
                return (
                  <div key={product.id} className="card-base p-4 hover-lift group w-full max-w-sm">
                    <div className="space-y-3">
                      {/* Product Image */}
                      <div className="aspect-square bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-lg overflow-hidden">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl text-secondary">
                            👕
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-foreground group-hover:text-primary transition-smooth line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">{product.type}</p>
                          </div>
                          <div className={`badge-base text-xs ${hasAvailableSizes ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                            {hasAvailableSizes ? 'Available' : 'Out of Stock'}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-gradient-primary">${product.price}</span>
                          <div className="flex items-center space-x-1 bg-secondary/30 rounded-full px-2 py-1">
                            <span className="text-xs">⭐</span>
                            <span className="text-xs font-medium">{product.points}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="w-full btn-secondary py-2 px-3 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Event Tickets Section - Second */}
        {tickets.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xl text-white">🎫</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gradient-primary">Event Tickets</h2>
                <p className="text-muted-foreground">Special events and fundraising tickets</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center place-items-center max-w-7xl mx-auto">
              {tickets.map(ticket => {
                const availableQuantity = ticket.inventory?.find(inv => inv.size === 'ONESIZE')?.quantity || 0;
                const isAvailable = availableQuantity > 0;
                
                return (
                  <div key={ticket.id} className="card-base p-4 hover-lift group w-full max-w-sm">
                    <div className="space-y-3">
                      {/* Ticket Image */}
                      <div className="aspect-square bg-gradient-to-br from-yellow-100/50 to-orange-100/50 rounded-lg overflow-hidden">
                        {ticket.imageUrl ? (
                          <img 
                            src={ticket.imageUrl} 
                            alt={ticket.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl text-yellow-600">
                            🎫
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-foreground group-hover:text-primary transition-smooth line-clamp-2">
                              {ticket.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">{availableQuantity} available</p>
                          </div>
                          <div className={`badge-base text-xs ${isAvailable ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                            {isAvailable ? 'Available' : 'Sold Out'}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-gradient-primary">${ticket.price}</span>
                          <div className="flex items-center space-x-1 bg-secondary/30 rounded-full px-2 py-1">
                            <span className="text-xs">⭐</span>
                            <span className="text-xs font-medium">{ticket.points}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedProduct(ticket)}
                        className="w-full btn-secondary py-2 px-3 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}



        {/* No products message */}
        {products.length === 0 && tickets.length === 0 && !loading && (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-secondary/20 to-secondary/30 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">🛒</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Store Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We're preparing amazing products and tickets for you. Check back soon for exclusive team merchandise and event access!
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card-base max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-gradient-primary">{selectedProduct.name}</h2>
                  <p className="text-muted-foreground uppercase tracking-wide">{selectedProduct.type}</p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-10 h-10 bg-secondary/20 hover:bg-secondary/30 rounded-full flex items-center justify-center text-foreground hover:text-primary transition-smooth"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Product Image */}
                <div className="space-y-4">
                  <div className="aspect-square bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-lg overflow-hidden">
                    {selectedProduct.imageUrl ? (
                      <img 
                        src={selectedProduct.imageUrl} 
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <div className="text-6xl text-secondary">
                            {selectedProduct.type === 'TICKET' ? '🎫' : '👕'}
                          </div>
                          <p className="text-sm text-muted-foreground">No image available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                  {/* Price and Points */}
                  <div className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-bold text-gradient-primary">${selectedProduct.price}</div>
                        <div className="text-sm text-muted-foreground">Per item</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 bg-secondary/30 rounded-full px-3 py-2">
                          <span>⭐</span>
                          <span className="font-bold">{selectedProduct.points} pts</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">earned per purchase</div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedProduct.description && (
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-2">Description</h3>
                      <p className="text-muted-foreground leading-relaxed">{selectedProduct.description}</p>
                    </div>
                  )}
                  
                  {/* Availability Status */}
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Availability</h3>
                    <div className="flex items-center space-x-2">
                      {selectedProduct.inventory?.some(inv => inv.quantity > 0) ? (
                        <>
                          <div className="w-3 h-3 bg-success rounded-full"></div>
                          <span className="text-success font-medium">In Stock</span>
                          <span className="text-muted-foreground text-sm">
                            (Multiple sizes available)
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 bg-destructive rounded-full"></div>
                          <span className="text-destructive font-medium">Out of Stock</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Purchase Instructions */}
                  <div className="p-4 bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-lg border border-blue-200/30">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm">👥</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground mb-2">How to Purchase</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Contact your team coach to purchase this item. They have access to process sales and will ensure 
                          you receive your points immediately upon purchase. Ask about availability in your preferred size!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Purchase Modal */}
      {showTicketPurchase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card-base max-w-md w-full shadow-2xl">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gradient-primary">Purchase Ticket</h2>
                  <div className="w-8 h-1 bg-gradient-primary rounded-full"></div>
                </div>
                <button
                  onClick={() => setShowTicketPurchase(false)}
                  className="w-10 h-10 bg-secondary/20 hover:bg-secondary/30 rounded-full flex items-center justify-center text-foreground hover:text-primary transition-smooth"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Ticket Details */}
                <div className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/10">
                  <h3 className="text-xl font-bold text-foreground">{showTicketPurchase.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-3xl font-bold text-gradient-primary">${showTicketPurchase.price}</span>
                    <div className="flex items-center space-x-2 bg-secondary/30 rounded-full px-3 py-1">
                      <span className="text-sm">⭐</span>
                      <span className="text-sm font-medium">{showTicketPurchase.points} pts</span>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleTicketPurchase(showTicketPurchase);
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={ticketForm.name}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-smooth"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={ticketForm.email}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-smooth"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full btn-primary py-4 text-lg font-medium"
                  >
                    Complete Purchase
                  </button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    Points will be added to your team immediately after purchase
                  </p>
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