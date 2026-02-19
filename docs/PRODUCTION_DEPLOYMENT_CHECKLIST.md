# Production Deployment Checklist

## Pre-Deployment Phase

### 1. Code Review & Quality Gates ✓

- [ ] All code changes reviewed and approved
- [ ] No console.log() statements in production code
- [ ] No TODO/FIXME comments in critical paths
- [ ] TypeScript strict mode: 0 errors
- [ ] Linting: 0 warnings
- [ ] Unit test coverage: >80%
- [ ] Integration tests: All passing
- [ ] No security vulnerabilities (npm audit)

**Commands to verify:**
```bash
# TypeScript
npm run build

# Linting (if configured)
npm run lint

# Security audit
npm audit

# Test coverage
npm run test:coverage
```

---

### 2. Security Audit ✓

**Authentication & Authorization:**
- [ ] JWT tokens configured with 24h expiry
- [ ] Password hashing: bcrypt with salt rounds ≥ 10
- [ ] API keys/secrets not in code repo
- [ ] Secrets stored in environment variables
- [ ] Admin user credentials changed from defaults
- [ ] CORS origins whitelist configured
- [ ] Rate limiting configured for all endpoints

**Data Protection:**
- [ ] Sensitive data not logged
- [ ] Database credentials in environment variables
- [ ] HTTPS enforced (configured)
- [ ] HSTS header configured
- [ ] Content Security Policy enabled
- [ ] X-Frame-Options: DENY configured
- [ ] X-Content-Type-Options: nosniff configured

**Input Validation:**
- [ ] All user inputs validated with Zod
- [ ] File uploads validated (if applicable)
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CSRF protection (if applicable)

**API Security:**
- [ ] Rate limiting: 30 req/min (general), 5/15min (auth)
- [ ] Request size limits: 5MB enforced
- [ ] No API keys in URLs
- [ ] API endpoints require authentication
- [ ] Error messages don't expose sensitive info

---

### 3. Database Readiness ✓

**Schema & Data:**
- [ ] All migrations applied successfully
- [ ] Database schema matches Prisma schema
- [ ] No pending migrations
- [ ] Foreign key constraints verified
- [ ] Indexes created on frequently queried fields
- [ ] Backup procedure tested

**Data Integrity:**
- [ ] Foreign key relationships validated
- [ ] Unique constraints verified
- [ ] Data consistency checked
- [ ] Test data cleaned up (if applicable)

**Database Performance:**
- [ ] Query performance tested (< 500ms)
- [ ] Connection pool sized appropriately
- [ ] Slow query logging enabled
- [ ] Backup schedule configured

**Commands:**
```bash
# Apply migrations
npx prisma migrate deploy

# Verify schema
npx prisma db push --skip-generate

# Check database connection
npx prisma db execute --stdin < verify.sql
```

---

### 4. Environment Configuration ✓

**Required Environment Variables:**
```bash
# Authentication
JWT_SECRET=<production-secret-key>
JWT_EXPIRY=86400  # 24 hours

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Application
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.example.com

# CORS
ALLOWED_ORIGINS=https://example.com,https://app.example.com

# Email (if applicable)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=sender@example.com
SMTP_PASS=<secure-password>

# Logging
LOG_LEVEL=info
```

**Verification:**
```bash
# Check all required env vars are set
cat .env.production | grep -E "JWT_SECRET|DATABASE_URL|NODE_ENV"

# Test environment loading
node -e "console.log(process.env.JWT_SECRET ? '✓' : '✗')"
```

---

### 5. Performance Optimization ✓

- [ ] Build optimized for production
- [ ] Static assets compressed (gzip/brotli)
- [ ] Database queries optimized (N+1 queries checked)
- [ ] Caching strategy configured (if applicable)
- [ ] CDN configured (if applicable)
- [ ] Load balancing tested (if multi-server)

**Verification:**
```bash
# Production build
npm run build

# Check bundle size
npm run build -- --analyze

# Page load time test
npm run lighthouse
```

---

### 6. Monitoring & Logging ✓

**Logging:**
- [ ] Structured logging configured
- [ ] Log rotation enabled
- [ ] Sensitive data not logged
- [ ] Error logging includes request ID
- [ ] Log retention policy: 30 days minimum

