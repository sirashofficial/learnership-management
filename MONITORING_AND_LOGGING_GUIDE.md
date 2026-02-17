# Production Monitoring & Logging Setup Guide

## Overview

Complete monitoring, logging, and alerting setup for production deployment. This guide covers error tracking, performance monitoring, health checks, log aggregation, and alerting procedures.

---

## 1. Health Check Endpoint

### Create Health Check Route

**File:** `src/app/api/health/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Health check - no auth required
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    const dbResponseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        responseTime: `${dbResponseTime}ms`
      },
      uptime: process.uptime(),
      memory: {
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      },
      nodeVersion: process.version,
      environment: process.env.NODE_ENV
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

// Export as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
```

### Health Check Monitoring

```bash
# Check health every 30 seconds
curl -s http://localhost:3000/api/health | jq .

# Expected output:
{
  "status": "ok",
  "timestamp": "2026-02-15T10:45:30Z",
  "database": {
    "status": "connected",
    "responseTime": "12ms"
  },
  "uptime": 3600,
  "memory": {
    "heapUsed": "150MB",
    "heapTotal": "256MB"
  },
  "nodeVersion": "v18.16.0",
  "environment": "production"
}
```

---

## 2. Error Tracking (Sentry)

### Installation

```bash
npm install @sentry/nextjs
npm install @sentry/tracing
```

### Setup Sentry

**File:** `sentry.server.config.js`

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV !== 'production',
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request?.headers?.authorization) {
      delete event.request.headers.authorization;
    }
    return event;
  },
});
```

**File:** `sentry.client.config.js`

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Don't send errors from localhost
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
});
```

### Integration in API Routes

```typescript
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
  try {
    // Your code here
  } catch (error) {
    // Capture with context
    Sentry.captureException(error, {
      contexts: {
        api: {
          method: request.method,
          path: request.nextUrl.pathname,
          userId: request.user?.id,
        }
      },
      tags: {
        endpoint: '/api/students',
        failed_operation: 'list_students'
      }
    });
    
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

### Environment Variables

```bash
# .env.production
SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
NEXT_PUBLIC_SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
SENTRY_AUTH_TOKEN=<auth-token>
```

---

## 3. Request/Response Logging

### Create Logger Utility

**File:** `src/lib/logger.ts`

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId: string;
  userId?: string;
  method?: string;
  path?: string;
  [key: string]: any;
}

class Logger {
  private context: LogContext;

  constructor(context: Partial<LogContext> = {}) {
    this.context = {
      requestId: context.requestId || generateRequestId(),
      ...context,
    };
  }

  private formatLog(level: LogLevel, message: string, data?: any) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      data,
    };
  }

  debug(message: string, data?: any) {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(JSON.stringify(this.formatLog('debug', message, data)));
    }
  }

  info(message: string, data?: any) {
    console.log(JSON.stringify(this.formatLog('info', message, data)));
  }

  warn(message: string, data?: any) {
    console.warn(JSON.stringify(this.formatLog('warn', message, data)));
  }

  error(message: string, error?: Error, data?: any) {
    console.error(JSON.stringify(this.formatLog('error', message, {
      errorMessage: error?.message,
      errorStack: error?.stack,
      ...data,
    })));
  }
}

export default Logger;

function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

### Logging in Middleware

**File:** `src/middleware.ts`

```typescript
import Logger from '@/lib/logger';

export function middleware(request: NextRequest) {
  const requestId = generateRequestId();
  const logger = new Logger({ requestId });

  const startTime = Date.now();
  
  logger.info('Request received', {
    method: request.method,
    path: request.nextUrl.pathname,
    userAgent: request.headers.get('user-agent'),
  });

  // ... middleware logic ...

  const duration = Date.now() - startTime;
  
  logger.info('Request completed', {
    method: request.method,
    path: request.nextUrl.pathname,
    status: response.status,
    duration: `${duration}ms`,
  });
  
  return response;
}
```

### Log Levels

```
DEBUG: Development-only detailed logs
INFO: Normal operational events
WARN: Potential issues (high rate limits approaching)
ERROR: Errors that need attention (failed requests, database errors)
```

---

## 4. Performance Monitoring

### Response Time Tracking

```typescript
// In API routes
const startTime = Date.now();

try {
  // Your logic
  
  const duration = Date.now() - startTime;
  logger.info('API call completed', {
    endpoint: '/api/students',
    duration: `${duration}ms`,
    success: true,
  });
} catch (error) {
  const duration = Date.now() - startTime;
  logger.error('API call failed', error, {
    endpoint: '/api/students',
    duration: `${duration}ms`,
  });
}
```

### Database Query Monitoring

```typescript
// Enable Prisma query logging
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
  ],
});

