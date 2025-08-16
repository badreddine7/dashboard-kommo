const { z } = require('zod');

// ============================================================================
// USER SCHEMAS
// ============================================================================

const userSchema = z.object({
  id: z.string().uuid('User ID must be a valid UUID'),
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required'),
  kommo_account: z.string().optional(),
  stripe_customer_id: z.string().optional(),
  email_verified: z.boolean().optional(),
  created_at: z.date().optional()
});

const userCreateSchema = z.object({
  email: z.string().email('Invalid email format').transform(val => val.toLowerCase().trim()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').transform(val => val?.trim() || ''),
  kommoAccount: z.string().optional().transform(val => val?.trim() || '')
});

const userLoginSchema = z.object({
  email: z.string().email('Invalid email format').transform(val => val.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required')
});

const userUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional().transform(val => val?.trim()),
  kommoAccount: z.string().optional().transform(val => val?.trim()),
  kommo_account: z.string().optional().transform(val => val?.trim())
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const kommoAccountValidationSchema = z.object({
  account_domain: z.string().min(1, 'Account domain is required')
});

// ============================================================================
// SUBSCRIPTION SCHEMAS
// ============================================================================

const subscriptionSchema = z.object({
  id: z.string().uuid('Subscription ID must be a valid UUID'),
  plan_type: z.enum(['BASIC', 'PRO', 'ENTERPRISE'], {
    errorMap: () => ({ message: 'Plan type must be BASIC, PRO, or ENTERPRISE' })
  }),
  status: z.enum(['ACTIVE', 'CANCELLED', 'EXPIRED', 'TRIAL'], {
    errorMap: () => ({ message: 'Status must be ACTIVE, CANCELLED, EXPIRED, or TRIAL' })
  }),
  trial_ends_at: z.date().optional(),
  current_period_start: z.date().optional(),
  current_period_end: z.date().optional(),
  stripe_subscription_id: z.string().optional(),
  stripe_customer_id: z.string().optional(),
  cancel_at_period_end: z.boolean().optional(),
  cancelled_at: z.date().optional()
});

const subscriptionUpdateSchema = z.object({
  plan_type: z.enum(['BASIC', 'PRO', 'ENTERPRISE']).optional(),
  status: z.enum(['ACTIVE', 'CANCELLED', 'EXPIRED', 'TRIAL']).optional(),
  trial_ends_at: z.date().optional(),
  current_period_start: z.date().optional(),
  current_period_end: z.date().optional(),
  stripe_subscription_id: z.string().optional(),
  stripe_customer_id: z.string().optional(),
  cancel_at_period_end: z.boolean().optional(),
  cancelled_at: z.date().optional()
});

// ============================================================================
// REPORT SCHEMAS
// ============================================================================

const reportGenerateSchema = z.object({
  reportType: z.enum([
    'performance-summary',
    'activity-report', 
    'revenue-analysis',
    'team-comparison',
    'conversion-funnel',
    'time-analysis'
  ], {
    errorMap: () => ({ message: 'Invalid report type' })
  }),
  timeRange: z.enum([
    'Last 7 days',
    'Last 30 days', 
    'Last 90 days',
    'This month',
    'This quarter',
    'This year'
  ], {
    errorMap: () => ({ message: 'Invalid time range' })
  }),
  format: z.enum(['pdf', 'json'], {
    errorMap: () => ({ message: 'Format must be pdf or json' })
  }),
  repId: z.string().optional(),
  useCache: z.boolean().default(true)
});

const reportIdSchema = z.object({
  reportId: z.string().uuid('Report ID must be a valid UUID')
});

const reportQuerySchema = z.object({
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(100).default(10).optional(),
  reportType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

// ============================================================================
// STRIPE SCHEMAS
// ============================================================================

const stripeCheckoutSchema = z.object({
  planType: z.enum(['BASIC', 'PRO', 'ENTERPRISE'], {
    errorMap: () => ({ message: 'Plan type must be BASIC, PRO, or ENTERPRISE' })
  })
});

const stripeWebhookSchema = z.object({
  type: z.string().min(1, 'Webhook type is required'),
  data: z.object({
    object: z.any()
  })
});

const stripePortalSchema = z.object({
  returnUrl: z.string().url('Return URL must be a valid URL').optional()
});

const stripeCustomerIdSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required')
});

const stripeSubscriptionIdSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required')
});