**Monitoring:**
- [ ] Application health endpoint configured
- [ ] Error tracking service integrated (Sentry/etc)
- [ ] Performance monitoring active
- [ ] Database connection pool monitored
- [ ] Disk space monitoring enabled
- [ ] CPU/Memory monitoring enabled

**Alerting:**
- [ ] High error rate alert (>5%)
- [ ] Database connection failures
- [ ] Out of memory warnings
- [ ] Deployment notifications

---

### 7. Backup & Disaster Recovery ✓

**Backup Strategy:**
- [ ] Daily automated backups configured
- [ ] Backup retention: 30 days minimum
- [ ] Backup testing procedure documented
- [ ] Backup storage location secured
- [ ] Point-in-time recovery tested

**Disaster Recovery:**
- [ ] RTO (Recovery Time Objective): < 1 hour
- [ ] RPO (Recovery Point Objective): < 1 hour
- [ ] Failover procedure documented
- [ ] Failover testing completed
- [ ] Communication plan for outages

---

### 8. Documentation ✓

- [ ] API documentation complete
- [ ] Deployment guide written
- [ ] Operating procedures documented
- [ ] Troubleshooting guide created
- [ ] Change log updated
- [ ] Known issues documented

**Files to verify:**
- [ ] API_DOCUMENTATION.md (created)
- [ ] PRODUCTION_TESTING_CHECKLIST.md (created)
- [ ] API_TESTING_GUIDE.md (created)
- [ ] Deployment procedures
- [ ] Runbook for common issues

---

## Deployment Phase

### 1. Pre-Deployment Checks

```bash
# Verify build
npm run build
# Expected: ✓ Compiled successfully

# Run tests
npm run test
# Expected: All tests passing

# Security scan
npm audit
# Expected: 0 vulnerabilities

# Type check
npx tsc --noEmit
# Expected: 0 errors
```

### 2. Deployment Steps

**Option A: Docker Deployment**

```bash
# Build with multi-stage for optimization
docker build -t learnership-api:1.0.0 .

# Tag for registry
docker tag learnership-api:1.0.0 registry.example.com/learnership-api:1.0.0

# Push to registry
docker push registry.example.com/learnership-api:1.0.0

# Deploy (using Kubernetes or Docker Swarm)
kubectl apply -f deployment.yaml
```

**Option B: Traditional Server Deployment**

```bash
# SSH to production server
ssh user@production-server

# Pull latest code
git pull origin main

# Install dependencies
npm ci --only=production

# Run migrations
npx prisma migrate deploy

# Build application
npm run build

# Restart service
pm2 restart learnership-api

# Verify health
curl http://localhost:3000/health
```

### 3. Post-Deployment Verification

```bash
# Check health endpoint
curl https://api.example.com/health
# Expected: { "status": "ok" }

# Verify authentication
curl -X POST https://api.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
# Expected: 200/401 (depends on credentials)

# Test key endpoint
curl https://api.example.com/api/students \
  -H "Authorization: Bearer <token>"
# Expected: 200 with data

# Check security headers
curl -i https://api.example.com/api/students \
  -H "Authorization: Bearer <token>"
# Expected: X-Frame-Options, X-Content-Type-Options, etc.

# Monitor logs
tail -f /var/log/learnership/app.log

# Check database connectivity
echo "SELECT 1;" | psql $DATABASE_URL
# Expected: (1 row)
```

### 4. Smoke Tests (Post-Deployment)

```bash
# Run smoke test suite
./test-api.sh all

# Import Postman collection
# - Open Postman
# - Import: Learnership_API_Postman_Collection.json
# - Set base_url variable to production URL
# - Run collection tests
# - Expected: All requests successful

# Manual verification
curl https://api.example.com/api/students?page=1&pageSize=10 \
  -H "Authorization: Bearer <production-token>"
```

---

## Post-Deployment Phase

### 1. Monitoring First Week

**Daily Checklist:**
- [ ] Check error logs (should be minimal)
- [ ] Monitor API response times (should be <500ms avg)
- [ ] Verify backup completion
- [ ] Check disk space on servers
- [ ] Monitor database query performance
- [ ] Review security logs
- [ ] Check rate limiter metrics

