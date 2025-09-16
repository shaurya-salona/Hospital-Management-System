const express = require('express');
const router = express.Router();
const { authenticateToken, staffOnly } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateAppointment = [
  body('patientId').isUUID().withMessage('Valid patient ID is required'),
  body('doctorId').isUUID().withMessage('Valid doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid appointment time is required'),
  body('reason').optional().isString(),
  body('duration').optional().isInt({ min: 15, max: 240 }).withMessage('Duration must be between 15 and 240 minutes')
];

const validateId = [
  param('id').isUUID().withMessage('Valid appointment ID is required')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('date').optional().isISO8601().withMessage('Valid date filter is required'),
  query('status').optional().isIn(['scheduled', 'confirmed', 'completed', 'cancelled']).withMessage('Invalid status filter'),
  query('doctorId').optional().isUUID().withMessage('Valid doctor ID filter is required')
];

// All routes require authentication and staff access
router.use(authenticateToken);
router.use(staffOnly);

// GET /api/appointments - Get all appointments with pagination and filters
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, date, status, doctorId } = req.query;
    const offset = (page - 1) * limit;

    // Mock data for now - replace with actual database queries
    const mockAppointments = [
      {
        id: '1',
        patient_id: '1',
        doctor_id: '1',
        appointment_date: '2024-01-15',
        appointment_time: '10:00',
        reason: 'General Consultation',
        status: 'scheduled',
        duration: 30,
        patient_name: 'John Doe',
        doctor_name: 'Dr. Smith',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        patient_id: '2',
        doctor_id: '2',
        appointment_date: '2024-01-15',
        appointment_time: '11:00',
        reason: 'Follow-up',
        status: 'confirmed',
        duration: 30,
        patient_name: 'Jane Smith',
        doctor_name: 'Dr. Johnson',
        created_at: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: mockAppointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockAppointments.length,
        pages: Math.ceil(mockAppointments.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

// GET /api/appointments/:id - Get appointment by ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data - replace with actual database query
    const appointment = {
      id,
      patient_id: '1',
      doctor_id: '1',
      appointment_date: '2024-01-15',
      appointment_time: '10:00',
      reason: 'General Consultation',
      status: 'scheduled',
      duration: 30,
      patient_name: 'John Doe',
      doctor_name: 'Dr. Smith',
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment',
      error: error.message
    });
  }
});

// POST /api/appointments - Create new appointment
router.post('/', validateAppointment, async (req, res) => {
  try {
    const appointmentData = req.body;
    
    // Mock creation - replace with actual database insert
    const newAppointment = {
      id: Date.now().toString(),
      ...appointmentData,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: newAppointment,
      message: 'Appointment created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: error.message
    });
  }
});

// PUT /api/appointments/:id - Update appointment
router.put('/:id', validateId, validateAppointment, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Mock update - replace with actual database update
    const updatedAppointment = {
      id,
      ...updateData,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: updatedAppointment,
      message: 'Appointment updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating appointment',
      error: error.message
    });
  }
});

// DELETE /api/appointments/:id - Cancel appointment
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock deletion - replace with actual database update (soft delete)
    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling appointment',
      error: error.message
    });
  }
});

module.exports = router;
