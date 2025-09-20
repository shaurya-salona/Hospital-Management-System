const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {
  validatePassword,
  generateTwoFactorSecret,
  generateQRCode,
  verifyTwoFactorToken,
  logSecurityEvent,
  encryptData,
  decryptData
} = require('../middlewares/security');
const { logger } = require('../config/logger');

class SecurityController {
  constructor() {
    this.db = require('../config/database-manager');
  }

  // Setup 2FA for user
  async setupTwoFactor(req, res) {
    try {
      const { userId } = req.user;

      // Check if user already has 2FA enabled
      const existingSecret = await this.db.query(
        'SELECT two_factor_secret FROM users WHERE id = $1',
        [userId]
      );

      if (existingSecret.rows[0]?.two_factor_secret) {
        return res.status(400).json({
          success: false,
          message: 'Two-factor authentication is already enabled'
        });
      }

      // Get user email for QR code
      const userResult = await this.db.query(
        'SELECT email FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userEmail = userResult.rows[0].email;

      // Generate 2FA secret
      const { secret, qrCodeUrl } = generateTwoFactorSecret(userEmail);
      const qrCodeDataUrl = await generateQRCode(qrCodeUrl);

      // Store secret temporarily (not activated yet)
      await this.db.query(
        'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
        [secret, userId]
      );

      logSecurityEvent('2FA_SETUP_INITIATED', {
        userId,
        userEmail
      });

      res.json({
        success: true,
        data: {
          secret,
          qrCodeUrl,
          qrCodeDataUrl,
          message: 'Scan the QR code with your authenticator app and verify with a token'
        }
      });
    } catch (error) {
      logger.error('Error setting up 2FA', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error setting up two-factor authentication'
      });
    }
  }

