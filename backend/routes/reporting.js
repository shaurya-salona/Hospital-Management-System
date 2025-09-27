/**
 * Reporting API Routes for HMIS
 * Handles all reporting endpoints
 */

const express = require('express');
const router = express.Router();
const { logger } = require('../config/logger');
const ReportingEngine = require('../reporting/reporting-engine');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

// Initialize reporting engine
const reportingEngine = new ReportingEngine();

// Middleware for all reporting routes
router.use(authenticateToken);

// Financial Reports
router.get('/financial/revenue', authorizeRole(['admin', 'finance', 'manager']), async (req, res) => {
    try {
        const { startDate, endDate, department, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const reportData = await reportingEngine.generateFinancialReport({
            startDate,
            endDate,
            reportType: 'revenue',
            department,
            format
        });

        res.json(reportData);
    } catch (error) {
        logger.error('Error generating revenue report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate revenue report',
            error: error.message
        });
    }
});

router.get('/financial/expenses', authorizeRole(['admin', 'finance', 'manager']), async (req, res) => {
    try {
        const { startDate, endDate, department, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const reportData = await reportingEngine.generateFinancialReport({
            startDate,
            endDate,
            reportType: 'expenses',
            department,
            format
        });

        res.json(reportData);
    } catch (error) {
        logger.error('Error generating expenses report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate expenses report',
            error: error.message
        });
    }
});

router.get('/financial/profit-loss', authorizeRole(['admin', 'finance', 'manager']), async (req, res) => {
    try {
        const { startDate, endDate, department, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const reportData = await reportingEngine.generateFinancialReport({
            startDate,
            endDate,
            reportType: 'profit_loss',
            department,
            format
        });

        res.json(reportData);
    } catch (error) {
        logger.error('Error generating profit-loss report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate profit-loss report',
            error: error.message
        });
    }
});

router.get('/financial/billing', authorizeRole(['admin', 'finance', 'manager', 'receptionist']), async (req, res) => {
    try {
        const { startDate, endDate, department, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const reportData = await reportingEngine.generateFinancialReport({
            startDate,
            endDate,
            reportType: 'billing',
            department,
            format
        });

        res.json(reportData);
    } catch (error) {
        logger.error('Error generating billing report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate billing report',
            error: error.message
        });
    }
});

router.get('/financial/insurance', authorizeRole(['admin', 'finance', 'manager']), async (req, res) => {
    try {
        const { startDate, endDate, department, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const reportData = await reportingEngine.generateFinancialReport({
            startDate,
            endDate,
            reportType: 'insurance',
            department,
            format
        });

        res.json(reportData);
    } catch (error) {
        logger.error('Error generating insurance report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate insurance report',
            error: error.message
        });
    }
});

// Patient Analytics Reports
router.get('/analytics/patients/demographics', authorizeRole(['admin', 'doctor', 'nurse', 'manager']), async (req, res) => {
    try {
        const { startDate, endDate, department, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const reportData = await reportingEngine.generatePatientAnalytics({
            startDate,
            endDate,
            reportType: 'demographics',
            department,
            format
        });

        res.json(reportData);
    } catch (error) {
        logger.error('Error generating demographics report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate demographics report',
            error: error.message
        });
    }
});

router.get('/analytics/patients/admissions', authorizeRole(['admin', 'doctor', 'nurse', 'manager']), async (req, res) => {
    try {
        const { startDate, endDate, department, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const reportData = await reportingEngine.generatePatientAnalytics({
            startDate,
            endDate,
            reportType: 'admissions',
            department,
            format
        });

        res.json(reportData);
    } catch (error) {
        logger.error('Error generating admissions report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate admissions report',
            error: error.message
        });
    }
});

router.get('/analytics/patients/diagnoses', authorizeRole(['admin', 'doctor', 'nurse', 'manager']), async (req, res) => {
    try {
        const { startDate, endDate, department, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const reportData = await reportingEngine.generatePatientAnalytics({
            startDate,
            endDate,
            reportType: 'diagnoses',
            department,
            format
        });

        res.json(reportData);
    } catch (error) {
        logger.error('Error generating diagnoses report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate diagnoses report',
            error: error.message
        });
    }
});

router.get('/analytics/patients/outcomes', authorizeRole(['admin', 'doctor', 'nurse', 'manager']), async (req, res) => {
    try {
        const { startDate, endDate, department, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const reportData = await reportingEngine.generatePatientAnalytics({
            startDate,
            endDate,
            reportType: 'outcomes',
            department,
            format
        });

        res.json(reportData);
    } catch (error) {
        logger.error('Error generating outcomes report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate outcomes report',
            error: error.message
        });
    }
});

