const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  ENTERPRISE: {
    id: 'price_enterprise_monthly', 
    name: 'Enterprise',
    price: 99.99,
    currency: 'usd',
    interval: 'month',
    trial_period_days: 14, // 14-day trial
    features: [
      'Unlimited team members',
      'Advanced analytics',
      'Custom reports',
      'Priority support',
      'API access (10000 calls/day)',
      'White-label options',
      'Custom integrations'
    ],
    limits: {
      team_members: -1, // unlimited
      api_calls_per_day: 10000,
      custom_reports: -1 // unlimited
    }
  }
};

// Create Stripe products and prices (run once for setup)
async function createStripeProducts() {
  try {
    // Create Enterprise plan
    const enterpriseProduct = await stripe.products.create({
      name: 'Enterprise Plan', 
      description: 'Enterprise CRM Analytics with unlimited features and 14-day trial',
      metadata: {
        plan_type: 'ENTERPRISE'
      }
    });

    const enterprisePrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 9999, // $99.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      trial_period_days: 14, // 14-day trial
      metadata: {
        plan_type: 'ENTERPRISE'
      }
    });

    console.log('Stripe products and prices created:');
    console.log('Enterprise Product ID:', enterpriseProduct.id);
    console.log('Enterprise Price ID:', enterprisePrice.id);

    return {
      enterprise: {
        productId: enterpriseProduct.id,
        priceId: enterprisePrice.id
      }
    };
  } catch (error) {
    console.error('Error creating Stripe products:', error);
    throw error;
  }
}

module.exports = {
  stripe,
  SUBSCRIPTION_PLANS,
  createStripeProducts
};