const stripeSyncSchema = z.object({
  subscriptionId: z.string().optional(),
  userId: z.string().uuid('User ID must be a valid UUID').optional()
}).refine(data => data.subscriptionId || data.userId, {
  message: 'Either subscriptionId or userId is required'
});

// ============================================================================
// USAGE SCHEMAS
// ============================================================================

const usageQuerySchema = z.object({
  teamMemberCount: z.string().optional().transform(val => parseInt(val) || 1)
});

const usageLogSchema = z.object({
  action_type: z.string().min(1, 'Action type is required'),
  count: z.number().int().positive().default(1).optional(),
  metadata: z.any().optional()
});

// ============================================================================
// KOMMO SCHEMAS
// ============================================================================

const kommoTokensSchema = z.object({
  access_token: z.string().min(1, 'Access token is required'),
  refresh_token: z.string().min(1, 'Refresh token is required'),
  expires_in: z.number().positive('Expires in must be positive'),
  token_type: z.string().min(1, 'Token type is required')
});

const kommoAccountSchema = z.object({
  account_domain: z.string().min(1, 'Account domain is required')
});

// ============================================================================
// REQUEST VALIDATION SCHEMAS
// ============================================================================

const requestUserSchema = z.object({
  user: userSchema
});

const requestWithSubscriptionSchema = z.object({
  user: userSchema,
  subscription: subscriptionSchema.optional()
});

// ============================================================================
// PARAMETER VALIDATION SCHEMAS
// ============================================================================

const userIdParamSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID')
});

const reportIdParamSchema = z.object({
  reportId: z.string().uuid('Report ID must be a valid UUID')
});

// ============================================================================
// PAGINATION AND SEARCH SCHEMAS
// ============================================================================

const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10)
});

const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  filters: z.record(z.any()).optional()
});

// ============================================================================
// UTILITY VALIDATION FUNCTIONS
// ============================================================================

const validateEmail = (email) => {
  const emailSchema = z.string().email('Invalid email format');
  return emailSchema.safeParse(email);
};

const validateUuid = (uuid) => {
  const uuidSchema = z.string().uuid('Must be a valid UUID');
  return uuidSchema.safeParse(uuid);
};

const validateDate = (date) => {
  const dateSchema = z.string().datetime('Must be a valid date');
  return dateSchema.safeParse(date);
};

// ============================================================================
// EXPORT ALL SCHEMAS
// ============================================================================

module.exports = {
  // User schemas
  userSchema,
  userCreateSchema,
  userLoginSchema,
  userUpdateSchema,
  passwordChangeSchema,
  refreshTokenSchema,
  kommoAccountValidationSchema,
  
  // Subscription schemas
  subscriptionSchema,
  subscriptionUpdateSchema,
  
  // Report schemas
  reportGenerateSchema,
  reportIdSchema,
  reportQuerySchema,
  
  // Stripe schemas
  stripeCheckoutSchema,
  stripeWebhookSchema,
  stripePortalSchema,
  stripeCustomerIdSchema,
  stripeSubscriptionIdSchema,
  stripeSyncSchema,
  
  // Usage schemas
  usageQuerySchema,
  usageLogSchema,
  
  // Kommo schemas
  kommoTokensSchema,
  kommoAccountSchema,
  
  // Request schemas
  requestUserSchema,
  requestWithSubscriptionSchema,
  
  // Parameter schemas
  userIdParamSchema,
  reportIdParamSchema,
  
  // Utility schemas
  paginationSchema,
  searchSchema,
  
  // Utility functions
  validateEmail,
  validateUuid,
  validateDate
};
