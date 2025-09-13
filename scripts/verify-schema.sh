#!/bin/bash
# Database Schema Verification Script

echo "🔍 Starting database schema verification..."

# Save current schema
cp prisma/schema.prisma prisma/schema.prisma.backup

echo "📥 Pulling actual database schema..."
npx prisma db pull

echo "🔍 Checking for differences..."
if diff -q prisma/schema.prisma prisma/schema.prisma.backup > /dev/null; then
    echo "✅ Schema matches database - no drift detected"
else
    echo "⚠️  SCHEMA DRIFT DETECTED!"
    echo "📊 Differences found:"
    diff prisma/schema.prisma prisma/schema.prisma.backup
    echo ""
    echo "🤔 What to do:"
    echo "1. If database is correct: Keep pulled schema"
    echo "2. If schema is correct: Run 'npx prisma migrate dev'"
    echo "3. Restore original: 'mv prisma/schema.prisma.backup prisma/schema.prisma'"
fi

echo "📋 Migration status:"
npx prisma migrate status

echo "🧪 Testing critical models..."
echo "Testing Donation model for productSaleId field..."