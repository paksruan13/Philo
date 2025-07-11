import { useEffect, useState } from "react";

const Donations = () => {
  const [coachMessage, setCoachMessage] = useState("");
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [shirtSize, setShirtSize] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    // Fetch teams
    fetch("http://localhost:4243/teams")
      .then((res) => res.json())
      .then((data) => setTeams(data))
      .catch((err) => console.error("Error fetching teams:", err));

    // Fetch shirt inventory
    fetch("http://localhost:4243/inventory/shirts")
      .then((res) => res.json())
      .then((data) => setInventory(data))
      .catch((err) => console.error("Error fetching inventory:", err));
  }, []);

  useEffect(() => {
    // Load coach message
    fetch("http://localhost:4243/message")
      .then((res) => res.json())
      .then((data) => setCoachMessage(data.message))
      .catch(() => setCoachMessage("Support your team! Proceeds go to team travel and supplies."));
  }, []);

  const getInventoryForSize = (size) => {
    const item = inventory.find(inv => inv.size === size);
    return item ? (item.quantity - item.reserved) : 0;
  };

  const isShirtAvailable = (size) => {
    return getInventoryForSize(size) > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Check inventory before proceeding
    if (shirtSize && !isShirtAvailable(shirtSize)) {
      setError(`Sorry, size ${shirtSize} is currently out of stock`);
      setLoading(false);
      return;
    }
  
    try {
      const userRes = await fetch("http://localhost:4243/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName, email: userEmail, teamId }),
      });
  
      const user = await userRes.json();
      if (!user.id) throw new Error("User creation failed");
  
      const sessionRes = await fetch("http://localhost:4243/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          teamId,
          amount: parseFloat(amount),
          shirtSize: shirtSize || null,
        }),
      });
  
      const session = await sessionRes.json();
      if (!session.url) throw new Error(session.error || "Checkout session failed");
  
      window.location.href = session.url;
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-16 lg:px-32 space-y-12">
      {/* Top Row: Shirt & Bundle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Shirt Option */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-between">
          <img
            src="https://store.ato.org/cdn/shop/products/short-sleeve-t-shirts-ato-classic-tee-19423512166565.jpg?v=1668535217&width=1080"
            alt="Shirt"
            className="w-full max-w-xs mb-4 object-contain"
          />
          <button
            onClick={() => window.open("https://store.ato.org/", "_blank")}
            className="mt-2 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full"
          >
            Buy Shirt
          </button>
        </div>

        {/* Bundle Option */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-between">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQt8KhBe6KdglmZkTRfJmwkBxKi96Aa6poyuw&s"
            alt="Bundle"
            className="w-full max-w-xs mb-4 object-contain"
          />
          <button
            onClick={() => window.open("https://www.officialsigepstore.com/", "_blank")}
            className="mt-2 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full"
          >
            Buy Bundle
          </button>
        </div>
      </div>

      {/* Middle Row: Ticket Only */}
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
        <button
          onClick={() => window.open("https://ticket-stripe-link.com", "_blank")}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full max-w-sm"
        >
          Buy Ticket
        </button>
      </div>

      {/* Donation Form */}
      <div className="bg-white rounded-xl shadow p-6 max-w-3xl mx-auto space-y-4">
        <h3 className="text-2xl font-bold text-center mb-4">Donate + Optionally Buy a Shirt</h3>
        
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select Your Team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Full Name"
          className="w-full p-2 border rounded"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email Address"
          className="w-full p-2 border rounded"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Donation Amount (USD)"
          min="1"
          className="w-full p-2 border rounded"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <div>
          <label className="block font-medium text-sm mb-2">Select Shirt Size (Optional)</label>
          <select
            value={shirtSize}
            onChange={(e) => setShirtSize(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- No Shirt --</option>
            {['S', 'M', 'L', 'XL'].map(size => {
              const available = getInventoryForSize(size);
              const isAvailable = available > 0;
              return (
                <option 
                  key={size} 
                  value={size}
                  disabled={!isAvailable}
                >
                  {size} {isAvailable ? `(${available} left)` : '(Out of Stock)'}
                </option>
              );
            })}
          </select>
          
          {/* Inventory Status Display */}
          <div className="mt-2 text-sm text-gray-600">
            <div className="grid grid-cols-4 gap-2">
              {['S', 'M', 'L', 'XL'].map(size => {
                const available = getInventoryForSize(size);
                const isAvailable = available > 0;
                return (
                  <div 
                    key={size}
                    className={`p-2 rounded text-center ${
                      isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    <div className="font-semibold">{size}</div>
                    <div className="text-xs">
                      {isAvailable ? `${available} left` : 'Out of Stock'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? "Processing..." : "Donate + Checkout with Stripe"}
        </button>
      </div>
    </div>
  );
};

export default Donations;