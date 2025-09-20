const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { securityConfig, createRateLimit } = require('../middlewares/security');
const { auditLogger } = require('../middlewares/audit');
const securityController = require('../controllers/securityController');

// Apply rate limiting to all security routes
router.use(createRateLimit(15 * 60 * 1000, 20, 'Too many security requests'));

// All routes require authentication
router.use(authenticateToken);

// 2FA Setup and Management
router.post('/2fa/setup', async (req, res) => {
  try {
    await auditLogger.logSecurityEvent(req.user.id, '2FA_SETUP_ATTEMPT', {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await securityController.setupTwoFactor(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error setting up 2FA'
    });
  }
});

router.post('/2fa/verify', async (req, res) => {
  try {
    await auditLogger.logSecurityEvent(req.user.id, '2FA_VERIFICATION_ATTEMPT', {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await securityController.verifyTwoFactor(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying 2FA'
    });
  }
});

router.post('/2fa/disable', async (req, res) => {
  try {
    await auditLogger.logSecurityEvent(req.user.id, '2FA_DISABLE_ATTEMPT', {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await securityController.disableTwoFactor(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error disabling 2FA'
    });
  }
});

// Password Management
router.post('/password/change', async (req, res) => {
  try {
    await auditLogger.logSecurityEvent(req.user.id, 'PASSWORD_CHANGE_ATTEMPT', {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await securityController.changePassword(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
});

router.post('/password/reset/request',
  createRateLimit(60 * 60 * 1000, 3, 'Too many password reset requests'),
  async (req, res) => {
    try {
      await auditLogger.logSecurityEvent(null, 'PASSWORD_RESET_REQUEST', {
        email: req.body.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      await securityController.requestPasswordReset(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error requesting password reset'
      });
    }
  }
);

router.post('/password/reset/confirm', async (req, res) => {
  try {
    await auditLogger.logSecurityEvent(null, 'PASSWORD_RESET_CONFIRM', {
      token: req.body.token ? 'provided' : 'missing',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await securityController.resetPassword(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
});

// Security Settings
router.get('/settings', async (req, res) => {
  try {
    await auditLogger.logDataAccess(req.user.id, 'security_settings', null, 'READ', {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await securityController.getSecuritySettings(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting security settings'
    });
  }
});

// Audit Logs (Admin only)
router.get('/audit-logs', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    await auditLogger.logDataAccess(req.user.id, 'audit_logs', null, 'READ', {
      filters: req.query,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    const logs = await auditLogger.getAuditLogs(req.query);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting audit logs'
    });
  }
});

// Audit Report (Admin only)
router.get('/audit-report', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    await auditLogger.logDataAccess(req.user.id, 'audit_report', null, 'READ', {
      filters: req.query,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    const report = await auditLogger.generateAuditReport(req.query);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating audit report'
    });
  }
});

// Security Configuration (Admin only)
router.get('/config', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    await auditLogger.logDataAccess(req.user.id, 'security_config', null, 'READ', {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Return sanitized security configuration
    const config = {
      password: {
        minLength: securityConfig.password.minLength,
        maxLength: securityConfig.password.maxLength,
        requireUppercase: securityConfig.password.requireUppercase,
        requireLowercase: securityConfig.password.requireLowercase,
        requireNumbers: securityConfig.password.requireNumbers,
        requireSpecialChars: securityConfig.password.requireSpecialChars
      },
      twoFactor: {
        issuer: securityConfig.twoFactor.issuer,
        algorithm: securityConfig.twoFactor.algorithm,
        digits: securityConfig.twoFactor.digits,
        period: securityConfig.twoFactor.period
      },
      session: {
        maxAge: securityConfig.session.maxAge,
        secure: securityConfig.session.secure,
        httpOnly: securityConfig.session.httpOnly,
        sameSite: securityConfig.session.sameSite
      }
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting security configuration'
    });
  }
});

// Export audit logs (Admin only)
router.get('/audit-logs/export', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    await auditLogger.logDataAccess(req.user.id, 'audit_logs', null, 'EXPORT', {
      filters: req.query,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    const logs = await auditLogger.getAuditLogs({ ...req.query, limit: 10000 });

    // Convert to CSV format
    const csvHeaders = [
      'ID', 'User ID', 'User Name', 'User Email', 'Action', 'Resource',
      'Resource ID', 'IP Address', 'User Agent', 'Success', 'Severity', 'Created At'
    ];

    const csvRows = logs.map(log => [
      log.id,
      log.userId || '',
      log.userName || '',
      log.userEmail || '',
      log.action,
      log.resource,
      log.resourceId || '',
      log.ipAddress || '',
      log.userAgent || '',
      log.success,
      log.severity,
      log.createdAt
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting audit logs'
    });
  }
});

module.exports = router;