**Commands:**
```bash
# Check logs for errors
grep ERROR /var/log/learnership/app.log | tail -20

# Check response times
grep "latency" /var/log/learnership/app.log | awk '{print $NF}' | sort -n | tail -20

# Check database performance
psql $DATABASE_URL -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

### 2. Weekly Review

- [ ] Review error tracking (Sentry/etc)
- [ ] Analyze performance metrics
- [ ] Check user feedback/issues
- [ ] Review security logs
- [ ] Test backup restoration process
- [ ] Update documentation based on findings
- [ ] Plan for any required optimizations

### 3. Rollback Plan

If critical issues discovered:

```bash
# Option 1: Revert to previous version
git describe --tags
git checkout v1.0.0
npm ci
npm run build
npm start

# Option 2: Restore from database backup
pg_restore -d learnership /backups/learnership-backup.sql

# Notify users
# - Send status page update
# - Email users of issue
# - Provide ETA for resolution
```

---

## Rollback Scenarios & Recovery

### Scenario 1: Critical Bug in API

**Symptoms:**
- API returning 500 errors
- Authentication failures
- Data corruption

**Recovery:**
```bash
# 1. Immediate rollback
git revert <commit-hash>
npm run build
pm2 restart learnership-api

# 2. Monitor error logs
tail -f /var/log/learnership/app.log

# 3. Check database integrity
npx prisma studio

# 4. Notify stakeholders
```

### Scenario 2: Database Connection Issues

**Symptoms:**
- 503 Service Unavailable
- Database timeout errors
- Connection pool exhausted

**Recovery:**
```bash
# 1. Check database status
pg_isready -h $DB_HOST

# 2. Verify connection string
echo $DATABASE_URL

# 3. Restart database connection pool
pm2 restart learnership-api

# 4. Scale horizontal (if load balancing)
kubectl scale deployment learnership-api --replicas=3
```

### Scenario 3: Rate Limiter Issues

**Symptoms:**
- All requests returning 429
- Users locked out
- In-memory limiter full

**Recovery:**
```bash
# 1. Check rate limiter status
curl http://localhost:3000/debug/rate-limit

# 2. Reset rate limiting
# Edit middleware.ts and restart:
pm2 restart learnership-api

# 3. Monitor recovery
curl http://localhost:3000/api/students \
  -H "Authorization: Bearer <token>" \
  -w "\n%{http_code}\n"
```

---

## Production Maintenance Schedule

### Daily (Automated)
- [ ] Backup database
- [ ] Check health endpoint
- [ ] Monitor error logs
- [ ] Generate daily report

### Weekly (Manual Review)
- [ ] Review security logs
- [ ] Analyze performance metrics
- [ ] Test backup restoration
- [ ] Review error tracking platform

### Monthly
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Dependency updates (security patches)
- [ ] Capacity planning review
- [ ] Team training & documentation

### Quarterly
- [ ] Load testing
- [ ] Disaster recovery drill
- [ ] Security penetration test
- [ ] Architecture review
- [ ] Technology stack evaluation

---

## Sign-Off

**Deployment Approval:**
- [ ] Tech Lead Approval: _________________ Date: _______
- [ ] DevOps Approval: _________________ Date: _______
- [ ] Product Owner Approval: _________________ Date: _______

**Post-Deployment Verification:**
- [ ] First Responder: _________________ Date: _______
- [ ] Time to First Success: _________ minutes
- [ ] Issues Reported: _________ (0 expected)

**Notes:**
```
[Space for deployment notes, issues encountered, resolutions]
```

---

## Quick References

**Useful Commands:**
```bash
# Check application version
npm list | grep learnership

# View logs
pm2 logs learnership-api -n 100

# Restart application
pm2 restart learnership-api

# Stop gracefully
pm2 stop learnership-api

# View PM2 status
pm2 status

# Database console
npx prisma studio

# Health check
curl http://localhost:3000/health
```

**Emergency Contacts:**
- On-Call Engineer: ___________________
- Database Administrator: ___________________
- Security Team: ___________________
- CDN/Infrastructure: ___________________

**Service Dependencies:**
- Database: PostgreSQL 14+
- Cache: Redis (optional)
- CDN: Configured via nginx/CloudFlare
- Email: SMTP service
- Monitoring: Sentry/DataDog
