# 🚀 AWS Lambda Deployment Guide

## Prerequisites

1. **AWS Account Setup**
   - AWS Account with appropriate permissions
   - AWS CLI installed and configured
   - Serverless Framework account (created during first run)

2. **Database Setup**
   - PostgreSQL database (AWS RDS recommended for production)
   - Connection string ready for environment variables

3. **Environment Variables**
   - Copy `.env.lambda.template` to `.env.lambda`
   - Fill in all required values

## Quick Start

### 1. Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, Region, and Output format
```

### 2. Set Environment Variables

Create `.env.lambda` file with your production values:

```bash
cp .env.lambda.template .env.lambda
# Edit .env.lambda with your actual values
```

### 3. Deploy to Development

```bash
npm run lambda:deploy:dev
```

### 4. Deploy to Production

```bash
npm run lambda:deploy:prod
```

## Available Commands

- `npm run lambda:dev` - Run locally with serverless-offline
- `npm run lambda:deploy:dev` - Deploy to development stage
- `npm run lambda:deploy:staging` - Deploy to staging stage  
- `npm run lambda:deploy:prod` - Deploy to production stage
- `npm run lambda:remove:dev` - Remove development deployment
- `npm run lambda:logs` - View production logs
- `npm run lambda:info` - Get deployment information

## Architecture Benefits

### Cost Optimization
- **Pay-per-use**: Only pay for actual requests, not idle time
- **Auto-scaling**: Handles traffic spikes automatically
- **No server management**: AWS manages infrastructure

### Performance
- **Cold start optimization**: Optimized database connections
- **Regional deployment**: Deploy close to users
- **Automatic scaling**: Instant scale to thousands of concurrent users

### Expected Traffic Handling
- **Concurrent users**: 1000+ simultaneous users
- **Request volume**: 10,000+ requests per minute
- **Cost estimate**: $50-200/month for high traffic vs $500+ for EC2

## Production Readiness

### Database Considerations
- Use AWS RDS with connection pooling (RDS Proxy recommended)
- Consider read replicas for high read workloads
- Monitor connection limits

### Monitoring
- AWS CloudWatch for metrics and logs
- Set up alarms for errors and performance
- Use X-Ray for request tracing

### Security
- Environment variables stored securely in AWS
- IAM roles with minimal required permissions
- VPC configuration if needed

## Migration from EC2

1. **Deploy Lambda alongside EC2** (blue-green deployment)
2. **Update mobile app** to use Lambda endpoints
3. **Monitor performance** and error rates
4. **Gradually shift traffic** from EC2 to Lambda
5. **Decommission EC2** once Lambda is stable

## Real-time Features

Optimized for mobile app usage patterns:
- **Scheduled leaderboard updates**: Daily calculation at midnight UTC for consistent rankings
- **Pull-to-refresh**: Users control when they see latest data across all screens
- **Cached responses**: Fast API responses with pre-calculated leaderboard data
- **Timestamp display**: Shows when leaderboard was last updated and next update time
- **No WebSockets needed**: HTTP APIs handle all data fetching efficiently

### Mobile App Features:
- **LeaderboardScreen**: Shows last updated time and next scheduled update
- **Pull-to-refresh**: Swipe down on any screen to get latest data
- **Update indicators**: Visual feedback when data is cached vs live
- **Automatic refresh**: Data refreshes when user navigates to screens

## Next Steps

1. Set up AWS credentials
2. Configure environment variables
3. Deploy to development stage
4. Test all endpoints
5. Update mobile app configuration
6. Deploy to production