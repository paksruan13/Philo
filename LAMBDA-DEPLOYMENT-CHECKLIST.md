# 🚀 Lambda Deployment Checklist

## Pre-Deployment Verification
- [ ] **Schema Sync Check**: Run `npx prisma migrate status` to ensure all migrations are applied
- [ ] **Database Introspection**: Run `npx prisma db pull` to verify actual DB matches schema
- [ ] **Schema Validation**: Run `npx prisma validate` to check for schema errors
- [ ] **Client Generation**: Run `npx prisma generate` with latest schema

## Migration Safety Steps
1. **Always migrate before deploying code**:
   ```bash
   npx prisma migrate deploy  # Apply pending migrations
   npx prisma generate        # Regenerate client
   npx serverless deploy      # Deploy updated Lambda
   ```

2. **Verify migration status**:
   ```bash
   npx prisma migrate status
   ```

3. **Test critical endpoints** after deployment:
   ```bash
   curl "$API_URL/health"      # Health check
   curl "$API_URL/donations"   # Test problematic endpoints
   ```

## Environment-Specific Issues

### For Lambda Deployments:
- [ ] Ensure `.env.lambda` is used as `.env` before migrations
- [ ] Verify DATABASE_URL points to correct RDS instance
- [ ] Check that Prisma binary targets include `rhel-openssl-1.0.x`

### Common Migration Failures:
- **Missing productSaleId**: Usually means ProductSale→Donation relationship migration wasn't applied
- **Schema drift**: Local schema ahead of deployed database
- **Client out of sync**: Prisma client generated before latest migration

## Recovery Commands (When Things Go Wrong):
```bash
# 1. Check what's actually in the database
npx prisma db pull

# 2. Compare with our schema (manual diff check)
git diff prisma/schema.prisma

# 3. Apply missing migrations
npx prisma migrate deploy

# 4. Regenerate client and redeploy
npx prisma generate
npx serverless deploy --stage dev
```

## Quick Health Check Script:
```bash
#!/bin/bash
echo "🔍 Checking database health..."
npx prisma migrate status
echo "✅ Testing API health..."
curl -s "$API_URL/health" | jq
echo "✅ Testing problematic endpoint..."
curl -s "$API_URL/donations" -H "Authorization: Bearer $TOKEN" | jq
```