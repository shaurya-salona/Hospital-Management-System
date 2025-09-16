const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { logger, contextLogger } = require('../config/logger');
const { config } = require('../config/config');

// Health check service
class HealthCheckService {
  constructor() {
    this.startTime = Date.now();
    this.checks = {
      database: this.checkDatabase.bind(this),
      memory: this.checkMemory.bind(this),
      disk: this.checkDisk.bind(this),
      external: this.checkExternalServices.bind(this)
    };
  }

  // Database health check
  async checkDatabase() {
    const start = Date.now();
    
    try {
      // Create a test connection
      const testPool = new Pool({
        ...config.database,
        max: 1,
        connectionTimeoutMillis: 5000
      });

      // Test basic connectivity
      const client = await testPool.connect();
      await client.query('SELECT 1');
      client.release();
      
      // Test connection pool stats
      const stats = {
        totalConnections: testPool.totalCount,
        idleConnections: testPool.idleCount,
        waitingClients: testPool.waitingCount
      };

      await testPool.end();

      const responseTime = Date.now() - start;

      return {
        status: 'healthy',
        responseTime,
        details: {
          host: config.database.host,
          port: config.database.port,
          database: config.database.database,
          ...stats
        }
      };

    } catch (error) {
      const responseTime = Date.now() - start;
      
      logger.error('Database health check failed', {
        error: error.message,
        responseTime,
        host: config.database.host
      });

      return {
        status: 'unhealthy',
        responseTime,
        error: error.message,
        details: {
          host: config.database.host,
          port: config.database.port
        }
      };
    }
  }

