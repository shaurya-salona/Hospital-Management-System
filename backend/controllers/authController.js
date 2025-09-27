const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Use centralized database manager
const db = require('../config/database-manager');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');

class AuthController {
  // User login
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Enhanced input validation
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      // Input sanitization
      const sanitizedUsername = username.trim().toLowerCase();
      const sanitizedPassword = password.trim();

      // Password strength validation
      if (sanitizedPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long'
        });
      }

      // Check for account lockout
      const lockoutQuery = `
        SELECT failed_login_attempts, is_locked, locked_until
        FROM users
        WHERE (username = $1 OR email = $1) AND is_active = true
      `;

      const lockoutResult = await db.query(lockoutQuery, [sanitizedUsername]);

      if (lockoutResult.rows.length > 0) {
        const user = lockoutResult.rows[0];

        // Check if account is locked
        if (user.is_locked) {
          return res.status(423).json({
            success: false,
            message: 'Account is locked. Please contact administrator.'
          });
        }

        // Check if account is temporarily locked due to failed attempts
        if (user.locked_until && new Date() < new Date(user.locked_until)) {
          return res.status(423).json({
            success: false,
            message: 'Account temporarily locked due to multiple failed attempts'
          });
        }
      }

      // Find user in database
      const userQuery = `
        SELECT u.*, s.employee_id, s.department, s.specialization
        FROM users u
        LEFT JOIN staff s ON u.id = s.user_id
        WHERE (u.username = $1 OR u.email = $1) AND u.is_active = true
      `;

      const userResult = await db.query(userQuery, [sanitizedUsername]);

      if (userResult.rows.length === 0) {
        // Log failed login attempt
        console.warn(`Failed login attempt for username: ${sanitizedUsername}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const user = userResult.rows[0];

      // Verify password with timing attack protection
      const isValidPassword = await bcrypt.compare(sanitizedPassword, user.password_hash);

      if (!isValidPassword) {
        // Increment failed login attempts
        const updateQuery = `
          UPDATE users
          SET failed_login_attempts = failed_login_attempts + 1,
              locked_until = CASE
                WHEN failed_login_attempts >= 4 THEN NOW() + INTERVAL '15 minutes'
                ELSE locked_until
              END
          WHERE id = $1
        `;

        await db.query(updateQuery, [user.id]);

        // Log failed login attempt
        console.warn(`Failed login attempt for user: ${user.username}`, {
          userId: user.id,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          failedAttempts: user.failed_login_attempts + 1
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Reset failed login attempts on successful login
      if (user.failed_login_attempts > 0) {
        const resetQuery = `
          UPDATE users
          SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW()
          WHERE id = $1
        `;
        await db.query(resetQuery, [user.id]);
      } else {
        // Update last login timestamp
        const updateLoginQuery = `UPDATE users SET last_login = NOW() WHERE id = $1`;
        await db.query(updateLoginQuery, [user.id]);
      }

      // Generate JWT token with shorter expiration
      const token = generateAccessToken({
        userId: user.id,
        username: user.username,
        role: user.role
      });

      // Log successful login
      console.info(`User ${user.username} logged in successfully`, {
        userId: user.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });

      // Remove sensitive data
      const { password_hash, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          token,
          role: user.role
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;

      // Check if we're in demo mode
      if (db.isDemoMode && db.isDemoMode()) {
        // Use demo data
        const demoData = db.getDemoData();
        if (demoData && demoData.users) {
          const user = demoData.users.find(u => u.id === userId);
          if (user) {
            const { password_hash, ...userWithoutPassword } = user;
            return res.json({
              success: true,
              data: userWithoutPassword
            });
          }
        }
      } else {
        // Use PostgreSQL
        const userQuery = `
          SELECT u.*, s.employee_id, s.department, s.specialization
          FROM users u
          LEFT JOIN staff s ON u.id = s.user_id
          WHERE u.id = $1 AND u.is_active = true
        `;

        const userResult = await db.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        const user = userResult.rows[0];
        const { password_hash, ...userWithoutPassword } = user;

        return res.json({
          success: true,
          data: userWithoutPassword
        });
      }

      // If we get here, user not found
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // User logout
  async logout(req, res) {
    try {
      const userId = req.user?.userId;
      const username = req.user?.username;

      // Log logout event
      if (userId && username) {
        console.info(`User ${username} logged out`, {
          userId: userId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        });
      }

      // In a production environment, you should:
      // 1. Add the token to a blacklist
      // 2. Store blacklisted tokens in Redis or database
      // 3. Check blacklist in JWT middleware

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Generate new access token
      const newToken = jwt.sign(
        {
          userId: decoded.userId,
          username: decoded.username,
          role: decoded.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.json({
        success: true,
        data: {
          token: newToken
        }
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }
}

module.exports = new AuthController();
