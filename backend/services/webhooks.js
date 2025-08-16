const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { 
  getUserByEmail, 
  updateUser, 
  findUserByStripeCustomerId, 
  updateSubscription, 
  logUsage 
} = require('../database-pg');

// Webhook event handlers
const webhookHandlers = {
  'customer.created': async (event) => {
    const customer = event.data.object;
    console.log('Customer created:', customer.id, 'email:', customer.email);
    
    try {
      // Find user by email (since customer was just created)
      const user = await getUserByEmail(customer.email);
      if (!user) {
        console.error('User not found for customer email:', customer.email);
        return;
      }

      console.log('Found user:', user.id, 'current stripe_customer_id:', user.stripe_customer_id);

      // Update user with the new Stripe customer ID
      const result = await updateUser(user.id, {
        stripe_customer_id: customer.id
      });

      console.log('Customer ID update result:', result);
      console.log('Customer ID updated for user:', user.id, 'to:', customer.id);
    } catch (error) {
      console.error('Error handling customer.created:', error);
    }
  },

  'customer.updated': async (event) => {
    const customer = event.data.object;
    console.log('Customer updated:', customer.id);
    
    try {
          // Find user by email
    const user = await getUserByEmail(customer.email);
      if (!user) {
        console.error('User not found for customer email:', customer.email);
        return;
      }

      // Update user with the Stripe customer ID
      await updateUser(user.id, {
        stripe_customer_id: customer.id
      });

      console.log('Customer ID updated for user:', user.id, 'to:', customer.id);
    } catch (error) {
      console.error('Error handling customer.updated:', error);
    }
  },

  'customer.subscription.created': async (event) => {
    const subscription = event.data.object;
    console.log('Subscription created:', subscription.id);
    console.log('Subscription details:', {
      customer: subscription.customer,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end
    });
    
    try {
      // Use the comprehensive sync function
      const success = await syncSubscriptionStatus(subscription.id);
      
      if (success) {
        console.log('✅ Subscription created and synced successfully');
      } else {
        console.error('❌ Failed to sync subscription on creation');
        // Retry after a short delay
        setTimeout(async () => {
          console.log('🔄 Retrying subscription sync...');
          await syncSubscriptionStatus(subscription.id);
        }, 5000);
      }
    } catch (error) {
      console.error('Error handling subscription.created:', error);
      // Retry after error
      setTimeout(async () => {
        console.log('🔄 Retrying subscription sync after error...');
        await syncSubscriptionStatus(subscription.id);
      }, 10000);
    }
  },

  'customer.subscription.updated': async (event) => {
    const subscription = event.data.object;
    console.log('Subscription updated:', subscription.id);
    console.log('Subscription details:', {
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: subscription.current_period_end
    });
    
    try {
      // Use the comprehensive sync function
      const success = await syncSubscriptionStatus(subscription.id);
      
      if (success) {
        console.log('✅ Subscription updated and synced successfully');
        
        // Check if this is a reactivation (cancel_at_period_end changed from true to false)
        const user = await findUserByStripeCustomerId(subscription.customer);
        if (user && subscription.cancel_at_period_end === false) {
          console.log('🔄 Subscription reactivated for user:', user.id);
          // Force update to ACTIVE status
          await updateSubscription(user.id, {
            status: 'ACTIVE',
            cancel_at_period_end: false
          });
        }
      } else {
        console.error('❌ Failed to sync subscription on update');
        // Retry after a short delay
        setTimeout(async () => {
          console.log('🔄 Retrying subscription sync...');
          await syncSubscriptionStatus(subscription.id);
        }, 5000);
      }
    } catch (error) {
      console.error('Error handling subscription.updated:', error);
      // Retry after error
      setTimeout(async () => {
        console.log('🔄 Retrying subscription sync after error...');
        await syncSubscriptionStatus(subscription.id);
      }, 10000);
    }
  },

  'customer.subscription.deleted': async (event) => {
    const subscription = event.data.object;
    console.log('Subscription deleted:', subscription.id);
    
    try {
      const user = await findUserByStripeCustomerId(subscription.customer);
      if (!user) {
        console.error('User not found for customer:', subscription.customer);
        return;
      }

      await updateSubscription(user.id, {
        cancelled_at: new Date(),
        cancel_at_period_end: true
      });

      console.log('Subscription cancelled for user:', user.id);
    } catch (error) {
      console.error('Error handling subscription.deleted:', error);
    }
  },

  'invoice.payment_succeeded': async (event) => {
    const invoice = event.data.object;
    console.log('Payment succeeded for invoice:', invoice.id);
    
    try {
      if (invoice.subscription) {
        const user = await findUserByStripeCustomerId(invoice.customer);
        if (user) {
          // Log successful payment
          await logUsage(user.id, 'payment_success', {
            invoice_id: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency
          });
          
          // Sync subscription status after successful payment
          console.log('🔄 Syncing subscription after successful payment:', invoice.subscription);
          const syncSuccess = await syncSubscriptionStatus(invoice.subscription);
          
          if (syncSuccess) {
            console.log('✅ Subscription synced successfully after payment');
          } else {
            console.error('❌ Failed to sync subscription after payment');
            // Retry after a short delay
            setTimeout(async () => {
              console.log('🔄 Retrying subscription sync after payment...');
              await syncSubscriptionStatus(invoice.subscription);
            }, 5000);
          }
        }
      }
    } catch (error) {
      console.error('Error handling payment.succeeded:', error);
    }
  },

  'invoice.payment_failed': async (event) => {
    const invoice = event.data.object;
    console.log('Payment failed for invoice:', invoice.id);
    
    try {
      if (invoice.subscription) {
        const user = await findUserByStripeCustomerId(invoice.customer);
        if (user) {
          // Log failed payment
          await logUsage(user.id, 'payment_failed', {
            invoice_id: invoice.id,
            amount: invoice.amount_due,
            currency: invoice.currency
          });
        }
      }
    } catch (error) {
      console.error('Error handling payment.failed:', error);
    }
  }
};

