const express = require('express');
const router = express.Router();
const { authenticateToken, staffOnly } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateICUPatient = [
  body('patientId').isUUID().withMessage('Valid patient ID is required'),
  body('admissionReason').notEmpty().withMessage('Admission reason is required'),
  body('severity').isIn(['critical', 'serious', 'stable']).withMessage('Invalid severity level'),
  body('roomNumber').optional().isString(),
  body('bedNumber').optional().isString()
];

const validateVitalSigns = [
  body('patientId').isUUID().withMessage('Valid patient ID is required'),
  body('heartRate').isInt({ min: 30, max: 200 }).withMessage('Valid heart rate is required'),
  body('bloodPressure').matches(/^\d{2,3}\/\d{2,3}$/).withMessage('Valid blood pressure format required (e.g., 120/80)'),
  body('temperature').isFloat({ min: 30, max: 45 }).withMessage('Valid temperature is required'),
  body('oxygenSaturation').isInt({ min: 70, max: 100 }).withMessage('Valid oxygen saturation is required'),
  body('respiratoryRate').isInt({ min: 8, max: 40 }).withMessage('Valid respiratory rate is required')
];

const validateId = [
  param('id').isUUID().withMessage('Valid ID is required')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['critical', 'serious', 'stable', 'discharged']).withMessage('Invalid status filter')
];

// All routes require authentication and staff access
router.use(authenticateToken);
router.use(staffOnly);

// GET /api/icu/patients - Get all ICU patients
router.get('/patients', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Mock data for now - replace with actual database queries
    const mockICUPatients = [
      {
        id: '1',
        patient_id: '1',
        patient_name: 'John Doe',
        admission_reason: 'Post-surgical monitoring',
        severity: 'critical',
        room_number: 'ICU-101',
        bed_number: 'A1',
        admission_date: '2024-01-15T08:00:00Z',
        status: 'critical',
        vital_signs: {
          heart_rate: 95,
          blood_pressure: '120/80',
          temperature: 37.2,
          oxygen_saturation: 98,
          respiratory_rate: 16
        },
        last_updated: new Date().toISOString()
      },
      {
        id: '2',
        patient_id: '2',
        patient_name: 'Jane Smith',
        admission_reason: 'Respiratory distress',
        severity: 'serious',
        room_number: 'ICU-102',
        bed_number: 'B1',
        admission_date: '2024-01-14T14:30:00Z',
        status: 'serious',
        vital_signs: {
          heart_rate: 110,
          blood_pressure: '140/90',
          temperature: 38.5,
          oxygen_saturation: 92,
          respiratory_rate: 24
        },
        last_updated: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: mockICUPatients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockICUPatients.length,
        pages: Math.ceil(mockICUPatients.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU patients',
      error: error.message
    });
  }
});

// GET /api/icu/patients/:id - Get ICU patient by ID
router.get('/patients/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data - replace with actual database query
    const patient = {
      id,
      patient_id: '1',
      patient_name: 'John Doe',
      admission_reason: 'Post-surgical monitoring',
      severity: 'critical',
      room_number: 'ICU-101',
      bed_number: 'A1',
      admission_date: '2024-01-15T08:00:00Z',
      status: 'critical',
      vital_signs: {
        heart_rate: 95,
        blood_pressure: '120/80',
        temperature: 37.2,
        oxygen_saturation: 98,
        respiratory_rate: 16
      },
      last_updated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU patient',
      error: error.message
    });
  }
});

// POST /api/icu/patients - Admit patient to ICU
router.post('/patients', validateICUPatient, async (req, res) => {
  try {
    const patientData = req.body;
    
    // Mock creation - replace with actual database insert
    const newICUPatient = {
      id: Date.now().toString(),
      ...patientData,
      admission_date: new Date().toISOString(),
      status: patientData.severity,
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: newICUPatient,
      message: 'Patient admitted to ICU successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error admitting patient to ICU',
      error: error.message
    });
  }
});

// POST /api/icu/vital-signs - Record vital signs
router.post('/vital-signs', validateVitalSigns, async (req, res) => {
  try {
    const vitalSignsData = req.body;
    
    // Mock creation - replace with actual database insert
    const newVitalSigns = {
      id: Date.now().toString(),
      ...vitalSignsData,
      recorded_at: new Date().toISOString(),
      recorded_by: req.user.id
    };

    // Emit real-time update via WebSocket
    if (global.io) {
      global.io.to('role-doctor').emit('vital-signs-update', {
        patientId: vitalSignsData.patientId,
        vitalSigns: vitalSignsData,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      data: newVitalSigns,
      message: 'Vital signs recorded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording vital signs',
      error: error.message
    });
  }
});

// GET /api/icu/vital-signs/:patientId - Get patient's vital signs history
router.get('/vital-signs/:patientId', [
  param('patientId').isUUID().withMessage('Valid patient ID is required'),
  query('hours').optional().isInt({ min: 1, max: 168 }).withMessage('Hours must be between 1 and 168')
], async (req, res) => {
  try {
    const { patientId } = req.params;
    const { hours = 24 } = req.query;

    // Mock vital signs history - replace with actual database query
    const vitalSignsHistory = [
      {
        id: '1',
        patient_id: patientId,
        heart_rate: 95,
        blood_pressure: '120/80',
        temperature: 37.2,
        oxygen_saturation: 98,
        respiratory_rate: 16,
        recorded_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        patient_id: patientId,
        heart_rate: 98,
        blood_pressure: '118/78',
        temperature: 37.0,
        oxygen_saturation: 99,
        respiratory_rate: 15,
        recorded_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }
    ];

    res.json({
      success: true,
      data: vitalSignsHistory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vital signs history',
      error: error.message
    });
  }
});

// PUT /api/icu/patients/:id/status - Update patient status
router.put('/patients/:id/status', validateId, [
  body('status').isIn(['critical', 'serious', 'stable', 'discharged']).withMessage('Invalid status'),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Mock update - replace with actual database update
    const updatedPatient = {
      id,
      status,
      notes,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: updatedPatient,
      message: 'Patient status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating patient status',
      error: error.message
    });
  }
});

// GET /api/icu/alerts - Get ICU alerts
router.get('/alerts', async (req, res) => {
  try {
    // Mock alerts - replace with actual database query
    const alerts = [
      {
        id: '1',
        patient_id: '1',
        patient_name: 'John Doe',
        alert_type: 'critical',
        message: 'Heart rate above normal range',
        severity: 'high',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        patient_id: '2',
        patient_name: 'Jane Smith',
        alert_type: 'warning',
        message: 'Oxygen saturation below 95%',
        severity: 'medium',
        created_at: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU alerts',
      error: error.message
    });
  }
});

module.exports = router;
