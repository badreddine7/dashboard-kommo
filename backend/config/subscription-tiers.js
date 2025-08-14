// Subscription tier definitions and limits
const SUBSCRIPTION_TIERS = {
  ENTERPRISE: {
    name: 'Enterprise',
    price: 99, // USD per month
    trial_days: 14, // 14-day trial
    features: {
      max_leads: Infinity,
      max_users: Infinity,
      max_accounts: Infinity,
      charts: ['all'],
      refresh_interval_min: 0.5, // 30 seconds
      export_formats: ['csv', 'pdf', 'excel', 'json'],
      real_time_notifications: true,
      advanced_analytics: true,
      stage_analysis: true,
      heatmap: true,
      custom_fields_analysis: true,
      api_access: true,
      white_label: true,
      custom_integrations: true,
      support_level: 'phone',
      data_retention_days: 365
    },
    limits: {
      api_calls_per_hour: 10000,
      dashboard_refreshes_per_day: Infinity,
      export_downloads_per_month: Infinity
    },
    api_calls_per_day: 10000,
    team_members: -1, // unlimited
    custom_reports: -1 // unlimited
  }
};

// Feature flags mapping
const FEATURE_FLAGS = {
  // Dashboard features
  'dashboard.metrics': ['ENTERPRISE'],
  'dashboard.charts.basic': ['ENTERPRISE'],
  'dashboard.charts.advanced': ['ENTERPRISE'],
  'dashboard.heatmap': ['ENTERPRISE'],
  'dashboard.stage_analysis': ['ENTERPRISE'],
  'dashboard.funnel': ['ENTERPRISE'],
  
  // Export features
  'export.csv': ['ENTERPRISE'],
  'export.pdf': ['ENTERPRISE'],
  'export.excel': ['ENTERPRISE'],
  'export.json': ['ENTERPRISE'],
  
  // Real-time features
  'realtime.notifications': ['ENTERPRISE'],
  'realtime.auto_refresh': ['ENTERPRISE'],
  
  // Analytics features
  'analytics.advanced': ['ENTERPRISE'],
  'analytics.custom_fields': ['ENTERPRISE'],
  'analytics.lead_source': ['ENTERPRISE'],
  
  // User management
  'users.multiple': ['ENTERPRISE'],
  'accounts.multiple': ['ENTERPRISE'],
  
  // API access
  'api.access': ['ENTERPRISE'],
  'api.webhooks': ['ENTERPRISE'],
  
  // Customization
  'branding.white_label': ['ENTERPRISE'],
  'integrations.custom': ['ENTERPRISE']
};

// Usage action types for tracking
const USAGE_ACTIONS = {
  DASHBOARD_VIEW: 'dashboard_view',
  CHART_RENDER: 'chart_render',
  DATA_REFRESH: 'data_refresh',
  EXPORT_DOWNLOAD: 'export_download',
  API_CALL: 'api_call',
  LEAD_ANALYSIS: 'lead_analysis',
  USER_LOGIN: 'user_login'
};

// Helper functions
function getTierLimits(planType) {
  return SUBSCRIPTION_TIERS[planType] || SUBSCRIPTION_TIERS.ENTERPRISE;
}

function hasFeatureAccess(planType, featureName) {
  const allowedTiers = FEATURE_FLAGS[featureName];
  return allowedTiers ? allowedTiers.includes(planType) : false;
}

function isWithinLimit(planType, limitType, currentUsage) {
  const tier = getTierLimits(planType);
  const limit = tier.limits[limitType];
  
  if (limit === Infinity) return true;
  return currentUsage < limit;
}

function getTrialEndDate(planType) {
  const tier = getTierLimits(planType);
  if (tier.trial_days === 0) return null;
  
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + tier.trial_days);
  return endDate;
}

function isTrialExpired(trialEndsAt) {
  if (!trialEndsAt) return false;
  return new Date() > new Date(trialEndsAt);
}

function getSubscriptionStatus(subscription) {
  if (!subscription) return 'NONE';
  
  // Check if trial is expired
  if (subscription.status === 'TRIAL' && isTrialExpired(subscription.trial_ends_at)) {
    return 'EXPIRED';
  }
  
  // Check if billing cycle is expired
  if (subscription.billing_cycle_ends_at && new Date() > new Date(subscription.billing_cycle_ends_at)) {
    return 'EXPIRED';
  }
  
  return subscription.status;
}

function canUpgradeTo(currentPlan, targetPlan) {
  // With only Enterprise plan, no upgrades needed
  return false;
}

function canDowngradeTo(currentPlan, targetPlan) {
  // With only Enterprise plan, no downgrades needed
  return false;
}

module.exports = {
  SUBSCRIPTION_TIERS,
  FEATURE_FLAGS,
  USAGE_ACTIONS,
  getTierLimits,
  hasFeatureAccess,
  isWithinLimit,
  getTrialEndDate,
  isTrialExpired,
  getSubscriptionStatus,
  canUpgradeTo,
  canDowngradeTo
};
