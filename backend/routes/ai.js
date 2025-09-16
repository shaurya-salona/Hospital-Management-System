const express = require('express');
const router = express.Router();
const { authenticateToken, staffOnly } = require('../middlewares/auth');
const { body } = require('express-validator');

// Validation middleware
const validateAIRequest = [
  body('query').notEmpty().withMessage('Query is required'),
  body('type').isIn(['diagnosis', 'treatment', 'drug-interaction', 'general']).withMessage('Invalid AI request type')
];

// All routes require authentication and staff access
router.use(authenticateToken);
router.use(staffOnly);

// POST /api/ai/assist - Get AI assistance
router.post('/assist', validateAIRequest, async (req, res) => {
  try {
    const { query, type, context } = req.body;

    // Mock AI response - replace with actual AI service integration
    let response;
    
    switch (type) {
      case 'diagnosis':
        response = {
          suggestions: [
            'Based on the symptoms described, consider:',
            '1. Hypertension - monitor blood pressure',
            '2. Diabetes - check blood glucose levels',
            '3. Common cold - symptomatic treatment'
          ],
          confidence: 0.85,
          recommendations: 'Further testing recommended'
        };
        break;
      case 'treatment':
        response = {
          suggestions: [
            'Recommended treatment options:',
            '1. Lifestyle modifications',
            '2. Medication therapy',
            '3. Regular monitoring'
          ],
          confidence: 0.90,
          recommendations: 'Follow up in 2 weeks'
        };
        break;
      case 'drug-interaction':
        response = {
          interactions: [
            {
              drug1: 'Medication A',
              drug2: 'Medication B',
              severity: 'moderate',
              description: 'May increase risk of side effects',
              recommendation: 'Monitor patient closely'
            }
          ],
          confidence: 0.95
        };
        break;
      default:
        response = {
          suggestions: [
            'General medical advice:',
            '1. Maintain regular check-ups',
            '2. Follow prescribed medications',
            '3. Maintain healthy lifestyle'
          ],
          confidence: 0.80
        };
    }

    res.json({
      success: true,
      data: response,
      query: query,
      type: type
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing AI request',
      error: error.message
    });
  }
});

// POST /api/ai/analyze-symptoms - Analyze patient symptoms
router.post('/analyze-symptoms', [
  body('symptoms').isArray().withMessage('Symptoms must be an array'),
  body('patientAge').optional().isInt({ min: 0, max: 150 }).withMessage('Valid age is required'),
  body('patientGender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender')
], async (req, res) => {
  try {
    const { symptoms, patientAge, patientGender } = req.body;

    // Mock symptom analysis - replace with actual AI service
    const analysis = {
      possibleConditions: [
        {
          condition: 'Hypertension',
          probability: 0.75,
          symptoms: ['headache', 'dizziness'],
          recommendations: 'Check blood pressure, consider medication'
        },
        {
          condition: 'Common Cold',
          probability: 0.60,
          symptoms: ['cough', 'runny nose'],
          recommendations: 'Rest, fluids, symptomatic treatment'
        }
      ],
      urgency: 'low',
      recommendations: 'Schedule appointment within 24-48 hours'
    };

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error analyzing symptoms',
      error: error.message
    });
  }
});

// POST /api/ai/drug-interaction-check - Check drug interactions
router.post('/drug-interaction-check', [
  body('medications').isArray().withMessage('Medications must be an array'),
  body('medications.*').isString().withMessage('Each medication must be a string')
], async (req, res) => {
  try {
    const { medications } = req.body;

    // Mock drug interaction check - replace with actual AI service
    const interactions = [
      {
        drug1: medications[0] || 'Medication A',
        drug2: medications[1] || 'Medication B',
        severity: 'moderate',
        description: 'May increase risk of gastrointestinal side effects',
        recommendation: 'Monitor patient for stomach upset, consider taking with food'
      }
    ];

    res.json({
      success: true,
      data: {
        interactions,
        severity: 'moderate',
        recommendations: 'Monitor patient closely for adverse effects'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking drug interactions',
      error: error.message
    });
  }
});

module.exports = router;
