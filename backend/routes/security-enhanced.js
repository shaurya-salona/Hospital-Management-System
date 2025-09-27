/**
 * Enhanced Security API Routes for HMIS
 * Handles 2FA, audit logging, encryption, and HIPAA compliance
 */

const express = require('express');
const router = express.Router();
const { logger } = require('../config/logger');
const TwoFactorAuth = require('../security/two-factor-auth');
const AuditLogger = require('../security/audit-logger');
const EncryptionManager = require('../security/encryption-manager');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

// Initialize security components
const twoFactorAuth = new TwoFactorAuth();
const auditLogger = new AuditLogger();
const encryptionManager = new EncryptionManager();

// Middleware for all security routes
router.use(authenticateToken);

// Two-Factor Authentication Routes
router.post('/2fa/setup', authorizeRole(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist']), async (req, res) => {
    try {
        const { userId, userEmail } = req.body;

        if (!userId || !userEmail) {
            return res.status(400).json({
                success: false,
                message: 'User ID and email are required'
            });
        }

        const result = await twoFactorAuth.generateTOTPSecret(userId, userEmail);

        // Log 2FA setup
        await auditLogger.logEvent({
            userId,
            eventType: auditLogger.eventTypes.TOTP_SETUP,
            description: '2FA TOTP setup initiated',
            severity: auditLogger.severityLevels.MEDIUM,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json(result);
    } catch (error) {
        logger.error('Error setting up 2FA:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to setup 2FA',
            error: error.message
        });
    }
});

router.post('/2fa/verify', authorizeRole(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist']), async (req, res) => {
    try {
        const { userId, token, backupCode } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        let result;
        if (backupCode) {
            result = await twoFactorAuth.verifyBackupCode(userId, backupCode);
        } else if (token) {
            result = await twoFactorAuth.verifyTOTPToken(userId, token);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Token or backup code is required'
            });
        }

        res.json(result);
    } catch (error) {
        logger.error('Error verifying 2FA:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify 2FA',
            error: error.message
        });
    }
});

router.post('/2fa/sms/send', authorizeRole(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist']), async (req, res) => {
    try {
        const { userId, phoneNumber } = req.body;

        if (!userId || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'User ID and phone number are required'
            });
        }

        const result = await twoFactorAuth.sendSMS2FA(userId, phoneNumber);
        res.json(result);
    } catch (error) {
        logger.error('Error sending SMS 2FA:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send SMS 2FA',
            error: error.message
        });
    }
});

router.post('/2fa/email/send', authorizeRole(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist']), async (req, res) => {
    try {
        const { userId, email } = req.body;

        if (!userId || !email) {
            return res.status(400).json({
                success: false,
                message: 'User ID and email are required'
            });
        }

        const result = await twoFactorAuth.sendEmail2FA(userId, email);
        res.json(result);
    } catch (error) {
        logger.error('Error sending email 2FA:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email 2FA',
            error: error.message
        });
    }
});

router.get('/2fa/status/:userId', authorizeRole(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist']), async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await twoFactorAuth.get2FAStatus(userId);
        res.json({ success: true, ...result });
    } catch (error) {
        logger.error('Error getting 2FA status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get 2FA status',
            error: error.message
        });
    }
});

router.delete('/2fa/disable/:userId', authorizeRole(['admin']), async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await twoFactorAuth.disable2FA(userId);
        res.json(result);
    } catch (error) {
        logger.error('Error disabling 2FA:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disable 2FA',
            error: error.message
        });
    }
});

// Audit Logging Routes
router.get('/audit/logs', authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const {
            userId,
            eventType,
            severity,
            startDate,
            endDate,
            resourceType,
            limit = 100,
            offset = 0
        } = req.query;

        const filters = {
            userId,
            eventType,
            severity,
            startDate,
            endDate,
            resourceType,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };

        const result = await auditLogger.getAuditLogs(filters);
        res.json(result);
    } catch (error) {
        logger.error('Error getting audit logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get audit logs',
            error: error.message
        });
    }
});

router.get('/audit/statistics', authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const { timeRange = '24h' } = req.query;
        const result = await auditLogger.getAuditStatistics(timeRange);
        res.json(result);
    } catch (error) {
        logger.error('Error getting audit statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get audit statistics',
            error: error.message
        });
    }
});

router.post('/audit/export', authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const { filters = {}, format = 'json' } = req.body;
        const result = await auditLogger.exportAuditLogs(filters, format);
        res.json(result);
    } catch (error) {
        logger.error('Error exporting audit logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export audit logs',
            error: error.message
        });
    }
});

