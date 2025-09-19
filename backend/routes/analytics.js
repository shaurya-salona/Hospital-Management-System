const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, staffOnly } = require('../middlewares/auth');
const { ValidationRules, handleValidationErrors } = require('../middlewares/validation');
const { body, query } = require('express-validator');

// Apply authentication to all analytics routes
router.use(authenticateToken);
router.use(staffOnly);

// Dashboard Analytics
router.get('/dashboard', 
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    handleValidationErrors
  ],
  analyticsController.getDashboardAnalytics
);

// Patient Analytics
router.get('/patients',
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    query('groupBy').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid groupBy value'),
    handleValidationErrors
  ],
  analyticsController.getPatientAnalytics
);

// Financial Analytics
router.get('/financial',
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    query('groupBy').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid groupBy value'),
    handleValidationErrors
  ],
  analyticsController.getFinancialAnalytics
);

// Operational Analytics
router.get('/operational',
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    handleValidationErrors
  ],
  analyticsController.getOperationalAnalytics
);

// Custom Report Generation
router.post('/reports/custom',
  [
    body('reportType').isIn(['patient_summary', 'financial_summary', 'appointment_analysis', 'staff_performance'])
      .withMessage('Invalid report type'),
    body('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    body('filters').optional().isObject().withMessage('Filters must be an object'),
    handleValidationErrors
  ],
  analyticsController.generateCustomReport
);

// Real-time Analytics (WebSocket endpoint)
router.get('/realtime', (req, res) => {
  // This would typically be handled by WebSocket connections
  res.json({
    success: true,
    message: 'Real-time analytics available via WebSocket connection',
    endpoint: '/socket.io'
  });
});

// Export Analytics Data
router.get('/export/:type',
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    query('format').optional().isIn(['json', 'csv', 'xlsx']).withMessage('Invalid export format'),
    handleValidationErrors
  ],
  async (req, res) => {
    try {
      const { type } = req.params;
      const { startDate, endDate, format = 'json' } = req.query;
      
      // Get analytics data based on type
      let data;
      switch (type) {
        case 'dashboard':
          data = await analyticsController.getDashboardAnalytics(req, res);
          break;
        case 'patients':
          data = await analyticsController.getPatientAnalytics(req, res);
          break;
        case 'financial':
          data = await analyticsController.getFinancialAnalytics(req, res);
          break;
        case 'operational':
          data = await analyticsController.getOperationalAnalytics(req, res);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid export type'
          });
      }

      // Set appropriate headers for download
      const filename = `hmis_${type}_analytics_${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        // Convert data to CSV format
        const csv = convertToCSV(data);
        res.send(csv);
      } else if (format === 'xlsx') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
        // Convert data to Excel format
        const excel = convertToExcel(data);
        res.send(excel);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        res.json(data);
      }

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to export analytics data',
        error: error.message
      });
    }
  }
);

// Helper function to convert data to CSV
function convertToCSV(data) {
  // This is a simplified CSV conversion
  // In a real implementation, you'd use a proper CSV library
  if (!data || !data.data) return '';
  
  const rows = [];
  const flattenObject = (obj, prefix = '') => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        flattenObject(obj[key], `${prefix}${key}.`);
      } else {
        rows.push(`${prefix}${key},${obj[key]}`);
      }
    }
  };
  
  flattenObject(data.data);
  return rows.join('\n');
}

// Helper function to convert data to Excel
function convertToExcel(data) {
  // This is a placeholder for Excel conversion
  // In a real implementation, you'd use a library like 'xlsx'
  return JSON.stringify(data);
}

module.exports = router;