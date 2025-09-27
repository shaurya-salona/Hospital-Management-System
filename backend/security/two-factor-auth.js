/**
 * Two-Factor Authentication (2FA) System for HMIS
 * Provides TOTP, SMS, and Email-based 2FA
 */

const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { logger } = require('../config/logger');
const { query } = require('../config/database');
const nodemailer = require('nodemailer');

class TwoFactorAuth {
    constructor() {
        this.issuer = 'HMIS Hospital Management';
        this.algorithm = 'sha1';
        this.digits = 6;
        this.period = 30;
        this.window = 1;

        // Email transporter configuration
        this.emailTransporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        this.init();
    }

    init() {
        logger.info('Two-Factor Authentication system initialized');
    }

    // Generate TOTP secret for user
    async generateTOTPSecret(userId, userEmail) {
        try {
            const secret = speakeasy.generateSecret({
                name: userEmail,
                issuer: this.issuer,
                length: 32
            });

            // Store secret in database
            await this.storeTOTPSecret(userId, secret.base32);

            // Generate QR code
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

            return {
                success: true,
                secret: secret.base32,
                qrCode: qrCodeUrl,
                manualEntryKey: secret.base32,
                backupCodes: await this.generateBackupCodes(userId)
            };

        } catch (error) {
            logger.error('Error generating TOTP secret:', error);
            throw error;
        }
    }

    // Store TOTP secret in database
    async storeTOTPSecret(userId, secret) {
        try {
            const encryptedSecret = this.encryptSecret(secret);

            await query(
                `INSERT INTO user_2fa_secrets (user_id, secret, created_at, updated_at)
                 VALUES ($1, $2, NOW(), NOW())
                 ON CONFLICT (user_id)
                 DO UPDATE SET secret = $2, updated_at = NOW()`,
                [userId, encryptedSecret]
            );

            logger.info(`TOTP secret stored for user ${userId}`);
        } catch (error) {
            logger.error('Error storing TOTP secret:', error);
            throw error;
        }
    }

    // Generate backup codes
    async generateBackupCodes(userId) {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }

        // Store backup codes in database
        await query(
            `INSERT INTO user_backup_codes (user_id, codes, created_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id)
             DO UPDATE SET codes = $2, created_at = NOW()`,
            [userId, JSON.stringify(codes)]
        );

