const crypto = require('crypto');

// Security configuration for HMIS
const securityConfig = {
  // JWT Configuration
  jwt: {
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: process.env.JWT_ISSUER || 'HMIS-Hospital',
    audience: process.env.JWT_AUDIENCE || 'HMIS-Users'
  },

  // Password Security
  password: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
    maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH) || 128,
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
    requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    maxAge: parseInt(process.env.PASSWORD_MAX_AGE_DAYS) || 90, // days
    historyCount: parseInt(process.env.PASSWORD_HISTORY_COUNT) || 5
  },

  // Two-Factor Authentication
  twoFactor: {
    enabled: process.env.TWO_FACTOR_ENABLED === 'true',
    issuer: process.env.TWO_FACTOR_ISSUER || 'HMIS Hospital',
    algorithm: process.env.TWO_FACTOR_ALGORITHM || 'sha1',
    digits: parseInt(process.env.TWO_FACTOR_DIGITS) || 6,
    period: parseInt(process.env.TWO_FACTOR_PERIOD) || 30,
    window: parseInt(process.env.TWO_FACTOR_WINDOW) || 2,
    backupCodesCount: parseInt(process.env.TWO_FACTOR_BACKUP_CODES) || 10
  },

  // Session Security
  session: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.SESSION_SAME_SITE || 'strict',
    rolling: true,
    renew: true
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    loginMaxAttempts: parseInt(process.env.LOGIN_MAX_ATTEMPTS) || 5,
    passwordResetMaxAttempts: parseInt(process.env.PASSWORD_RESET_MAX_ATTEMPTS) || 3,
    skipSuccessfulRequests: true
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
  },

  // Content Security Policy
  csp: {
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
  },

  // Data Encryption
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    saltLength: 16
  },

  // Audit Logging
  audit: {
    enabled: process.env.AUDIT_ENABLED !== 'false',
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS) || 2555, // 7 years for HIPAA
    logLevel: process.env.AUDIT_LOG_LEVEL || 'INFO',
    sensitiveFields: [
      'password', 'password_hash', 'ssn', 'credit_card', 'bank_account',
      'medical_record_number', 'insurance_id', 'two_factor_secret'
    ]
  },

  // HIPAA Compliance
  hipaa: {
    enabled: process.env.HIPAA_ENABLED === 'true',
    dataRetentionYears: parseInt(process.env.HIPAA_RETENTION_YEARS) || 6,
    encryptionRequired: process.env.HIPAA_ENCRYPTION_REQUIRED === 'true',
    accessLoggingRequired: process.env.HIPAA_ACCESS_LOGGING === 'true',
    minimumAccessLevel: process.env.HIPAA_MIN_ACCESS_LEVEL || 'staff'
  },

  // Security Headers
  headers: {
    hsts: {
      maxAge: parseInt(process.env.HSTS_MAX_AGE) || 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    xssProtection: true,
    noSniff: true,
    frameOptions: 'DENY',
    referrerPolicy: 'strict-origin-when-cross-origin'
  },

  // Database Security
  database: {
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 20,
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
    sslRequired: process.env.NODE_ENV === 'production',
    encryptSensitiveData: process.env.DB_ENCRYPT_SENSITIVE === 'true'
  },

  // File Upload Security
  fileUpload: {
    maxSize: parseInt(process.env.FILE_MAX_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: process.env.FILE_ALLOWED_TYPES ?
      process.env.FILE_ALLOWED_TYPES.split(',') :
      ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    scanForViruses: process.env.FILE_VIRUS_SCAN === 'true',
    quarantinePath: process.env.FILE_QUARANTINE_PATH || '/tmp/quarantine'
  },

  // API Security
  api: {
    versioning: process.env.API_VERSIONING === 'true',
    deprecationWarning: process.env.API_DEPRECATION_WARNING === 'true',
    requestSizeLimit: process.env.API_REQUEST_SIZE_LIMIT || '10mb',
    responseTimeLimit: parseInt(process.env.API_RESPONSE_TIME_LIMIT) || 30000
  },

  // Monitoring and Alerting
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    alertThresholds: {
      failedLogins: parseInt(process.env.ALERT_FAILED_LOGINS) || 5,
      suspiciousActivity: parseInt(process.env.ALERT_SUSPICIOUS_ACTIVITY) || 3,
      dataBreachAttempts: parseInt(process.env.ALERT_DATA_BREACH) || 1
    },
    notificationChannels: process.env.ALERT_CHANNELS ?
      process.env.ALERT_CHANNELS.split(',') : ['email', 'log']
  },

  // Backup Security
  backup: {
    encryptionRequired: process.env.BACKUP_ENCRYPTION === 'true',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    offsiteRequired: process.env.BACKUP_OFFSITE === 'true',
    testRestoreRequired: process.env.BACKUP_TEST_RESTORE === 'true'
  }
};

// Generate encryption key if not provided
const generateEncryptionKey = () => {
  if (!process.env.ENCRYPTION_KEY) {
    const key = crypto.randomBytes(securityConfig.encryption.keyLength).toString('hex');
    console.warn('⚠️  ENCRYPTION_KEY not set. Generated temporary key:', key);
    console.warn('⚠️  Set ENCRYPTION_KEY environment variable for production!');
    return key;
  }
  return process.env.ENCRYPTION_KEY;
};

// Security validation
const validateSecurityConfig = () => {
  const errors = [];

  // Validate password requirements
  if (securityConfig.password.minLength < 8) {
    errors.push('Password minimum length should be at least 8 characters');
  }

  if (securityConfig.password.bcryptRounds < 10) {
    errors.push('Bcrypt rounds should be at least 10 for security');
  }

  // Validate JWT settings
  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET environment variable is required');
  }

  // Validate encryption key
  if (!process.env.ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
    errors.push('ENCRYPTION_KEY environment variable is required in production');
  }

  // Validate database SSL in production
  if (process.env.NODE_ENV === 'production' && !securityConfig.database.sslRequired) {
    errors.push('Database SSL should be required in production');
  }

  if (errors.length > 0) {
    console.error('❌ Security configuration errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    throw new Error('Invalid security configuration');
  }
};

// Initialize security
const initializeSecurity = () => {
  try {
    validateSecurityConfig();

    // Set encryption key
    securityConfig.encryption.key = generateEncryptionKey();

    console.log('✅ Security configuration validated');
    console.log(`🔐 2FA Enabled: ${securityConfig.twoFactor.enabled}`);
    console.log(`📊 Audit Logging: ${securityConfig.audit.enabled}`);
    console.log(`🏥 HIPAA Compliance: ${securityConfig.hipaa.enabled}`);

    return securityConfig;
  } catch (error) {
    console.error('❌ Security initialization failed:', error.message);
    process.exit(1);
  }
};

module.exports = {
  securityConfig,
  validateSecurityConfig,
  initializeSecurity
};
