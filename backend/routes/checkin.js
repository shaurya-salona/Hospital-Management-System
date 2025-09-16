const express = require('express');
const router = express.Router();
const { authenticateToken, staffOnly } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateCheckIn = [
  body('patientId').isUUID().withMessage('Valid patient ID is required'),
  body('appointmentId').isUUID().withMessage('Valid appointment ID is required'),
  body('checkinTime').isISO8601().withMessage('Valid check-in time is required'),
  body('notes').optional().isString()
];

const validateId = [
  param('id').isUUID().withMessage('Valid check-in ID is required')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['waiting', 'in-progress', 'completed']).withMessage('Invalid status filter')
];

// All routes require authentication and staff access
router.use(authenticateToken);
router.use(staffOnly);

// GET /api/checkin - Get all check-in records
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Mock data for now - replace with actual database queries
    const mockCheckIns = [
      {
        id: '1',
        patient_id: '1',
        patient_name: 'John Doe',
        appointment_id: '1',
        appointment_time: '10:00',
        doctor_name: 'Dr. Smith',
        checkin_time: '2024-01-15T09:45:00Z',
        checkout_time: null,
        status: 'waiting',
        notes: 'Patient arrived early',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        patient_id: '2',
        patient_name: 'Jane Smith',
        appointment_id: '2',
        appointment_time: '11:00',
        doctor_name: 'Dr. Johnson',
        checkin_time: '2024-01-15T10:55:00Z',
        checkout_time: '2024-01-15T11:30:00Z',
        status: 'completed',
        notes: 'Consultation completed successfully',
        created_at: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: mockCheckIns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockCheckIns.length,
        pages: Math.ceil(mockCheckIns.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching check-in records',
      error: error.message
    });
  }
});

// GET /api/checkin/:id - Get check-in record by ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data - replace with actual database query
    const checkIn = {
      id,
      patient_id: '1',
      patient_name: 'John Doe',
      appointment_id: '1',
      appointment_time: '10:00',
      doctor_name: 'Dr. Smith',
      checkin_time: '2024-01-15T09:45:00Z',
      checkout_time: null,
      status: 'waiting',
      notes: 'Patient arrived early',
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: checkIn
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching check-in record',
      error: error.message
    });
  }
});

// POST /api/checkin - Check in patient
router.post('/', validateCheckIn, async (req, res) => {
  try {
    const checkInData = req.body;
    
    // Mock creation - replace with actual database insert
    const newCheckIn = {
      id: Date.now().toString(),
      ...checkInData,
      status: 'waiting',
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: newCheckIn,
      message: 'Patient checked in successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking in patient',
      error: error.message
    });
  }
});

// PUT /api/checkin/:id/checkout - Check out patient
router.put('/:id/checkout', validateId, [
  body('checkoutTime').isISO8601().withMessage('Valid check-out time is required'),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { checkoutTime, notes } = req.body;
    
    // Mock update - replace with actual database update
    const updatedCheckIn = {
      id,
      checkout_time: checkoutTime,
      notes,
      status: 'completed',
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: updatedCheckIn,
      message: 'Patient checked out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking out patient',
      error: error.message
    });
  }
});

// PUT /api/checkin/:id/status - Update check-in status
router.put('/:id/status', validateId, [
  body('status').isIn(['waiting', 'in-progress', 'completed']).withMessage('Invalid status'),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Mock update - replace with actual database update
    const updatedCheckIn = {
      id,
      status,
      notes,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: updatedCheckIn,
      message: 'Check-in status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating check-in status',
      error: error.message
    });
  }
});

module.exports = router;
