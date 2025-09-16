const { logger, logError, contextLogger } = require('../config/logger');

/**
 * Custom Error Classes
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError) {
    super(message, 500);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

/**
 * Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log the error with context
  const errorContext = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    userRole: req.user?.role,
    body: req.method !== 'GET' ? req.body : undefined,
    params: req.params,
    query: req.query
  };

  // Log different error types with appropriate levels
  if (error.statusCode >= 500) {
    logError(error, errorContext);
  } else if (error.statusCode >= 400) {
    logger.warn('Client Error', {
      message: error.message,
      statusCode: error.statusCode,
      ...errorContext
    });
  }

  // Handle specific error types
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID format';
    error = new ValidationError(message);
  }

  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ConflictError(message);
  }

  if (err.name === 'ValidationError') {
    const message = 'Invalid input data';
    const errors = Object.values(err.errors).map(val => val.message);
    error = new ValidationError(message, errors);
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again';
    error = new AuthenticationError(message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired. Please log in again';
    error = new AuthenticationError(message);
  }

  // PostgreSQL specific errors
  if (err.code === '23505') { // Unique violation
    const message = 'A record with this information already exists';
    error = new ConflictError(message);
  }

  if (err.code === '23503') { // Foreign key violation
    const message = 'Cannot perform this operation due to related records';
    error = new ValidationError(message);
  }

  if (err.code === '23502') { // Not null violation
    const message = 'Required field is missing';
    error = new ValidationError(message);
  }

  // Rate limiting errors
  if (err.status === 429) {
    contextLogger.security('Rate limit exceeded', errorContext);
    error = new AppError('Too many requests. Please try again later.', 429);
  }

  // Default to 500 server error
  if (!error.statusCode) {
    error = new AppError('Something went wrong', 500, false);
  }

  // Security logging for authentication/authorization errors
  if (error.statusCode === 401 || error.statusCode === 403) {
    contextLogger.security(`${error.statusCode} - ${error.message}`, errorContext);
  }

  res.status(error.statusCode).json({
    success: false,
    error: {
      message: error.message,
      ...(error.errors && { errors: error.errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};

/**
 * 404 Handler - for routes that don't exist
 */
const notFoundHandler = (req, res, next) => {
  const message = `Route ${req.originalUrl} not found`;
  const error = new NotFoundError(message);
  
  logger.warn('Route Not Found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  next(error);
};

/**
 * Async Error Catcher - wraps async functions to catch errors
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Database Error Handler
 */
const handleDatabaseError = (error, operation) => {
  logError(error, { operation, database: true });
  
  if (error.code === 'ECONNREFUSED') {
    return new DatabaseError('Database connection failed');
  }
  
  if (error.code === '28P01') {
    return new DatabaseError('Database authentication failed');
  }
  
  if (error.code === '3D000') {
    return new DatabaseError('Database does not exist');
  }
  
  return new DatabaseError('Database operation failed', error);
};

/**
 * Validation Error Handler
 */
const handleValidationError = (errors) => {
  const formattedErrors = errors.map(error => ({
    field: error.param,
    message: error.msg,
    value: error.value
  }));
  
  return new ValidationError('Validation failed', formattedErrors);
};

/**
 * Process Error Handlers
 */
const setupProcessErrorHandlers = () => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
      error: err.message,
      stack: err.stack
    });
    
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', {
      error: err.message,
      stack: err.stack,
      promise: promise
    });
    
    process.exit(1);
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    process.exit(0);
  });
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  
  // Middleware
  errorHandler,
  notFoundHandler,
  catchAsync,
  
  // Handlers
  handleDatabaseError,
  handleValidationError,
  
  // Setup
  setupProcessErrorHandlers
};