        return codes;
    }

    // Verify TOTP token
    async verifyTOTPToken(userId, token) {
        try {
            const result = await query(
                'SELECT secret FROM user_2fa_secrets WHERE user_id = $1',
                [userId]
            );

            if (result.rows.length === 0) {
                return { success: false, message: '2FA not enabled for user' };
            }

            const secret = this.decryptSecret(result.rows[0].secret);
            const verified = speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: token,
                window: this.window
            });

            if (verified) {
                // Log successful 2FA verification
                await this.log2FAEvent(userId, 'totp_verify_success', 'TOTP verification successful');
                return { success: true, message: 'TOTP token verified' };
            } else {
                // Log failed 2FA attempt
                await this.log2FAEvent(userId, 'totp_verify_failed', 'Invalid TOTP token');
                return { success: false, message: 'Invalid TOTP token' };
            }

        } catch (error) {
            logger.error('Error verifying TOTP token:', error);
            throw error;
        }
    }

    // Verify backup code
    async verifyBackupCode(userId, code) {
        try {
            const result = await query(
                'SELECT codes FROM user_backup_codes WHERE user_id = $1',
                [userId]
            );

            if (result.rows.length === 0) {
                return { success: false, message: 'No backup codes found' };
            }

            const codes = JSON.parse(result.rows[0].codes);
            const codeIndex = codes.indexOf(code.toUpperCase());

            if (codeIndex === -1) {
                await this.log2FAEvent(userId, 'backup_code_failed', 'Invalid backup code');
                return { success: false, message: 'Invalid backup code' };
            }

            // Remove used backup code
            codes.splice(codeIndex, 1);
            await query(
                'UPDATE user_backup_codes SET codes = $1 WHERE user_id = $2',
                [JSON.stringify(codes), userId]
            );

            await this.log2FAEvent(userId, 'backup_code_success', 'Backup code used successfully');
            return { success: true, message: 'Backup code verified' };

        } catch (error) {
            logger.error('Error verifying backup code:', error);
            throw error;
        }
    }

    // Send SMS 2FA code
    async sendSMS2FA(userId, phoneNumber) {
        try {
            const code = this.generateSMSCode();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            // Store SMS code in database
            await query(
                `INSERT INTO user_sms_codes (user_id, phone_number, code, expires_at, created_at)
                 VALUES ($1, $2, $3, $4, NOW())
                 ON CONFLICT (user_id)
                 DO UPDATE SET phone_number = $2, code = $3, expires_at = $4, created_at = NOW()`,
                [userId, phoneNumber, code, expiresAt]
            );

            // Send SMS (implementation depends on SMS provider)
            await this.sendSMS(phoneNumber, `Your HMIS 2FA code is: ${code}. Valid for 10 minutes.`);

            await this.log2FAEvent(userId, 'sms_sent', 'SMS 2FA code sent');
            return { success: true, message: 'SMS code sent successfully' };

        } catch (error) {
            logger.error('Error sending SMS 2FA:', error);
            throw error;
        }
    }

    // Verify SMS 2FA code
    async verifySMS2FA(userId, code) {
        try {
            const result = await query(
                'SELECT code, expires_at FROM user_sms_codes WHERE user_id = $1',
                [userId]
            );

            if (result.rows.length === 0) {
                return { success: false, message: 'No SMS code found' };
            }

            const storedCode = result.rows[0].code;
            const expiresAt = new Date(result.rows[0].expires_at);

            if (new Date() > expiresAt) {
                await this.log2FAEvent(userId, 'sms_verify_failed', 'SMS code expired');
                return { success: false, message: 'SMS code expired' };
            }

            if (storedCode !== code) {
                await this.log2FAEvent(userId, 'sms_verify_failed', 'Invalid SMS code');
                return { success: false, message: 'Invalid SMS code' };
            }

            // Remove used SMS code
            await query('DELETE FROM user_sms_codes WHERE user_id = $1', [userId]);

            await this.log2FAEvent(userId, 'sms_verify_success', 'SMS code verified successfully');
            return { success: true, message: 'SMS code verified' };

        } catch (error) {
            logger.error('Error verifying SMS 2FA:', error);
            throw error;
        }
    }

    // Send Email 2FA code
    async sendEmail2FA(userId, email) {
        try {
            const code = this.generateEmailCode();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            // Store email code in database
            await query(
                `INSERT INTO user_email_codes (user_id, email, code, expires_at, created_at)
                 VALUES ($1, $2, $3, $4, NOW())
                 ON CONFLICT (user_id)
                 DO UPDATE SET email = $2, code = $3, expires_at = $4, created_at = NOW()`,
                [userId, email, code, expiresAt]
            );

            // Send email
            await this.sendEmail(email, 'HMIS 2FA Code', `
                <h2>Two-Factor Authentication Code</h2>
                <p>Your HMIS 2FA code is: <strong>${code}</strong></p>
                <p>This code is valid for 15 minutes.</p>
                <p>If you didn't request this code, please contact support immediately.</p>
            `);

            await this.log2FAEvent(userId, 'email_sent', 'Email 2FA code sent');
            return { success: true, message: 'Email code sent successfully' };

        } catch (error) {
            logger.error('Error sending email 2FA:', error);
            throw error;
        }
    }

    // Verify Email 2FA code
    async verifyEmail2FA(userId, code) {
        try {
            const result = await query(
                'SELECT code, expires_at FROM user_email_codes WHERE user_id = $1',
                [userId]
            );

            if (result.rows.length === 0) {
                return { success: false, message: 'No email code found' };
            }

            const storedCode = result.rows[0].code;
            const expiresAt = new Date(result.rows[0].expires_at);

            if (new Date() > expiresAt) {
                await this.log2FAEvent(userId, 'email_verify_failed', 'Email code expired');
                return { success: false, message: 'Email code expired' };
            }

            if (storedCode !== code) {
                await this.log2FAEvent(userId, 'email_verify_failed', 'Invalid email code');
                return { success: false, message: 'Invalid email code' };
            }

            // Remove used email code
            await query('DELETE FROM user_email_codes WHERE user_id = $1', [userId]);

            await this.log2FAEvent(userId, 'email_verify_success', 'Email code verified successfully');
            return { success: true, message: 'Email code verified' };

        } catch (error) {
            logger.error('Error verifying email 2FA:', error);
            throw error;
        }
    }

    // Check if user has 2FA enabled
    async is2FAEnabled(userId) {
        try {
            const result = await query(
                'SELECT COUNT(*) as count FROM user_2fa_secrets WHERE user_id = $1',
                [userId]
            );

            return result.rows[0].count > 0;
        } catch (error) {
            logger.error('Error checking 2FA status:', error);
            return false;
        }
    }

    // Disable 2FA for user
    async disable2FA(userId) {
        try {
            await query('DELETE FROM user_2fa_secrets WHERE user_id = $1', [userId]);
            await query('DELETE FROM user_backup_codes WHERE user_id = $1', [userId]);
            await query('DELETE FROM user_sms_codes WHERE user_id = $1', [userId]);
            await query('DELETE FROM user_email_codes WHERE user_id = $1', [userId]);

            await this.log2FAEvent(userId, '2fa_disabled', '2FA disabled for user');
            return { success: true, message: '2FA disabled successfully' };

        } catch (error) {
            logger.error('Error disabling 2FA:', error);
            throw error;
        }
    }

    // Get user's 2FA status
    async get2FAStatus(userId) {
        try {
            const [totpResult, backupResult] = await Promise.all([
                query('SELECT created_at FROM user_2fa_secrets WHERE user_id = $1', [userId]),
                query('SELECT codes FROM user_backup_codes WHERE user_id = $1', [userId])
            ]);

            const hasTOTP = totpResult.rows.length > 0;
            const hasBackupCodes = backupResult.rows.length > 0;
            const backupCodesCount = hasBackupCodes ? JSON.parse(backupResult.rows[0].codes).length : 0;

            return {
                enabled: hasTOTP,
                totpEnabled: hasTOTP,
                backupCodesCount,
                setupDate: hasTOTP ? totpResult.rows[0].created_at : null
            };

        } catch (error) {
            logger.error('Error getting 2FA status:', error);
            throw error;
        }
    }

    // Utility methods
    generateSMSCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    generateEmailCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    encryptSecret(secret) {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(algorithm, key);

        let encrypted = cipher.update(secret, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return iv.toString('hex') + ':' + encrypted;
    }

    decryptSecret(encryptedSecret) {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
        const [ivHex, encrypted] = encryptedSecret.split(':');
        const iv = Buffer.from(ivHex, 'hex');

        const decipher = crypto.createDecipher(algorithm, key);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    async sendSMS(phoneNumber, message) {
        // Implementation depends on SMS provider (Twilio, AWS SNS, etc.)
        // This is a placeholder implementation
        logger.info(`SMS sent to ${phoneNumber}: ${message}`);
        return true;
    }

    async sendEmail(email, subject, html) {
        try {
            await this.emailTransporter.sendMail({
                from: process.env.SMTP_FROM || 'noreply@hmis.com',
                to: email,
                subject: subject,
                html: html
            });
        } catch (error) {
            logger.error('Error sending email:', error);
            throw error;
        }
    }

    async log2FAEvent(userId, event, description) {
        try {
            await query(
                `INSERT INTO security_audit_logs (user_id, event_type, description, ip_address, user_agent, created_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                [userId, event, description, null, null]
            );
        } catch (error) {
            logger.error('Error logging 2FA event:', error);
        }
    }
}

module.exports = TwoFactorAuth;


