const { body, param, query, validationResult } = require('express-validator');

/**
 * Centralized validation middleware
 * Handles validation errors and returns standardized responses
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }

  next();
};

/**
 * Common validation rules
 */
const ValidationRules = {
  // Authentication validation
  auth: {
    login: [
      body('username')
        .isLength({ min: 1 })
        .withMessage('Username is required'),
      
      body('password')
        .isLength({ min: 1 })
        .withMessage('Password is required')
    ]
  },

  // Patient validation
  patient: {
    create: [
      body('firstName')
        .isLength({ min: 1, max: 50 })
        .withMessage('First name is required and must not exceed 50 characters'),
      
      body('lastName')
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name is required and must not exceed 50 characters'),
      
      body('email')
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),
      
      body('phone')
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Phone number must be in international format'),
      
      body('dateOfBirth')
        .isISO8601()
        .withMessage('Date of birth must be a valid date (YYYY-MM-DD)'),
      
      body('gender')
        .isIn(['male', 'female', 'other'])
        .withMessage('Gender must be one of: male, female, other'),
      
      body('bloodType')
        .optional()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Blood type must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-')
    ],
    
    update: [
      body('firstName')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must not exceed 50 characters'),
      
      body('lastName')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must not exceed 50 characters'),
      
      body('email')
        .optional()
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),
      
      body('phone')
        .optional()
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Phone number must be in international format'),
      
      body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Date of birth must be a valid date (YYYY-MM-DD)'),
      
      body('gender')
        .optional()
        .isIn(['male', 'female', 'other'])
        .withMessage('Gender must be one of: male, female, other'),
      
      body('bloodType')
        .optional()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Blood type must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-')
    ]
  },

  // Appointment validation
  appointment: {
    create: [
      body('patientId')
        .isUUID()
        .withMessage('Patient ID must be a valid UUID'),
      
      body('doctorId')
        .isUUID()
        .withMessage('Doctor ID must be a valid UUID'),
      
      body('appointmentDate')
        .isISO8601()
        .withMessage('Appointment date must be a valid date (YYYY-MM-DD)'),
      
      body('appointmentTime')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .withMessage('Appointment time must be in HH:MM:SS format'),
      
      body('reason')
        .isLength({ min: 3, max: 500 })
        .withMessage('Reason is required and must be between 3 and 500 characters')
    ]
  },

  // Common parameter validations
  params: {
    id: [
      param('id')
        .isUUID()
        .withMessage('ID must be a valid UUID')
    ]
  },

  // Common query validations
  query: {
    pagination: [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
    ],
    
    search: [
      query('q')
        .optional()
        .isString()
        .isLength({ min: 2, max: 100 })
        .withMessage('Search query must be between 2 and 100 characters')
        .escape()
    ]
  }
};

// Legacy support
const validateRequest = handleValidationErrors;

/**
 * Input sanitization middleware
 * Sanitizes user input to prevent XSS attacks
 */
const sanitizeInput = (req, res, next) => {
  // Basic input sanitization
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

module.exports = {
  handleValidationErrors,
  ValidationRules,
  validateRequest,
  sanitizeInput
};