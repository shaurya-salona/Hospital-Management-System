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

        // Use centralized database manager
        const db = require('../config/database-manager');

        // Build query with filters
        let query = `
      SELECT u.*, s.employee_id, s.department, s.specialization, s.hire_date
      FROM users u
      LEFT JOIN staff s ON u.id = s.user_id
      WHERE 1=1
    `;
        const queryParams = [];
        let paramCount = 0;

        if (role) {
            paramCount++;
            query += ` AND u.role = $${paramCount}`;
            queryParams.push(role);
        }

        if (isActive !== undefined) {
            paramCount++;
            query += ` AND u.is_active = $${paramCount}`;
            queryParams.push(isActive === 'true');
        }

        // Add pagination
        query += ` ORDER BY u.created_at DESC`;

        paramCount++;
        query += ` LIMIT $${paramCount}`;
        queryParams.push(parseInt(limit));

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        queryParams.push(offset);

        // Get count for pagination
        let countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      WHERE 1=1
    `;
        const countParams = [];
        let countParamCount = 0;

        if (role) {
            countParamCount++;
            countQuery += ` AND u.role = $${countParamCount}`;
            countParams.push(role);
        }

        if (isActive !== undefined) {
            countParamCount++;
            countQuery += ` AND u.is_active = $${countParamCount}`;
            countParams.push(isActive === 'true');
        }

        const [usersResult, countResult] = await Promise.all([
            db.query(query, queryParams),
            db.query(countQuery, countParams)
        ]);

        const users = usersResult.rows.map(user => {
            const { password_hash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        const totalCount = parseInt(countResult.rows[0]?.total || 0);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                pages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
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
        const { validationResult } = require('express-validator');
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { firstName, lastName, email, password, role, phone, specialization, department } = req.body;
        const db = require('../config/database-manager');
        const bcrypt = require('bcryptjs');

        // Check if user already exists
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const userQuery = `
      INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, username, email, role, first_name, last_name, phone, is_active, created_at
    `;

        const userValues = [email, email, passwordHash, role, firstName, lastName, phone, true];
        const userResult = await db.query(userQuery, userValues);
        const newUser = userResult.rows[0];

        // If user is staff (not patient), create staff record
        if (role !== 'patient' && (specialization || department)) {
            const staffQuery = `
        INSERT INTO staff (user_id, employee_id, department, specialization, hire_date)
        VALUES ($1, $2, $3, $4, CURRENT_DATE)
      `;

            const employeeId = `EMP${String(Date.now()).slice(-6)}`;
            const staffValues = [newUser.id, employeeId, department, specialization];
            await db.query(staffQuery, staffValues);
        }

        // Remove sensitive data
        const { password_hash, ...userWithoutPassword } = newUser;

        res.status(201).json({
            success: true,
            data: userWithoutPassword,
            message: 'User created successfully'
        });
    } catch (error) {
        console.error('Error creating user:', error);
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
