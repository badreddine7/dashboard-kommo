const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripe');
const { authenticate } = require('../middleware/auth');
const { validateBody, validateUserId } = require('../middleware/validation');
const { 
  stripeCheckoutSchema,
  stripePortalSchema,
  stripeCustomerIdSchema,
  stripeSubscriptionIdSchema,
  stripeSyncSchema
} = require('../validation/schemas');
const { SUBSCRIPTION_PLANS, stripe } = require('../config/stripe-config');
const { 
  getSubscriptionByUserId, 
  updateSubscription, 
  getUserSubscription 
} = require('../database-pg');
const { handleWebhook, verifyWebhookSignature } = require('../services/webhooks');

// Get available subscription plans
router.get('/plans', async (req, res) => {
  try {
    console.log('Fetching available subscription plans...');
    
    // Fetch all active prices from Stripe
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product']
    });
    
    const plans = prices.data
      .filter(price => price.recurring) // Only subscription prices
      .filter(price => price.product.metadata?.plan_type === 'ENTERPRISE') // Only Enterprise
      .map(price => {
        const product = price.product;
        return {
          id: price.id,
          name: product.name,
          description: product.description,
          price: price.unit_amount / 100, // Convert from cents
          currency: price.currency,
          interval: price.recurring.interval,
          trial_period_days: price.trial_period_days,
          plan_type: product.metadata?.plan_type || 'ENTERPRISE',
          features: product.metadata?.features ? JSON.parse(product.metadata.features) : []
        };
      });
    
    console.log('Available plans:', plans.map(p => ({ id: p.id, name: p.name, plan_type: p.plan_type })));
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans',
      error: error.message
    });
  }
});

// Create checkout session for subscription
router.post('/create-checkout-session', authenticate, validateUserId, validateBody(stripeCheckoutSchema), async (req, res) => {
  try {
    const { planType } = req.body;
    const userId = req.user.id;

    // Use environment variable for frontend URL, fallback to localhost for Docker
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost';
    const successUrl = `${frontendUrl}/payment-success?payment=success&plan=${planType}&upgraded=true&welcome=true`;
    const cancelUrl = `${frontendUrl}/pricing?canceled=true&plan=${planType}`;

    const session = await stripeService.createCheckoutSession(
      userId,
      planType,
      successUrl,
      cancelUrl
    );

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session'
    });
  }
});

// Create customer portal session
router.post('/create-portal-session', validateBody(stripeCustomerIdSchema), async (req, res) => {
  try {
    const { customerId } = req.body;

    console.log('Creating portal session for customer:', customerId);

    // Use environment variable for frontend URL, fallback to localhost for Docker
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost';
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${frontendUrl}/billing`,
    });

    console.log('Portal session created:', session.id);

    res.json({
      success: true,
      data: {
        url: session.url
      }
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    
    // Handle specific Stripe portal configuration error
    if (error.message && error.message.includes('No configuration provided')) {
      res.status(400).json({
        success: false,
        message: 'Billing portal is not configured. Please contact support.',
        error: 'PORTAL_NOT_CONFIGURED'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create billing portal session',
        error: error.message
      });
    }
  }
});

// Get user's subscription details
router.get('/subscription', authenticate, validateUserId, async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await getSubscriptionByUserId(userId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found'
      });
    }

    // Get Stripe subscription details if available
    let stripeSubscription = null;
    if (subscription.stripe_subscription_id) {
      try {
        stripeSubscription = await stripeService.getSubscription(subscription.stripe_subscription_id);
      } catch (error) {
        console.error('Error getting Stripe subscription:', error);
      }
    }

    res.json({
      success: true,
      data: {
        subscription,
        stripeSubscription
      }
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription details'
    });
  }
});

// Cancel subscription endpoint
router.post('/cancel-subscription', authenticate, validateUserId, validateBody(stripeSubscriptionIdSchema), async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    console.log('Cancelling subscription:', subscriptionId);

    // Cancel the subscription in Stripe (at period end)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    console.log('Subscription cancelled:', subscription.id);
    console.log("debug status 1", subscription.status);
    console.log("debug cancel_at_period_end:", subscription.cancel_at_period_end);
    console.log("debug current_period_end:", new Date(subscription.current_period_end * 1000));

    // Update our database using authenticated user
    // Note: Stripe status remains 'active' but cancel_at_period_end is true
    // We set our database status to 'CANCELLED' to reflect the cancellation intent
    await updateSubscription(req.user.id, {
      cancelled_at: new Date(),
      cancel_at_period_end: true,
      updated_at: new Date()
    });

    console.log('Database updated for user:', req.user.id);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        subscription_id: subscription.id,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: new Date(subscription.current_period_end * 1000)
      }
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
});

// Reactivate subscription
router.post('/reactivate-subscription', authenticate, validateUserId, async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await getSubscriptionByUserId(userId);

    if (!subscription || !subscription.stripe_subscription_id) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found'
      });
    }

    const reactivatedSubscription = await stripeService.reactivateSubscription(
      subscription.stripe_subscription_id
    );

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
      data: {
        subscription: reactivatedSubscription
      }
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reactivate subscription'
    });
  }
});



// Dynamic subscription sync endpoint
router.post('/sync-subscription', validateBody(stripeSyncSchema), async (req, res) => {
  try {
    const { subscriptionId, userId } = req.body;

    let targetSubscriptionId = subscriptionId;

    // If userId provided, get their subscription
    if (!subscriptionId && userId) {
      const subscription = await getUserSubscription(userId);
      if (!subscription || !subscription.stripe_subscription_id) {
        return res.status(404).json({
          success: false,
          message: 'No Stripe subscription found for this user'
        });
      }
      targetSubscriptionId = subscription.stripe_subscription_id;
    }

    console.log('Syncing subscription:', targetSubscriptionId);

    // Import the sync function
    const { syncSubscriptionStatus } = require('../services/webhooks');
    
    const success = await syncSubscriptionStatus(targetSubscriptionId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Subscription synced successfully',
        data: { subscriptionId: targetSubscriptionId }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to sync subscription'
      });
    }
  } catch (error) {
    console.error('Error syncing subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync subscription',
      error: error.message
    });
  }
});

// Auto-sync all subscriptions endpoint
router.post('/sync-all-subscriptions', async (req, res) => {
  try {
    console.log('Starting auto-sync of all subscriptions...');
    
    // Import the sync function
    const { syncAllSubscriptions } = require('../services/webhooks');
    
    await syncAllSubscriptions();
    
    res.json({
      success: true,
      message: 'All subscriptions synced successfully'
    });
  } catch (error) {
    console.error('Error in auto-sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync all subscriptions',
      error: error.message
    });
  }
});

// Stripe webhook handler
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = verifyWebhookSignature(req.body, sig);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Debug logging
  console.log('Webhook event received:', {
    type: event.type,
    id: event.id,
    customer: event.data?.object?.customer,
    subscription: event.data?.object?.subscription
  });

  try {
    await handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

module.exports = router;
