/**
 * Comprehensive Audit Logging System for HMIS
 * Provides detailed audit trails for security and compliance
 */

const { logger } = require('../config/logger');
const { query } = require('../config/database');
const crypto = require('crypto');

class AuditLogger {
    constructor() {
        this.eventTypes = {
            // Authentication Events
            LOGIN_SUCCESS: 'login_success',
            LOGIN_FAILED: 'login_failed',
            LOGOUT: 'logout',
            PASSWORD_CHANGE: 'password_change',
            PASSWORD_RESET: 'password_reset',

            // 2FA Events
            TOTP_SETUP: 'totp_setup',
            TOTP_VERIFY_SUCCESS: 'totp_verify_success',
            TOTP_VERIFY_FAILED: 'totp_verify_failed',
            BACKUP_CODE_USED: 'backup_code_used',
            SMS_2FA_SENT: 'sms_2fa_sent',
            EMAIL_2FA_SENT: 'email_2fa_sent',

            // Data Access Events
            PATIENT_VIEW: 'patient_view',
            PATIENT_CREATE: 'patient_create',
            PATIENT_UPDATE: 'patient_update',
            PATIENT_DELETE: 'patient_delete',
            MEDICAL_RECORD_VIEW: 'medical_record_view',
            MEDICAL_RECORD_CREATE: 'medical_record_create',
            MEDICAL_RECORD_UPDATE: 'medical_record_update',
            MEDICAL_RECORD_DELETE: 'medical_record_delete',

            // Appointment Events
            APPOINTMENT_CREATE: 'appointment_create',
            APPOINTMENT_UPDATE: 'appointment_update',
            APPOINTMENT_CANCEL: 'appointment_cancel',
            APPOINTMENT_VIEW: 'appointment_view',

            // Billing Events
            BILL_CREATE: 'bill_create',
            BILL_UPDATE: 'bill_update',
            BILL_DELETE: 'bill_delete',
            PAYMENT_PROCESSED: 'payment_processed',
            INSURANCE_CLAIM_CREATE: 'insurance_claim_create',

            // System Events
            USER_CREATE: 'user_create',
            USER_UPDATE: 'user_update',
            USER_DELETE: 'user_delete',
            ROLE_CHANGE: 'role_change',
            PERMISSION_CHANGE: 'permission_change',
            SYSTEM_CONFIG_CHANGE: 'system_config_change',

            // Security Events
            SUSPICIOUS_ACTIVITY: 'suspicious_activity',
            MULTIPLE_FAILED_LOGINS: 'multiple_failed_logins',
            UNAUTHORIZED_ACCESS: 'unauthorized_access',
            DATA_EXPORT: 'data_export',
            DATA_IMPORT: 'data_import',
            BACKUP_CREATED: 'backup_created',
            BACKUP_RESTORED: 'backup_restored',

            // Compliance Events
            HIPAA_VIOLATION: 'hipaa_violation',
            DATA_BREACH: 'data_breach',
            PRIVACY_VIOLATION: 'privacy_violation',
            CONSENT_GIVEN: 'consent_given',
            CONSENT_WITHDRAWN: 'consent_withdrawn'
        };

        this.severityLevels = {
            LOW: 'low',
            MEDIUM: 'medium',
            HIGH: 'high',
            CRITICAL: 'critical'
        };

        this.init();
    }

    init() {
        logger.info('Audit Logger system initialized');
    }

    // Main audit logging method
    async logEvent(eventData) {
        try {
            const {
                userId,
                eventType,
                description,
                severity = this.severityLevels.MEDIUM,
                ipAddress,
                userAgent,
                resourceId,
                resourceType,
                oldValues,
                newValues,
                metadata = {}
            } = eventData;

            // Validate required fields
            if (!eventType || !description) {
                throw new Error('Event type and description are required');
            }

            // Create audit log entry
            const auditEntry = {
                userId: userId || null,
                eventType,
                description,
                severity,
                ipAddress: ipAddress || null,
                userAgent: userAgent || null,
                resourceId: resourceId || null,
                resourceType: resourceType || null,
                oldValues: oldValues ? JSON.stringify(oldValues) : null,
                newValues: newValues ? JSON.stringify(newValues) : null,
                metadata: JSON.stringify(metadata),
                timestamp: new Date(),
                hash: this.generateEventHash(eventData)
            };

            // Store in database
            await this.storeAuditLog(auditEntry);

            // Log to application logger
            this.logToApplicationLogger(auditEntry);

            // Check for suspicious activity
            await this.checkSuspiciousActivity(auditEntry);

            return { success: true, auditId: auditEntry.hash };

        } catch (error) {
            logger.error('Error logging audit event:', error);
            throw error;
        }
    }

