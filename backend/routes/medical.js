const express = require('express');
const router = express.Router();
const { authenticateToken, staffOnly, doctorOrAdmin } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateMedicalRecord = [
  body('patientId').isUUID().withMessage('Valid patient ID is required'),
  body('doctorId').isUUID().withMessage('Valid doctor ID is required'),
  body('visitDate').isISO8601().withMessage('Valid visit date is required'),
  body('chiefComplaint').isString().withMessage('Chief complaint is required'),
  body('diagnosis').optional().isString().withMessage('Diagnosis must be a string'),
  body('treatment').optional().isString().withMessage('Treatment must be a string'),
  body('prescription').optional().isString().withMessage('Prescription must be a string'),
  body('vitalSigns').optional().isObject().withMessage('Vital signs must be an object')
];

const validatePrescription = [
  body('patientId').isUUID().withMessage('Valid patient ID is required'),
  body('doctorId').isUUID().withMessage('Valid doctor ID is required'),
  body('medications').isArray().withMessage('Medications must be an array'),
  body('medications.*.name').isString().withMessage('Medication name is required'),
  body('medications.*.dosage').isString().withMessage('Medication dosage is required'),
  body('medications.*.frequency').isString().withMessage('Medication frequency is required'),
  body('medications.*.duration').isString().withMessage('Medication duration is required')
];

const validateId = [
  param('id').isUUID().withMessage('Valid medical record ID is required')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('patientId').optional().isUUID().withMessage('Valid patient ID is required'),
  query('doctorId').optional().isUUID().withMessage('Valid doctor ID is required')
];

// All routes require authentication
router.use(authenticateToken);

// GET /api/medical - Get all medical records with pagination and filters
router.get('/', validatePagination, staffOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId, doctorId } = req.query;
    const offset = (page - 1) * limit;
    const db = require('../config/database-manager');

    // Build query with filters
    let query = `
      SELECT mr.*,
             p.patient_id, pu.first_name as patient_first_name, pu.last_name as patient_last_name,
             s.employee_id, su.first_name as doctor_first_name, su.last_name as doctor_last_name
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN staff s ON mr.doctor_id = s.id
      JOIN users su ON s.user_id = su.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 0;

    if (patientId) {
      paramCount++;
      query += ` AND mr.patient_id = $${paramCount}`;
      queryParams.push(patientId);
    }

    if (doctorId) {
      paramCount++;
      query += ` AND mr.doctor_id = $${paramCount}`;
      queryParams.push(doctorId);
    }

    // Add pagination
    query += ` ORDER BY mr.visit_date DESC`;

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    queryParams.push(parseInt(limit));

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push(offset);

    // Get count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM medical_records mr
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (patientId) {
      countParamCount++;
      countQuery += ` AND mr.patient_id = $${countParamCount}`;
      countParams.push(patientId);
    }

    if (doctorId) {
      countParamCount++;
      countQuery += ` AND mr.doctor_id = $${countParamCount}`;
      countParams.push(doctorId);
    }

    const [recordsResult, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery, countParams)
    ]);

    const records = recordsResult.rows.map(record => ({
      id: record.id,
      patient_id: record.patient_id,
      patient_name: `${record.patient_first_name} ${record.patient_last_name}`,
      doctor_id: record.doctor_id,
      doctor_name: `Dr. ${record.doctor_first_name} ${record.doctor_last_name}`,
      visit_date: record.visit_date,
      chief_complaint: record.chief_complaint,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      prescription: record.prescription,
      vital_signs: record.vital_signs,
      created_at: record.created_at
    }));

    const totalCount = parseInt(countResult.rows[0]?.total || 0);

    res.json({
      success: true,
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medical records',
      error: error.message
    });
  }
});

// GET /api/medical/:id - Get medical record by ID
router.get('/:id', validateId, staffOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database-manager');

    const query = `
      SELECT mr.*,
             p.patient_id, pu.first_name as patient_first_name, pu.last_name as patient_last_name,
             s.employee_id, su.first_name as doctor_first_name, su.last_name as doctor_last_name
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN staff s ON mr.doctor_id = s.id
      JOIN users su ON s.user_id = su.id
      WHERE mr.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    const record = result.rows[0];
    const recordData = {
      id: record.id,
      patient_id: record.patient_id,
      patient_name: `${record.patient_first_name} ${record.patient_last_name}`,
      doctor_id: record.doctor_id,
      doctor_name: `Dr. ${record.doctor_first_name} ${record.doctor_last_name}`,
      visit_date: record.visit_date,
      chief_complaint: record.chief_complaint,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      prescription: record.prescription,
      vital_signs: record.vital_signs,
      created_at: record.created_at
    };

    res.json({
      success: true,
      data: recordData
    });
  } catch (error) {
    console.error('Error fetching medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medical record',
      error: error.message
    });
  }
});

