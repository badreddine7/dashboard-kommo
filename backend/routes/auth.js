const express = require('express');
const authService = require('../services/auth');
const { authenticate } = require('../middleware/auth');
const { dbHelpers } = require('../database'); // Added for debug endpoint

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, kommoAccount } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid email format'
      });
    }

    const result = await authService.register({
      email: email.toLowerCase().trim(),
      password,
      name: name?.trim() || '',
      kommoAccount: kommoAccount?.trim() || ''
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'Registration failed',
        message: error.message
      });
    }

    res.status(400).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email and password are required'
      });
    }

    const result = await authService.login(email.toLowerCase().trim(), password);

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    console.error('Login error:', error);
    
    res.status(401).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Refresh token is required'
      });
    }

    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    
    res.status(401).json({
      error: 'Token refresh failed',
      message: error.message
    });
  }
});

// Get user profile (protected route)
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await authService.getProfile(req.user.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get profile error:', error);
    
    res.status(500).json({
      error: 'Failed to get profile',
      message: error.message
    });
  }
});

// Update user profile (protected route)
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, kommoAccount, kommo_account } = req.body;
    
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (kommoAccount !== undefined) updates.kommo_account = kommoAccount.trim();
    if (kommo_account !== undefined) updates.kommo_account = kommo_account.trim();

    console.log('🔧 Profile update request:', { name, kommoAccount, kommo_account, updates });

    const result = await authService.updateProfile(req.user.id, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    res.status(400).json({
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// Change password (protected route)
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'New password must be at least 6 characters long'
      });
    }

    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: result
    });
  } catch (error) {
    console.error('Change password error:', error);
    
    res.status(400).json({
      error: 'Failed to change password',
      message: error.message
    });
  }
});

// Logout (protected route) - mainly for client-side token cleanup
router.post('/logout', authenticate, async (req, res) => {
  try {
    // In a more sophisticated implementation, you might want to:
    // 1. Blacklist the token
    // 2. Log the logout event
    // 3. Clear any server-side sessions
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    res.status(500).json({
      error: 'Logout failed',
      message: error.message
    });
  }
});

// Validate token (utility endpoint)
router.get('/validate', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user,
        subscription: req.subscription
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    
    res.status(500).json({
      error: 'Token validation failed',
      message: error.message
    });
  }
});

// Debug endpoint to check user data
router.get('/debug/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get user data
    const user = await dbHelpers.getUserById(userId);
    const subscription = await dbHelpers.getUserSubscription(userId);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          kommo_account: user.kommo_account,
          email_verified: user.email_verified,
          stripe_customer_id: user.stripe_customer_id,
          created_at: user.created_at
        },
        subscription: subscription ? {
          id: subscription.id,
          plan_type: subscription.plan_type,
          status: subscription.status,
          trial_ends_at: subscription.trial_ends_at,
          current_period_end: subscription.current_period_end,
          stripe_subscription_id: subscription.stripe_subscription_id,
          stripe_customer_id: subscription.stripe_customer_id
        } : null
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Validate Kommo account installation
router.post('/validate-kommo-account', async (req, res) => {
  try {
    const { account_domain } = req.body;

    if (!account_domain) {
      return res.status(400).json({
        success: false,
        message: 'Account domain is required'
      });
    }

    // Clean the account domain (remove protocol if present)
    const cleanDomain = account_domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    console.log('🔍 Validating Kommo account:', cleanDomain);

    // Check if tokens exist for this account domain
    const tokens = await dbHelpers.getKommoTokens(cleanDomain);

    if (!tokens) {
      console.log('❌ No tokens found for account:', cleanDomain);
      return res.status(404).json({
        success: false,
        message: 'Kommo account not found or not installed',
        error: 'ACCOUNT_NOT_INSTALLED',
        details: {
          account_domain: cleanDomain,
          suggestion: 'Please install the Dashboard++ app from the Kommo marketplace first'
        }
      });
    }

    // Check if tokens are valid (not expired)
    const now = new Date();
    const expiresAt = new Date(tokens.expires_at);
    const isExpired = expiresAt <= now;

    if (isExpired) {
      console.log('⚠️ Tokens expired for account:', cleanDomain);
      return res.status(400).json({
        success: false,
        message: 'Kommo account tokens have expired',
        error: 'TOKENS_EXPIRED',
        details: {
          account_domain: cleanDomain,
          expires_at: tokens.expires_at,
          suggestion: 'Please re-authenticate your Kommo account'
        }
      });
    }

    console.log('✅ Kommo account validated successfully:', cleanDomain);
    res.json({
      success: true,
      message: 'Kommo account is installed and active',
      data: {
        account_domain: cleanDomain,
        is_installed: true,
        is_active: true,
        expires_at: tokens.expires_at
      }
    });

  } catch (error) {
    console.error('Error validating Kommo account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate Kommo account',
      error: error.message
    });
  }
});

module.exports = router;
