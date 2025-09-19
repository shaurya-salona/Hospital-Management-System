
router.get('/stats', async (req, res) => {
  try {
    // Mock counseling statistics - replace with actual database queries
    const stats = {
      total_sessions: 45,
      sessions_today: 8,
      patients_counseled: 35,
      follow_up_required: 12,
      average_duration: 18,
      top_medications: [
        { medication: 'Lisinopril', count: 8 },
        { medication: 'Metformin', count: 6 },
        { medication: 'Warfarin', count: 5 },
        { medication: 'Atorvastatin', count: 4 }
      ]
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching counseling statistics',
      error: error.message
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticateToken, staffOnly } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateCounseling = [
  body('patientId').isUUID().withMessage('Valid patient ID is required'),
  body('medication').notEmpty().withMessage('Medication name is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('duration').isInt({ min: 5, max: 120 }).withMessage('Duration must be between 5 and 120 minutes'),
  body('notes').notEmpty().withMessage('Counseling notes are required'),
  body('followUpRequired').optional().isBoolean().withMessage('Follow-up required must be a boolean')
];

const validateId = [
  param('id').isUUID().withMessage('Valid counseling session ID is required')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['completed', 'scheduled', 'follow-up-required']).withMessage('Invalid status filter'),
  query('patientId').optional().isUUID().withMessage('Valid patient ID filter is required')
];

// All routes require authentication and staff access
router.use(authenticateToken);
router.use(staffOnly);

// GET /api/counseling - Get all counseling sessions
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, patientId } = req.query;

    // Mock data for now - replace with actual database queries
    const mockCounseling = [
      {
        id: '1',
        patient_id: '1',
        patient_name: 'John Doe',
        medication: 'Lisinopril 10mg',
        date: '2024-01-15T10:00:00Z',
        duration: 15,
        notes: 'Explained proper administration, side effects, and importance of regular monitoring',
        status: 'completed',
        follow_up_required: false,
        pharmacist_name: 'Sarah Davis',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        patient_id: '2',
        patient_name: 'Jane Smith',
        medication: 'Metformin 500mg',
        date: '2024-01-15T11:00:00Z',
        duration: 20,
        notes: 'Discussed diabetes management, medication timing, and lifestyle modifications',
        status: 'completed',
        follow_up_required: true,
        pharmacist_name: 'Sarah Davis',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        patient_id: '3',
        patient_name: 'Mike Johnson',
        medication: 'Warfarin 5mg',
        date: '2024-01-16T09:00:00Z',
        duration: 25,
        notes: 'Scheduled for tomorrow - will discuss blood thinning medication and monitoring',
        status: 'scheduled',
        follow_up_required: false,
        pharmacist_name: 'Sarah Davis',
        created_at: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: mockCounseling,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockCounseling.length,
        pages: Math.ceil(mockCounseling.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching counseling sessions',
      error: error.message
    });
  }
});

// GET /api/counseling/:id - Get counseling session by ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data - replace with actual database query
    const session = {
      id,
      patient_id: '1',
      patient_name: 'John Doe',
      medication: 'Lisinopril 10mg',
      date: '2024-01-15T10:00:00Z',
      duration: 15,
      notes: 'Explained proper administration, side effects, and importance of regular monitoring',
      status: 'completed',
      follow_up_required: false,
      pharmacist_name: 'Sarah Davis',
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching counseling session',
      error: error.message
    });
  }
});

// POST /api/counseling - Create new counseling session
router.post('/', validateCounseling, async (req, res) => {
  try {
    const counselingData = req.body;
    
    // Mock creation - replace with actual database insert
    const newSession = {
      id: Date.now().toString(),
      ...counselingData,
      status: 'completed',
      pharmacist_name: req.user.username || 'Current Pharmacist',
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: newSession,
      message: 'Counseling session created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating counseling session',
      error: error.message
    });
  }
});

// PUT /api/counseling/:id - Update counseling session
router.put('/:id', validateId, validateCounseling, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Mock update - replace with actual database update
    const updatedSession = {
      id,
      ...updateData,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: updatedSession,
      message: 'Counseling session updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating counseling session',
      error: error.message
    });
  }
});

// GET /api/counseling/patient/:patientId - Get patient's counseling history
router.get('/patient/:patientId', [
  param('patientId').isUUID().withMessage('Valid patient ID is required'),
  query('medication').optional().isString()
], async (req, res) => {
  try {
    const { patientId } = req.params;
    const { medication } = req.query;

    // Mock patient counseling history - replace with actual database query
    const history = [
      {
        id: '1',
        medication: 'Lisinopril 10mg',
        date: '2024-01-15T10:00:00Z',
        duration: 15,
        notes: 'Explained proper administration, side effects, and importance of regular monitoring',
        status: 'completed',
        follow_up_required: false,
        pharmacist_name: 'Sarah Davis'
      },
      {
        id: '2',
        medication: 'Metformin 500mg',
        date: '2024-01-10T14:00:00Z',
        duration: 20,
        notes: 'Discussed diabetes management and medication timing',
        status: 'completed',
        follow_up_required: true,
        pharmacist_name: 'Sarah Davis'
      }
    ];

    res.json({
      success: true,
      data: {
        patient_id: patientId,
        counseling_history: history,
        total_sessions: history.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient counseling history',
      error: error.message
    });
  }
});

// GET /api/counseling/stats - Get counseling statistics
router.get('/stats', async (req, res) => {
  try {
    // Mock counseling statistics - replace with actual database queries
    const stats = {
      total_sessions: 45,
      sessions_today: 8,
      patients_counseled: 35,
      follow_up_required: 12,
      average_duration: 18,
      top_medications: [
        { medication: 'Lisinopril', count: 8 },
        { medication: 'Metformin', count: 6 },
        { medication: 'Warfarin', count: 5 },
        { medication: 'Atorvastatin', count: 4 }
      ]
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching counseling statistics',
      error: error.message
    });
  }
});

module.exports = router;
