const { createStripeProducts } = require('./config/stripe-config');

async function setupStripe() {
  console.log('🔧 Setting up Stripe products and prices...');
  console.log('This will create the necessary products and prices for subscription tiers.\n');

  try {
    const result = await createStripeProducts();
    
    console.log('\n✅ Stripe setup completed successfully!');
    console.log('\n📋 Generated Price IDs:');
    console.log(`   STRIPE_PRICE_ID_PROFESSIONAL=${result.professional.priceId}`);
    console.log(`   STRIPE_PRICE_ID_ENTERPRISE=${result.enterprise.priceId}`);
    
    console.log('\n📋 Generated Product IDs:');
    console.log(`   STRIPE_PRODUCT_ID_PROFESSIONAL=${result.professional.productId}`);
    console.log(`   STRIPE_PRODUCT_ID_ENTERPRISE=${result.enterprise.productId}`);
    
    console.log('\n💡 Add these environment variables to your .env file:');
    console.log('   STRIPE_PRICE_ID_PROFESSIONAL=' + result.professional.priceId);
    console.log('   STRIPE_PRICE_ID_ENTERPRISE=' + result.enterprise.priceId);
    
    console.log('\n🎉 Stripe is now ready for subscription management!');
    
  } catch (error) {
    console.error('\n❌ Error setting up Stripe:', error.message);
    if (error.response?.data) {
      console.error('Stripe API Error:', error.response.data);
    }
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

setupStripe();
