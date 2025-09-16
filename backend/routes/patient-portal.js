const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { body, param } = require('express-validator');

// Try to use PostgreSQL, fallback to demo database
let query;
try {
  const db = require('../config/database');
  query = db.query;
} catch (error) {
  const demoDb = require('../config/demo-database');
  query = demoDb.query;
}

// All routes require authentication
router.use(authenticateToken);

// Validation middleware
const validateId = [
  param('id').isUUID().withMessage('Valid ID is required')
];

// GET /api/patient-portal/dashboard - Get patient dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get patient's basic info
    const patientQuery = 'SELECT * FROM patients WHERE user_id = $1';
    const patientResult = await query(patientQuery, [userId]);
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const patient = patientResult.rows[0];
    
    // Get upcoming appointments
    const appointmentsQuery = `
      SELECT a.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialization
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = $1 AND a.appointment_date >= CURRENT_DATE
      ORDER BY a.appointment_date, a.appointment_time
      LIMIT 5
    `;
    const appointmentsResult = await query(appointmentsQuery, [patient.id]);
    
    // Get active prescriptions
    const prescriptionsQuery = `
      SELECT p.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name
      FROM prescriptions p
      LEFT JOIN doctors d ON p.doctor_id = d.id
      WHERE p.patient_id = $1 AND p.status = 'active'
      ORDER BY p.created_at DESC
      LIMIT 5
    `;
    const prescriptionsResult = await query(prescriptionsQuery, [patient.id]);
    
    // Get recent medical records
    const recordsQuery = `
      SELECT mr.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name
      FROM medical_records mr
      LEFT JOIN doctors d ON mr.doctor_id = d.id
      WHERE mr.patient_id = $1
      ORDER BY mr.created_at DESC
      LIMIT 5
    `;
    const recordsResult = await query(recordsQuery, [patient.id]);
    
    // Get billing summary
    const billingQuery = `
      SELECT 
        COUNT(*) as total_bills,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount
      FROM billing
      WHERE patient_id = $1
    `;
    const billingResult = await query(billingQuery, [patient.id]);
    
    res.json({
      success: true,
      data: {
        patient: {
          id: patient.id,
          firstName: patient.first_name,
          lastName: patient.last_name,
          email: patient.email,
          phone: patient.phone,
          dateOfBirth: patient.date_of_birth,
          bloodType: patient.blood_type
        },
        upcomingAppointments: appointmentsResult.rows,
        activePrescriptions: prescriptionsResult.rows,
        recentRecords: recordsResult.rows,
        billingSummary: billingResult.rows[0]
      }
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data'
    });
  }
});

// GET /api/patient-portal/appointments - Get patient's appointments
router.get('/appointments', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, limit = 20, offset = 0 } = req.query;
    
    // Get patient ID
    const patientQuery = 'SELECT id FROM patients WHERE user_id = $1';
    const patientResult = await query(patientQuery, [userId]);
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const patientId = patientResult.rows[0].id;
    
    let appointmentsQuery = `
      SELECT a.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialization
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = $1
    `;
    
    const queryParams = [patientId];
    
    if (status) {
      appointmentsQuery += ' AND a.status = $2';
      queryParams.push(status);
    }
    
    appointmentsQuery += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const appointmentsResult = await query(appointmentsQuery, queryParams);
    
    res.json({
      success: true,
      data: appointmentsResult.rows
    });
    
  } catch (error) {
    console.error('Appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load appointments'
    });
  }
});

// POST /api/patient-portal/appointments/:id/cancel - Cancel appointment
router.post('/appointments/:id/cancel', validateId, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user.userId;
    
    // Verify patient owns this appointment
    const verifyQuery = `
      SELECT a.* FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.id = $1 AND p.user_id = $2
    `;
    const verifyResult = await query(verifyQuery, [appointmentId, userId]);
    
    if (verifyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or access denied'
      });
    }
    
    // Cancel the appointment
    const cancelQuery = 'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    await query(cancelQuery, ['cancelled', appointmentId]);
    
    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
    
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment'
    });
  }
});

