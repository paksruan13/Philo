const fs = require('fs');
const path = require('path');

/**
 * Security-focused error handler and logger
 */
class SecurityLogger {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.securityLogFile = path.join(this.logDir, 'security.log');
    this.errorLogFile = path.join(this.logDir, 'errors.log');
    
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Log security events
   */
  logSecurityEvent(event, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details: {
        ...details,
        // Remove sensitive data
        password: details.password ? '[REDACTED]' : undefined,
        token: details.token ? '[REDACTED]' : undefined,
        secret: details.secret ? '[REDACTED]' : undefined,
      },
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown',
      userId: details.userId || null
    };

    // Write to security log
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(this.securityLogFile, logLine);

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔒 Security Event: ${event}`, details);
    }
  }

  /**
   * Log authentication attempts
   */
  logAuthAttempt(email, success, ip, userAgent, details = {}) {
    this.logSecurityEvent('AUTH_ATTEMPT', {
      email,
      success,
      ip,
      userAgent,
      ...details
    });
  }

  /**
   * Log rate limit violations
   */
  logRateLimitViolation(ip, endpoint, userAgent) {
    this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip,
      endpoint,
      userAgent,
      severity: 'warning'
    });
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(type, details = {}) {
    this.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
      type,
      severity: 'high',
      ...details
    });
  }

  /**
   * Log admin actions
   */
  logAdminAction(action, adminId, targetId, details = {}) {
    this.logSecurityEvent('ADMIN_ACTION', {
      action,
      adminId,
      targetId,
      ...details
    });
  }
}

/**
 * Enhanced error handler middleware
 */
const createErrorHandler = (securityLogger) => {
  return (err, req, res, next) => {
    // Log error details
    const errorDetails = {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || null,
      timestamp: new Date().toISOString()
    };

    // Log to file
    const errorLine = JSON.stringify(errorDetails) + '\n';
    fs.appendFileSync(path.join(process.cwd(), 'logs', 'errors.log'), errorLine);

    // Security-sensitive error logging
    if (err.status === 401 || err.status === 403) {
      securityLogger.logSecurityEvent('UNAUTHORIZED_ACCESS', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production') {
      // Generic error messages for security
      const safeErrors = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        429: 'Too Many Requests',
        500: 'Internal Server Error'
      };

      const statusCode = err.status || 500;
      res.status(statusCode).json({
        error: safeErrors[statusCode] || 'Internal Server Error',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    } else {
      // Development - show detailed errors
      res.status(err.status || 500).json({
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Request ID middleware for tracking
 */
const addRequestId = (req, res, next) => {
  req.id = require('crypto').randomBytes(8).toString('hex');
  res.set('X-Request-ID', req.id);
  next();
};

/**
 * Security headers middleware
 */
const addSecurityLogging = (securityLogger) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log suspicious status codes
      if (res.statusCode >= 400) {
        let responseSize = 0;
        try {
          if (typeof data === 'string') {
            responseSize = Buffer.byteLength(data);
          } else if (Buffer.isBuffer(data)) {
            responseSize = data.length;
          } else if (data && typeof data === 'object') {
            responseSize = Buffer.byteLength(JSON.stringify(data));
          } else if (data) {
            responseSize = Buffer.byteLength(String(data));
          }
        } catch (err) {
          responseSize = 0; // Fallback if size calculation fails
        }
        
        securityLogger.logSecurityEvent('HTTP_ERROR', {
          statusCode: res.statusCode,
          url: req.originalUrl,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          responseSize: responseSize
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Monitor for potential attacks
 */
const createAttackDetector = (securityLogger) => {
  const suspiciousPatterns = [
    /(\<script\>|\<\/script\>)/gi, // XSS attempts
    /(union\s+select|drop\s+table|insert\s+into)/gi, // SQL injection
    /(\.\.\/|\.\.\\)/g, // Directory traversal
    /(eval\s*\(|javascript:)/gi, // Code injection
  ];

  return (req, res, next) => {
    const checkForAttacks = (obj, location) => {
      if (typeof obj === 'string') {
        suspiciousPatterns.forEach(pattern => {
          if (pattern.test(obj)) {
            securityLogger.logSuspiciousActivity('POTENTIAL_ATTACK', {
              pattern: pattern.toString(),
              input: obj.substring(0, 100), // Log first 100 chars
              location,
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              url: req.originalUrl
            });
          }
        });
      } else if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(key => {
          checkForAttacks(obj[key], `${location}.${key}`);
        });
      }
    };

    // Check request parameters
    checkForAttacks(req.query, 'query');
    checkForAttacks(req.body, 'body');
    checkForAttacks(req.params, 'params');

    next();
  };
};

const securityLogger = new SecurityLogger();

module.exports = {
  SecurityLogger,
  securityLogger,
  createErrorHandler,
  addRequestId,
  addSecurityLogging,
  createAttackDetector
};