// Helper function to determine plan type from Stripe price ID dynamically
async function getPlanTypeFromPriceId(priceId) {
  console.log('Processing price ID:', priceId);
  
  try {
    // Fetch the price details from Stripe
    const price = await stripe.prices.retrieve(priceId);
    console.log('Price details from Stripe:', {
      id: price.id,
      product: price.product,
      metadata: price.metadata
    });
    
    // Check if the price has metadata with plan_type
    if (price.metadata && price.metadata.plan_type) {
      console.log('Found plan_type in metadata:', price.metadata.plan_type);
      return price.metadata.plan_type.toUpperCase();
    }
    
    // If no metadata, try to get it from the product
    if (price.product) {
      const product = await stripe.products.retrieve(price.product);
      console.log('Product details from Stripe:', {
        id: product.id,
        name: product.name,
        metadata: product.metadata
      });
      
      if (product.metadata && product.metadata.plan_type) {
        console.log('Found plan_type in product metadata:', product.metadata.plan_type);
        return product.metadata.plan_type.toUpperCase();
      }
      
      // Try to infer from product name
      const productName = product.name.toLowerCase();
      if (productName.includes('enterprise')) {
        console.log('Inferred ENTERPRISE from product name');
        return 'ENTERPRISE';
      }
    }
    
    console.log('No plan type found, defaulting to ENTERPRISE');
    return 'ENTERPRISE';
  } catch (error) {
    console.error('Error fetching price details from Stripe:', error);
    console.log('Defaulting to ENTERPRISE due to error');
    return 'ENTERPRISE';
  }
}

// Comprehensive subscription status sync function
async function syncSubscriptionStatus(subscriptionId) {
  try {
    console.log('Syncing subscription status for:', subscriptionId);
    
    // Get subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log('Stripe subscription status:', stripeSubscription.status);
    
    // Find user by customer ID
    const user = await findUserByStripeCustomerId(stripeSubscription.customer);
    if (!user) {
      console.error('User not found for customer:', stripeSubscription.customer);
      return false;
    }
    
    // Get plan type dynamically
    const planType = await getPlanTypeFromPriceId(stripeSubscription.items.data[0].price.id);
    
    // Map Stripe status to our status
    let mappedStatus = 'TRIAL';
    if (stripeSubscription.status === 'active') {
      // Check if it was previously cancelled but now reactivated
      if (stripeSubscription.cancel_at_period_end === false) {
        mappedStatus = 'ACTIVE';
      } else {
        mappedStatus = 'ACTIVE'; // Still active but will cancel at period end
      }
    } else if (stripeSubscription.status === 'trialing') {
      mappedStatus = 'TRIAL';
    } else if (stripeSubscription.status === 'canceled') {
      mappedStatus = 'CANCELLED';
    } else if (stripeSubscription.status === 'past_due') {
      mappedStatus = 'PAST_DUE';
    } else if (stripeSubscription.status === 'unpaid') {
      mappedStatus = 'UNPAID';
    }
    
    console.log('Mapped status:', mappedStatus, 'Plan type:', planType);
    
    // Update subscription in database
    const updateResult = await updateSubscription(user.id, {
      plan_type: planType,
      status: mappedStatus,
      stripe_subscription_id: subscriptionId,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000),
      trial_ends_at: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
      cancelled_at: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end || false
    });
    
    console.log('Subscription sync result:', updateResult);
    return true;
  } catch (error) {
    console.error('Error syncing subscription status:', error);
    return false;
  }
}

// Auto-sync all subscriptions function
async function syncAllSubscriptions() {
  try {
    console.log('Starting auto-sync of all subscriptions...');
    
         // Get all subscriptions from database using PostgreSQL
     const subscriptionsResult = await pool.query('SELECT * FROM subscriptions WHERE stripe_subscription_id IS NOT NULL');
     const subscriptions = subscriptionsResult.rows;
    
    console.log(`Found ${subscriptions.length} subscriptions to sync`);
    
    for (const subscription of subscriptions) {
      console.log(`Syncing subscription: ${subscription.stripe_subscription_id}`);
      await syncSubscriptionStatus(subscription.stripe_subscription_id);
    }
    
    console.log('✅ All subscriptions synced successfully!');
  } catch (error) {
    console.error('Error in auto-sync:', error);
  }
}

// Main webhook handler
async function handleWebhook(event) {
  const handler = webhookHandlers[event.type];
  
  if (handler) {
    try {
      await handler(event);
    } catch (error) {
      console.error(`Error handling webhook ${event.type}:`, error);
      throw error;
    }
  } else {
    console.log(`Unhandled webhook event: ${event.type}`);
  }
}

// Verify webhook signature
function verifyWebhookSignature(payload, signature) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('No webhook secret configured, skipping signature verification');
      return true;
    }
    
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    throw error;
  }
}

module.exports = {
  handleWebhook,
  verifyWebhookSignature,
  syncSubscriptionStatus,
  syncAllSubscriptions
};