    // Store audit log in database
    async storeAuditLog(auditEntry) {
        try {
            await query(
                `INSERT INTO security_audit_logs (
                    user_id, event_type, description, severity, ip_address,
                    user_agent, resource_id, resource_type, old_values,
                    new_values, metadata, created_at, event_hash
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [
                    auditEntry.userId,
                    auditEntry.eventType,
                    auditEntry.description,
                    auditEntry.severity,
                    auditEntry.ipAddress,
                    auditEntry.userAgent,
                    auditEntry.resourceId,
                    auditEntry.resourceType,
                    auditEntry.oldValues,
                    auditEntry.newValues,
                    auditEntry.metadata,
                    auditEntry.timestamp,
                    auditEntry.hash
                ]
            );

            logger.info(`Audit log stored: ${auditEntry.eventType} for user ${auditEntry.userId}`);
        } catch (error) {
            logger.error('Error storing audit log:', error);
            throw error;
        }
    }

    // Log to application logger
    logToApplicationLogger(auditEntry) {
        const logMessage = `AUDIT: ${auditEntry.eventType} - ${auditEntry.description} (User: ${auditEntry.userId}, IP: ${auditEntry.ipAddress})`;

        switch (auditEntry.severity) {
            case this.severityLevels.CRITICAL:
                logger.error(logMessage, auditEntry);
                break;
            case this.severityLevels.HIGH:
                logger.warn(logMessage, auditEntry);
                break;
            case this.severityLevels.MEDIUM:
                logger.info(logMessage, auditEntry);
                break;
            case this.severityLevels.LOW:
                logger.debug(logMessage, auditEntry);
                break;
        }
    }

    // Generate event hash for integrity verification
    generateEventHash(eventData) {
        const hashInput = JSON.stringify({
            userId: eventData.userId,
            eventType: eventData.eventType,
            timestamp: eventData.timestamp,
            ipAddress: eventData.ipAddress
        });

        return crypto.createHash('sha256').update(hashInput).digest('hex');
    }

    // Check for suspicious activity patterns
    async checkSuspiciousActivity(auditEntry) {
        try {
            // Check for multiple failed logins
            if (auditEntry.eventType === this.eventTypes.LOGIN_FAILED) {
                await this.checkMultipleFailedLogins(auditEntry.userId, auditEntry.ipAddress);
            }

            // Check for unusual access patterns
            if (auditEntry.eventType === this.eventTypes.PATIENT_VIEW) {
                await this.checkUnusualPatientAccess(auditEntry.userId, auditEntry.resourceId);
            }

            // Check for data export patterns
            if (auditEntry.eventType === this.eventTypes.DATA_EXPORT) {
                await this.checkDataExportPatterns(auditEntry.userId);
            }

        } catch (error) {
            logger.error('Error checking suspicious activity:', error);
        }
    }

    // Check for multiple failed logins
    async checkMultipleFailedLogins(userId, ipAddress) {
        try {
            const timeWindow = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes

            const result = await query(
                `SELECT COUNT(*) as failed_attempts
                 FROM security_audit_logs
                 WHERE (user_id = $1 OR ip_address = $2)
                 AND event_type = $3
                 AND created_at > $4`,
                [userId, ipAddress, this.eventTypes.LOGIN_FAILED, timeWindow]
            );

            const failedAttempts = parseInt(result.rows[0].failed_attempts);

            if (failedAttempts >= 5) {
                await this.logEvent({
                    userId,
                    eventType: this.eventTypes.MULTIPLE_FAILED_LOGINS,
                    description: `Multiple failed login attempts detected: ${failedAttempts} attempts`,
                    severity: this.severityLevels.HIGH,
                    ipAddress,
                    metadata: { failedAttempts, timeWindow: timeWindow.toISOString() }
                });
            }

        } catch (error) {
            logger.error('Error checking multiple failed logins:', error);
        }
    }

    // Check for unusual patient access patterns
    async checkUnusualPatientAccess(userId, patientId) {
        try {
            const timeWindow = new Date(Date.now() - 60 * 60 * 1000); // 1 hour

            const result = await query(
                `SELECT COUNT(*) as access_count
                 FROM security_audit_logs
                 WHERE user_id = $1
                 AND event_type = $2
                 AND resource_id = $3
                 AND created_at > $4`,
                [userId, this.eventTypes.PATIENT_VIEW, patientId, timeWindow]
            );

            const accessCount = parseInt(result.rows[0].access_count);

            if (accessCount > 10) {
                await this.logEvent({
                    userId,
                    eventType: this.eventTypes.SUSPICIOUS_ACTIVITY,
                    description: `Unusual patient access pattern: ${accessCount} views in 1 hour`,
                    severity: this.severityLevels.MEDIUM,
                    resourceId: patientId,
                    resourceType: 'patient',
                    metadata: { accessCount, timeWindow: timeWindow.toISOString() }
                });
            }

        } catch (error) {
            logger.error('Error checking unusual patient access:', error);
        }
    }

    // Check for data export patterns
    async checkDataExportPatterns(userId) {
        try {
            const timeWindow = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

            const result = await query(
                `SELECT COUNT(*) as export_count
                 FROM security_audit_logs
                 WHERE user_id = $1
                 AND event_type = $2
                 AND created_at > $3`,
                [userId, this.eventTypes.DATA_EXPORT, timeWindow]
            );

            const exportCount = parseInt(result.rows[0].export_count);

            if (exportCount > 5) {
                await this.logEvent({
                    userId,
                    eventType: this.eventTypes.SUSPICIOUS_ACTIVITY,
                    description: `High data export activity: ${exportCount} exports in 24 hours`,
                    severity: this.severityLevels.HIGH,
                    metadata: { exportCount, timeWindow: timeWindow.toISOString() }
                });
            }

        } catch (error) {
            logger.error('Error checking data export patterns:', error);
        }
    }

    // Get audit logs with filtering
    async getAuditLogs(filters = {}) {
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
            } = filters;

            let queryText = `
                SELECT * FROM security_audit_logs
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 0;

            if (userId) {
                paramCount++;
                queryText += ` AND user_id = $${paramCount}`;
                params.push(userId);
            }

            if (eventType) {
                paramCount++;
                queryText += ` AND event_type = $${paramCount}`;
                params.push(eventType);
            }

            if (severity) {
                paramCount++;
                queryText += ` AND severity = $${paramCount}`;
                params.push(severity);
            }

            if (startDate) {
                paramCount++;
                queryText += ` AND created_at >= $${paramCount}`;
                params.push(startDate);
            }

            if (endDate) {
                paramCount++;
                queryText += ` AND created_at <= $${paramCount}`;
                params.push(endDate);
            }

            if (resourceType) {
                paramCount++;
                queryText += ` AND resource_type = $${paramCount}`;
                params.push(resourceType);
            }

            queryText += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            params.push(limit, offset);

            const result = await query(queryText, params);

            return {
                success: true,
                logs: result.rows,
                total: result.rows.length
            };

        } catch (error) {
            logger.error('Error getting audit logs:', error);
            throw error;
        }
    }

    // Get audit statistics
    async getAuditStatistics(timeRange = '24h') {
        try {
            let timeFilter;
            switch (timeRange) {
                case '1h':
                    timeFilter = new Date(Date.now() - 60 * 60 * 1000);
                    break;
                case '24h':
                    timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    timeFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    timeFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
            }

            const [
                totalEvents,
                eventsByType,
                eventsBySeverity,
                topUsers,
                suspiciousActivity
            ] = await Promise.all([
                query('SELECT COUNT(*) as total FROM security_audit_logs WHERE created_at > $1', [timeFilter]),
                query('SELECT event_type, COUNT(*) as count FROM security_audit_logs WHERE created_at > $1 GROUP BY event_type ORDER BY count DESC', [timeFilter]),
                query('SELECT severity, COUNT(*) as count FROM security_audit_logs WHERE created_at > $1 GROUP BY severity', [timeFilter]),
                query('SELECT user_id, COUNT(*) as count FROM security_audit_logs WHERE created_at > $1 GROUP BY user_id ORDER BY count DESC LIMIT 10', [timeFilter]),
                query('SELECT COUNT(*) as count FROM security_audit_logs WHERE event_type = $1 AND created_at > $2', [this.eventTypes.SUSPICIOUS_ACTIVITY, timeFilter])
            ]);

            return {
                success: true,
                statistics: {
                    totalEvents: parseInt(totalEvents.rows[0].total),
                    eventsByType: eventsByType.rows,
                    eventsBySeverity: eventsBySeverity.rows,
                    topUsers: topUsers.rows,
                    suspiciousActivity: parseInt(suspiciousActivity.rows[0].count),
                    timeRange
                }
            };

        } catch (error) {
            logger.error('Error getting audit statistics:', error);
            throw error;
        }
    }

    // Export audit logs
    async exportAuditLogs(filters = {}, format = 'json') {
        try {
            const result = await this.getAuditLogs(filters);

            switch (format) {
                case 'csv':
                    return this.exportToCSV(result.logs);
                case 'json':
                default:
                    return result;
            }

        } catch (error) {
            logger.error('Error exporting audit logs:', error);
            throw error;
        }
    }

    // Export to CSV format
    exportToCSV(logs) {
        const headers = [
            'Timestamp', 'User ID', 'Event Type', 'Description', 'Severity',
            'IP Address', 'Resource ID', 'Resource Type'
        ];

        const csvRows = [headers.join(',')];

        logs.forEach(log => {
            const row = [
                log.created_at,
                log.user_id || '',
                log.event_type,
                `"${log.description.replace(/"/g, '""')}"`,
                log.severity,
                log.ip_address || '',
                log.resource_id || '',
                log.resource_type || ''
            ];
            csvRows.push(row.join(','));
        });

        return {
            success: true,
            format: 'csv',
            data: csvRows.join('\n'),
            filename: `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
        };
    }

    // Convenience methods for common events
    async logLoginSuccess(userId, ipAddress, userAgent) {
        return await this.logEvent({
            userId,
            eventType: this.eventTypes.LOGIN_SUCCESS,
            description: 'User logged in successfully',
            severity: this.severityLevels.LOW,
            ipAddress,
            userAgent
        });
    }

    async logLoginFailed(userId, ipAddress, userAgent, reason) {
        return await this.logEvent({
            userId,
            eventType: this.eventTypes.LOGIN_FAILED,
            description: `Login failed: ${reason}`,
            severity: this.severityLevels.MEDIUM,
            ipAddress,
            userAgent
        });
    }

    async logPatientAccess(userId, patientId, action, ipAddress) {
        return await this.logEvent({
            userId,
            eventType: `patient_${action}`,
            description: `Patient ${action}: ${patientId}`,
            severity: this.severityLevels.MEDIUM,
            ipAddress,
            resourceId: patientId,
            resourceType: 'patient'
        });
    }

    async logDataExport(userId, exportType, recordCount, ipAddress) {
        return await this.logEvent({
            userId,
            eventType: this.eventTypes.DATA_EXPORT,
            description: `Data exported: ${exportType} (${recordCount} records)`,
            severity: this.severityLevels.HIGH,
            ipAddress,
            metadata: { exportType, recordCount }
        });
    }

    async logHIPAAViolation(userId, description, ipAddress) {
        return await this.logEvent({
            userId,
            eventType: this.eventTypes.HIPAA_VIOLATION,
            description: `HIPAA Violation: ${description}`,
            severity: this.severityLevels.CRITICAL,
            ipAddress
        });
    }
}

module.exports = AuditLogger;


