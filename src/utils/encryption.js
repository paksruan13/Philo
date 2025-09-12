const crypto = require('crypto');

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 12; // For GCM, IV length is 12 bytes

if (!process.env.ENCRYPTION_KEY) {
  console.warn('⚠️  ENCRYPTION_KEY not set in environment. Using temporary key. Set ENCRYPTION_KEY for production!');
}

/**
 * Encrypt sensitive data
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted data as base64 string
 */
const encrypt = (text) => {
  if (!text) return null;
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
    cipher.setAAD(Buffer.from('ProjectPhi', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV, auth tag, and encrypted data
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'base64')]);
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {string} - Decrypted text
 */
const decrypt = (encryptedData) => {
  if (!encryptedData) return null;
  
  try {
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + 16);
    const encrypted = combined.subarray(IV_LENGTH + 16);
    
    const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
    decipher.setAAD(Buffer.from('ProjectPhi', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash sensitive data (one-way)
 * @param {string} data - Data to hash
 * @returns {string} - SHA-256 hash
 */
const hashData = (data) => {
  if (!data) return null;
  
  return crypto
    .createHash('sha256')
    .update(data + (process.env.HASH_SALT || 'ProjectPhiSalt'))
    .digest('hex');
};

/**
 * Generate secure random token
 * @param {number} length - Length in bytes (default: 32)
 * @returns {string} - Random token as hex string
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Secure password hashing with bcrypt
 * Note: This is for additional password security beyond bcrypt
 */
const enhancePasswordSecurity = (password) => {
  // Add pepper to password before bcrypt hashing
  const pepper = process.env.PASSWORD_PEPPER || 'DefaultPepper2023!';
  return password + pepper;
};

/**
 * Fields that should be encrypted at rest
 */
const ENCRYPTED_FIELDS = [
  'ssn', 
  'phoneNumber', 
  'address',
  'emergencyContact',
  'parentEmail',
  'medicalInfo'
];

/**
 * Utility to encrypt object fields
 */
const encryptObjectFields = (obj, fieldsToEncrypt = ENCRYPTED_FIELDS) => {
  const result = { ...obj };
  
  fieldsToEncrypt.forEach(field => {
    if (result[field]) {
      result[field] = encrypt(result[field]);
    }
  });
  
  return result;
};

/**
 * Utility to decrypt object fields
 */
const decryptObjectFields = (obj, fieldsToDecrypt = ENCRYPTED_FIELDS) => {
  const result = { ...obj };
  
  fieldsToDecrypt.forEach(field => {
    if (result[field]) {
      try {
        result[field] = decrypt(result[field]);
      } catch (error) {
        console.warn(`Failed to decrypt field ${field}:`, error.message);
        result[field] = '[DECRYPT_ERROR]';
      }
    }
  });
  
  return result;
};

module.exports = {
  encrypt,
  decrypt,
  hashData,
  generateSecureToken,
  enhancePasswordSecurity,
  encryptObjectFields,
  decryptObjectFields,
  ENCRYPTED_FIELDS
};
