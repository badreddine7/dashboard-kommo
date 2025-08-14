const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  PROFESSIONAL: {
    id: 'price_professional_monthly',
    name: 'Professional',
    price: 29.99,
    currency: 'usd',
    interval: 'month',
    features: [
      'Up to 10 team members',
      'Advanced analytics',
      'Custom reports',
      'Priority support',
      'API access (1000 calls/day)'
    ],
    limits: {
      team_members: 10,
      api_calls_per_day: 1000,
      custom_reports: 50
    }
  },
  ENTERPRISE: {
    id: 'price_enterprise_monthly', 
    name: 'Enterprise',
    price: 99.99,
    currency: 'usd',
    interval: 'month',
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
    // Create Professional plan
    const professionalProduct = await stripe.products.create({
      name: 'Professional Plan',
      description: 'Professional CRM Analytics with advanced features',
      metadata: {
        plan_type: 'PROFESSIONAL'
      }
    });

    const professionalPrice = await stripe.prices.create({
      product: professionalProduct.id,
      unit_amount: 2999, // $29.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_type: 'PROFESSIONAL'
      }
    });

    // Create Enterprise plan
    const enterpriseProduct = await stripe.products.create({
      name: 'Enterprise Plan', 
      description: 'Enterprise CRM Analytics with unlimited features',
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
      metadata: {
        plan_type: 'ENTERPRISE'
      }
    });

    console.log('Stripe products and prices created:');
    console.log('Professional Product ID:', professionalProduct.id);
    console.log('Professional Price ID:', professionalPrice.id);
    console.log('Enterprise Product ID:', enterpriseProduct.id);
    console.log('Enterprise Price ID:', enterprisePrice.id);

    return {
      professional: {
        productId: professionalProduct.id,
        priceId: professionalPrice.id
      },
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
