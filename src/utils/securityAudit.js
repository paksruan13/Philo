const crypto = require('crypto');

/**
 * Security audit for environment variables
 * Checks for missing, weak, or insecure configurations
 */
class EnvironmentSecurityAudit {
  constructor() {
    this.findings = [];
    this.criticalCount = 0;
    this.warningCount = 0;
  }

  /**
   * Add security finding
   */
  addFinding(type, message, severity = 'warning') {
    this.findings.push({
      type,
      message,
      severity,
      timestamp: new Date().toISOString()
    });

    if (severity === 'critical') {
      this.criticalCount++;
    } else if (severity === 'warning') {
      this.warningCount++;
    }
  }

  /**
   * Check JWT configuration
   */
  checkJWTSecurity() {
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      this.addFinding('JWT', 'JWT_SECRET is not set', 'critical');
      return;
    }

    if (jwtSecret.length < 32) {
      this.addFinding('JWT', 'JWT_SECRET is too short (should be 32+ characters)', 'critical');
    }

    if (jwtSecret === 'default' || jwtSecret === 'secret' || jwtSecret === 'your-secret-key') {
      this.addFinding('JWT', 'JWT_SECRET appears to be a default/weak value', 'critical');
    }

    // Check for common patterns
    if (/^(test|dev|local|demo)/.test(jwtSecret.toLowerCase())) {
      this.addFinding('JWT', 'JWT_SECRET appears to be a development key', 'warning');
    }
  }

  /**
   * Check database security
   */
  checkDatabaseSecurity() {
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      this.addFinding('Database', 'DATABASE_URL is not set', 'critical');
      return;
    }

    if (dbUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
      this.addFinding('Database', 'Using localhost database in production', 'warning');
    }

    if (dbUrl.includes('password=') && !dbUrl.includes('sslmode=require')) {
      this.addFinding('Database', 'Database connection may not be using SSL', 'warning');
    }

    if (dbUrl.includes('postgres://postgres:') || dbUrl.includes('password=postgres')) {
      this.addFinding('Database', 'Using default database credentials', 'critical');
    }
  }

  /**
   * Check encryption keys
   */
  checkEncryptionSecurity() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      this.addFinding('Encryption', 'ENCRYPTION_KEY is not set', 'warning');
      return;
    }

    if (encryptionKey.length < 32) {
      this.addFinding('Encryption', 'ENCRYPTION_KEY is too short', 'warning');
    }
  }

  /**
   * Check AWS credentials
   */
  checkAWSCredentials() {
    const awsKeyId = process.env.AWS_ACCESS_KEY_ID;
    const awsSecret = process.env.AWS_SECRET_ACCESS_KEY;

    if (!awsKeyId || !awsSecret) {
      this.addFinding('AWS', 'AWS credentials not fully configured', 'warning');
      return;
    }

    if (awsKeyId.startsWith('AKIA') && awsKeyId.length !== 20) {
      this.addFinding('AWS', 'AWS Access Key ID appears malformed', 'warning');
    }

    if (awsSecret.length !== 40) {
      this.addFinding('AWS', 'AWS Secret Access Key appears malformed', 'warning');
    }
  }

  /**
   * Check Node.js environment
   */
  checkNodeEnvironment() {
    const nodeEnv = process.env.NODE_ENV;

    if (!nodeEnv) {
      this.addFinding('Node.js', 'NODE_ENV is not set', 'warning');
    }

    if (nodeEnv !== 'production' && nodeEnv !== 'development' && nodeEnv !== 'test') {
      this.addFinding('Node.js', `Unexpected NODE_ENV value: ${nodeEnv}`, 'warning');
    }

    // Check for debug flags in production
    if (nodeEnv === 'production') {
      if (process.env.DEBUG) {
        this.addFinding('Node.js', 'DEBUG flag enabled in production', 'warning');
      }
      
      if (process.env.ENABLE_QUERY_MONITORING === 'true') {
        this.addFinding('Node.js', 'Query monitoring enabled in production', 'info');
      }
    }
  }

  /**
   * Check CORS configuration
   */
  checkCORSConfig() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS;
    const frontendUrl = process.env.FRONTEND_URL;

    if (process.env.NODE_ENV === 'production' && !frontendUrl) {
      this.addFinding('CORS', 'FRONTEND_URL not set for production', 'warning');
    }

    if (allowedOrigins && allowedOrigins.includes('*')) {
      this.addFinding('CORS', 'Wildcard (*) found in ALLOWED_ORIGINS', 'warning');
    }
  }

  /**
   * Run complete security audit
   */
  runAudit() {
    console.log('🔍 Starting environment security audit...\n');

    this.checkJWTSecurity();
    this.checkDatabaseSecurity();
    this.checkEncryptionSecurity();
    this.checkAWSCredentials();
    this.checkNodeEnvironment();
    this.checkCORSConfig();

    return this.generateReport();
  }

  /**
   * Generate audit report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.findings.length,
        critical: this.criticalCount,
        warnings: this.warningCount,
        info: this.findings.length - this.criticalCount - this.warningCount
      },
      findings: this.findings,
      recommendations: this.generateRecommendations()
    };

    console.log('📊 Security Audit Report');
    console.log('========================');
    console.log(`🚨 Critical issues: ${this.criticalCount}`);
    console.log(`⚠️  Warnings: ${this.warningCount}`);
    console.log(`ℹ️  Info: ${report.summary.info}\n`);

    if (this.criticalCount > 0) {
      console.log('🚨 Critical Issues:');
      this.findings
        .filter(f => f.severity === 'critical')
        .forEach(f => console.log(`   • [${f.type}] ${f.message}`));
      console.log('');
    }

    if (this.warningCount > 0) {
      console.log('⚠️  Warnings:');
      this.findings
        .filter(f => f.severity === 'warning')
        .forEach(f => console.log(`   • [${f.type}] ${f.message}`));
      console.log('');
    }

    return report;
  }

  /**
   * Generate security recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.criticalCount > 0) {
      recommendations.push('🚨 Address all critical security issues before deploying to production');
    }

    recommendations.push('🔐 Use AWS Secrets Manager for production secrets');
    recommendations.push('🔄 Implement secret rotation policies');
    recommendations.push('📊 Set up CloudWatch monitoring for security events');
    recommendations.push('🛡️ Enable AWS GuardDuty for threat detection');

    return recommendations;
  }
}

module.exports = { EnvironmentSecurityAudit };
