const stripeClient = require('../config/stripe');
const { handleCompletedPayment } = require('../services/paymentService');
const { emitLeaderboardUpdate } = require('../services/leaderboardService');

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  if (!sig) {
    return res.status(400).send('No signature');
  }

  let event;

  try {
    event = stripeClient.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      const donation = await handleCompletedPayment(session);
      const io = req.app.get('io');
      await emitLeaderboardUpdate(io);
    } catch (err) {
      console.error('Error handling completed payment:', err);
    }
  }

  res.json({ received: true });
};

const createCheckoutSession = async (req, res) => {
  const { teamId, userId, amount } = req.body;
  try {
    const { createCheckoutSession } = require('../services/paymentService');
    const session = await createCheckoutSession({ teamId, userId, amount });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  handleStripeWebhook,
  createCheckoutSession
};