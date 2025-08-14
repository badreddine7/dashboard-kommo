// Subscription tier definitions and limits
const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free Trial',
    price: 0,
    trial_days: 14,
    features: {
      max_leads: 1000,
      max_users: 1,
      max_accounts: 1,
      charts: ['basic', 'doughnut', 'bar'],
      refresh_interval_min: 5, // minutes
      export_formats: [],
      real_time_notifications: false,
      advanced_analytics: false,
      stage_analysis: false,
      heatmap: false,
      custom_fields_analysis: false,
      api_access: false,
      support_level: 'email',
      data_retention_days: 30
    },
    limits: {
      api_calls_per_hour: 100,
      dashboard_refreshes_per_day: 50,
      export_downloads_per_month: 0
    },
    api_calls_per_day: 100,
    team_members: 3,
    custom_reports: 5
  },
  
  PROFESSIONAL: {
    name: 'Professional',
    price: 29, // USD per month
    trial_days: 0,
    features: {
      max_leads: 10000,
      max_users: 5,
      max_accounts: 3,
      charts: ['basic', 'doughnut', 'bar', 'line', 'funnel'],
      refresh_interval_min: 1, // minutes
      export_formats: ['csv', 'pdf'],
      real_time_notifications: true,
      advanced_analytics: true,
      stage_analysis: true,
      heatmap: true,
      custom_fields_analysis: true,
      api_access: false,
      support_level: 'priority_email',
      data_retention_days: 90
    },
    limits: {
      api_calls_per_hour: 1000,
      dashboard_refreshes_per_day: 500,
      export_downloads_per_month: 50
    },
    api_calls_per_day: 1000,
    team_members: 10,
    custom_reports: 50
  },
  
  ENTERPRISE: {
    name: 'Enterprise',
    price: 99, // USD per month
    trial_days: 0,
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
  'dashboard.metrics': ['FREE', 'PROFESSIONAL', 'ENTERPRISE'],
  'dashboard.charts.basic': ['FREE', 'PROFESSIONAL', 'ENTERPRISE'],
  'dashboard.charts.advanced': ['PROFESSIONAL', 'ENTERPRISE'],
  'dashboard.heatmap': ['PROFESSIONAL', 'ENTERPRISE'],
  'dashboard.stage_analysis': ['PROFESSIONAL', 'ENTERPRISE'],
  'dashboard.funnel': ['PROFESSIONAL', 'ENTERPRISE'],
  
  // Export features
  'export.csv': ['PROFESSIONAL', 'ENTERPRISE'],
  'export.pdf': ['PROFESSIONAL', 'ENTERPRISE'],
  'export.excel': ['ENTERPRISE'],
  'export.json': ['ENTERPRISE'],
  
  // Real-time features
  'realtime.notifications': ['PROFESSIONAL', 'ENTERPRISE'],
  'realtime.auto_refresh': ['PROFESSIONAL', 'ENTERPRISE'],
  
  // Analytics features
  'analytics.advanced': ['PROFESSIONAL', 'ENTERPRISE'],
  'analytics.custom_fields': ['PROFESSIONAL', 'ENTERPRISE'],
  'analytics.lead_source': ['PROFESSIONAL', 'ENTERPRISE'],
  
  // User management
  'users.multiple': ['PROFESSIONAL', 'ENTERPRISE'],
  'accounts.multiple': ['PROFESSIONAL', 'ENTERPRISE'],
  
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
  return SUBSCRIPTION_TIERS[planType] || SUBSCRIPTION_TIERS.FREE;
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
  const tiers = ['FREE', 'PROFESSIONAL', 'ENTERPRISE'];
  const currentIndex = tiers.indexOf(currentPlan);
  const targetIndex = tiers.indexOf(targetPlan);
  
  return targetIndex > currentIndex;
}

function canDowngradeTo(currentPlan, targetPlan) {
  const tiers = ['FREE', 'PROFESSIONAL', 'ENTERPRISE'];
  const currentIndex = tiers.indexOf(currentPlan);
  const targetIndex = tiers.indexOf(targetPlan);
  
  return targetIndex < currentIndex;
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
