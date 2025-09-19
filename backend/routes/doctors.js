const express = require('express');
const router = express.Router();
const { authenticateToken, staffOnly } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateDoctorAvailability = [
    body('doctorId').isUUID().withMessage('Valid doctor ID is required'),
    body('status').isIn(['available', 'busy', 'off-duty']).withMessage('Invalid status'),
    body('currentPatients').optional().isInt({ min: 0 }).withMessage('Current patients must be a non-negative integer'),
    body('nextAvailable').optional().isISO8601().withMessage('Valid next available time is required')
];

const validateId = [
    param('id').isUUID().withMessage('Valid doctor ID is required')
];

const validatePagination = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['available', 'busy', 'off-duty']).withMessage('Invalid status filter'),
    query('specialization').optional().isString()
];

// All routes require authentication and staff access
router.use(authenticateToken);
router.use(staffOnly);

// GET /api/doctors/availability - Get doctor availability
router.get('/availability', validatePagination, async (req, res) => {
    try {
        const { page = 1, limit = 10, status, specialization } = req.query;
        const offset = (page - 1) * limit;

        // Use centralized database manager
        const db = require('../config/database-manager');

        let query = `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        s.employee_id,
        s.department,
        s.specialization,
        s.license_number,
        s.hire_date,
        s.salary,
        COALESCE(da.status, 'available') as status,
        COALESCE(da.current_patients, 0) as current_patients,
        da.next_available,
        da.room_number
      FROM users u
      LEFT JOIN staff s ON u.id = s.user_id
      LEFT JOIN doctor_availability da ON u.id = da.doctor_id
      WHERE u.role = 'doctor' AND u.is_active = true
    `;

        const values = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            query += ` AND COALESCE(da.status, 'available') = $${paramCount}`;
            values.push(status);
        }

        if (specialization) {
            paramCount++;
            query += ` AND s.specialization ILIKE $${paramCount}`;
            values.push(`%${specialization}%`);
        }

        query += ` ORDER BY u.first_name, u.last_name LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        values.push(parseInt(limit), offset);

        const result = await db.query(query, values);

        // Get total count
        let countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN staff s ON u.id = s.user_id
      LEFT JOIN doctor_availability da ON u.id = da.doctor_id
      WHERE u.role = 'doctor' AND u.is_active = true
    `;

        const countValues = [];
        let countParamCount = 0;

        if (status) {
            countParamCount++;
            countQuery += ` AND COALESCE(da.status, 'available') = $${countParamCount}`;
            countValues.push(status);
        }

        if (specialization) {
            countParamCount++;
            countQuery += ` AND s.specialization ILIKE $${countParamCount}`;
            countValues.push(`%${specialization}%`);
        }

        const countResult = await db.query(countQuery, countValues);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get doctor availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching doctor availability',
            error: error.message
        });
    }
});

// GET /api/doctors/availability/:id - Get specific doctor availability
router.get('/availability/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;

        // Mock data - replace with actual database query
        const doctor = {
            id,
            name: 'Dr. John Smith',
            specialization: 'General Medicine',
            status: 'available',
            current_patients: 2,
            next_available: '2024-01-15T10:30:00Z',
            room_number: '101',
            phone: '+1234567890',
            email: 'dr.smith@hospital.com',
            schedule: [
                {
                    day: 'Monday',
                    start_time: '09:00',
                    end_time: '17:00',
                    break_start: '12:00',
                    break_end: '13:00'
                },
                {
                    day: 'Tuesday',
                    start_time: '09:00',
                    end_time: '17:00',
                    break_start: '12:00',
                    break_end: '13:00'
                }
            ]
        };

        res.json({
            success: true,
            data: doctor
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching doctor availability',
            error: error.message
        });
    }
});

// PUT /api/doctors/availability/:id - Update doctor availability
router.put('/availability/:id', validateId, validateDoctorAvailability, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Mock update - replace with actual database update
        const updatedDoctor = {
            id,
            ...updateData,
            updated_at: new Date().toISOString()
        };

        res.json({
            success: true,
            data: updatedDoctor,
            message: 'Doctor availability updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating doctor availability',
            error: error.message
        });
    }
});

// GET /api/doctors/schedule/:id - Get doctor's schedule
router.get('/schedule/:id', validateId, [
    query('date').optional().isISO8601().withMessage('Valid date is required')
], async (req, res) => {
    try {
        const { id } = req.params;
        const { date } = req.query;

        // Mock schedule data - replace with actual database query
        const schedule = {
            doctor_id: id,
            date: date || new Date().toISOString().split('T')[0],
            appointments: [
                {
                    id: '1',
                    patient_name: 'John Doe',
                    time: '09:00',
                    duration: 30,
                    status: 'scheduled',
                    reason: 'General Consultation'
                },
                {
                    id: '2',
                    patient_name: 'Jane Smith',
                    time: '10:00',
                    duration: 30,
                    status: 'scheduled',
                    reason: 'Follow-up'
                },
                {
                    id: '3',
                    patient_name: 'Mike Johnson',
                    time: '11:00',
                    duration: 30,
                    status: 'scheduled',
                    reason: 'New Patient'
                }
            ],
            availability: {
                start_time: '09:00',
                end_time: '17:00',
                break_start: '12:00',
                break_end: '13:00'
            }
        };

        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching doctor schedule',
            error: error.message
        });
    }
});

module.exports = router;