// GET /api/patient-portal/prescriptions - Get patient's prescriptions
router.get('/prescriptions', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status = 'active', limit = 20, offset = 0 } = req.query;
    
    // Get patient ID
    const patientQuery = 'SELECT id FROM patients WHERE user_id = $1';
    const patientResult = await query(patientQuery, [userId]);
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const patientId = patientResult.rows[0].id;
    
    const prescriptionsQuery = `
      SELECT p.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name
      FROM prescriptions p
      LEFT JOIN doctors d ON p.doctor_id = d.id
      WHERE p.patient_id = $1 AND p.status = $2
      ORDER BY p.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    const prescriptionsResult = await query(prescriptionsQuery, [patientId, status, parseInt(limit), parseInt(offset)]);
    
    res.json({
      success: true,
      data: prescriptionsResult.rows
    });
    
  } catch (error) {
    console.error('Prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load prescriptions'
    });
  }
});

// POST /api/patient-portal/prescriptions/:id/refill - Request prescription refill
router.post('/prescriptions/:id/refill', validateId, async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    const userId = req.user.userId;
    
    // Verify patient owns this prescription
    const verifyQuery = `
      SELECT p.* FROM prescriptions p
      JOIN patients pt ON p.patient_id = pt.id
      WHERE p.id = $1 AND pt.user_id = $2
    `;
    const verifyResult = await query(verifyQuery, [prescriptionId, userId]);
    
    if (verifyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found or access denied'
      });
    }
    
    // Create refill request
    const refillQuery = `
      INSERT INTO prescription_refills (prescription_id, patient_id, status, requested_at)
      VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP)
    `;
    await query(refillQuery, [prescriptionId, verifyResult.rows[0].patient_id]);
    
    res.json({
      success: true,
      message: 'Refill request submitted successfully'
    });
    
  } catch (error) {
    console.error('Refill request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit refill request'
    });
  }
});

// GET /api/patient-portal/medical-records - Get patient's medical records
router.get('/medical-records', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;
    
    // Get patient ID
    const patientQuery = 'SELECT id FROM patients WHERE user_id = $1';
    const patientResult = await query(patientQuery, [userId]);
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const patientId = patientResult.rows[0].id;
    
    const recordsQuery = `
      SELECT mr.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name
      FROM medical_records mr
      LEFT JOIN doctors d ON mr.doctor_id = d.id
      WHERE mr.patient_id = $1
      ORDER BY mr.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const recordsResult = await query(recordsQuery, [patientId, parseInt(limit), parseInt(offset)]);
    
    res.json({
      success: true,
      data: recordsResult.rows
    });
    
  } catch (error) {
    console.error('Medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load medical records'
    });
  }
});

// GET /api/patient-portal/billing - Get patient's billing records
router.get('/billing', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, limit = 20, offset = 0 } = req.query;
    
    // Get patient ID
    const patientQuery = 'SELECT id FROM patients WHERE user_id = $1';
    const patientResult = await query(patientQuery, [userId]);
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const patientId = patientResult.rows[0].id;
    
    let billingQuery = `
      SELECT b.*, a.appointment_date, d.first_name as doctor_first_name, d.last_name as doctor_last_name
      FROM billing b
      LEFT JOIN appointments a ON b.appointment_id = a.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE b.patient_id = $1
    `;
    
    const queryParams = [patientId];
    
    if (status) {
      billingQuery += ' AND b.status = $2';
      queryParams.push(status);
    }
    
    billingQuery += ' ORDER BY b.created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const billingResult = await query(billingQuery, queryParams);
    
    res.json({
      success: true,
      data: billingResult.rows
    });
    
  } catch (error) {
    console.error('Billing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load billing records'
    });
  }
});

// GET /api/patient-portal/messages - Get patient's messages
router.get('/messages', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;
    
    const messagesQuery = `
      SELECT m.*, u.first_name as sender_first_name, u.last_name as sender_last_name, u.role as sender_role
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.recipient_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const messagesResult = await query(messagesQuery, [userId, parseInt(limit), parseInt(offset)]);
    
    res.json({
      success: true,
      data: messagesResult.rows
    });
    
  } catch (error) {
    console.error('Messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load messages'
    });
  }
});

module.exports = router;
