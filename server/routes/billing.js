import express from 'express';
import Stripe from 'stripe';
import { query } from '../utils/database.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...');

// Create checkout session
router.post('/checkout', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { price_id } = req.body;

    if (!price_id) {
      return res.status(400).json({ message: 'Price ID is required' });
    }

    // Get user email
    const userResult = await query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: userResult.rows[0].email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings`,
      metadata: {
        user_id: userId,
      },
    });

    res.json({ checkout_url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
});

// Get subscription status
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      'SELECT subscription_status, subscription_id, subscription_data FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    let subscriptionDetails = null;

    if (user.subscription_id) {
      try {
        subscriptionDetails = await stripe.subscriptions.retrieve(user.subscription_id);
      } catch (stripeError) {
        console.error('Stripe subscription retrieval error:', stripeError);
      }
    }

    res.json({
      status: user.subscription_status || 'free',
      subscription: subscriptionDetails,
      metadata: user.subscription_data ? JSON.parse(user.subscription_data) : null
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Failed to get subscription status' });
  }
});

// Webhook for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const userId = session.metadata.user_id;
        
        if (session.subscription) {
          await query(
            'UPDATE users SET subscription_status = $1, subscription_id = $2 WHERE id = $3',
            ['active', session.subscription, userId]
          );
        }
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        const status = subscription.status;
        
        await query(
          'UPDATE users SET subscription_status = $1, subscription_data = $2 WHERE subscription_id = $3',
          [status, JSON.stringify(subscription), subscription.id]
        );
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;