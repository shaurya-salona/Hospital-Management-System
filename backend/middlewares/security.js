const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { logger } = require('../config/logger');

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        timestamp: new Date().toISOString()
      });
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }
  });
};

// Security middleware configurations
const securityConfig = {
  // Rate limits
  login: createRateLimit(15 * 60 * 1000, 5, 'Too many login attempts'),
  api: createRateLimit(15 * 60 * 1000, 100, 'Too many API requests'),
  passwordReset: createRateLimit(60 * 60 * 1000, 3, 'Too many password reset attempts'),

  // Password requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLength: 128
  },

  // Session settings
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  },

  // 2FA settings
  twoFactor: {
    issuer: 'HMIS Hospital',
    algorithm: 'sha1',
    digits: 6,
    period: 30
  }
};

// Password validation
const validatePassword = (password) => {
  const errors = [];

  if (password.length < securityConfig.password.minLength) {
    errors.push(`Password must be at least ${securityConfig.password.minLength} characters long`);
  }

  if (password.length > securityConfig.password.maxLength) {
    errors.push(`Password must be no more than ${securityConfig.password.maxLength} characters long`);
  }

  if (securityConfig.password.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (securityConfig.password.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (securityConfig.password.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (securityConfig.password.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// 2FA utilities
const generateTwoFactorSecret = (userEmail) => {
  const secret = speakeasy.generateSecret({
    name: `${securityConfig.twoFactor.issuer} (${userEmail})`,
    issuer: securityConfig.twoFactor.issuer,
    algorithm: securityConfig.twoFactor.algorithm,
    length: 32
  });

  return {
    secret: secret.base32,
    qrCodeUrl: secret.otpauth_url
  };
};

const generateQRCode = async (secretUrl) => {
  try {
    return await QRCode.toDataURL(secretUrl);
  } catch (error) {
    logger.error('Error generating QR code', { error: error.message });
    throw new Error('Failed to generate QR code');
  }
};

const verifyTwoFactorToken = (token, secret) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow 2 time windows for clock drift
  });
};

// Data encryption utilities
const encryptData = (data, key) => {
  try {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    logger.error('Error encrypting data', { error: error.message });
    throw new Error('Failed to encrypt data');
  }
};

const decryptData = (encryptedData, key) => {
  try {
    const algorithm = 'aes-256-gcm';
    const decipher = crypto.createDecipher(algorithm, key);

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Error decrypting data', { error: error.message });
    throw new Error('Failed to decrypt data');
  }
};

// Audit logging
const logSecurityEvent = (event, details) => {
  logger.info('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString(),
    severity: 'SECURITY'
  });
};

// IP whitelist middleware
const ipWhitelist = (allowedIPs) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (allowedIPs.includes(clientIP)) {
      next();
    } else {
      logSecurityEvent('IP_NOT_WHITELISTED', {
        ip: clientIP,
        endpoint: req.originalUrl,
        userAgent: req.get('User-Agent')
      });

      res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
    }
  };
};

// Content Security Policy
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
};

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: cspConfig,
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// SQL injection prevention
const sanitizeSQL = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/[';\-]/g, '') // Remove SQL injection characters
    .replace(/union/gi, '') // Remove UNION statements
    .replace(/select/gi, '') // Remove SELECT statements
    .replace(/insert/gi, '') // Remove INSERT statements
    .replace(/update/gi, '') // Remove UPDATE statements
    .replace(/delete/gi, '') // Remove DELETE statements
    .replace(/drop/gi, '') // Remove DROP statements
    .trim();
};

module.exports = {
  securityConfig,
  validatePassword,
  generateTwoFactorSecret,
  generateQRCode,
  verifyTwoFactorToken,
  encryptData,
  decryptData,
  logSecurityEvent,
  ipWhitelist,
  securityHeaders,
  sanitizeInput,
  sanitizeSQL,
  createRateLimit
};
