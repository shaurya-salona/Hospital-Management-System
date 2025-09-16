const express = require('express');
const router = express.Router();
const { authenticateToken, staffOnly } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateMedicalRecord = [
  body('patientId').isUUID().withMessage('Valid patient ID is required'),
  body('type').isIn(['consultation', 'diagnosis', 'treatment', 'follow-up']).withMessage('Invalid record type'),
  body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
  body('treatment').notEmpty().withMessage('Treatment is required'),
  body('notes').optional().isString()
];

const validatePrescription = [
  body('patientId').isUUID().withMessage('Valid patient ID is required'),
  body('medication').notEmpty().withMessage('Medication name is required'),
  body('dosage').notEmpty().withMessage('Dosage is required'),
  body('instructions').notEmpty().withMessage('Instructions are required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer')
];

const validateId = [
  param('id').isUUID().withMessage('Valid ID is required')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['consultation', 'diagnosis', 'treatment', 'follow-up']).withMessage('Invalid type filter'),
  query('patientId').optional().isUUID().withMessage('Valid patient ID filter is required')
];

// All routes require authentication and staff access
router.use(authenticateToken);
router.use(staffOnly);

// Medical Records Routes

// GET /api/medical/records - Get all medical records
router.get('/records', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, patientId } = req.query;

    // Mock data for now - replace with actual database queries
    const mockRecords = [
      {
        id: '1',
        patient_id: '1',
        patient_name: 'John Doe',
        type: 'consultation',
        diagnosis: 'Hypertension',
        treatment: 'Lifestyle modifications and medication',
        notes: 'Patient shows improvement with current treatment',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        patient_id: '2',
        patient_name: 'Jane Smith',
        type: 'diagnosis',
        diagnosis: 'Type 2 Diabetes',
        treatment: 'Metformin and dietary changes',
        notes: 'New diagnosis, patient education provided',
        status: 'active',
        created_at: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: mockRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockRecords.length,
        pages: Math.ceil(mockRecords.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching medical records',
      error: error.message
    });
  }
});

// GET /api/medical/records/:id - Get medical record by ID
router.get('/records/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data - replace with actual database query
    const record = {
      id,
      patient_id: '1',
      patient_name: 'John Doe',
      type: 'consultation',
      diagnosis: 'Hypertension',
      treatment: 'Lifestyle modifications and medication',
      notes: 'Patient shows improvement with current treatment',
      status: 'active',
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching medical record',
      error: error.message
    });
  }
});

// POST /api/medical/records - Create new medical record
router.post('/records', validateMedicalRecord, async (req, res) => {
  try {
    const recordData = req.body;
    
    // Mock creation - replace with actual database insert
    const newRecord = {
      id: Date.now().toString(),
      ...recordData,
      status: 'active',
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: newRecord,
      message: 'Medical record created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating medical record',
      error: error.message
    });
  }
});

// Prescriptions Routes

// GET /api/medical/prescriptions - Get all prescriptions
router.get('/prescriptions', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId } = req.query;

    // Mock data for now - replace with actual database queries
    const mockPrescriptions = [
      {
        id: '1',
        patient_id: '1',
        patient_name: 'John Doe',
        medication: 'Lisinopril 10mg',
        dosage: '10mg once daily',
        instructions: 'Take with food, monitor blood pressure',
        start_date: '2024-01-01',
        end_date: '2024-04-01',
        quantity: 90,
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        patient_id: '2',
        patient_name: 'Jane Smith',
        medication: 'Metformin 500mg',
        dosage: '500mg twice daily',
        instructions: 'Take with meals',
        start_date: '2024-01-15',
        end_date: '2024-04-15',
        quantity: 60,
        status: 'active',
        created_at: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: mockPrescriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockPrescriptions.length,
        pages: Math.ceil(mockPrescriptions.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching prescriptions',
      error: error.message
    });
  }
});

// GET /api/medical/prescriptions/:id - Get prescription by ID
router.get('/prescriptions/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data - replace with actual database query
    const prescription = {
      id,
      patient_id: '1',
      patient_name: 'John Doe',
      medication: 'Lisinopril 10mg',
      dosage: '10mg once daily',
      instructions: 'Take with food, monitor blood pressure',
      start_date: '2024-01-01',
      end_date: '2024-04-01',
      quantity: 90,
      status: 'active',
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching prescription',
      error: error.message
    });
  }
});

// POST /api/medical/prescriptions - Create new prescription
router.post('/prescriptions', validatePrescription, async (req, res) => {
  try {
    const prescriptionData = req.body;
    
    // Mock creation - replace with actual database insert
    const newPrescription = {
      id: Date.now().toString(),
      ...prescriptionData,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: newPrescription,
      message: 'Prescription created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating prescription',
      error: error.message
    });
  }
});

// PUT /api/medical/prescriptions/:id - Update prescription
router.put('/prescriptions/:id', validateId, validatePrescription, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Mock update - replace with actual database update
    const updatedPrescription = {
      id,
      ...updateData,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: updatedPrescription,
      message: 'Prescription updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating prescription',
      error: error.message
    });
  }
});

module.exports = router;
