const { logger } = require('../config/logger');

class AuditLogger {
  constructor() {
    this.db = require('../config/database-manager');
  }

  // Log audit event to database
  async logEvent(eventData) {
    try {
      const {
        userId,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
        success = true,
        severity = 'INFO'
      } = eventData;

      const query = `
        INSERT INTO audit_logs (
          user_id, action, resource, resource_id, details,
          ip_address, user_agent, success, severity, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        RETURNING id
      `;

      const values = [
        userId,
        action,
        resource,
        resourceId,
        JSON.stringify(details),
        ipAddress,
        userAgent,
        success,
        severity
      ];

      const result = await this.db.query(query, values);

      // Also log to application logs
      logger.info('Audit Event', {
        auditId: result.rows[0].id,
        ...eventData,
        timestamp: new Date().toISOString()
      });

      return result.rows[0].id;
    } catch (error) {
      logger.error('Error logging audit event', {
        error: error.message,
        eventData
      });
      throw error;
    }
  }

  // Log authentication events
  async logAuthEvent(userId, action, success, details = {}) {
    return this.logEvent({
      userId,
      action: `AUTH_${action}`,
      resource: 'authentication',
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      success,
      severity: success ? 'INFO' : 'WARNING'
    });
  }

  // Log data access events (HIPAA compliance)
  async logDataAccess(userId, resource, resourceId, action, details = {}) {
    return this.logEvent({
      userId,
      action: `DATA_${action}`,
      resource,
      resourceId,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      success: true,
      severity: 'INFO'
    });
  }

  // Log data modification events
  async logDataModification(userId, resource, resourceId, action, details = {}) {
    return this.logEvent({
      userId,
      action: `MODIFY_${action}`,
      resource,
      resourceId,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      success: true,
      severity: 'INFO'
    });
  }

  // Log security events
  async logSecurityEvent(userId, action, details = {}) {
    return this.logEvent({
      userId,
      action: `SECURITY_${action}`,
      resource: 'security',
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      success: false,
      severity: 'WARNING'
    });
  }

  // Log system events
  async logSystemEvent(action, details = {}) {
    return this.logEvent({
      userId: null,
      action: `SYSTEM_${action}`,
      resource: 'system',
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      success: true,
      severity: 'INFO'
    });
  }

  // Get audit logs with filtering
  async getAuditLogs(filters = {}) {
    try {
      const {
        userId,
        action,
        resource,
        startDate,
        endDate,
        severity,
        page = 1,
        limit = 50
      } = filters;

      let query = `
        SELECT al.*, u.first_name, u.last_name, u.email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;

      const queryParams = [];
      let paramCount = 0;

      if (userId) {
        paramCount++;
        query += ` AND al.user_id = $${paramCount}`;
        queryParams.push(userId);
      }

      if (action) {
        paramCount++;
        query += ` AND al.action ILIKE $${paramCount}`;
        queryParams.push(`%${action}%`);
      }

      if (resource) {
        paramCount++;
        query += ` AND al.resource = $${paramCount}`;
        queryParams.push(resource);
      }

      if (startDate) {
        paramCount++;
        query += ` AND al.created_at >= $${paramCount}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND al.created_at <= $${paramCount}`;
        queryParams.push(endDate);
      }

      if (severity) {
        paramCount++;
        query += ` AND al.severity = $${paramCount}`;
        queryParams.push(severity);
      }

      // Add pagination
      query += ` ORDER BY al.created_at DESC`;

      paramCount++;
      query += ` LIMIT $${paramCount}`;
      queryParams.push(parseInt(limit));

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      queryParams.push((parseInt(page) - 1) * parseInt(limit));

      const result = await this.db.query(query, queryParams);

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        userName: row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : null,
        userEmail: row.email,
        action: row.action,
        resource: row.resource,
        resourceId: row.resource_id,
        details: JSON.parse(row.details),
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        success: row.success,
        severity: row.severity,
        createdAt: row.created_at
      }));
    } catch (error) {
      logger.error('Error getting audit logs', { error: error.message });
      throw error;
    }
  }

  // Generate audit report
  async generateAuditReport(filters = {}) {
    try {
      const {
        startDate,
        endDate,
        userId,
        resource
      } = filters;

      let query = `
        SELECT
          al.action,
          al.resource,
          al.severity,
          COUNT(*) as count,
          COUNT(CASE WHEN al.success = true THEN 1 END) as success_count,
          COUNT(CASE WHEN al.success = false THEN 1 END) as failure_count
        FROM audit_logs al
        WHERE 1=1
      `;

      const queryParams = [];
      let paramCount = 0;

      if (startDate) {
        paramCount++;
        query += ` AND al.created_at >= $${paramCount}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND al.created_at <= $${paramCount}`;
        queryParams.push(endDate);
      }

      if (userId) {
        paramCount++;
        query += ` AND al.user_id = $${paramCount}`;
        queryParams.push(userId);
      }

      if (resource) {
        paramCount++;
        query += ` AND al.resource = $${paramCount}`;
        queryParams.push(resource);
      }

      query += `
        GROUP BY al.action, al.resource, al.severity
        ORDER BY count DESC
      `;

      const result = await this.db.query(query, queryParams);

      return result.rows.map(row => ({
        action: row.action,
        resource: row.resource,
        severity: row.severity,
        totalCount: parseInt(row.count),
        successCount: parseInt(row.success_count),
        failureCount: parseInt(row.failure_count)
      }));
    } catch (error) {
      logger.error('Error generating audit report', { error: error.message });
      throw error;
    }
  }
}

// Create singleton instance
const auditLogger = new AuditLogger();

// Middleware to automatically log requests
const auditMiddleware = (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    // Log the request after response is sent
    setImmediate(async () => {
      try {
        const userId = req.user?.id || null;
        const action = `${req.method}_${req.route?.path || req.path}`;
        const resource = req.route?.path?.split('/')[1] || 'unknown';
        const success = res.statusCode < 400;

        await auditLogger.logEvent({
          userId,
          action,
          resource,
          resourceId: req.params.id || null,
          details: {
            method: req.method,
            path: req.path,
            query: req.query,
            statusCode: res.statusCode,
            responseSize: data ? data.length : 0
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success,
          severity: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARNING' : 'INFO'
        });
      } catch (error) {
        logger.error('Error in audit middleware', { error: error.message });
      }
    });

    originalSend.call(this, data);
  };

  next();
};

module.exports = {
  auditLogger,
  auditMiddleware
};
