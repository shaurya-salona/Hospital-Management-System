/**
 * Data Encryption Manager for HMIS
 * Provides comprehensive encryption for sensitive healthcare data
 */

const crypto = require('crypto');
const { logger } = require('../config/logger');
const { query } = require('../config/database');

class EncryptionManager {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32;
        this.ivLength = 16;
        this.tagLength = 16;

        // Initialize encryption keys
        this.masterKey = this.getMasterKey();
        this.dataEncryptionKey = this.getDataEncryptionKey();
        this.fieldEncryptionKey = this.getFieldEncryptionKey();

        this.init();
    }

    init() {
        logger.info('Encryption Manager initialized');
    }

    // Get master encryption key
    getMasterKey() {
        const key = process.env.MASTER_ENCRYPTION_KEY;
        if (!key) {
            logger.warn('MASTER_ENCRYPTION_KEY not set, using default (NOT SECURE FOR PRODUCTION)');
            return crypto.scryptSync('default-master-key', 'salt', this.keyLength);
        }
        return crypto.scryptSync(key, 'salt', this.keyLength);
    }

    // Get data encryption key
    getDataEncryptionKey() {
        const key = process.env.DATA_ENCRYPTION_KEY;
        if (!key) {
            logger.warn('DATA_ENCRYPTION_KEY not set, using default (NOT SECURE FOR PRODUCTION)');
            return crypto.scryptSync('default-data-key', 'salt', this.keyLength);
        }
        return crypto.scryptSync(key, 'salt', this.keyLength);
    }

    // Get field encryption key
    getFieldEncryptionKey() {
        const key = process.env.FIELD_ENCRYPTION_KEY;
        if (!key) {
            logger.warn('FIELD_ENCRYPTION_KEY not set, using default (NOT SECURE FOR PRODUCTION)');
            return crypto.scryptSync('default-field-key', 'salt', this.keyLength);
        }
        return crypto.scryptSync(key, 'salt', this.keyLength);
    }

    // Encrypt sensitive data
    encryptData(data, keyType = 'data') {
        try {
            if (!data || data === '') {
                return data;
            }

            const key = keyType === 'field' ? this.fieldEncryptionKey : this.dataEncryptionKey;
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipher(this.algorithm, key);

            let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const tag = cipher.getAuthTag();

            // Combine IV, tag, and encrypted data
            const result = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;

            return result;

        } catch (error) {
            logger.error('Error encrypting data:', error);
            throw error;
        }
    }

    // Decrypt sensitive data
    decryptData(encryptedData, keyType = 'data') {
        try {
            if (!encryptedData || encryptedData === '') {
                return encryptedData;
            }

            const key = keyType === 'field' ? this.fieldEncryptionKey : this.dataEncryptionKey;
            const parts = encryptedData.split(':');

            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }

            const iv = Buffer.from(parts[0], 'hex');
            const tag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];

            const decipher = crypto.createDecipher(this.algorithm, key);
            decipher.setAuthTag(tag);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return JSON.parse(decrypted);

        } catch (error) {
            logger.error('Error decrypting data:', error);
            throw error;
        }
    }

    // Encrypt patient data
    async encryptPatientData(patientData) {
        try {
            const encryptedData = { ...patientData };

            // Encrypt sensitive fields
            const sensitiveFields = [
                'ssn', 'insurance_number', 'medical_record_number',
                'emergency_contact_phone', 'notes', 'diagnosis'
            ];

            for (const field of sensitiveFields) {
                if (encryptedData[field]) {
                    encryptedData[field] = this.encryptData(encryptedData[field], 'field');
                }
            }

            return encryptedData;

        } catch (error) {
            logger.error('Error encrypting patient data:', error);
            throw error;
        }
    }

    // Decrypt patient data
    async decryptPatientData(patientData) {
        try {
            const decryptedData = { ...patientData };

            // Decrypt sensitive fields
            const sensitiveFields = [
                'ssn', 'insurance_number', 'medical_record_number',
                'emergency_contact_phone', 'notes', 'diagnosis'
            ];

            for (const field of sensitiveFields) {
                if (decryptedData[field]) {
                    try {
                        decryptedData[field] = this.decryptData(decryptedData[field], 'field');
                    } catch (error) {
                        // If decryption fails, the field might not be encrypted
                        logger.warn(`Failed to decrypt field ${field}, keeping original value`);
                    }
                }
            }

            return decryptedData;

        } catch (error) {
            logger.error('Error decrypting patient data:', error);
            throw error;
        }
    }

    // Encrypt medical records
    async encryptMedicalRecord(medicalRecord) {
        try {
            const encryptedRecord = { ...medicalRecord };

            // Encrypt sensitive medical data
            const sensitiveFields = [
                'diagnosis', 'treatment_notes', 'medication_history',
                'allergies', 'family_history', 'surgical_history'
            ];

            for (const field of sensitiveFields) {
                if (encryptedRecord[field]) {
                    encryptedRecord[field] = this.encryptData(encryptedRecord[field], 'field');
                }
            }

            return encryptedRecord;

        } catch (error) {
            logger.error('Error encrypting medical record:', error);
            throw error;
        }
    }

    // Decrypt medical records
    async decryptMedicalRecord(medicalRecord) {
        try {
            const decryptedRecord = { ...medicalRecord };

            // Decrypt sensitive medical data
            const sensitiveFields = [
                'diagnosis', 'treatment_notes', 'medication_history',
                'allergies', 'family_history', 'surgical_history'
            ];

            for (const field of sensitiveFields) {
                if (decryptedRecord[field]) {
                    try {
                        decryptedRecord[field] = this.decryptData(decryptedRecord[field], 'field');
                    } catch (error) {
                        logger.warn(`Failed to decrypt field ${field}, keeping original value`);
                    }
                }
            }

            return decryptedRecord;

        } catch (error) {
            logger.error('Error decrypting medical record:', error);
            throw error;
        }
    }

    // Encrypt billing information
    async encryptBillingData(billingData) {
        try {
            const encryptedData = { ...billingData };

            // Encrypt sensitive billing fields
            const sensitiveFields = [
                'credit_card_number', 'bank_account_number', 'routing_number',
                'billing_notes', 'insurance_claim_details'
            ];

            for (const field of sensitiveFields) {
                if (encryptedData[field]) {
                    encryptedData[field] = this.encryptData(encryptedData[field], 'field');
                }
            }

            return encryptedData;

        } catch (error) {
            logger.error('Error encrypting billing data:', error);
            throw error;
        }
    }

    // Decrypt billing information
    async decryptBillingData(billingData) {
        try {
            const decryptedData = { ...billingData };

            // Decrypt sensitive billing fields
            const sensitiveFields = [
                'credit_card_number', 'bank_account_number', 'routing_number',
                'billing_notes', 'insurance_claim_details'
            ];

            for (const field of sensitiveFields) {
                if (decryptedData[field]) {
                    try {
                        decryptedData[field] = this.decryptData(decryptedData[field], 'field');
                    } catch (error) {
                        logger.warn(`Failed to decrypt field ${field}, keeping original value`);
                    }
                }
            }

            return decryptedData;

        } catch (error) {
            logger.error('Error decrypting billing data:', error);
            throw error;
        }
    }

    // Hash sensitive data for searching
    hashForSearch(data) {
        try {
            if (!data) return null;

            const hash = crypto.createHash('sha256');
            hash.update(data.toString().toLowerCase().trim());
            return hash.digest('hex');

        } catch (error) {
            logger.error('Error hashing data for search:', error);
            throw error;
        }
    }

    // Generate secure random token
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    // Generate secure password hash
    async hashPassword(password) {
        try {
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
            return salt + ':' + hash.toString('hex');

        } catch (error) {
            logger.error('Error hashing password:', error);
            throw error;
        }
    }

    // Verify password hash
    async verifyPassword(password, hashedPassword) {
        try {
            const [salt, hash] = hashedPassword.split(':');
            const hashVerify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
            return hash === hashVerify.toString('hex');

        } catch (error) {
            logger.error('Error verifying password:', error);
            throw error;
        }
    }

    // Encrypt file content
    async encryptFile(fileBuffer, filename) {
        try {
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipher(this.algorithm, this.dataEncryptionKey);

            let encrypted = cipher.update(fileBuffer);
            encrypted = Buffer.concat([encrypted, cipher.final()]);

            const tag = cipher.getAuthTag();

            return {
                iv: iv.toString('hex'),
                tag: tag.toString('hex'),
                encrypted: encrypted.toString('hex'),
                filename: this.encryptData(filename, 'field')
            };

        } catch (error) {
            logger.error('Error encrypting file:', error);
            throw error;
        }
    }

    // Decrypt file content
    async decryptFile(encryptedFile) {
        try {
            const decipher = crypto.createDecipher(this.algorithm, this.dataEncryptionKey);
            decipher.setAuthTag(Buffer.from(encryptedFile.tag, 'hex'));

            let decrypted = decipher.update(Buffer.from(encryptedFile.encrypted, 'hex'));
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            return {
                content: decrypted,
                filename: this.decryptData(encryptedFile.filename, 'field')
            };

        } catch (error) {
            logger.error('Error decrypting file:', error);
            throw error;
        }
    }

    // Generate encryption key pair
    generateKeyPair() {
        try {
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });

            return { publicKey, privateKey };

        } catch (error) {
            logger.error('Error generating key pair:', error);
            throw error;
        }
    }

    // Encrypt with public key
    encryptWithPublicKey(data, publicKey) {
        try {
            const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(data));
            return encrypted.toString('base64');

        } catch (error) {
            logger.error('Error encrypting with public key:', error);
            throw error;
        }
    }

    // Decrypt with private key
    decryptWithPrivateKey(encryptedData, privateKey) {
        try {
            const decrypted = crypto.privateDecrypt(privateKey, Buffer.from(encryptedData, 'base64'));
            return decrypted.toString('utf8');

        } catch (error) {
            logger.error('Error decrypting with private key:', error);
            throw error;
        }
    }

    // Rotate encryption keys
    async rotateKeys() {
        try {
            logger.info('Starting encryption key rotation...');

            // Generate new keys
            const newDataKey = crypto.randomBytes(this.keyLength);
            const newFieldKey = crypto.randomBytes(this.keyLength);

            // Store old keys for migration
            await this.storeKeyVersion('data', this.dataEncryptionKey, 'old');
            await this.storeKeyVersion('field', this.fieldEncryptionKey, 'old');

            // Update current keys
            this.dataEncryptionKey = newDataKey;
            this.fieldEncryptionKey = newFieldKey;

            await this.storeKeyVersion('data', newDataKey, 'current');
            await this.storeKeyVersion('field', newFieldKey, 'current');

            logger.info('Encryption key rotation completed');

        } catch (error) {
            logger.error('Error rotating encryption keys:', error);
            throw error;
        }
    }

    // Store key version
    async storeKeyVersion(keyType, key, version) {
        try {
            await query(
                `INSERT INTO encryption_keys (key_type, key_data, version, created_at)
                 VALUES ($1, $2, $3, NOW())`,
                [keyType, key.toString('hex'), version]
            );

        } catch (error) {
            logger.error('Error storing key version:', error);
            throw error;
        }
    }

    // Get encryption status
    async getEncryptionStatus() {
        try {
            const result = await query(
                'SELECT key_type, version, created_at FROM encryption_keys ORDER BY created_at DESC'
            );

            return {
                success: true,
                status: {
                    keys: result.rows,
                    algorithm: this.algorithm,
                    keyLength: this.keyLength
                }
            };

        } catch (error) {
            logger.error('Error getting encryption status:', error);
            throw error;
        }
    }

    // Validate encryption integrity
    async validateEncryptionIntegrity() {
        try {
            const testData = 'HMIS Encryption Test Data';
            const encrypted = this.encryptData(testData);
            const decrypted = this.decryptData(encrypted);

            return {
                success: true,
                valid: decrypted === testData,
                message: decrypted === testData ? 'Encryption integrity validated' : 'Encryption integrity failed'
            };

        } catch (error) {
            logger.error('Error validating encryption integrity:', error);
            return {
                success: false,
                valid: false,
                message: 'Encryption integrity validation failed'
            };
        }
    }
}

module.exports = EncryptionManager;


