const express = require('express');
const router = express.Router();
const { authenticateToken, staffOnly } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateLabTest = [
  body('patientId').isUUID().withMessage('Valid patient ID is required'),
  body('testType').isIn(['blood', 'urine', 'xray', 'mri', 'ct', 'ultrasound', 'ecg']).withMessage('Invalid test type'),
  body('reason').notEmpty().withMessage('Reason for test is required'),
  body('priority').isIn(['normal', 'urgent', 'emergency']).withMessage('Invalid priority level'),
  body('doctorId').isUUID().withMessage('Valid doctor ID is required')
];

const validateId = [
  param('id').isUUID().withMessage('Valid test ID is required')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status filter'),
  query('testType').optional().isIn(['blood', 'urine', 'xray', 'mri', 'ct', 'ultrasound', 'ecg']).withMessage('Invalid test type filter')
];

// All routes require authentication and staff access
router.use(authenticateToken);
router.use(staffOnly);

// GET /api/lab/tests - Get all lab tests
router.get('/tests', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, testType } = req.query;

    // Mock data for now - replace with actual database queries
    const mockLabTests = [
      {
        id: '1',
        patient_id: '1',
        patient_name: 'John Doe',
        test_type: 'blood',
        reason: 'Routine check-up',
        priority: 'normal',
        status: 'pending',
        ordered_date: '2024-01-15T09:00:00Z',
        doctor_name: 'Dr. Smith',
        results: null,
        abnormal: false,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        patient_id: '2',
        patient_name: 'Jane Smith',
        test_type: 'xray',
        reason: 'Chest pain',
        priority: 'urgent',
        status: 'completed',
        ordered_date: '2024-01-15T08:30:00Z',
        doctor_name: 'Dr. Johnson',
        results: 'Normal chest X-ray, no abnormalities detected',
        abnormal: false,
        completed_date: '2024-01-15T10:00:00Z',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        patient_id: '3',
        patient_name: 'Mike Johnson',
        test_type: 'blood',
        reason: 'Diabetes monitoring',
        priority: 'normal',
        status: 'completed',
        ordered_date: '2024-01-14T14:00:00Z',
        doctor_name: 'Dr. Brown',
        results: 'Blood glucose: 180 mg/dL (elevated)',
        abnormal: true,
        completed_date: '2024-01-14T16:00:00Z',
        created_at: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: mockLabTests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockLabTests.length,
        pages: Math.ceil(mockLabTests.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lab tests',
      error: error.message
    });
  }
});

// GET /api/lab/tests/:id - Get lab test by ID
router.get('/tests/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data - replace with actual database query
    const test = {
      id,
      patient_id: '1',
      patient_name: 'John Doe',
      test_type: 'blood',
      reason: 'Routine check-up',
      priority: 'normal',
      status: 'pending',
      ordered_date: '2024-01-15T09:00:00Z',
      doctor_name: 'Dr. Smith',
      results: null,
      abnormal: false,
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lab test',
      error: error.message
    });
  }
});

// POST /api/lab/tests - Order new lab test
router.post('/tests', validateLabTest, async (req, res) => {
  try {
    const testData = req.body;
    
    // Mock creation - replace with actual database insert
    const newTest = {
      id: Date.now().toString(),
      ...testData,
      status: 'pending',
      ordered_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: newTest,
      message: 'Lab test ordered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error ordering lab test',
      error: error.message
    });
  }
});

// PUT /api/lab/tests/:id/status - Update test status
router.put('/tests/:id/status', validateId, [
  body('status').isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('results').optional().isString(),
  body('abnormal').optional().isBoolean()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { status, results, abnormal } = req.body;
    
    // Mock update - replace with actual database update
    const updatedTest = {
      id,
      status,
      results,
      abnormal,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updatedTest.completed_date = new Date().toISOString();
    }

    res.json({
      success: true,
      data: updatedTest,
      message: 'Lab test status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating lab test status',
      error: error.message
    });
  }
});

// GET /api/lab/results/:patientId - Get patient's lab results
router.get('/results/:patientId', [
  param('patientId').isUUID().withMessage('Valid patient ID is required'),
  query('testType').optional().isIn(['blood', 'urine', 'xray', 'mri', 'ct', 'ultrasound', 'ecg']).withMessage('Invalid test type filter')
], async (req, res) => {
  try {
    const { patientId } = req.params;
    const { testType } = req.query;

    // Mock lab results - replace with actual database query
    const results = [
      {
        id: '1',
        test_type: 'blood',
        test_name: 'Complete Blood Count',
        results: {
          'Hemoglobin': '14.2 g/dL',
          'White Blood Cells': '7.5 x 10^9/L',
          'Platelets': '250 x 10^9/L'
        },
        normal_ranges: {
          'Hemoglobin': '12.0-16.0 g/dL',
          'White Blood Cells': '4.0-11.0 x 10^9/L',
          'Platelets': '150-450 x 10^9/L'
        },
        abnormal: false,
        completed_date: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        test_type: 'blood',
        test_name: 'Blood Glucose',
        results: {
          'Glucose': '180 mg/dL'
        },
        normal_ranges: {
          'Glucose': '70-100 mg/dL'
        },
        abnormal: true,
        completed_date: '2024-01-14T16:00:00Z'
      }
    ];

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lab results',
      error: error.message
    });
  }
});

module.exports = router;
