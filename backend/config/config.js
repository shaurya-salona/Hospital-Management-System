const path = require('path');
const fs = require('fs');

/**
 * Environment-based configuration loader
 * Loads configuration based on NODE_ENV
 */

// Load environment variables from appropriate .env file
const loadEnvFile = () => {
  const env = process.env.NODE_ENV || 'development';
  const envFiles = [
    `.env.${env}.local`,
    `.env.${env}`,
    '.env.local',
    '.env'
  ];

  // Also check for files without dot prefix (for deployment compatibility)
  envFiles.push(
    `env.${env}.local`,
    `env.${env}`,
    'env.local',
    'env'
  );

  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, '..', envFile);
    
    if (fs.existsSync(envPath)) {
      console.log(`Loading environment from: ${envFile}`);
      require('dotenv').config({ path: envPath });
      break;
    }
  }
};

// Load environment variables
loadEnvFile();

/**
 * Configuration object
 */
const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  
  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'hmis_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true',
    max: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 10,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 2000,
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRE || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  },

  // Security Configuration
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
    corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    rateLimitSkipSuccessful: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true',
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT, 10) || 86400000 // 24 hours
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxSize: parseInt(process.env.LOG_MAX_SIZE, 10) || 5242880, // 5MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES, 10) || 5,
    datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
    compress: process.env.LOG_COMPRESS === 'true'
  },

  // Email Configuration
  email: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    from: process.env.SMTP_FROM || 'noreply@hospital.com'
  },

  // File Upload Configuration
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 5242880, // 5MB
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES ? process.env.UPLOAD_ALLOWED_TYPES.split(',') : ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    path: process.env.UPLOAD_PATH || path.join(__dirname, '../uploads')
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    ttl: parseInt(process.env.REDIS_TTL, 10) || 3600
  },

  // Monitoring Configuration
  monitoring: {
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || 30000,
    performanceMonitoring: process.env.PERFORMANCE_MONITORING === 'true',
    metricsEnabled: process.env.METRICS_ENABLED === 'true'
  },

  // External API Configuration
  external: {
    timeout: parseInt(process.env.EXTERNAL_API_TIMEOUT, 10) || 10000,
    retries: parseInt(process.env.EXTERNAL_API_RETRIES, 10) || 3
  },

  // Backup Configuration
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS, 10) || 30,
    path: process.env.BACKUP_PATH || path.join(__dirname, '../backups')
  },

  // SSL Configuration
  ssl: {
    enabled: process.env.SSL_ENABLED === 'true',
    certPath: process.env.SSL_CERT_PATH,
    keyPath: process.env.SSL_KEY_PATH
  },

  // Cache Configuration
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL, 10) || 300, // 5 minutes
    maxSize: parseInt(process.env.CACHE_MAX_SIZE, 10) || 100
  },

  // Feature Flags
  features: {
    apiDocs: process.env.ENABLE_API_DOCS === 'true',
    metricsEndpoint: process.env.ENABLE_METRICS_ENDPOINT === 'true',
    auditLogs: process.env.ENABLE_AUDIT_LOGS !== 'false', // Default true
    realTimeNotifications: process.env.ENABLE_REAL_TIME_NOTIFICATIONS !== 'false' // Default true
  },

  // Third-party Integrations
  integrations: {
    pharmacy: {
      apiUrl: process.env.INTEGRATION_PHARMACY_API_URL,
      apiKey: process.env.INTEGRATION_PHARMACY_API_KEY
    },
    lab: {
      apiUrl: process.env.INTEGRATION_LAB_API_URL,
      apiKey: process.env.INTEGRATION_LAB_API_KEY
    }
  },

  // Notification Configuration
  notifications: {
    enabled: process.env.NOTIFICATION_ENABLED !== 'false',
    channels: process.env.NOTIFICATION_CHANNELS ? process.env.NOTIFICATION_CHANNELS.split(',') : ['email'],
    sms: {
      provider: process.env.SMS_PROVIDER || 'twilio',
      apiKey: process.env.SMS_API_KEY,
      from: process.env.SMS_FROM
    }
  },

  // Analytics Configuration
  analytics: {
    enabled: process.env.ANALYTICS_ENABLED === 'true',
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS, 10) || 365
  },

  // Security Headers Configuration
  helmet: {
    enabled: process.env.HELMET_ENABLED !== 'false',
    hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE, 10) || 31536000,
    contentSecurityPolicy: process.env.CONTENT_SECURITY_POLICY || "default-src 'self'"
  }
};

/**
 * Environment-specific overrides
 */
if (config.env === 'production') {
  // Production-specific configurations
  config.logging.level = 'warn';
  config.features.apiDocs = false;
  config.features.metricsEndpoint = false;
  config.security.corsOrigin = config.security.corsOrigin.filter(origin => !origin.includes('localhost'));
}

if (config.env === 'development') {
  // Development-specific configurations
  config.logging.level = 'debug';
  config.features.apiDocs = true;
  config.features.metricsEndpoint = true;
  config.security.corsOrigin.push('http://localhost:3000', 'http://localhost:3001');
}

if (config.env === 'test') {
  // Test-specific configurations
  config.database.database = process.env.TEST_DB_NAME || 'hmis_test_db';
  config.logging.level = 'error';
  config.jwt.expiresIn = '1h';
  config.features.apiDocs = false;
  config.features.metricsEndpoint = false;
  config.notifications.enabled = false;
}

/**
 * Configuration validation
 */
const validateConfig = () => {
  const required = [
    'database.host',
    'database.user',
    'database.password',
    'jwt.secret'
  ];

  const missing = [];

  const checkPath = (obj, path) => {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current[key] === undefined || current[key] === null || current[key] === '') {
        return false;
      }
      current = current[key];
    }
    return true;
  };

  for (const path of required) {
    if (!checkPath(config, path)) {
      missing.push(path);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }

  // Validate JWT secret length in production
  if (config.env === 'production' && config.jwt.secret.length < 32) {
    throw new Error('JWT secret must be at least 32 characters long in production');
  }

  // Validate CORS origins in production
  if (config.env === 'production') {
    const hasLocalhost = config.security.corsOrigin.some(origin => origin.includes('localhost'));
    if (hasLocalhost) {
      console.warn('Warning: localhost origins found in production CORS configuration');
    }
  }
};

// Validate configuration on load
try {
  validateConfig();
  console.log(`Configuration loaded successfully for ${config.env} environment`);
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  process.exit(1);
}

/**
 * Get configuration for specific service
 */
const getServiceConfig = (service) => {
  const serviceConfigs = {
    database: config.database,
    jwt: config.jwt,
    security: config.security,
    logging: config.logging,
    email: config.email,
    upload: config.upload,
    redis: config.redis,
    monitoring: config.monitoring,
    external: config.external,
    backup: config.backup,
    ssl: config.ssl,
    cache: config.cache,
    features: config.features,
    integrations: config.integrations,
    notifications: config.notifications,
    analytics: config.analytics,
    helmet: config.helmet
  };

  return serviceConfigs[service] || config;
};

module.exports = {
  config,
  getServiceConfig,
  validateConfig
};