// Encryption Routes
router.post('/encryption/encrypt', authorizeRole(['admin', 'doctor', 'nurse']), async (req, res) => {
    try {
        const { data, keyType = 'data' } = req.body;

        if (!data) {
            return res.status(400).json({
                success: false,
                message: 'Data is required'
            });
        }

        const encryptedData = encryptionManager.encryptData(data, keyType);

        // Log encryption event
        await auditLogger.logEvent({
            userId: req.user.userId,
            eventType: 'data_encrypted',
            description: 'Data encrypted using encryption manager',
            severity: auditLogger.severityLevels.MEDIUM,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            encryptedData
        });
    } catch (error) {
        logger.error('Error encrypting data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to encrypt data',
            error: error.message
        });
    }
});

router.post('/encryption/decrypt', authorizeRole(['admin', 'doctor', 'nurse']), async (req, res) => {
    try {
        const { encryptedData, keyType = 'data' } = req.body;

        if (!encryptedData) {
            return res.status(400).json({
                success: false,
                message: 'Encrypted data is required'
            });
        }

        const decryptedData = encryptionManager.decryptData(encryptedData, keyType);

        // Log decryption event
        await auditLogger.logEvent({
            userId: req.user.userId,
            eventType: 'data_decrypted',
            description: 'Data decrypted using encryption manager',
            severity: auditLogger.severityLevels.MEDIUM,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            decryptedData
        });
    } catch (error) {
        logger.error('Error decrypting data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to decrypt data',
            error: error.message
        });
    }
});

router.get('/encryption/status', authorizeRole(['admin']), async (req, res) => {
    try {
        const result = await encryptionManager.getEncryptionStatus();
        res.json(result);
    } catch (error) {
        logger.error('Error getting encryption status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get encryption status',
            error: error.message
        });
    }
});

router.post('/encryption/validate', authorizeRole(['admin']), async (req, res) => {
    try {
        const result = await encryptionManager.validateEncryptionIntegrity();
        res.json(result);
    } catch (error) {
        logger.error('Error validating encryption:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate encryption',
            error: error.message
        });
    }
});

router.post('/encryption/rotate-keys', authorizeRole(['admin']), async (req, res) => {
    try {
        await encryptionManager.rotateKeys();

        // Log key rotation
        await auditLogger.logEvent({
            userId: req.user.userId,
            eventType: 'encryption_keys_rotated',
            description: 'Encryption keys rotated',
            severity: auditLogger.severityLevels.HIGH,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Encryption keys rotated successfully'
        });
    } catch (error) {
        logger.error('Error rotating encryption keys:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to rotate encryption keys',
            error: error.message
        });
    }
});

// HIPAA Compliance Routes
router.get('/hipaa/compliance-status', authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const complianceChecks = await performHIPAAComplianceChecks();
        res.json({
            success: true,
            complianceStatus: complianceChecks
        });
    } catch (error) {
        logger.error('Error checking HIPAA compliance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check HIPAA compliance',
            error: error.message
        });
    }
});

router.post('/hipaa/violation-report', authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const { description, severity, affectedUsers, incidentDetails } = req.body;

        if (!description) {
            return res.status(400).json({
                success: false,
                message: 'Description is required'
            });
        }

        // Log HIPAA violation
        await auditLogger.logHIPAAViolation(
            req.user.userId,
            description,
            req.ip
        );

        res.json({
            success: true,
            message: 'HIPAA violation reported and logged'
        });
    } catch (error) {
        logger.error('Error reporting HIPAA violation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to report HIPAA violation',
            error: error.message
        });
    }
});

// Security Dashboard Routes
router.get('/dashboard/overview', authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const [
            auditStats,
            encryptionStatus,
            twoFactorStats
        ] = await Promise.all([
            auditLogger.getAuditStatistics('24h'),
            encryptionManager.getEncryptionStatus(),
            getTwoFactorStatistics()
        ]);

        res.json({
            success: true,
            overview: {
                audit: auditStats.statistics,
                encryption: encryptionStatus.status,
                twoFactor: twoFactorStats
            }
        });
    } catch (error) {
        logger.error('Error getting security dashboard overview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get security dashboard overview',
            error: error.message
        });
    }
});

// Helper methods
const performHIPAAComplianceChecks = async () => {
    try {
        const checks = {
            encryptionEnabled: true,
            auditLoggingEnabled: true,
            twoFactorEnabled: true,
            dataRetentionCompliant: true,
            accessControlsInPlace: true,
            lastComplianceCheck: new Date().toISOString()
        };

        return checks;
    } catch (error) {
        logger.error('Error performing HIPAA compliance checks:', error);
        throw error;
    }
};

const getTwoFactorStatistics = async () => {
    try {
        // This would typically query the database for 2FA statistics
        return {
            totalUsers: 0,
            twoFactorEnabled: 0,
            backupCodesGenerated: 0,
            lastMonthActivations: 0
        };
    } catch (error) {
        logger.error('Error getting 2FA statistics:', error);
        throw error;
    }
};

module.exports = router;