  // Memory health check
  checkMemory() {
    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    
    const usedMemoryMB = Math.round(memUsage.rss / 1024 / 1024);
    const totalMemoryMB = Math.round(totalMemory / 1024 / 1024);
    const freeMemoryMB = Math.round(freeMemory / 1024 / 1024);
    const memoryUsagePercent = Math.round((memUsage.rss / totalMemory) * 100);

    // Consider memory unhealthy if usage is above 90%
    const status = memoryUsagePercent > 90 ? 'unhealthy' : 'healthy';

    return {
      status,
      details: {
        processMemory: {
          rss: `${usedMemoryMB}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
        },
        systemMemory: {
          total: `${totalMemoryMB}MB`,
          free: `${freeMemoryMB}MB`,
          used: `${totalMemoryMB - freeMemoryMB}MB`,
          usagePercent: `${memoryUsagePercent}%`
        }
      }
    };
  }

  // Disk space health check
  checkDisk() {
    try {
      const fs = require('fs');
      const stats = fs.statSync(process.cwd());
      
      // This is a basic check - in production, you'd want more sophisticated disk monitoring
      return {
        status: 'healthy',
        details: {
          path: process.cwd(),
          accessible: true
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        details: {
          path: process.cwd(),
          accessible: false
        }
      };
    }
  }

  // External services health check
  async checkExternalServices() {
    const services = [];

    // Check email service if configured
    if (config.email.host && config.email.host !== 'localhost') {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransporter(config.email);
        await transporter.verify();
        
        services.push({
          name: 'email',
          status: 'healthy',
          host: config.email.host
        });
      } catch (error) {
        services.push({
          name: 'email',
          status: 'unhealthy',
          host: config.email.host,
          error: error.message
        });
      }
    }

    // Check Redis if configured
    if (config.redis.host && config.redis.host !== 'localhost') {
      try {
        const redis = require('redis');
        const client = redis.createClient(config.redis);
        await client.connect();
        await client.ping();
        await client.disconnect();
        
        services.push({
          name: 'redis',
          status: 'healthy',
          host: config.redis.host
        });
      } catch (error) {
        services.push({
          name: 'redis',
          status: 'unhealthy',
          host: config.redis.host,
          error: error.message
        });
      }
    }

    const overallStatus = services.every(s => s.status === 'healthy') ? 'healthy' : 'degraded';

    return {
      status: overallStatus,
      services
    };
  }

  // Get system uptime
  getUptime() {
    return {
      process: Math.floor((Date.now() - this.startTime) / 1000),
      system: Math.floor(require('os').uptime())
    };
  }

  // Get CPU usage
  getCpuUsage() {
    const cpus = require('os').cpus();
    const loadAvg = require('os').loadavg();
    
    return {
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      loadAverage: {
        '1min': loadAvg[0],
        '5min': loadAvg[1],
        '15min': loadAvg[2]
      }
    };
  }

  // Run all health checks
  async runAllChecks() {
    const results = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      uptime: this.getUptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.env,
      checks: {}
    };

    // Run all checks in parallel
    const checkPromises = Object.entries(this.checks).map(async ([name, checkFn]) => {
      try {
        const result = await checkFn();
        return [name, result];
      } catch (error) {
        return [name, {
          status: 'unhealthy',
          error: error.message
        }];
      }
    });

    const checkResults = await Promise.all(checkPromises);
    
    // Collect results
    for (const [name, result] of checkResults) {
      results.checks[name] = result;
    }

    // Determine overall status
    const unhealthyChecks = Object.values(results.checks).filter(check => check.status === 'unhealthy');
    const degradedChecks = Object.values(results.checks).filter(check => check.status === 'degraded');

    if (unhealthyChecks.length > 0) {
      results.status = 'unhealthy';
    } else if (degradedChecks.length > 0) {
      results.status = 'degraded';
    }

    // Add system metrics
    results.metrics = {
      memory: this.checkMemory().details,
      cpu: this.getCpuUsage()
    };

    return results;
  }
}

const healthService = new HealthCheckService();

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health Check]
 *     summary: Basic health check
 *     description: Quick health status check
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is unhealthy
 */
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    const healthStatus = await healthService.runAllChecks();
    const responseTime = Date.now() - startTime;

    // Log health check
    contextLogger.api('/health', 'GET', {
      status: healthStatus.status,
      responseTime: `${responseTime}ms`,
      checks: Object.keys(healthStatus.checks).length
    });

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      ...healthStatus,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     tags: [Health Check]
 *     summary: Readiness check
 *     description: Check if the service is ready to accept requests
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', async (req, res) => {
  try {
    // Check critical dependencies only
    const dbCheck = await healthService.checkDatabase();
    
    const isReady = dbCheck.status === 'healthy';
    const statusCode = isReady ? 200 : 503;

    res.status(statusCode).json({
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbCheck
      }
    });

  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     tags: [Health Check]
 *     summary: Liveness check
 *     description: Check if the service is alive (for Kubernetes liveness probes)
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/live', (req, res) => {
  // Simple liveness check - just return OK if the process is running
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: healthService.getUptime().process
  });
});

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     tags: [Health Check]
 *     summary: Detailed health check
 *     description: Comprehensive health check with all metrics
 *     responses:
 *       200:
 *         description: Detailed health information
 */
router.get('/detailed', async (req, res) => {
  try {
    const healthStatus = await healthService.runAllChecks();
    
    // Add additional detailed metrics
    const detailed = {
      ...healthStatus,
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.versions.node,
        v8Version: process.versions.v8
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale
      }
    };

    res.status(200).json(detailed);

  } catch (error) {
    logger.error('Detailed health check failed', { error: error.message });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /health/metrics:
 *   get:
 *     tags: [Health Check]
 *     summary: System metrics
 *     description: Get system performance metrics
 *     responses:
 *       200:
 *         description: System metrics
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      memory: healthService.checkMemory().details,
      cpu: healthService.getCpuUsage(),
      uptime: healthService.getUptime(),
      eventLoop: {
        delay: 0 // You could implement event loop delay measurement here
      }
    };

    res.status(200).json(metrics);

  } catch (error) {
    logger.error('Metrics check failed', { error: error.message });
    
    res.status(500).json({
      error: 'Metrics check failed',
      details: error.message
    });
  }
});

module.exports = router;

