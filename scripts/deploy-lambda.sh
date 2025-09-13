#!/bin/bash

# 🚀 Lambda Deployment Helper Script
# This script helps deploy the Project Phi API to AWS Lambda

set -e

echo "🚀 Project Phi Lambda Deployment Helper"
echo "========================================"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   brew install awscli"
    exit 1
fi

# Check if AWS is configured
if ! aws configure list | grep -q access_key; then
    echo "❌ AWS credentials not configured. Please run:"
    echo "   aws configure"
    exit 1
fi

# Check if .env.lambda exists
if [ ! -f ".env.lambda" ]; then
    echo "❌ .env.lambda file not found. Please create it from the template:"
    echo "   cp .env.lambda.template .env.lambda"
    echo "   # Then edit .env.lambda with your actual values"
    exit 1
fi

# Load environment variables
export $(cat .env.lambda | grep -v '^#' | xargs)

echo "✅ AWS CLI configured"
echo "✅ Environment variables loaded"

# Get deployment stage
STAGE=${1:-dev}
echo "📦 Deploying to stage: $STAGE"

# Run Prisma generate to ensure latest schema
echo "🔄 Generating Prisma client..."
npm run db:generate

# Deploy based on stage
case $STAGE in
    "dev")
        echo "🚀 Deploying to development..."
        npm run lambda:deploy:dev
        ;;
    "staging")
        echo "🚀 Deploying to staging..."
        npm run lambda:deploy:staging
        ;;
    "prod")
        echo "🚀 Deploying to production..."
        npm run lambda:deploy:prod
        ;;
    *)
        echo "❌ Invalid stage. Use: dev, staging, or prod"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Get deployment info: npm run lambda:info"
echo "📋 View logs: npm run lambda:logs"
echo ""
echo "🔗 Your API endpoint will be shown above"
echo "   Update your mobile app to use the new Lambda URL"