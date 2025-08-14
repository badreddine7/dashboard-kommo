const { stripe, SUBSCRIPTION_PLANS } = require('../config/stripe-config');
const { dbHelpers } = require('../database');

class StripeService {
  // Create a checkout session for subscription
  async createCheckoutSession(userId, planType, successUrl, cancelUrl) {
    try {
      const plan = SUBSCRIPTION_PLANS[planType];
      if (!plan) {
        throw new Error('Invalid plan type');
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: plan.currency,
              product_data: {
                name: `${plan.name} Plan`,
                description: plan.features.join(', '),
              },
              unit_amount: Math.round(plan.price * 100), // Convert to cents
              recurring: {
                interval: plan.interval,
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: userId,
        metadata: {
          userId: userId,
          planType: planType
        }
      });

      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Create a customer portal session for subscription management
  async createCustomerPortalSession(customerId, returnUrl) {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      throw error;
    }
  }

  // Create a Stripe customer
  async createCustomer(userId, email, name) {
    try {
      const customer = await stripe.customers.create({
        email: email,
        name: name,
        metadata: {
          userId: userId
        }
      });

      // Update user with Stripe customer ID
      await dbHelpers.updateUser(userId, { stripe_customer_id: customer.id });

      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  // Get customer by user ID
  async getCustomerByUserId(userId) {
    try {
      const user = await dbHelpers.getUserById(userId);
      if (!user || !user.stripe_customer_id) {
        return null;
      }

      return await stripe.customers.retrieve(user.stripe_customer_id);
    } catch (error) {
      console.error('Error getting customer:', error);
      return null;
    }
  }

  // Handle successful subscription
  async handleSubscriptionCreated(subscription) {
    try {
      const userId = subscription.metadata.userId;
      const planType = subscription.metadata.planType;

      // Update subscription in database
      await dbHelpers.updateSubscription(userId, {
        stripe_subscription_id: subscription.id,
        plan_type: planType,
        status: subscription.status.toUpperCase(),
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        trial_ends_at: null // Clear trial since they're now paying
      });

      console.log(`Subscription created for user ${userId}: ${planType}`);
    } catch (error) {
      console.error('Error handling subscription creation:', error);
      throw error;
    }
  }

  // Handle subscription updates
  async handleSubscriptionUpdated(subscription) {
    try {
      const userId = subscription.metadata.userId;
      const planType = subscription.metadata.planType;

      await dbHelpers.updateSubscription(userId, {
        stripe_subscription_id: subscription.id,
        plan_type: planType,
        status: subscription.status.toUpperCase(),
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000)
      });

      console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
    } catch (error) {
      console.error('Error handling subscription update:', error);
      throw error;
    }
  }

  // Handle subscription cancellation
  async handleSubscriptionCancelled(subscription) {
    try {
      const userId = subscription.metadata.userId;

      await dbHelpers.updateSubscription(userId, {
        status: 'CANCELLED',
        cancelled_at: new Date()
      });

      console.log(`Subscription cancelled for user ${userId}`);
    } catch (error) {
      console.error('Error handling subscription cancellation:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });

      return subscription;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Reactivate subscription
  async reactivateSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });

      return subscription;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId) {
    try {
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }
  }

  // Get customer's active subscriptions
  async getCustomerSubscriptions(customerId) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active'
      });

      return subscriptions.data;
    } catch (error) {
      console.error('Error getting customer subscriptions:', error);
      throw error;
    }
  }
}

module.exports = new StripeService();