prisma.$on('query', (e) => {
  logger.debug('DB Query', {
    query: e.query,
    duration: `${e.duration}ms`,
    params: e.params,
  });
});
```

### Metrics to Monitor

```
✓ API Response Time (target: <500ms avg)
✓ Database Query Time (target: <100ms)
✓ Request Rate (requests/second)
✓ Error Rate (errors/second)
✓ Memory Usage (should be stable)
✓ CPU Usage (should spike during load)
✓ Connection Pool Usage (should stay <80%)
✓ Rate Limiter Rejections (429 responses)
```

---

## 5. Log Aggregation

### Winston Logger Setup (Production)

**File:** `src/lib/winston-logger.ts`

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'learnership-api',
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Console (all environments)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    
    // File - All logs
    new winston.transports.File({
      filename: '/var/log/learnership/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 30,
    }),
    
    // File - Errors only
    new winston.transports.File({
      filename: '/var/log/learnership/error.log',
      level: 'error',
      maxsize: 5242880,
      maxFiles: 30,
    }),
  ],
});

// Log uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({
    filename: '/var/log/learnership/exceptions.log',
  })
);

// Log unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise,
  });
});

export default logger;
```

### Log Rotation

```bash
# Install log rotation
npm install logrotate

# Configuration: /etc/logrotate.d/learnership
/var/log/learnership/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 node node
    sharedscripts
    postrotate
        systemctl reload learnership
    endscript
}

# Manual rotation test
sudo logrotate -f /etc/logrotate.d/learnership
```

---

## 6. Alerting

### Alert Rules

**Email Alerts for:**

```
1. High Error Rate
   - Threshold: >5% of requests failing
   - Duration: 5+ minutes
   - Action: Page on-call engineer

2. Database Connection Issues
   - Threshold: Connection failures
   - Duration: Immediate
   - Action: Page on-call engineer + notify DevOps

3. Memory Leak
   - Threshold: Heap usage >80%
   - Duration: Continuously increasing over 1 hour
   - Action: Notify on-call + auto-restart if >95%

4. Rate Limiter Attacks
   - Threshold: >100 429 responses/minute
   - Duration: Immediate
   - Action: Alert security team + optional IP block

5. API Response Degradation
   - Threshold: p95 latency >2s (normal <500ms)
   - Duration: 5+ minutes
   - Action: Investigate + page if >5s

6. Backup Failures
   - Threshold: Backup not completed
   - Duration: Should complete daily 2-4am UTC
   - Action: Alert DevOps team
```

### Slack/PagerDuty Integration

**Sentry → Slack:**
```
Alert on:
- Exception rate increase
- New error types
- Critical errors (500s)

Channel: #api-errors (dev) or #production-alerts (prod)
Format: Error message + link to Sentry + stack trace
```

**Custom Alerting Script:**

```typescript
// src/lib/alerts.ts
async function sendAlert(severity: 'low' | 'medium' | 'high', message: string, data?: any) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: message,
      attachments: [{
        color: severity === 'high' ? 'danger' : 'warning',
        fields: [
          { title: 'Severity', value: severity.toUpperCase(), short: true },
          { title: 'Environment', value: process.env.NODE_ENV, short: true },
          { title: 'Details', value: JSON.stringify(data), short: false },
          { title: 'Timestamp', value: new Date().toISOString(), short: true },
        ],
      }],
    }),
  });
}

export { sendAlert };
```

---

## 7. Uptime Monitoring

### External Health Check

```bash
# Use service like Uptime.com, StatusPage.io, or Datadog

# Configure to check:
- URL: https://api.example.com/api/health
- Frequency: Every 60 seconds
- Timeout: 10 seconds
- Notification: Slack if down for 5+ minutes
```

### Internal Status Dashboard

**Display on Status Page:**
```
System Status: OPERATIONAL
Last 24h Uptime: 99.99%
Response Time: 145ms (avg)
Error Rate: 0.02%
Active Requests: 142
```

---

## 8. Metrics Dashboard

### Key Metrics (Using DataDog/Prometheus)

```
Tier 1 (Critical):
- API availability (target: 99.9%)
- Error rate (target: <0.5%)
- Database connectivity (target: 100%)

Tier 2 (Important):
- Response time p50/p95/p99 (target: <500ms)
- Request volume (requests/sec)
- Active connections (should be stable)

Tier 3 (Informational):
- Memory trend
- CPU usage
- Disk usage
- Cache hit rate
```

### Sample Queries

