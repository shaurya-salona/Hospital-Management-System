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
  body('reason').optional().isString().withMessage('Reason must be a string'),
  body('durationMinutes').optional().isInt({ min: 15, max: 240 }).withMessage('Duration must be between 15 and 240 minutes')
];

const validateAppointmentUpdate = [
  body('appointmentDate').optional().isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid appointment time is required'),
  body('status').optional().isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Valid status is required'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string')
];

const validateId = [
  param('id').isUUID().withMessage('Valid appointment ID is required')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Valid status is required'),
  query('date').optional().isISO8601().withMessage('Valid date is required')
];

// All routes require authentication and staff access
router.use(authenticateToken);
router.use(staffOnly);

// GET /api/appointments - Get all appointments with pagination and filters
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, date } = req.query;
    const offset = (page - 1) * limit;
    const db = require('../config/database-manager');

    // Build query with filters
    let query = `
      SELECT a.*,
             p.patient_id, pu.first_name as patient_first_name, pu.last_name as patient_last_name,
             s.employee_id, su.first_name as doctor_first_name, su.last_name as doctor_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN staff s ON a.doctor_id = s.id
      JOIN users su ON s.user_id = su.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (date) {
      paramCount++;
      query += ` AND a.appointment_date = $${paramCount}`;
      queryParams.push(date);
    }

    // Add pagination
    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    queryParams.push(parseInt(limit));

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push(offset);

    // Get count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM appointments a
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (status) {
      countParamCount++;
      countQuery += ` AND a.status = $${countParamCount}`;
      countParams.push(status);
    }

    if (date) {
      countParamCount++;
      countQuery += ` AND a.appointment_date = $${countParamCount}`;
      countParams.push(date);
    }

    const [appointmentsResult, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery, countParams)
    ]);

    const appointments = appointmentsResult.rows.map(appointment => ({
      id: appointment.id,
      patient_id: appointment.patient_id,
      patient_name: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
      doctor_id: appointment.doctor_id,
      doctor_name: `Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}`,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      duration_minutes: appointment.duration_minutes,
      status: appointment.status,
      reason: appointment.reason,
      notes: appointment.notes,
      created_at: appointment.created_at
    }));

    const totalCount = parseInt(countResult.rows[0]?.total || 0);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
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
    const db = require('../config/database-manager');

    const query = `
      SELECT a.*,
             p.patient_id, pu.first_name as patient_first_name, pu.last_name as patient_last_name,
             s.employee_id, su.first_name as doctor_first_name, su.last_name as doctor_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN staff s ON a.doctor_id = s.id
      JOIN users su ON s.user_id = su.id
      WHERE a.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const appointment = result.rows[0];
    const appointmentData = {
      id: appointment.id,
      patient_id: appointment.patient_id,
      patient_name: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
      doctor_id: appointment.doctor_id,
      doctor_name: `Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}`,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      duration_minutes: appointment.duration_minutes,
      status: appointment.status,
      reason: appointment.reason,
      notes: appointment.notes,
      created_at: appointment.created_at
    };

    res.json({
      success: true,
      data: appointmentData
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
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
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      reason,
      durationMinutes = 30,
      notes
    } = req.body;

    const db = require('../config/database-manager');

    // Check if patient exists
    const patientCheck = await db.query('SELECT id FROM patients WHERE id = $1', [patientId]);
    if (patientCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if doctor exists
    const doctorCheck = await db.query('SELECT id FROM staff WHERE id = $1', [doctorId]);
    if (doctorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check for conflicting appointments
    const conflictCheck = await db.query(`
      SELECT id FROM appointments
      WHERE doctor_id = $1
      AND appointment_date = $2
      AND appointment_time = $3
      AND status NOT IN ('cancelled', 'completed')
    `, [doctorId, appointmentDate, appointmentTime]);

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Doctor has a conflicting appointment at this time'
      });
    }

    // Create appointment
    const appointmentQuery = `
      INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, appointment_time,
        duration_minutes, status, reason, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const appointmentValues = [
      patientId, doctorId, appointmentDate, appointmentTime,
      durationMinutes, 'scheduled', reason, notes
    ];

    const appointmentResult = await db.query(appointmentQuery, appointmentValues);
    const newAppointment = appointmentResult.rows[0];

    res.status(201).json({
      success: true,
      data: newAppointment,
      message: 'Appointment created successfully'
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: error.message
    });
  }
});

// PUT /api/appointments/:id - Update appointment
router.put('/:id', validateId, validateAppointmentUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const db = require('../config/database-manager');

    // Check if appointment exists
    const appointmentCheck = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (updateData.appointmentDate) {
      paramCount++;
      updates.push(`appointment_date = $${paramCount}`);
      values.push(updateData.appointmentDate);
    }
    if (updateData.appointmentTime) {
      paramCount++;
      updates.push(`appointment_time = $${paramCount}`);
      values.push(updateData.appointmentTime);
    }
    if (updateData.status) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      values.push(updateData.status);
    }
    if (updateData.reason) {
      paramCount++;
      updates.push(`reason = $${paramCount}`);
      values.push(updateData.reason);
    }
    if (updateData.notes) {
      paramCount++;
      updates.push(`notes = $${paramCount}`);
      values.push(updateData.notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    paramCount++;
    values.push(id);

    const query = `
      UPDATE appointments
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Appointment updated successfully'
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
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
    const db = require('../config/database-manager');

    // Check if appointment exists
    const appointmentCheck = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Cancel appointment (soft delete by changing status)
    await db.query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelled', id]
    );

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling appointment',
      error: error.message
    });
  }
});

// GET /api/appointments/doctor/:doctorId - Get appointments for a specific doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    const db = require('../config/database-manager');

    let query = `
      SELECT a.*,
             p.patient_id, pu.first_name as patient_first_name, pu.last_name as patient_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      WHERE a.doctor_id = $1
    `;
    const queryParams = [doctorId];

    if (date) {
      query += ` AND a.appointment_date = $2`;
      queryParams.push(date);
    }

    query += ` ORDER BY a.appointment_date, a.appointment_time`;

    const result = await db.query(query, queryParams);

    const appointments = result.rows.map(appointment => ({
      id: appointment.id,
      patient_id: appointment.patient_id,
      patient_name: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      duration_minutes: appointment.duration_minutes,
      status: appointment.status,
      reason: appointment.reason
    }));

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor appointments',
      error: error.message
    });
  }
});

module.exports = router;
