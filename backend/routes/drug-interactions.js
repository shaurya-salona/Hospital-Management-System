const express = require('express');
const router = express.Router();
const { authenticateToken, staffOnly } = require('../middlewares/auth');
const { body, query, param } = require('express-validator');

// Validation middleware
const validateDrugInteractionCheck = [
  body('medications').isArray().withMessage('Medications must be an array'),
  body('medications.*').isString().withMessage('Each medication must be a string'),
  body('patientId').optional().isUUID().withMessage('Valid patient ID is required')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('severity').optional().isIn(['minor', 'moderate', 'major', 'contraindicated']).withMessage('Invalid severity filter')
];

// All routes require authentication and staff access
router.use(authenticateToken);
router.use(staffOnly);

// GET /api/drug-interactions - Get drug interaction database
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, severity } = req.query;

    // Mock drug interaction database - replace with actual database queries
    const mockInteractions = [
      {
        id: '1',
        drug1: 'Warfarin',
        drug2: 'Aspirin',
        severity: 'major',
        description: 'Increased risk of bleeding when taken together',
        recommendation: 'Monitor INR closely, consider alternative pain management',
        mechanism: 'Both drugs affect blood clotting mechanisms',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        drug1: 'Digoxin',
        drug2: 'Furosemide',
        severity: 'moderate',
        description: 'Furosemide can increase digoxin levels',
        recommendation: 'Monitor digoxin levels and adjust dose if necessary',
        mechanism: 'Furosemide can cause hypokalemia, increasing digoxin toxicity',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        drug1: 'Metformin',
        drug2: 'Contrast Dye',
        severity: 'major',
        description: 'Risk of lactic acidosis with contrast dye',
        recommendation: 'Discontinue metformin 48 hours before and after contrast procedure',
        mechanism: 'Contrast dye can impair kidney function, increasing metformin toxicity',
        created_at: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: mockInteractions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockInteractions.length,
        pages: Math.ceil(mockInteractions.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching drug interactions',
      error: error.message
    });
  }
});

// POST /api/drug-interactions/check - Check for drug interactions
router.post('/check', validateDrugInteractionCheck, async (req, res) => {
  try {
    const { medications, patientId } = req.body;

    // Mock drug interaction check - replace with actual interaction checking logic
    const interactions = [];
    
    // Simple mock logic - in real implementation, this would query a drug interaction database
    if (medications.includes('Warfarin') && medications.includes('Aspirin')) {
      interactions.push({
        drug1: 'Warfarin',
        drug2: 'Aspirin',
        severity: 'major',
        description: 'Increased risk of bleeding when taken together',
        recommendation: 'Monitor INR closely, consider alternative pain management',
        mechanism: 'Both drugs affect blood clotting mechanisms'
      });
    }

    if (medications.includes('Digoxin') && medications.includes('Furosemide')) {
      interactions.push({
        drug1: 'Digoxin',
        drug2: 'Furosemide',
        severity: 'moderate',
        description: 'Furosemide can increase digoxin levels',
        recommendation: 'Monitor digoxin levels and adjust dose if necessary',
        mechanism: 'Furosemide can cause hypokalemia, increasing digoxin toxicity'
      });
    }

    const result = {
      medications: medications,
      interactions: interactions,
      severity: interactions.length > 0 ? 
        interactions.some(i => i.severity === 'major') ? 'major' :
        interactions.some(i => i.severity === 'moderate') ? 'moderate' : 'minor'
        : 'none',
      recommendations: interactions.length > 0 ? 
        'Review interactions carefully before prescribing' : 
        'No significant interactions found',
      checked_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking drug interactions',
      error: error.message
    });
  }
});

// GET /api/drug-interactions/medication/:name - Get interactions for specific medication
router.get('/medication/:name', async (req, res) => {
  try {
    const { name } = req.params;

    // Mock medication-specific interactions - replace with actual database query
    const interactions = [
      {
        id: '1',
        drug1: name,
        drug2: 'Warfarin',
        severity: 'major',
        description: `Increased risk of bleeding when ${name} is taken with Warfarin`,
        recommendation: 'Monitor INR closely, consider alternative medications',
        mechanism: 'Both drugs affect blood clotting mechanisms'
      },
      {
        id: '2',
        drug1: name,
        drug2: 'Digoxin',
        severity: 'moderate',
        description: `${name} may increase digoxin levels`,
        recommendation: 'Monitor digoxin levels and adjust dose if necessary',
        mechanism: 'Potential pharmacokinetic interaction'
      }
    ];

    res.json({
      success: true,
      data: {
        medication: name,
        interactions: interactions,
        total_interactions: interactions.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching medication interactions',
      error: error.message
    });
  }
});

// GET /api/drug-interactions/severity/:level - Get interactions by severity level
router.get('/severity/:level', [
  param('level').isIn(['minor', 'moderate', 'major', 'contraindicated']).withMessage('Invalid severity level')
], async (req, res) => {
  try {
    const { level } = req.params;

    // Mock interactions by severity - replace with actual database query
    const interactions = [
      {
        id: '1',
        drug1: 'Drug A',
        drug2: 'Drug B',
        severity: level,
        description: `Example ${level} interaction`,
        recommendation: `Follow ${level} interaction guidelines`,
        mechanism: 'Example mechanism of interaction'
      }
    ];

    res.json({
      success: true,
      data: {
        severity: level,
        interactions: interactions,
        count: interactions.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching interactions by severity',
      error: error.message
    });
  }
});

module.exports = router;
