#!/usr/bin/env node

/**
 * Security Audit Runner
 * Run this script to perform a comprehensive security check
 */

require('dotenv').config();
const { EnvironmentSecurityAudit } = require('../src/utils/securityAudit');

console.log('🛡️  Project Phi - Security Audit Tool');
console.log('=====================================\n');

async function runSecurityAudit() {
  try {
    // Environment audit
    const envAudit = new EnvironmentSecurityAudit();
    const report = envAudit.runAudit();
    
    // Additional system checks
    console.log('🔍 Additional Security Checks:');
    console.log('------------------------------');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const nodeMajor = parseInt(nodeVersion.split('.')[0].substring(1));
    
    if (nodeMajor < 18) {
      console.log('⚠️  Node.js version is outdated (current: %s, recommended: 18+)', nodeVersion);
    } else {
      console.log('✅ Node.js version is up to date (%s)', nodeVersion);
    }
    
    // Check for common security packages
    const fs = require('fs');
    const path = require('path');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')));
      const securityPackages = [
        'helmet',
        'express-rate-limit', 
        'bcryptjs',
        'jsonwebtoken',
        'express-validator'
      ];
      
      const missing = securityPackages.filter(pkg => 
        !packageJson.dependencies?.[pkg] && !packageJson.devDependencies?.[pkg]
      );
      
      if (missing.length > 0) {
        console.log('⚠️  Missing security packages: %s', missing.join(', '));
      } else {
        console.log('✅ All essential security packages are installed');
      }
      
    } catch (error) {
      console.log('⚠️  Could not read package.json');
    }
    
    // Check log directory
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      console.log('⚠️  Logs directory does not exist (will be created on first use)');
    } else {
      console.log('✅ Logs directory exists');
    }
    
    // Summary
    console.log('\n📊 Audit Summary:');
    console.log('=================');
    console.log(`Total Issues: ${report.summary.total}`);
    console.log(`Critical: ${report.summary.critical}`);
    console.log(`Warnings: ${report.summary.warnings}`);
    console.log(`Info: ${report.summary.info}`);
    
    if (report.summary.critical > 0) {
      console.log('\n🚨 CRITICAL: Address critical issues before production deployment!');
      process.exit(1);
    } else if (report.summary.warnings > 0) {
      console.log('\n⚠️  Consider addressing warnings for enhanced security');
      process.exit(0);
    } else {
      console.log('\n✅ Security audit passed!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Security audit failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runSecurityAudit();
}

module.exports = { runSecurityAudit };
