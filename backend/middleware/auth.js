const authService = require('../services/auth');
const { dbHelpers } = require('../database-pg');
const { getSubscriptionStatus, hasFeatureAccess, isWithinLimit } = require('../config/subscription-tiers');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No token provided or invalid format' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = authService.verifyToken(token);

    if (decoded.type !== 'access') {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Invalid token type' 
      });
    }

    // Get user from database
    const user = await dbHelpers.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'User not found' 
      });
    }

    // Get user subscription
    const subscription = await dbHelpers.getUserSubscription(user.id);

    // Add user and subscription to request object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      kommo_account: user.kommo_account,
      stripe_customer_id: user.stripe_customer_id,
      email_verified: user.email_verified,
      created_at: user.created_at
    };

    req.subscription = subscription ? {
      id: subscription.id,
      plan_type: subscription.plan_type,
      status: subscription.status,
      trial_ends_at: subscription.trial_ends_at,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      stripe_subscription_id: subscription.stripe_subscription_id,
      stripe_customer_id: subscription.stripe_customer_id,
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancelled_at: subscription.cancelled_at
    } : null;



    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Access denied', 
      message: 'Invalid or expired token' 
    });
  }
};

// Subscription status check middleware
const requireActiveSubscription = (req, res, next) => {
  if (!req.subscription) {
    return res.status(403).json({
      error: 'Subscription required',
      message: 'This action requires an active subscription'
    });
  }

  const { status } = req.subscription;
  const now = new Date();
  // Handle current_period_end as timestamp in milliseconds
  const currentPeriodEnd = req.subscription.current_period_end ? 
    new Date(parseInt(req.subscription.current_period_end)) : null;
  
  // Check if subscription is actually expired
  const isActuallyExpired = status === 'EXPIRED' || 
                           (status === 'CANCELLED' && currentPeriodEnd && now > currentPeriodEnd) ||
                           (status === 'TRIAL' && req.subscription.trial_ends_at && now > new Date(req.subscription.trial_ends_at));
  
  // Auto-update status to EXPIRED if period has ended
  if (status === 'CANCELLED' && currentPeriodEnd && now > currentPeriodEnd) {
    console.log('🔄 Auto-updating cancelled subscription to EXPIRED for user:', req.user.id);
    
    // Update the subscription status in the database
    const { dbHelpers } = require('../database-pg');
    dbHelpers.updateSubscription(req.user.id, {
      status: 'EXPIRED',
      updated_at: new Date()
    }).then(() => {
      console.log('✅ Subscription status updated to EXPIRED');
    }).catch(error => {
      console.error('❌ Error updating subscription status:', error);
    });
    
    // Update the request object
    req.subscription.status = 'EXPIRED';
  }
  
  if (isActuallyExpired) {
    return res.status(403).json({
      error: 'Subscription expired',
      message: 'Your subscription has expired. Please upgrade to continue.',
      subscription: req.subscription
    });
  }

  next();
};

// Feature access middleware factory
const requireFeature = (featureName) => {
  return (req, res, next) => {
    console.log('🔍 requireFeature middleware:', {
      featureName,
      subscription: req.subscription ? {
        plan_type: req.subscription.plan_type,
        status: req.subscription.status
      } : null
    });

    if (!req.subscription) {
      console.log('❌ No subscription found');
      return res.status(403).json({
        error: 'Feature not available',
        message: 'This feature requires an active subscription',
        feature: featureName
      });
    }

    const { plan_type, status } = req.subscription;

    // Check if subscription is active
    const now = new Date();
    // Handle current_period_end as timestamp in milliseconds
    const currentPeriodEnd = req.subscription.current_period_end ? 
      new Date(parseInt(req.subscription.current_period_end)) : null;
    
    // Auto-update status to EXPIRED if period has ended
    if (status === 'CANCELLED' && currentPeriodEnd && now > currentPeriodEnd) {
      console.log('🔄 Auto-updating cancelled subscription to EXPIRED for user:', req.user.id);
      
          // Update the subscription status in the database
    const { dbHelpers } = require('../database-pg');
    dbHelpers.updateSubscription(req.user.id, {
        status: 'EXPIRED',
        updated_at: new Date()
      }).then(() => {
        console.log('✅ Subscription status updated to EXPIRED');
      }).catch(error => {
        console.error('❌ Error updating subscription status:', error);
      });
      
      // Update the request object
      req.subscription.status = 'EXPIRED';
    }
    
    // Check if subscription is actually expired (past the current period end)
    const isActuallyExpired = status === 'EXPIRED' || 
                             (status === 'CANCELLED' && currentPeriodEnd && now > currentPeriodEnd) ||
                             (status === 'TRIAL' && req.subscription.trial_ends_at && now > new Date(req.subscription.trial_ends_at));
    
    // Allow access if subscription is cancelled but still within current period
    const isCancelledButActive = status === 'CANCELLED' && currentPeriodEnd && now <= currentPeriodEnd;
    
    if (isActuallyExpired) {
      console.log('❌ Subscription actually expired:', { status, currentPeriodEnd, now });
      return res.status(403).json({
        error: 'Subscription expired',
        message: 'Your subscription has expired. Please upgrade to continue.',
        feature: featureName
      });
    }
    
    // Allow access for cancelled subscriptions that are still within their billing period
    if (isCancelledButActive) {
      console.log('✅ Cancelled subscription but still within billing period, allowing access');
    }

    // Check feature access
    if (!hasFeatureAccess(plan_type, featureName)) {
      console.log('❌ Feature not available for plan:', plan_type);
      return res.status(403).json({
        error: 'Feature not available',
        message: `This feature is not available in your current plan (${plan_type})`,
        feature: featureName,
        current_plan: plan_type
      });
    }

    console.log('✅ Feature access granted');
    next();
  };
};