  // Verify and activate 2FA
  async verifyTwoFactor(req, res) {
    try {
      const { token } = req.body;
      const { userId } = req.user;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Verification token is required'
        });
      }

      // Get user's 2FA secret
      const userResult = await this.db.query(
        'SELECT two_factor_secret, email FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const { two_factor_secret, email } = userResult.rows[0];

      if (!two_factor_secret) {
        return res.status(400).json({
          success: false,
          message: 'Two-factor authentication is not set up'
        });
      }

      // Verify token
      const isValid = verifyTwoFactorToken(token, two_factor_secret);

      if (!isValid) {
        logSecurityEvent('2FA_VERIFICATION_FAILED', {
          userId,
          userEmail: email
        });

        return res.status(400).json({
          success: false,
          message: 'Invalid verification token'
        });
      }

      // Activate 2FA
      await this.db.query(
        'UPDATE users SET two_factor_enabled = true WHERE id = $1',
        [userId]
      );

      logSecurityEvent('2FA_ACTIVATED', {
        userId,
        userEmail: email
      });

      res.json({
        success: true,
        message: 'Two-factor authentication has been successfully enabled'
      });
    } catch (error) {
      logger.error('Error verifying 2FA', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error verifying two-factor authentication'
      });
    }
  }

  // Disable 2FA
  async disableTwoFactor(req, res) {
    try {
      const { password, token } = req.body;
      const { userId } = req.user;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required to disable 2FA'
        });
      }

      // Verify password
      const userResult = await this.db.query(
        'SELECT password_hash, two_factor_secret, email FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const { password_hash, two_factor_secret, email } = userResult.rows[0];

      const isPasswordValid = await bcrypt.compare(password, password_hash);
      if (!isPasswordValid) {
        logSecurityEvent('2FA_DISABLE_PASSWORD_FAILED', {
          userId,
          userEmail: email
        });

        return res.status(400).json({
          success: false,
          message: 'Invalid password'
        });
      }

      // If 2FA is enabled, require token
      if (two_factor_secret && token) {
        const isTokenValid = verifyTwoFactorToken(token, two_factor_secret);
        if (!isTokenValid) {
          logSecurityEvent('2FA_DISABLE_TOKEN_FAILED', {
            userId,
            userEmail: email
          });

          return res.status(400).json({
            success: false,
            message: 'Invalid 2FA token'
          });
        }
      }

      // Disable 2FA
      await this.db.query(
        'UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1',
        [userId]
      );

      logSecurityEvent('2FA_DISABLED', {
        userId,
        userEmail: email
      });

      res.json({
        success: true,
        message: 'Two-factor authentication has been disabled'
      });
    } catch (error) {
      logger.error('Error disabling 2FA', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error disabling two-factor authentication'
      });
    }
  }

  // Change password with security checks
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const { userId } = req.user;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors
        });
      }

      // Get current password hash
      const userResult = await this.db.query(
        'SELECT password_hash, email FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const { password_hash, email } = userResult.rows[0];

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, password_hash);
      if (!isCurrentPasswordValid) {
        logSecurityEvent('PASSWORD_CHANGE_FAILED', {
          userId,
          userEmail: email,
          reason: 'Invalid current password'
        });

        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Check if new password is different from current
      const isSamePassword = await bcrypt.compare(newPassword, password_hash);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: 'New password must be different from current password'
        });
      }

      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await this.db.query(
        'UPDATE users SET password_hash = $1, password_changed_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, userId]
      );

      logSecurityEvent('PASSWORD_CHANGED', {
        userId,
        userEmail: email
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Error changing password', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error changing password'
      });
    }
  }

  // Generate password reset token
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      // Check if user exists
      const userResult = await this.db.query(
        'SELECT id, email FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      if (userResult.rows.length === 0) {
        // Don't reveal if email exists or not
        return res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        });
      }

      const { id: userId } = userResult.rows[0];

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await this.db.query(
        'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
        [resetToken, resetTokenExpiry, userId]
      );

      logSecurityEvent('PASSWORD_RESET_REQUESTED', {
        userId,
        userEmail: email
      });

      // In a real application, you would send an email here
      // For now, we'll just return the token (remove this in production)
      res.json({
        success: true,
        message: 'Password reset link has been sent to your email',
        // Remove this in production - only for development
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      });
    } catch (error) {
      logger.error('Error requesting password reset', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error requesting password reset'
      });
    }
  }

  // Reset password with token
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Reset token and new password are required'
        });
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors
        });
      }

      // Find user with valid reset token
      const userResult = await this.db.query(
        'SELECT id, email, password_reset_expires FROM users WHERE password_reset_token = $1',
        [token]
      );

      if (userResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      const { id: userId, email, password_reset_expires } = userResult.rows[0];

      // Check if token is expired
      if (new Date() > new Date(password_reset_expires)) {
        await this.db.query(
          'UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = $1',
          [userId]
        );

        return res.status(400).json({
          success: false,
          message: 'Reset token has expired'
        });
      }

      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password and clear reset token
      await this.db.query(
        'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, password_changed_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, userId]
      );

      logSecurityEvent('PASSWORD_RESET_COMPLETED', {
        userId,
        userEmail: email
      });

      res.json({
        success: true,
        message: 'Password has been reset successfully'
      });
    } catch (error) {
      logger.error('Error resetting password', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error resetting password'
      });
    }
  }

  // Get security settings for user
  async getSecuritySettings(req, res) {
    try {
      const { userId } = req.user;

      const userResult = await this.db.query(
        'SELECT two_factor_enabled, password_changed_at, last_login_at FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const { two_factor_enabled, password_changed_at, last_login_at } = userResult.rows[0];

      res.json({
        success: true,
        data: {
          twoFactorEnabled: two_factor_enabled,
          passwordChangedAt: password_changed_at,
          lastLoginAt: last_login_at
        }
      });
    } catch (error) {
      logger.error('Error getting security settings', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error getting security settings'
      });
    }
  }
}

module.exports = new SecurityController();
