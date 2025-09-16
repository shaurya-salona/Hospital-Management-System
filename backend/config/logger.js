const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
require('fs').mkdirSync(logsDir, { recursive: true });

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += '\n' + JSON.stringify(meta, null, 2);
    }
    
    return log;
  })
);

// Create Winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'hmis-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error logs - separate file for errors only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    }),

    // Combined logs - all levels
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Access logs - HTTP requests
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // Audit logs - security and important actions
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf((info) => {
          // Only log audit-related messages
          if (info.audit || info.security || info.authentication) {
            return JSON.stringify(info);
          }
          return false;
        })
      )
    })
  ],

  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Custom logging methods for different contexts
const contextLogger = {
  // HTTP request logging
  http: (req, res, responseTime) => {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id,
      userRole: req.user?.role
    };

    logger.log('http', 'HTTP Request', logData);
  },

  // Authentication logging
  auth: (action, data) => {
    logger.warn(`Authentication: ${action}`, {
      audit: true,
      authentication: true,
      action,
      ...data,
      timestamp: new Date().toISOString()
    });
  },

  // Security logging
  security: (event, data) => {
    logger.warn(`Security Event: ${event}`, {
      audit: true,
      security: true,
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
  },

  // Database operations
  database: (operation, data) => {
    logger.info(`Database: ${operation}`, {
      database: true,
      operation,
      ...data
    });
  },

  // API operations
  api: (endpoint, method, data) => {
    logger.info(`API: ${method} ${endpoint}`, {
      api: true,
      endpoint,
      method,
      ...data
    });
  },

  // Business logic operations
  business: (operation, data) => {
    logger.info(`Business: ${operation}`, {
      business: true,
      operation,
      ...data
    });
  },

  // Performance monitoring
  performance: (operation, duration, data) => {
    const level = duration > 1000 ? 'warn' : 'info';
    logger.log(level, `Performance: ${operation} took ${duration}ms`, {
      performance: true,
      operation,
      duration,
      ...data
    });
  }
};

// Error logging with context
const logError = (error, context = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    ...context,
    timestamp: new Date().toISOString()
  };

  logger.error('Application Error', errorData);
};

// Success logging for important operations
const logSuccess = (operation, data = {}) => {
  logger.info(`Success: ${operation}`, {
    success: true,
    operation,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Warning logging for potential issues
const logWarning = (warning, data = {}) => {
  logger.warn(`Warning: ${warning}`, {
    warning: true,
    message: warning,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Create a stream for Morgan HTTP logging
const stream = {
  write: (message) => {
    // Remove trailing newline and log as HTTP level
    logger.log('http', message.trim());
  }
};

// Export logger and utilities
module.exports = {
  logger,
  contextLogger,
  logError,
  logSuccess,
  logWarning,
  stream
};

