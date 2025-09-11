const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { paymentLimiter } = require('../middleware/rateLimiting');

// Stripe webhook handler (needs raw body) - no rate limiting for webhooks from Stripe
router.post('/', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook);

// Checkout session creation (apply payment rate limiting)
router.post('/create-checkout-session', 
  paymentLimiter,
  express.json(), 
  webhookController.createCheckoutSession
);

module.exports = router;