const crypto = require('crypto');

/**
 * Creates a secure team code
 * @param {number} length - Length of the code to generate
 * @returns {string} - Secure random team code
 */
const createSecureTeamCode = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    result += chars[randomIndex];
  }
  
  return result;
};

module.exports = {
  createSecureTeamCode
};