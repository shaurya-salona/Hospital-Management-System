const express = require('express');
const router = express.Router();
const { authenticateToken, staffOnly } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validatePatient = [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
    body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
    body('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Valid blood type is required')
];

const validatePatientUpdate = [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
    body('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Valid blood type is required')
];

const validateId = [
    param('id').isUUID().withMessage('Valid patient ID is required')
];

const validatePagination = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string')
];

// All routes require authentication and staff access
router.use(authenticateToken);
router.use(staffOnly);

// GET /api/patients - Get all patients with pagination and filters
router.get('/', validatePagination, async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const offset = (page - 1) * limit;
        const db = require('../config/database-manager');

        // Build query with search
        let query = `
      SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.is_active
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
        const queryParams = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR p.patient_id ILIKE $${paramCount})`;
            queryParams.push(`%${search}%`);
        }

        // Add pagination
        query += ` ORDER BY p.created_at DESC`;

        paramCount++;
        query += ` LIMIT $${paramCount}`;
        queryParams.push(parseInt(limit));

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        queryParams.push(offset);

        // Get count for pagination
        let countQuery = `
      SELECT COUNT(*) as total
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
        const countParams = [];
        let countParamCount = 0;

        if (search) {
            countParamCount++;
            countQuery += ` AND (u.first_name ILIKE $${countParamCount} OR u.last_name ILIKE $${countParamCount} OR u.email ILIKE $${countParamCount} OR p.patient_id ILIKE $${countParamCount})`;
            countParams.push(`%${search}%`);
        }

        const [patientsResult, countResult] = await Promise.all([
            db.query(query, queryParams),
            db.query(countQuery, countParams)
        ]);

        const patients = patientsResult.rows.map(patient => ({
            id: patient.id,
            patient_id: patient.patient_id,
            first_name: patient.first_name,
            last_name: patient.last_name,
            email: patient.email,
            phone: patient.phone,
            date_of_birth: patient.date_of_birth,
            gender: patient.gender,
            blood_type: patient.blood_type,
            address: patient.address,
            emergency_contact_name: patient.emergency_contact_name,
            emergency_contact_phone: patient.emergency_contact_phone,
            insurance_provider: patient.insurance_provider,
            insurance_number: patient.insurance_number,
            allergies: patient.allergies,
            medical_history: patient.medical_history,
            is_active: patient.is_active,
            created_at: patient.created_at
        }));

        const totalCount = parseInt(countResult.rows[0]?.total || 0);

        res.json({
            success: true,
            data: patients,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                pages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching patients',
            error: error.message
        });
    }
});

// GET /api/patients/:id - Get patient by ID
router.get('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const db = require('../config/database-manager');

        const query = `
      SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.is_active
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        const patient = result.rows[0];
        const patientData = {
            id: patient.id,
            patient_id: patient.patient_id,
            first_name: patient.first_name,
            last_name: patient.last_name,
            email: patient.email,
            phone: patient.phone,
            date_of_birth: patient.date_of_birth,
            gender: patient.gender,
            blood_type: patient.blood_type,
            address: patient.address,
            emergency_contact_name: patient.emergency_contact_name,
            emergency_contact_phone: patient.emergency_contact_phone,
            insurance_provider: patient.insurance_provider,
            insurance_number: patient.insurance_number,
            allergies: patient.allergies,
            medical_history: patient.medical_history,
            is_active: patient.is_active,
            created_at: patient.created_at
        };

        res.json({
            success: true,
            data: patientData
        });
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching patient',
            error: error.message
        });
    }
});