// POST /api/medical - Create new medical record
router.post('/', validateMedicalRecord, doctorOrAdmin, async (req, res) => {
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
      visitDate,
      chiefComplaint,
      diagnosis,
      treatment,
      prescription,
      vitalSigns
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

    // Create medical record
    const recordQuery = `
      INSERT INTO medical_records (
        patient_id, doctor_id, visit_date, chief_complaint,
        diagnosis, treatment, prescription, vital_signs
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const recordValues = [
      patientId,
      doctorId,
      visitDate,
      chiefComplaint,
      diagnosis,
      treatment,
      prescription,
      vitalSigns ? JSON.stringify(vitalSigns) : null
    ];

    const recordResult = await db.query(recordQuery, recordValues);
    const newRecord = recordResult.rows[0];

    res.status(201).json({
      success: true,
      data: newRecord,
      message: 'Medical record created successfully'
    });
  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating medical record',
      error: error.message
    });
  }
});

// PUT /api/medical/:id - Update medical record
router.put('/:id', validateId, doctorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      visitDate,
      chiefComplaint,
      diagnosis,
      treatment,
      prescription,
      vitalSigns
    } = req.body;
    const db = require('../config/database-manager');

    // Check if record exists
    const recordCheck = await db.query('SELECT * FROM medical_records WHERE id = $1', [id]);
    if (recordCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (visitDate) {
      paramCount++;
      updates.push(`visit_date = $${paramCount}`);
      values.push(visitDate);
    }
    if (chiefComplaint) {
      paramCount++;
      updates.push(`chief_complaint = $${paramCount}`);
      values.push(chiefComplaint);
    }
    if (diagnosis) {
      paramCount++;
      updates.push(`diagnosis = $${paramCount}`);
      values.push(diagnosis);
    }
    if (treatment) {
      paramCount++;
      updates.push(`treatment = $${paramCount}`);
      values.push(treatment);
    }
    if (prescription) {
      paramCount++;
      updates.push(`prescription = $${paramCount}`);
      values.push(prescription);
    }
    if (vitalSigns) {
      paramCount++;
      updates.push(`vital_signs = $${paramCount}`);
      values.push(JSON.stringify(vitalSigns));
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
      UPDATE medical_records
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Medical record updated successfully'
    });
  } catch (error) {
    console.error('Error updating medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating medical record',
      error: error.message
    });
  }
});

// POST /api/medical/prescriptions - Create prescription
router.post('/prescriptions', validatePrescription, doctorOrAdmin, async (req, res) => {
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

    const { patientId, doctorId, medications, notes } = req.body;
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

    // Create prescription
    const prescriptionQuery = `
      INSERT INTO prescriptions (patient_id, doctor_id, medications, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const prescriptionValues = [
      patientId,
      doctorId,
      JSON.stringify(medications),
      notes
    ];

    const prescriptionResult = await db.query(prescriptionQuery, prescriptionValues);
    const newPrescription = prescriptionResult.rows[0];

    res.status(201).json({
      success: true,
      data: newPrescription,
      message: 'Prescription created successfully'
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating prescription',
      error: error.message
    });
  }
});

// GET /api/medical/patient/:patientId - Get medical records for a specific patient
router.get('/patient/:patientId', staffOnly, async (req, res) => {
  try {
    const { patientId } = req.params;
    const db = require('../config/database-manager');

    const query = `
      SELECT mr.*,
             s.employee_id, su.first_name as doctor_first_name, su.last_name as doctor_last_name
      FROM medical_records mr
      JOIN staff s ON mr.doctor_id = s.id
      JOIN users su ON s.user_id = su.id
      WHERE mr.patient_id = $1
      ORDER BY mr.visit_date DESC
    `;

    const result = await db.query(query, [patientId]);

    const records = result.rows.map(record => ({
      id: record.id,
      doctor_name: `Dr. ${record.doctor_first_name} ${record.doctor_last_name}`,
      visit_date: record.visit_date,
      chief_complaint: record.chief_complaint,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      prescription: record.prescription,
      vital_signs: record.vital_signs,
      created_at: record.created_at
    }));

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Error fetching patient medical records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient medical records',
      error: error.message
    });
  }
});

// GET /api/medical/prescriptions/patient/:patientId - Get prescriptions for a specific patient
router.get('/prescriptions/patient/:patientId', staffOnly, async (req, res) => {
  try {
    const { patientId } = req.params;
    const db = require('../config/database-manager');

    const query = `
      SELECT p.*,
             s.employee_id, su.first_name as doctor_first_name, su.last_name as doctor_last_name
      FROM prescriptions p
      JOIN staff s ON p.doctor_id = s.id
      JOIN users su ON s.user_id = su.id
      WHERE p.patient_id = $1
      ORDER BY p.created_at DESC
    `;

    const result = await db.query(query, [patientId]);

    const prescriptions = result.rows.map(prescription => ({
      id: prescription.id,
      doctor_name: `Dr. ${prescription.doctor_first_name} ${prescription.doctor_last_name}`,
      medications: prescription.medications,
      notes: prescription.notes,
      created_at: prescription.created_at
    }));

    res.json({
      success: true,
      data: prescriptions
    });
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient prescriptions',
      error: error.message
    });
  }
});

// DELETE /api/medical/:id - Delete medical record (admin only)
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database-manager');

    // Check if record exists
    const recordCheck = await db.query('SELECT * FROM medical_records WHERE id = $1', [id]);
    if (recordCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Delete record
    await db.query('DELETE FROM medical_records WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Medical record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting medical record',
      error: error.message
    });
  }
});

module.exports = router;
