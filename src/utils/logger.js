const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Create logger instance
const logger = winston.createLogger({
  levels: logLevels,
  format: logFormat,
  defaultMeta: { service: 'project-phi' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined logs
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Helper methods for structured logging
const logHelpers = {
  // Authentication events
  authSuccess: (userId, email) => {
    logger.info('Authentication successful', { userId, email, event: 'auth_success' });
  },
  
  authFailure: (email, reason) => {
    logger.warn('Authentication failed', { email, reason, event: 'auth_failure' });
  },
  
  // User actions
  userAction: (userId, action, details = {}) => {
    logger.info('User action', { userId, action, ...details, event: 'user_action' });
  },
  
  // System errors
  systemError: (error, context = {}) => {
    logger.error('System error', { 
      error: error.message, 
      stack: error.stack, 
      ...context, 
      event: 'system_error' 
    });
  },
  
  // Database operations
  dbOperation: (operation, table, details = {}) => {
    logger.info('Database operation', { operation, table, ...details, event: 'db_operation' });
  },
  
  // API requests
  apiRequest: (method, url, userId, responseTime, statusCode) => {
    logger.info('API request', { 
      method, 
      url, 
      userId, 
      responseTime, 
      statusCode, 
      event: 'api_request' 
    });
  }
};

module.exports = {
  logger,
  ...logHelpers
};