// Appointment Analytics Reports
router.get('/analytics/appointments/scheduling', authorizeRole(['admin', 'doctor', 'receptionist', 'manager']), async (req, res) => {
    try {
        const { startDate, endDate, doctor, department, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const reportData = await reportingEngine.generateAppointmentAnalytics({
            startDate,
            endDate,
            reportType: 'scheduling',
            doctor,
            department,
            format
        });

        res.json(reportData);
    } catch (error) {
        logger.error('Error generating scheduling report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate scheduling report',
            error: error.message
        });
    }
});

router.get('/analytics/appointments/utilization', authorizeRole(['admin', 'doctor', 'manager']), async (req, res) => {
    try {
        const { startDate, endDate, department, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const reportData = await reportingEngine.generateAppointmentAnalytics({
            startDate,
            endDate,
            reportType: 'utilization',
            department,
            format
        });

        res.json(reportData);
    } catch (error) {
        logger.error('Error generating utilization report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate utilization report',
            error: error.message
        });
    }
});

router.get('/analytics/appointments/wait-times', authorizeRole(['admin', 'doctor', 'receptionist', 'manager']), async (req, res) => {
    try {
        const { startDate, endDate, doctor, department, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const reportData = await reportingEngine.generateAppointmentAnalytics({
            startDate,
            endDate,
            reportType: 'wait_times',
            doctor,
            department,
            format
        });

        res.json(reportData);
    } catch (error) {
        logger.error('Error generating wait times report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate wait times report',
            error: error.message
        });
    }
});

router.get('/analytics/appointments/cancellations', authorizeRole(['admin', 'doctor', 'receptionist', 'manager']), async (req, res) => {
    try {
        const { startDate, endDate, doctor, department, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const reportData = await reportingEngine.generateAppointmentAnalytics({
            startDate,
            endDate,
            reportType: 'cancellations',
            doctor,
            department,
            format
        });

        res.json(reportData);
    } catch (error) {
        logger.error('Error generating cancellations report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate cancellations report',
            error: error.message
        });
    }
});

// Custom Reports
router.post('/custom', authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const { query: customQuery, parameters, reportName, description, format = 'json' } = req.body;

        if (!customQuery || !reportName) {
            return res.status(400).json({
                success: false,
                message: 'Custom query and report name are required'
            });
        }

        const reportData = await reportingEngine.generateCustomReport({
            query: customQuery,
            parameters,
            reportName,
            description,
            format
        });

        res.json(reportData);
    } catch (error) {
        logger.error('Error generating custom report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate custom report',
            error: error.message
        });
    }
});

// Report Export
router.post('/export', authorizeRole(['admin', 'finance', 'manager']), async (req, res) => {
    try {
        const { reportData, format } = req.body;

        if (!reportData || !format) {
            return res.status(400).json({
                success: false,
                message: 'Report data and format are required'
            });
        }

        const exportResult = await reportingEngine.exportReport(reportData, format);

        res.json(exportResult);
    } catch (error) {
        logger.error('Error exporting report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export report',
            error: error.message
        });
    }
});

// Report Templates
router.get('/templates', authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const templates = [
            {
                id: 'financial_summary',
                name: 'Financial Summary',
                description: 'Comprehensive financial overview',
                category: 'financial',
                parameters: ['startDate', 'endDate', 'department']
            },
            {
                id: 'patient_demographics',
                name: 'Patient Demographics',
                description: 'Patient demographic analysis',
                category: 'analytics',
                parameters: ['startDate', 'endDate', 'department']
            },
            {
                id: 'appointment_utilization',
                name: 'Appointment Utilization',
                description: 'Doctor and resource utilization',
                category: 'analytics',
                parameters: ['startDate', 'endDate', 'department']
            },
            {
                id: 'revenue_analysis',
                name: 'Revenue Analysis',
                description: 'Detailed revenue breakdown',
                category: 'financial',
                parameters: ['startDate', 'endDate', 'department']
            },
            {
                id: 'patient_outcomes',
                name: 'Patient Outcomes',
                description: 'Treatment outcomes analysis',
                category: 'analytics',
                parameters: ['startDate', 'endDate', 'department']
            }
        ];

        res.json({
            success: true,
            templates
        });
    } catch (error) {
        logger.error('Error fetching report templates:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch report templates',
            error: error.message
        });
    }
});

// Report History
router.get('/history', authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const { page = 1, limit = 10, userId, reportType } = req.query;

        // This would typically query a reports_history table
        // For now, returning mock data
        const history = [
            {
                id: 1,
                reportName: 'Financial Summary',
                reportType: 'financial',
                generatedBy: 'admin',
                generatedAt: new Date(),
                status: 'completed',
                format: 'pdf'
            },
            {
                id: 2,
                reportName: 'Patient Demographics',
                reportType: 'analytics',
                generatedBy: 'manager',
                generatedAt: new Date(Date.now() - 86400000),
                status: 'completed',
                format: 'excel'
            }
        ];

        res.json({
            success: true,
            history,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: history.length
            }
        });
    } catch (error) {
        logger.error('Error fetching report history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch report history',
            error: error.message
        });
    }
});

module.exports = router;


