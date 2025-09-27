const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load configuration first
const { config } = require('./config/config');

// Initialize logging
const { logger, contextLogger, stream, setupProcessErrorHandlers } = require('./config/logger');

// Setup process error handlers
// setupProcessErrorHandlers();

// Initialize error handling
const {
  errorHandler,
  notFoundHandler,
  catchAsync
} = require('./middlewares/errorHandler');

// Initialize validation middleware
const { handleValidationErrors, sanitizeInput } = require('./middlewares/validation');

// Try to use PostgreSQL, fallback to demo database
let query;
try {
  logger.info('Attempting to load PostgreSQL database...');
  const db = require('./config/database');
  query = db.query;
  logger.info('✅ Using PostgreSQL database');
} catch (error) {
  logger.warn('⚠️ PostgreSQL not available, using demo database', { error: error.message });
  try {
    const demoDb = require('./config/demo-database');
    query = demoDb.query;
    logger.info('✅ Using demo database');
  } catch (demoError) {
    logger.error('❌ Failed to load demo database', { error: demoError.message });
    process.exit(1);
  }
}

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboards');
const patientRoutes = require('./routes/patients');
const userRoutes = require('./routes/users');
const appointmentRoutes = require('./routes/appointments');
const medicalRoutes = require('./routes/medical');
const billingRoutes = require('./routes/billing');
const inventoryRoutes = require('./routes/inventory');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const icuRoutes = require('./routes/icu');
const checkinRoutes = require('./routes/checkin');
const doctorRoutes = require('./routes/doctors');
const labRoutes = require('./routes/lab');
const drugInteractionRoutes = require('./routes/drug-interactions');
const counselingRoutes = require('./routes/counseling');
const pharmacyRoutes = require('./routes/pharmacy');
const patientPortalRoutes = require('./routes/patient-portal');
const healthRoutes = require('./routes/health');
const securityRoutes = require('./routes/security');
const securityEnhancedRoutes = require('./routes/security-enhanced');
const reportingRoutes = require('./routes/reporting');
const aiMLRoutes = require('./routes/ai-ml'); // NEW

// Initialize Swagger documentation
const { specs, swaggerUi } = require('./config/swagger');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.security.corsOrigin,
    methods: ["GET", "POST"]
  }
});

const PORT = config.port;

// Trust proxy for accurate IP addresses in production
if (config.env === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: config.env === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  } : false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path.startsWith('/health/');
  }
});
app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// HTTP request logging with Winston
app.use(morgan('combined', { stream }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - start;
    contextLogger.http(req, res, responseTime);
  });

  next();
});

// Input sanitization middleware
app.use(sanitizeInput);

// Body parsing middleware
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    // Log large payloads
    if (buf.length > 1024 * 1024) { // 1MB
      logger.warn('Large payload received', {
        size: buf.length,
        endpoint: req.originalUrl,
        ip: req.ip
      });
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Documentation (only in development or if explicitly enabled)
if (config.features.apiDocs) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'HMIS API Documentation'
  }));
  logger.info('📚 Swagger documentation available at /api-docs');
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/icu', icuRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/drug-interactions', drugInteractionRoutes);
app.use('/api/counseling', counselingRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/patient-portal', patientPortalRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/security-enhanced', securityEnhancedRoutes);
app.use('/api/reporting', reportingRoutes);
app.use('/api/ai-ml', aiMLRoutes); // NEW

// Health check routes
app.use('/health', healthRoutes);

// Initialize WebSocket Manager
const WebSocketManager = require('./websocket/websocket-manager');
const wsManager = new WebSocketManager(server);

// Legacy WebSocket handling for backward compatibility
io.on('connection', (socket) => {
  logger.info('🔌 New client connected', { socketId: socket.id, ip: socket.handshake.address });

  // Join user to their role-based room
  socket.on('join-room', (data) => {
    const { userId, role } = data;
    socket.join(`user-${userId}`);
    socket.join(`role-${role}`);

    logger.info('👤 User joined WebSocket rooms', {
      userId,
      role,
      socketId: socket.id,
      rooms: [`user-${userId}`, `role-${role}`]
    });

    // Log authentication event
    contextLogger.auth('websocket-join', { userId, role, socketId: socket.id });
  });

  // Handle appointment notifications
  socket.on('appointment-created', (data) => {
    // Notify relevant users about new appointment
    io.to(`role-doctor`).emit('new-appointment', data);
    io.to(`role-receptionist`).emit('new-appointment', data);
  });

  // Handle prescription notifications
  socket.on('prescription-created', (data) => {
    // Notify pharmacist about new prescription
    io.to(`role-pharmacist`).emit('new-prescription', data);
  });

  // Handle lab result notifications
  socket.on('lab-result-created', (data) => {
    // Notify doctor and patient about lab results
    io.to(`user-${data.doctorId}`).emit('new-lab-result', data);
    io.to(`user-${data.patientId}`).emit('new-lab-result', data);
  });

  // Handle billing notifications
  socket.on('billing-created', (data) => {
    // Notify patient about new bill
    io.to(`user-${data.patientId}`).emit('new-bill', data);
  });

  // Handle general notifications
  socket.on('send-notification', (data) => {
    const { userId, message, type } = data;
    io.to(`user-${userId}`).emit('notification', { message, type });
  });

  socket.on('disconnect', (reason) => {
    logger.info('🔌 Client disconnected', {
      socketId: socket.id,
      reason,
      ip: socket.handshake.address
    });
  });
});

// Make io available globally
global.io = io;

// 404 handler - must be after all routes
app.use('*', notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);

  server.close(() => {
    logger.info('HTTP server closed');

    // Close database connections if available
    if (global.db && global.db.end) {
      global.db.end(() => {
        logger.info('Database connections closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 HMIS Backend Server running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  logger.info(`🌍 Environment: ${config.env}`);
  logger.info(`🔌 WebSocket server initialized`);

  if (config.features.apiDocs) {
    logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  }

  // Log configuration summary
  logger.info('Server configuration', {
    port: PORT,
    environment: config.env,
    database: config.database.host,
    corsOrigins: config.security.corsOrigin,
    rateLimitMax: config.security.rateLimitMaxRequests,
    features: config.features
  });
});

module.exports = app;
