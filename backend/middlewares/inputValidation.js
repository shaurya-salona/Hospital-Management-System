const validator = require('validator');
const { body, validationResult } = require('express-validator');

/**
 * Enhanced Input Validation Middleware
 * Provides comprehensive input sanitization and validation
 */

// Common validation rules
const commonRules = {
  // Username validation
  username: body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .escape(),

  // Email validation
  email: body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .escape(),

  // Password validation
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .escape(),

  // Phone validation
  phone: body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
    .escape(),

  // Name validation
  firstName: body('first_name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces')
    .escape(),

  lastName: body('last_name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces')
    .escape(),

  // Role validation
  role: body('role')
    .isIn(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'patient'])
    .withMessage('Invalid role specified'),

  // Patient ID validation
  patientId: body('patient_id')
    .trim()
    .matches(/^PAT\d{6}$/)
    .withMessage('Patient ID must be in format PAT000001')
    .escape(),

  // Doctor ID validation
  doctorId: body('doctor_id')
    .trim()
    .matches(/^DOC\d{6}$/)
    .withMessage('Doctor ID must be in format DOC000001')
    .escape(),

  // Date validation
  date: body('appointment_date')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .toDate(),

  // Time validation
  time: body('appointment_time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time in HH:MM format'),

  // Text fields
  reason: body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters')
    .escape(),

  notes: body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
    .escape(),

  // Address validation
  address: body('address')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address must not exceed 255 characters')
    .escape(),

  // Medical fields
  allergies: body('allergies')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Allergies must not exceed 500 characters')
    .escape(),

  medicalHistory: body('medical_history')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Medical history must not exceed 1000 characters')
    .escape(),

  // Inventory fields
  itemName: body('item_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Item name must be between 1 and 100 characters')
    .escape(),

  quantity: body('quantity')
    .isInt({ min: 0, max: 999999 })
    .withMessage('Quantity must be a positive integer'),

  unitPrice: body('unit_price')
    .isFloat({ min: 0, max: 999999.99 })
    .withMessage('Unit price must be a positive number'),

  // Search and filter validation
  searchTerm: body('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters')
    .escape(),

  page: body('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer'),

  limit: body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
};

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }

  next();
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize all string inputs
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = validator.escape(obj[key].trim());
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }

  if (req.query) {
    sanitizeObject(req.query);
  }

  if (req.params) {
    sanitizeObject(req.params);
  }

  next();
};

// XSS protection middleware
const xssProtection = (req, res, next) => {
  // Remove potentially dangerous characters
  const sanitizeForXSS = (str) => {
    if (typeof str !== 'string') return str;

    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeForXSS(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }

  next();
};

// File upload validation
const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  const validateFile = (file) => {
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }
  };

  try {
    if (req.file) {
      validateFile(req.file);
    }

    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files.forEach(validateFile);
      } else {
        Object.values(req.files).forEach(fileArray => {
          if (Array.isArray(fileArray)) {
            fileArray.forEach(validateFile);
          } else {
            validateFile(fileArray);
          }
        });
      }
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Rate limiting for sensitive operations
const rateLimitSensitive = (req, res, next) => {
  const sensitiveOperations = ['login', 'register', 'password-reset'];
  const operation = req.path.split('/').pop();

  if (sensitiveOperations.includes(operation)) {
    // Implement rate limiting logic here
    // This would typically use Redis or memory store
    console.log(`Rate limiting check for operation: ${operation}`);
  }

  next();
};

module.exports = {
  commonRules,
  handleValidationErrors,
  sanitizeInput,
  xssProtection,
  validateFileUpload,
  rateLimitSensitive
};
