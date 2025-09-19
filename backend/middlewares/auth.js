const jwt = require('jsonwebtoken');

// Use centralized database manager
const db = require('../config/database-manager');
const { JWT_SECRET } = require('../config/jwt');
const query = db.query;

// JWT Authentication Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists and is active
    let user = null;
    
    if (db.isDemoMode && db.isDemoMode()) {
      // Use demo data
      const demoData = db.getDemoData();
      if (demoData && demoData.users) {
        user = demoData.users.find(u => u.id === decoded.userId);
      }
    } else {
      // Use PostgreSQL
      const userQuery = 'SELECT id, username, role, is_active FROM users WHERE id = $1';
      const userResult = await query(userQuery, [decoded.userId]);
      user = userResult.rows[0];
    }
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Add user info to request object
    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    } else {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

// Role-based Authorization Middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Admin only middleware
const adminOnly = authorize('admin');

// Doctor and Admin middleware
const doctorOrAdmin = authorize('doctor', 'admin');

// Staff only middleware (all staff roles except patient)
const staffOnly = authorize('admin', 'doctor', 'nurse', 'receptionist', 'pharmacist');

// Patient only middleware
const patientOnly = authorize('patient');

module.exports = {
  authenticateToken,
  authorize,
  adminOnly,
  doctorOrAdmin,
  staffOnly,
  patientOnly
};
