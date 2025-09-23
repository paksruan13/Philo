const fs = require('fs');
const path = require('path');

/**
 * Security-focused error handler and logger
 */
class SecurityLogger {
  constructor() {
    
    this.isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    if (this.isLambda) {
      this.logDir = null;
      this.securityLogFile = null;
      this.errorLogFile = null;
    } else {
      
      this.logDir = path.join(process.cwd(), 'logs');
      this.securityLogFile = path.join(this.logDir, 'security.log');
      this.errorLogFile = path.join(this.logDir, 'errors.log');
      
      
      try {
        if (!fs.existsSync(this.logDir)) {
          fs.mkdirSync(this.logDir, { recursive: true });
        }
      } catch (err) {
        console.warn('Unable to create log directory:', err.message);
        
        this.isLambda = true;
        this.logDir = null;
        this.securityLogFile = null;
        this.errorLogFile = null;
      }
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
        
        password: details.password ? '[REDACTED]' : undefined,
        token: details.token ? '[REDACTED]' : undefined,
        secret: details.secret ? '[REDACTED]' : undefined,
      },
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown',
      userId: details.userId || null
    };

    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    if (this.isLambda) {
      
    } else {
      
      try {
        fs.appendFileSync(this.securityLogFile, logLine);
      } catch (err) {
        console.warn('Unable to write security log to file:', err.message);
      }
    }

    
    if (process.env.NODE_ENV === 'development') {
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

    
    const errorLine = JSON.stringify(errorDetails) + '\n';
    
    if (this.isLambda) {
      
      console.error('🔒 ERROR_LOG:', errorDetails);
    } else {
      
      try {
        fs.appendFileSync(path.join(process.cwd(), 'logs', 'errors.log'), errorLine);
      } catch (err) {
        console.warn('Unable to write error log to file:', err.message);
        console.error('🔒 ERROR_LOG:', errorDetails);
      }
    }

    
    if (err.status === 401 || err.status === 403) {
      securityLogger.logSecurityEvent('UNAUTHORIZED_ACCESS', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    
    if (process.env.NODE_ENV === 'production') {
      
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
          responseSize = 0; 
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
    /(\<script\>|\<\/script\>)/gi, 
    /(union\s+select|drop\s+table|insert\s+into)/gi, 
    /(\.\.\/|\.\.\\)/g, 
    /(eval\s*\(|javascript:)/gi, 
  ];

  return (req, res, next) => {
    const checkForAttacks = (obj, location) => {
      if (typeof obj === 'string') {
        suspiciousPatterns.forEach(pattern => {
          if (pattern.test(obj)) {
            securityLogger.logSuspiciousActivity('POTENTIAL_ATTACK', {
              pattern: pattern.toString(),
              input: obj.substring(0, 100), 
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
