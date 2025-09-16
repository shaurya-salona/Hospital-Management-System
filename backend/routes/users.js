const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateUser = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'doctor', 'receptionist', 'nurse', 'pharmacist']).withMessage('Invalid role'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('specialization').optional().isString(),
  body('department').optional().isString()
];

const validateUserUpdate = [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['admin', 'doctor', 'receptionist', 'nurse', 'pharmacist']).withMessage('Invalid role'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('specialization').optional().isString(),
  body('department').optional().isString(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

const validateId = [
  param('id').isUUID().withMessage('Valid user ID is required')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['admin', 'doctor', 'receptionist', 'nurse', 'pharmacist']).withMessage('Invalid role filter'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

// All routes require authentication and admin access
router.use(authenticateToken);
router.use(adminOnly);

// GET /api/users - Get all users with pagination and filters
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, isActive } = req.query;
    const offset = (page - 1) * limit;

    // Mock data for now - replace with actual database queries
    const mockUsers = [
      {
        id: '1',
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@hospital.com',
        role: 'admin',
        is_active: true,
        phone: '+1234567890',
        specialization: null,
        department: 'Administration',
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        first_name: 'John',
        last_name: 'Smith',
        email: 'dr.smith@hospital.com',
        role: 'doctor',
        is_active: true,
        phone: '+1234567891',
        specialization: 'General Medicine',
        department: 'Internal Medicine',
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        first_name: 'Jane',
        last_name: 'Johnson',
        email: 'dr.johnson@hospital.com',
        role: 'doctor',
        is_active: true,
        phone: '+1234567892',
        specialization: 'Pediatrics',
        department: 'Pediatrics',
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: '4',
        first_name: 'Mike',
        last_name: 'Brown',
        email: 'mike.brown@hospital.com',
        role: 'receptionist',
        is_active: true,
        phone: '+1234567893',
        specialization: null,
        department: 'Reception',
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: '5',
        first_name: 'Sarah',
        last_name: 'Davis',
        email: 'sarah.davis@hospital.com',
        role: 'pharmacist',
        is_active: true,
        phone: '+1234567894',
        specialization: 'Clinical Pharmacy',
        department: 'Pharmacy',
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: mockUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockUsers.length,
        pages: Math.ceil(mockUsers.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data - replace with actual database query
    const user = {
      id,
      first_name: 'John',
      last_name: 'Smith',
      email: 'dr.smith@hospital.com',
      role: 'doctor',
      is_active: true,
      phone: '+1234567891',
      specialization: 'General Medicine',
      department: 'Internal Medicine',
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// POST /api/users - Create new user
router.post('/', validateUser, async (req, res) => {
  try {
    const userData = req.body;
    
    // Mock creation - replace with actual database insert
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      is_active: true,
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', validateId, validateUserUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Mock update - replace with actual database update
    const updatedUser = {
      id,
      ...updateData,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// DELETE /api/users/:id - Delete user (soft delete)
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock deletion - replace with actual database update (soft delete)
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

module.exports = router;
