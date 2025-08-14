const { db } = require('./database');

async function showDatabaseContent() {
  console.log('🗄️  DATABASE CONTENT OVERVIEW\n');

  // Show Users
  console.log('👥 USERS:');
  db.all('SELECT * FROM users ORDER BY created_at DESC', [], (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
    } else {
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
    }

    // Show Subscriptions
    console.log('\n💳 SUBSCRIPTIONS:');
    db.all('SELECT * FROM subscriptions ORDER BY created_at DESC', [], (err, subscriptions) => {
      if (err) {
        console.error('Error fetching subscriptions:', err);
      } else {
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
      }

      // Show Usage Logs
      console.log('\n📊 USAGE LOGS:');
      db.all('SELECT * FROM usage_logs ORDER BY created_at DESC LIMIT 20', [], (err, usageLogs) => {
        if (err) {
          console.error('Error fetching usage logs:', err);
        } else {
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
        }

        // Show Feature Access
        console.log('\n🔐 FEATURE ACCESS:');
        db.all('SELECT * FROM feature_access ORDER BY created_at DESC', [], (err, featureAccess) => {
          if (err) {
            console.error('Error fetching feature access:', err);
          } else {
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
          }

          // Show Kommo Tokens
          console.log('\n🔑 KOMMO TOKENS:');
          db.all('SELECT * FROM kommo_tokens ORDER BY created_at DESC', [], (err, tokens) => {
            if (err) {
              console.error('Error fetching Kommo tokens:', err);
            } else {
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
            }

            // Show Database Summary
            console.log('\n\n📈 DATABASE SUMMARY:');
            db.get('SELECT COUNT(*) as count FROM users', [], (err, userCount) => {
              if (err) console.error('Error counting users:', err);
              else console.log(`   Total Users: ${userCount.count}`);

              db.get('SELECT COUNT(*) as count FROM subscriptions', [], (err, subCount) => {
                if (err) console.error('Error counting subscriptions:', err);
                else console.log(`   Total Subscriptions: ${subCount.count}`);

                db.get('SELECT COUNT(*) as count FROM usage_logs', [], (err, usageCount) => {
                  if (err) console.error('Error counting usage logs:', err);
                  else console.log(`   Total Usage Logs: ${usageCount.count}`);

                  db.get('SELECT COUNT(*) as count FROM feature_access', [], (err, featureCount) => {
                    if (err) console.error('Error counting feature access:', err);
                    else console.log(`   Total Feature Access: ${featureCount.count}`);

                    db.get('SELECT COUNT(*) as count FROM kommo_tokens', [], (err, tokenCount) => {
                      if (err) console.error('Error counting Kommo tokens:', err);
                      else console.log(`   Total Kommo Tokens: ${tokenCount.count}`);

                      // Show subscription breakdown
                      console.log('\n📊 SUBSCRIPTION BREAKDOWN:');
                      db.all('SELECT plan_type, status, COUNT(*) as count FROM subscriptions GROUP BY plan_type, status', [], (err, breakdown) => {
                        if (err) {
                          console.error('Error getting subscription breakdown:', err);
                        } else {
                          breakdown.forEach(item => {
                            console.log(`   ${item.plan_type} - ${item.status}: ${item.count}`);
                          });
                        }

                        console.log('\n✅ Database content displayed successfully!');
                        process.exit(0);
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
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
