const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Rate limiting configuration
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs: windowMs || 15 * 60 * 1000, // 15 minutes default
    max: max || 100, // limit each IP to 100 requests per windowMs
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// API rate limiting
const apiLimiter = createRateLimit(
  process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  'API rate limit exceeded. Please try again later.'
);

// Auth rate limiting (stricter)
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests per 15 minutes
  'Too many authentication attempts. Please try again later.'
);

// Kommo API rate limiting
const kommoApiLimiter = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 requests per minute
  'Kommo API rate limit exceeded. Please try again later.'
);

// Security middleware setup
const setupSecurity = (app) => {
  // Basic security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "https://js.stripe.com"],
        connectSrc: ["'self'", "https://api.stripe.com", "https://*.kommo.com"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Compression
  app.use(compression());

  // Trust proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);

  // Apply rate limiting
  app.use('/api/auth', authLimiter);
  app.use('/api/report', kommoApiLimiter);
  app.use('/api', apiLimiter);

  // Additional security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
};

module.exports = {
  setupSecurity,
  apiLimiter,
  authLimiter,
  kommoApiLimiter
};
