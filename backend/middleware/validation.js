const { z } = require('zod');

// Middleware to validate request body against a Zod schema
const validateBody = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.errors.map(err => err.message).join(', '),
        details: error.errors
      });
    }
    next(error); // Pass other errors to the next error handler
  }
};

// Middleware to validate request query against a Zod schema
const validateQuery = (schema) => (req, res, next) => {
  try {
    schema.parse(req.query);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.errors.map(err => err.message).join(', '),
        details: error.errors
      });
    }
    next(error);
  }
};

// Middleware to validate request parameters against a Zod schema
const validateParams = (schema) => (req, res, next) => {
  try {
    schema.parse(req.params);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.errors.map(err => err.message).join(', '),
        details: error.errors
      });
    }
    next(error);
  }
};

// Middleware to validate req.user.id (from JWT)
const validateUserId = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User ID not found in token.'
    });
  }
  try {
    const userIdSchema = z.string().uuid('User ID must be a valid UUID');
    userIdSchema.parse(req.user.id);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid user ID in token',
        details: error.errors
      });
    }
    next(error);
  }
};

// Utility function for UUID validation (used in auth middleware)
const validateUuid = (uuid) => {
  const uuidSchema = z.string().uuid('Must be a valid UUID');
  return uuidSchema.safeParse(uuid);
};

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  validateUserId,
  validateUuid
};
