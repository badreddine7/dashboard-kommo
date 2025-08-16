const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { dbHelpers } = require('../database-pg');
const { getTrialEndDate } = require('../config/subscription-tiers');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

class AuthService {
  // Generate JWT token
  generateToken(payload, expiresIn = JWT_EXPIRES_IN) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Hash password
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Register new user
  async register(userData) {
    const { email, password, name, kommoAccount } = userData;

    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Check if user already exists
    const existingUser = await dbHelpers.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const userId = uuidv4();
    const user = await dbHelpers.createUser({
      id: userId,
      email,
      password_hash: passwordHash,
      name: name || '',
      kommo_account: kommoAccount || ''
    });

    // Create enterprise trial subscription
    const subscriptionId = uuidv4();
    const trialEndsAt = getTrialEndDate('ENTERPRISE');
    
    await dbHelpers.createSubscription({
      id: subscriptionId,
      user_id: userId,
      plan_type: 'ENTERPRISE',
      status: 'TRIAL',
      trial_ends_at: trialEndsAt
    });

    // Generate tokens
    const accessToken = this.generateToken({ 
      userId: user.id, 
      email: user.email,
      type: 'access'
    });
    
    const refreshToken = this.generateToken({ 
      userId: user.id, 
      email: user.email,
      type: 'refresh'
    }, REFRESH_TOKEN_EXPIRES_IN);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        kommo_account: user.kommo_account,
        email_verified: user.email_verified,
        stripe_customer_id: user.stripe_customer_id,
        created_at: user.created_at
      },
      tokens: {
        accessToken,
        refreshToken
      },
      subscription: {
        plan_type: 'ENTERPRISE',
        status: 'TRIAL',
        trial_ends_at: trialEndsAt
      }
    };
  }

  // Login user
  async login(email, password) {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user
    const user = await dbHelpers.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Get user subscription
    const subscription = await dbHelpers.getUserSubscription(user.id);

    // Generate tokens
    const accessToken = this.generateToken({ 
      userId: user.id, 
      email: user.email,
      type: 'access'
    });
    
    const refreshToken = this.generateToken({ 
      userId: user.id, 
      email: user.email,
      type: 'refresh'
    }, REFRESH_TOKEN_EXPIRES_IN);

    // Log usage
    await dbHelpers.logUsage(user.id, 'user_login');

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        kommo_account: user.kommo_account,
        email_verified: user.email_verified,
        stripe_customer_id: user.stripe_customer_id,
        created_at: user.created_at
      },
      tokens: {
        accessToken,
        refreshToken
      },
      subscription: subscription ? {
        id: subscription.id,
        plan_type: subscription.plan_type,
        status: subscription.status,
        trial_ends_at: subscription.trial_ends_at,
        current_period_end: subscription.current_period_end,
        stripe_subscription_id: subscription.stripe_subscription_id
      } : null
    };
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const decoded = this.verifyToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Get user
      const user = await dbHelpers.getUserById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const newAccessToken = this.generateToken({ 
        userId: user.id, 
        email: user.email,
        type: 'access'
      });

      return {
        accessToken: newAccessToken
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Get user profile
  async getProfile(userId) {
    const user = await dbHelpers.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const subscription = await dbHelpers.getUserSubscription(userId);

    return {
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
        stripe_subscription_id: subscription.stripe_subscription_id
      } : null
    };
  }

  // Update user profile
  async updateProfile(userId, updates) {
    const allowedUpdates = ['name', 'kommo_account'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid updates provided');
    }

    // Update user in database
    await dbHelpers.updateUser(userId, filteredUpdates);
    
    // Return updated profile
    return await this.getProfile(userId);
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await dbHelpers.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password in database
    await dbHelpers.updateUser(userId, { password_hash: newPasswordHash });

    console.log('✅ Password updated successfully for user:', userId);
    return { success: true, message: 'Password updated successfully' };
  }
}

module.exports = new AuthService();
