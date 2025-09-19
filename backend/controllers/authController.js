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

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      // Find user in database
      const userQuery = `
        SELECT u.*, s.employee_id, s.department, s.specialization
        FROM users u
        LEFT JOIN staff s ON u.id = s.user_id
        WHERE u.username = $1 AND u.is_active = true
      `;
      
      const userResult = await db.query(userQuery, [username]);
      
      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const user = userResult.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = generateAccessToken({
        userId: user.id, 
        username: user.username, 
        role: user.role 
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
      // In a real application, you might want to blacklist the token
      // For now, we'll just return a success message
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
