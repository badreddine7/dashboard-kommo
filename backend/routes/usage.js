const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { dbHelpers } = require('../database');
const { SUBSCRIPTION_TIERS } = require('../config/subscription-tiers');

// Get user's usage statistics
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { teamMemberCount } = req.query; // Get team member count from query params
    
    // Get user's subscription to determine limits
    const subscription = await dbHelpers.getUserSubscription(userId);
    const planType = subscription?.plan_type || 'ENTERPRISE';
    const planLimits = SUBSCRIPTION_TIERS[planType];

    // Get today's date for API calls
    const today = new Date().toISOString().split('T')[0];
    
    // Get usage data
    const apiCallsToday = await dbHelpers.getUserUsage(userId, 'api_call', today);
    const customReports = await dbHelpers.getUserUsage(userId, 'report_generated');
    
    // Use actual team member count from analytics data, fallback to 1 if not provided
    const actualTeamMembers = parseInt(teamMemberCount) || 1;

    // Calculate percentages
    const apiCallsPercentage = planLimits.api_calls_per_day > 0 
      ? (apiCallsToday / planLimits.api_calls_per_day) * 100 
      : 0;
    
    const teamMembersPercentage = planLimits.team_members > 0 
      ? (actualTeamMembers / planLimits.team_members) * 100 
      : 0;
    
    const customReportsPercentage = planLimits.custom_reports > 0 
      ? (customReports / planLimits.custom_reports) * 100 
      : 0;

    const usageData = {
      api_calls: {
        used: apiCallsToday,
        limit: planLimits.api_calls_per_day,
        percentage: Math.min(apiCallsPercentage, 100)
      },
      team_members: {
        used: actualTeamMembers,
        limit: planLimits.team_members,
        percentage: Math.min(teamMembersPercentage, 100)
      },
      custom_reports: {
        used: customReports,
        limit: planLimits.custom_reports,
        percentage: Math.min(customReportsPercentage, 100)
      }
    };

    res.json({
      success: true,
      data: usageData
    });
  } catch (error) {
    console.error('Error getting usage data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage data'
    });
  }
});

// Log usage (for internal use)
router.post('/log', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { action_type, count = 1, metadata = null } = req.body;

    await dbHelpers.logUsage(userId, action_type, count, metadata);

    res.json({
      success: true,
      message: 'Usage logged successfully'
    });
  } catch (error) {
    console.error('Error logging usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log usage'
    });
  }
});

module.exports = router;