```promql
# Error rate
rate(api_errors_total[5m]) / rate(api_requests_total[5m])

# Response time p95
histogram_quantile(0.95, rate(api_request_duration_seconds_bucket[5m]))

# Database connection pool usage
db_connection_pool_used / db_connection_pool_max

# Memory trend
rate(process_resident_memory_bytes[1h])
```

---

## 9. Incident Response

### Incident Classification

```
SEV1 (Critical):
- API completely down
- Database unavailable
- Data loss or corruption
- Security breach
Action: Page all engineers immediately

SEV2 (High):
- API functionality degraded >25%
- Database performance critical (>5s queries)
- Memory leak detected
Action: Page on-call engineer

SEV3 (Medium):
- Specific endpoints slow (>2s)
- High error rate on specific feature
- Rate limiting being triggered frequently
Action: Alert team, create ticket

SEV4 (Low):
- Minor UI issues
- Non-critical endpoint slow (<1s)
- Low volume of errors
Action: Create ticket for next sprint
```

### Incident Response Procedure

```
1. Detection
   - Alert triggered
   - On-call engineer notified
   - Create incident ticket

2. Initial Assessment (5 min)
   - Check health endpoint
   - Review error logs
   - Check metrics dashboard
   - Identify affected systems

3. Communication
   - Post to #incidents channel
   - Update status page
   - Notify impacted customers

4. Investigation (10 min)
   - Check recent deployments
   - Review database queries
   - Check rate limiter state
   - Review error traces in Sentry

5. Mitigation
   - Scale up resources (if load issue)
   - Roll back recent deployment (if code issue)
   - Restart service (if process issue)
   - Kill long-running queries (if database issue)

6. Resolution
   - Apply permanent fix
   - Verify stability (15 min)
   - Post-mortem within 24 hours

7. Follow-up
   - Document incident
   - Identify root cause
   - Create action items
   - Update runbooks
```

---

## 10. Production Checklist

### Before Going Live

- [ ] Health check endpoint deployed and working
- [ ] Sentry project created and DSN configured
- [ ] Logger utility configured with file rotation
- [ ] Log files at /var/log/learnership with read permissions
- [ ] Winston logger setup to aggregator
- [ ] Alert rules configured in monitoring tool
- [ ] Slack/PagerDuty integrations tested
- [ ] Status page created and published
- [ ] Incident response procedures documented
- [ ] On-call schedule established
- [ ] Runbooks created for common issues
- [ ] Monitoring dashboard configured

### Production Monitoring Schedule

```
Every 5 minutes:
- Check API health endpoint
- Verify error rate <1%
- Check database connectivity

Every 15 minutes:
- Review error logs
- Monitor response times

Every hour:
- Check memory trends
- Verify backup completion
- Review rate limiter stats

Daily:
- Full security check
- Dependency scan
- Database size check
- Disk usage check

Weekly:
- Performance analysis
- Security audit
- Load testing

Monthly:
- Disaster recovery drill
- Dependency updates
- Capacity planning
```

---

## 11. Troubleshooting Guide

### Memory Usage High

```bash
# Check what's consuming memory
node --expose-gc -e "console.log(process.memoryUsage())"

# Force garbage collection
killall -SIGUSR2 node  # May not trigger immediately

# Check for leaks
npm install clinic
clinic doctor -- npm run dev

# Solution: Restart service
sudo systemctl restart learnership
```

### Database Connection Pool Exhausted

```bash
# Check connections
psql -U user -d dbname -c "SELECT count(*) FROM pg_stat_activity;"

# Check pool usage
echo "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;" | psql

# Solution:
# 1. Increase pool size in DATABASE_URL
# 2. Restart application
# 3. Investigate connection leaks
```

### Rate Limiter False Positives

```bash
# Check rate limiter state
# (logs should show: "RateLimit: key=... count=X/Y")

# If legitimate traffic blocked:
# Option 1: Increase rate limit
# Option 2: Whitelist IP address
# Option 3: Disable for specific paths
```

### Slow Queries

```bash
# Enable query logging
export LOG_LEVEL=debug

# Run load test
ab -n 100 -c 10 http://localhost:3000/api/students

# Analyze slow queries
# Look for queries >100ms in logs

# Add indexes if needed
# Check Prisma query plan
```

---

## Quick Reference

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**View Logs:**
```bash
tail -f /var/log/learnership/combined.log
tail -f /var/log/learnership/error.log
```

**Restart Service:**
```bash
sudo systemctl restart learnership
```

**Check Memory:**
```bash
ps aux | grep node
# Look for RSS (resident set size)
```

**Check Connections:**
```bash
netstat -an | grep :3000 | wc -l
```