// Usage limit middleware factory
const requireUsageLimit = (limitType, actionType) => {
  return async (req, res, next) => {
    if (!req.subscription) {
      return res.status(403).json({
        error: 'Usage limit exceeded',
        message: 'This action requires an active subscription'
      });
    }

    const { plan_type } = req.subscription;
    const userId = req.user.id;

    try {
      // Get current usage for today
      const today = new Date().toISOString().split('T')[0];
      const currentUsage = await dbHelpers.getUserUsage(userId, actionType, today);

      // Check if within limits
      if (!isWithinLimit(plan_type, limitType, currentUsage)) {
        return res.status(429).json({
          error: 'Usage limit exceeded',
          message: `You have reached your daily limit for ${actionType}`,
          current_usage: currentUsage,
          plan_type: plan_type
        });
      }

      // Log the usage
      await dbHelpers.logUsage(userId, actionType, 1, {
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        endpoint: req.path
      });

      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      // Continue on error to not block legitimate requests
      next();
    }
  };
};

// Plan-specific middleware
const requirePlan = (requiredPlan) => {
  return (req, res, next) => {
    if (!req.subscription) {
      return res.status(403).json({
        error: 'Plan upgrade required',
        message: `This feature requires ${requiredPlan} plan or higher`
      });
    }

    const { plan_type, status } = req.subscription;

    // Check if subscription is active
    const now = new Date();
    const currentPeriodEnd = req.subscription.current_period_end ? new Date(req.subscription.current_period_end) : null;
    
    // Check if subscription is actually expired
    const isActuallyExpired = status === 'EXPIRED' || 
                             (status === 'CANCELLED' && currentPeriodEnd && now > currentPeriodEnd) ||
                             (status === 'TRIAL' && req.subscription.trial_ends_at && now > new Date(req.subscription.trial_ends_at));
    
    if (isActuallyExpired) {
      return res.status(403).json({
        error: 'Subscription expired',
        message: 'Your subscription has expired. Please upgrade to continue.'
      });
    }

    // Define plan hierarchy (only Enterprise)
    const planHierarchy = {
      'ENTERPRISE': 0
    };

    const currentPlanLevel = planHierarchy[plan_type] || -1;
    const requiredPlanLevel = planHierarchy[requiredPlan] || 999;

    if (currentPlanLevel < requiredPlanLevel) {
      return res.status(403).json({
        error: 'Plan upgrade required',
        message: `This feature requires ${requiredPlan} plan or higher`,
        current_plan: plan_type,
        required_plan: requiredPlan
      });
    }

    next();
  };
};

// Optional authentication middleware (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    if (decoded.type === 'access') {
      const user = await dbHelpers.getUserById(decoded.userId);
      if (user) {
        const subscription = await dbHelpers.getUserSubscription(user.id);
        
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          kommo_account: user.kommo_account
        };

        req.subscription = subscription ? {
          id: subscription.id,
          plan_type: subscription.plan_type,
          status: subscription.status,
          trial_ends_at: subscription.trial_ends_at,
          billing_cycle_ends_at: subscription.billing_cycle_ends_at,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          stripe_subscription_id: subscription.stripe_subscription_id
        } : null;
      }
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
    console.log('Optional auth failed:', error.message);
  }

  next();
};

module.exports = {
  authenticate,
  requireActiveSubscription,
  requireFeature,
  requireUsageLimit,
  requirePlan,
  optionalAuth
};