// POST /api/patients - Create new patient
router.post('/', validatePatient, async (req, res) => {
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

        const {
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            gender,
            address,
            emergencyContactName,
            emergencyContactPhone,
            insuranceProvider,
            insuranceNumber,
            bloodType,
            allergies,
            medicalHistory
        } = req.body;

        const db = require('../config/database-manager');
        const bcrypt = require('bcryptjs');

        // Check if user already exists
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Generate patient ID
        const patientIdResult = await db.query('SELECT COUNT(*) as count FROM patients');
        const patientCount = parseInt(patientIdResult.rows[0].count) + 1;
        const patientId = `PAT${String(patientCount).padStart(6, '0')}`;

        // Hash password (default password for patients)
        const defaultPassword = 'patient123';
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

        // Start transaction
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // Create user
            const userQuery = `
        INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;

            const userValues = [email, email, passwordHash, 'patient', firstName, lastName, phone, true];
            const userResult = await client.query(userQuery, userValues);
            const userId = userResult.rows[0].id;

            // Create patient
            const patientQuery = `
        INSERT INTO patients (
          user_id, patient_id, date_of_birth, gender, address,
          emergency_contact_name, emergency_contact_phone,
          insurance_provider, insurance_number, blood_type,
          allergies, medical_history
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

            const patientValues = [
                userId, patientId, dateOfBirth, gender, address,
                emergencyContactName, emergencyContactPhone,
                insuranceProvider, insuranceNumber, bloodType,
                allergies, medicalHistory
            ];

            const patientResult = await client.query(patientQuery, patientValues);

            await client.query('COMMIT');

            const newPatient = {
                id: patientResult.rows[0].id,
                patient_id: patientResult.rows[0].patient_id,
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone,
                date_of_birth: dateOfBirth,
                gender: gender,
                blood_type: bloodType,
                address: address,
                emergency_contact_name: emergencyContactName,
                emergency_contact_phone: emergencyContactPhone,
                insurance_provider: insuranceProvider,
                insurance_number: insuranceNumber,
                allergies: allergies,
                medical_history: medicalHistory,
                is_active: true,
                created_at: patientResult.rows[0].created_at
            };

            res.status(201).json({
                success: true,
                data: newPatient,
                message: 'Patient created successfully'
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating patient:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating patient',
            error: error.message
        });
    }
});

// PUT /api/patients/:id - Update patient
router.put('/:id', validateId, validatePatientUpdate, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const db = require('../config/database-manager');

        // Get patient with user info
        const patientQuery = `
      SELECT p.*, u.id as user_id
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `;

        const patientResult = await db.query(patientQuery, [id]);
        if (patientResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        const patient = patientResult.rows[0];
        const userId = patient.user_id;

        // Start transaction
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // Update user data
            const userUpdates = [];
            const userValues = [];
            let paramCount = 0;

            if (updateData.firstName) {
                paramCount++;
                userUpdates.push(`first_name = $${paramCount}`);
                userValues.push(updateData.firstName);
            }
            if (updateData.lastName) {
                paramCount++;
                userUpdates.push(`last_name = $${paramCount}`);
                userValues.push(updateData.lastName);
            }
            if (updateData.email) {
                paramCount++;
                userUpdates.push(`email = $${paramCount}`);
                userValues.push(updateData.email);
            }
            if (updateData.phone) {
                paramCount++;
                userUpdates.push(`phone = $${paramCount}`);
                userValues.push(updateData.phone);
            }

            if (userUpdates.length > 0) {
                paramCount++;
                userValues.push(userId);
                const userQuery = `UPDATE users SET ${userUpdates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`;
                await client.query(userQuery, userValues);
            }

            // Update patient data
            const patientUpdates = [];
            const patientValues = [];
            paramCount = 0;

            if (updateData.bloodType) {
                paramCount++;
                patientUpdates.push(`blood_type = $${paramCount}`);
                patientValues.push(updateData.bloodType);
            }
            if (updateData.address) {
                paramCount++;
                patientUpdates.push(`address = $${paramCount}`);
                patientValues.push(updateData.address);
            }
            if (updateData.allergies) {
                paramCount++;
                patientUpdates.push(`allergies = $${paramCount}`);
                patientValues.push(updateData.allergies);
            }
            if (updateData.medicalHistory) {
                paramCount++;
                patientUpdates.push(`medical_history = $${paramCount}`);
                patientValues.push(updateData.medicalHistory);
            }

            if (patientUpdates.length > 0) {
                paramCount++;
                patientValues.push(id);
                const patientQuery = `UPDATE patients SET ${patientUpdates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`;
                await client.query(patientQuery, patientValues);
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Patient updated successfully'
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating patient',
            error: error.message
        });
    }
});

// DELETE /api/patients/:id - Delete patient (soft delete)
router.delete('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const db = require('../config/database-manager');

        // Get patient user_id
        const patientQuery = 'SELECT user_id FROM patients WHERE id = $1';
        const patientResult = await db.query(patientQuery, [id]);

        if (patientResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        const userId = patientResult.rows[0].user_id;

        // Soft delete user
        await db.query('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [userId]);

        res.json({
            success: true,
            message: 'Patient deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting patient',
            error: error.message
        });
    }
});

module.exports = router;
