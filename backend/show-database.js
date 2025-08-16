const { pool } = require('./database-pg');

async function showDatabaseContent() {
  console.log('🗄️  DATABASE CONTENT OVERVIEW\n');

  try {
    // Show Users
    console.log('👥 USERS:');
    const usersResult = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    const users = usersResult.rows;
    
    users.forEach(user => {
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Kommo Account: ${user.kommo_account || 'N/A'}`);
      console.log(`   Email Verified: ${user.email_verified ? 'Yes' : 'No'}`);
      console.log(`   Stripe Customer ID: ${user.stripe_customer_id || 'N/A'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Updated: ${user.updated_at}`);
      console.log('   ---');
    });

    // Show Subscriptions
    console.log('\n💳 SUBSCRIPTIONS:');
    const subscriptionsResult = await pool.query('SELECT * FROM subscriptions ORDER BY created_at DESC');
    const subscriptions = subscriptionsResult.rows;
    
    subscriptions.forEach(sub => {
      console.log(`   ID: ${sub.id}`);
      console.log(`   User ID: ${sub.user_id}`);
      console.log(`   Plan Type: ${sub.plan_type}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Trial Ends: ${sub.trial_ends_at || 'N/A'}`);
      console.log(`   Current Period Start: ${sub.current_period_start || 'N/A'}`);
      console.log(`   Current Period End: ${sub.current_period_end || 'N/A'}`);
      console.log(`   Cancelled At: ${sub.cancelled_at || 'N/A'}`);
      console.log(`   Cancel At Period End: ${sub.cancel_at_period_end ? 'Yes' : 'No'}`);
      console.log(`   Stripe Customer ID: ${sub.stripe_customer_id || 'N/A'}`);
      console.log(`   Stripe Subscription ID: ${sub.stripe_subscription_id || 'N/A'}`);
      console.log(`   Created: ${sub.created_at}`);
      console.log(`   Updated: ${sub.updated_at}`);
      console.log('   ---');
    });

    // Show Usage Logs
    console.log('\n📊 USAGE LOGS:');
    const usageLogsResult = await pool.query('SELECT * FROM usage_logs ORDER BY created_at DESC LIMIT 20');
    const usageLogs = usageLogsResult.rows;
    
    usageLogs.forEach(log => {
      console.log(`   ID: ${log.id}`);
      console.log(`   User ID: ${log.user_id}`);
      console.log(`   Action Type: ${log.action_type}`);
      console.log(`   Count: ${log.count}`);
      console.log(`   Date: ${log.date}`);
      console.log(`   Metadata: ${log.metadata || 'N/A'}`);
      console.log(`   Created: ${log.created_at}`);
      console.log('   ---');
    });

    // Show Feature Access
    console.log('\n🔐 FEATURE ACCESS:');
    const featureAccessResult = await pool.query('SELECT * FROM feature_access ORDER BY created_at DESC');
    const featureAccess = featureAccessResult.rows;
    
    featureAccess.forEach(feature => {
      console.log(`   ID: ${feature.id}`);
      console.log(`   Subscription ID: ${feature.subscription_id}`);
      console.log(`   Feature Name: ${feature.feature_name}`);
      console.log(`   Enabled: ${feature.enabled ? 'Yes' : 'No'}`);
      console.log(`   Usage Limit: ${feature.usage_limit || 'Unlimited'}`);
      console.log(`   Usage Count: ${feature.usage_count}`);
      console.log(`   Created: ${feature.created_at}`);
      console.log('   ---');
    });

    // Show Kommo Tokens
    console.log('\n🔑 KOMMO TOKENS:');
    const tokensResult = await pool.query('SELECT * FROM kommo_tokens ORDER BY created_at DESC');
    const tokens = tokensResult.rows;
    
    tokens.forEach(token => {
      console.log(`   ID: ${token.id}`);
      console.log(`   Account Domain: ${token.account_domain}`);
      console.log(`   Access Token: ${token.access_token ? '***' + token.access_token.slice(-4) : 'N/A'}`);
      console.log(`   Refresh Token: ${token.refresh_token ? '***' + token.refresh_token.slice(-4) : 'N/A'}`);
      console.log(`   Expires At: ${token.expires_at}`);
      console.log(`   Created: ${token.created_at}`);
      console.log(`   Updated: ${token.updated_at}`);
      console.log('   ---');
    });

    // Show Reports
    console.log('\n📄 REPORTS:');
    const reportsResult = await pool.query('SELECT * FROM reports ORDER BY generated_at DESC LIMIT 10');
    const reports = reportsResult.rows;
    
    reports.forEach(report => {
      console.log(`   ID: ${report.id}`);
      console.log(`   User ID: ${report.user_id}`);
      console.log(`   Rep ID: ${report.rep_id}`);
      console.log(`   Report Type: ${report.report_type}`);
      console.log(`   Time Range: ${report.time_range}`);
      console.log(`   Format: ${report.format}`);
      console.log(`   Generated At: ${report.generated_at}`);
      console.log('   ---');
    });

    // Show Database Summary
    console.log('\n\n📈 DATABASE SUMMARY:');
    const userCountResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`   Total Users: ${userCountResult.rows[0].count}`);

    const subCountResult = await pool.query('SELECT COUNT(*) as count FROM subscriptions');
    console.log(`   Total Subscriptions: ${subCountResult.rows[0].count}`);

    const usageCountResult = await pool.query('SELECT COUNT(*) as count FROM usage_logs');
    console.log(`   Total Usage Logs: ${usageCountResult.rows[0].count}`);

    const featureCountResult = await pool.query('SELECT COUNT(*) as count FROM feature_access');
    console.log(`   Total Feature Access: ${featureCountResult.rows[0].count}`);

    const tokenCountResult = await pool.query('SELECT COUNT(*) as count FROM kommo_tokens');
    console.log(`   Total Kommo Tokens: ${tokenCountResult.rows[0].count}`);

    const reportCountResult = await pool.query('SELECT COUNT(*) as count FROM reports');
    console.log(`   Total Reports: ${reportCountResult.rows[0].count}`);

    // Show subscription breakdown
    console.log('\n📊 SUBSCRIPTION BREAKDOWN:');
    const breakdownResult = await pool.query('SELECT plan_type, status, COUNT(*) as count FROM subscriptions GROUP BY plan_type, status');
    const breakdown = breakdownResult.rows;
    
    breakdown.forEach(item => {
      console.log(`   ${item.plan_type} - ${item.status}: ${item.count}`);
    });

    console.log('\n✅ Database content displayed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error displaying database content:', error);
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

showDatabaseContent();
