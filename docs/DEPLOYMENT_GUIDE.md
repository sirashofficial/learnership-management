# YEHA Deployment Guide

**Production Deployment Instructions**  
Version 1.0 | February 2026

---

## 📋 Table of Contents

1. [Deployment Options](#deployment-options)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Vercel Deployment](#vercel-deployment)
4. [Docker Deployment](#docker-deployment)
5. [VPS Deployment](#vps-deployment)
6. [Database Setup](#database-setup)
7. [Environment Configuration](#environment-configuration)
8. [Security Hardening](#security-hardening)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Deployment Options

### Quick Comparison

| Platform | Difficulty | Cost | Scalability | Best For |
|----------|------------|------|-------------|----------|
| **Vercel** | ⭐ Easy | Free tier available | ⭐⭐⭐⭐⭐ Excellent | Quick deployment, small teams |
| **Docker** | ⭐⭐ Moderate | Depends on hosting | ⭐⭐⭐⭐ Good | Containerized environments |
| **VPS** | ⭐⭐⭐ Advanced | $5-50/month | ⭐⭐⭐ Good | Full control, enterprise |

### Recommended: Vercel for Initial Deployment

**Pros:**
- Zero-configuration deployment
- Automatic HTTPS
- Global CDN
- Preview deployments
- Free tier generous

**Cons:**
- Vendor lock-in
- SQLite limitations (use PostgreSQL for production)
- Function execution time limits

---

## Pre-Deployment Checklist

### Code Readiness

- [ ] All tests passing
- [ ] No `console.log` statements in production code
- [ ] Environment variables documented
- [ ] Build succeeds without errors: `npm run build`
- [ ] Database migrations applied
- [ ] TypeScript compilation successful
- [ ] No critical security vulnerabilities: `npm audit`

### Configuration

- [ ] `.env.example` updated with all variables
- [ ] `JWT_SECRET` is strong and unique
- [ ] Database connection string configured
- [ ] API keys for external services obtained
- [ ] Email service configured (if using)
- [ ] CORS origins restricted
- [ ] Error tracking setup (Sentry, etc.)

### Security

- [ ] All API routes have authentication
- [ ] Admin routes require admin role
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] Sensitive data not in git history

### Performance

- [ ] Database indexes created
- [ ] Static assets optimized
- [ ] Images using next/image
- [ ] Bundle size analyzed
- [ ] Caching headers configured

---

## Vercel Deployment

### Prerequisites

- GitHub/GitLab/Bitbucket account
- Vercel account (free at [vercel.com](https://vercel.com))
- Repository pushed to Git

### Step-by-Step Deployment

#### 1. Push Code to Git

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "chore: prepare for deployment"

# Add remote (replace with your URL)
git remote add origin https://github.com/yourusername/yeha.git

# Push
git push -u origin main
```

#### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. **Import** your Git repository
4. Vercel auto-detects Next.js settings
5. Click **"Deploy"**

#### 3. Configure Environment Variables

In Vercel dashboard:

1. Go to **Project Settings** → **Environment Variables**
2. Add all variables from `.env.example`:

```bash
# Required
DATABASE_URL=postgresql://user:pass@host/dbname
JWT_SECRET=your-super-secret-key-min-32-chars
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Optional (AI features)
GEMINI_API_KEY=your-gemini-key
COHERE_API_KEY=your-cohere-key
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=your-env
PINECONE_INDEX=your-index

# Optional (Email)
RESEND_API_KEY=your-resend-key
EMAIL_FROM=noreply@yourdomain.com

# Optional (Document Intelligence)
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=your-endpoint
AZURE_DOCUMENT_INTELLIGENCE_KEY=your-key
```

3. Set environment for: **Production**, **Preview**, **Development**
4. Click **"Save"**

#### 4. Deploy Database

**Option A: Vercel Postgres (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Create Postgres database
vercel postgres create yeha-db

# Link to project
vercel link

# Get connection string
vercel env pull .env.production.local
```

**Option B: External PostgreSQL**

Use services like:
- [Supabase](https://supabase.com) (Free tier)
- [Neon](https://neon.tech) (Generous free tier)
- [Railway](https://railway.app)
- [PlanetScale](https://planetscale.com)

#### 5. Run Database Migrations

```bash
# Generate Prisma client for PostgreSQL
npx prisma generate

# Push schema to database
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

#### 6. Seed Database (Optional)

```bash
# Seed with initial data
npm run db:seed
```

#### 7. Verify Deployment

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Test login with seeded credentials
3. Check all pages load correctly
4. Test API endpoints
5. Verify database connectivity

### Custom Domain Setup

1. In Vercel dashboard: **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain (e.g., `yeha.yourdomain.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (5 minutes - 24 hours)

**DNS Records:**

```
Type: CNAME
Name: yeha (or @)
Value: cname.vercel-dns.com
```

---

## Docker Deployment

### Prerequisites

- Docker installed
- Docker Compose installed (optional)

### Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments
ARG DATABASE_URL
ARG JWT_SECRET
ARG NEXT_PUBLIC_APP_URL

# Set env
ENV DATABASE_URL=${DATABASE_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Update next.config.mjs

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  // ... other config
};

export default nextConfig;
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - DATABASE_URL=${DATABASE_URL}
        - JWT_SECRET=${JWT_SECRET}
        - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://yeha:password@db:5432/yeha
      - JWT_SECRET=${JWT_SECRET}
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=yeha
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=yeha
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Build and Run

```bash
# Build image
docker build -t yeha:latest .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Deploy to Production

**Docker Registry:**

```bash
# Tag image
docker tag yeha:latest registry.yourdomain.com/yeha:latest

# Push to registry
docker push registry.yourdomain.com/yeha:latest

# Pull and run on server
docker pull registry.yourdomain.com/yeha:latest
docker run -d -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  --name yeha \
  registry.yourdomain.com/yeha:latest
```

---

## VPS Deployment

### Prerequisites

- Linux VPS (Ubuntu 22.04 LTS recommended)
- SSH access
- Domain name (optional)

### Server Setup

#### 1. Connect to VPS

```bash
ssh root@your-server-ip
```

#### 2. Update System

```bash
apt update && apt upgrade -y
```

#### 3. Install Node.js

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify
node --version
npm --version
```

#### 4. Install PostgreSQL

```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Start service
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

In PostgreSQL:

```sql
CREATE DATABASE yeha;
CREATE USER yehauser WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE yeha TO yehauser;
\q
```

#### 5. Install Nginx

```bash
# Install Nginx
apt install -y nginx

# Start service
systemctl start nginx
systemctl enable nginx
```

#### 6. Install PM2

```bash
# Install PM2 globally
npm install -g pm2

# Setup PM2 startup
pm2 startup systemd
```

### Application Deployment

#### 1. Clone Repository

```bash
# Create app directory
mkdir -p /var/www
cd /var/www

# Clone repository
git clone https://github.com/yourusername/yeha.git
cd yeha
```

#### 2. Install Dependencies

```bash
npm install --production
```

#### 3. Configure Environment

```bash
# Create production .env
nano .env

# Add variables (paste from .env.example)
DATABASE_URL="postgresql://yehauser:secure_password@localhost:5432/yeha"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
# ... other variables
```

#### 4. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npm run db:seed
```

#### 5. Build Application

```bash
npm run build
```

#### 6. Start with PM2

```bash
# Start application
pm2 start npm --name "yeha" -- start

# Save PM2 configuration
pm2 save

# View logs
pm2 logs yeha

# Monitor
pm2 monit
```

### Nginx Configuration

#### 1. Create Nginx Config

```bash
nano /etc/nginx/sites-available/yeha
```

Add configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }

    # Client-side size limit
    client_max_body_size 10M;
}
```

#### 2. Enable Site

```bash
# Create symlink
ln -s /etc/nginx/sites-available/yeha /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

### SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts

# Auto-renewal is configured automatically
# Test renewal
certbot renew --dry-run
```

### Firewall Setup

```bash
# Install UFW
apt install -y ufw

# Allow SSH
ufw allow OpenSSH

# Allow HTTP/HTTPS
ufw allow 'Nginx Full'

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## Database Setup

### PostgreSQL (Recommended for Production)

#### Change from SQLite

1. Update `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

2. Update `DATABASE_URL`:

```bash
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
```

3. Regenerate client and migrate:

```bash
npx prisma generate
npx prisma migrate deploy
```

### Backup Strategy

#### Automated PostgreSQL Backups

Create backup script:

```bash
nano /usr/local/bin/backup-yeha.sh
```

Add content:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/yeha"
mkdir -p $BACKUP_DIR

# Dump database
pg_dump -U yehauser yeha | gzip > $BACKUP_DIR/yeha_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "yeha_*.sql.gz" -mtime +7 -delete

echo "Backup completed: yeha_$DATE.sql.gz"
```

Make executable:

```bash
chmod +x /usr/local/bin/backup-yeha.sh
```

Schedule with cron:

```bash
crontab -e

# Add line (backup daily at 2 AM)
0 2 * * * /usr/local/bin/backup-yeha.sh
```

#### Restore from Backup

```bash
# Stop application
pm2 stop yeha

# Restore database
gunzip < /var/backups/yeha/yeha_20260217_020000.sql.gz | psql -U yehauser yeha

# Restart application
pm2 start yeha
```

---

## Environment Configuration

### Production Environment Variables

```bash
# Core Configuration
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=min-32-character-secret-key-change-this
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# AI Services (Optional)
GEMINI_API_KEY=
COHERE_API_KEY=
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=
PINECONE_INDEX=

# Email Service (Optional)
RESEND_API_KEY=
EMAIL_FROM=noreply@yourdomain.com

# Document Intelligence (Optional)
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=
AZURE_DOCUMENT_INTELLIGENCE_KEY=

# Monitoring (Optional)
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Analytics (Optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS=
```

### Secure Environment Variables

**Never commit `.env` to Git:**

```bash
# .gitignore
.env
.env.local
.env.production.local
```

**Use secrets management:**
- Vercel: Project Settings → Environment Variables
- Docker: Docker secrets or encrypted env files
- VPS: File permissions `chmod 600 .env`

---

## Security Hardening

### Application Security

1. **Strong JWT Secret:**
```bash
# Generate secure secret (min 32 characters)
openssl rand -base64 32
```

2. **HTTPS Only:**
- Enforce HTTPS in production
- Set secure cookie flags
- Enable HSTS headers

3. **Rate Limiting:**
```typescript
// middleware.ts - already implemented
// Limit requests per IP
```

4. **Input Validation:**
- All inputs validated with Zod
- SQL injection prevention via Prisma
- XSS protection via React

5. **CORS Configuration:**
```typescript
// Allow only specific origins
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
];
```

### Server Security (VPS)

1. **Disable Root Login:**
```bash
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
systemctl restart sshd
```

2. **SSH Key Authentication:**
```bash
# Generate key on local machine
ssh-keygen -t ed25519

# Copy to server
ssh-copy-id user@server
```

3. **Fail2ban:**
```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

4. **Automatic Updates:**
```bash
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

---

## Monitoring & Maintenance

### Application Monitoring

#### PM2 Monitoring

```bash
# View logs
pm2 logs yeha

# Real-time monitoring
pm2 monit

# Restart on crashes (automatic)
pm2 resurrect
```

#### Error Tracking (Sentry)

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard -i nextjs

# Add DSN to .env
SENTRY_DSN=your-sentry-dsn
```

### Server Monitoring

#### System Resources

```bash
# CPU and memory
htop

# Disk space
df -h

# Disk usage
du -sh /var/www/yeha

# Database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('yeha'));"
```

#### Nginx Logs

```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

#### Database Monitoring

```bash
# Active connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('yeha'));"
```

### Maintenance Tasks

#### Weekly Tasks

- [ ] Check error logs
- [ ] Review performance metrics
- [ ] Check disk space
- [ ] Verify backups exist

#### Monthly Tasks

- [ ] Update dependencies: `npm update`
- [ ] Review security advisories: `npm audit`
- [ ] Analyze database performance
- [ ] Review and archive old data
- [ ] Test backup restoration

#### Quarterly Tasks

- [ ] Update Node.js version
- [ ] Review and optimize database indexes
- [ ] Security audit
- [ ] Performance optimization review

---

## Troubleshooting

### Common Deployment Issues

#### Build Fails

**Issue:** `npm run build` fails

**Solutions:**
1. Check TypeScript errors: `npx tsc --noEmit`
2. Verify all dependencies installed: `npm install`
3. Check environment variables are set
4. Review build logs for specific errors

#### Database Connection Fails

**Issue:** "Can't connect to database"

**Solutions:**
1. Verify `DATABASE_URL` is correct
2. Check database service is running
3. Test connection: `psql -U user -h host -d database`
4. Check firewall allows database port
5. Verify Prisma client is generated: `npx prisma generate`

#### 502 Bad Gateway (Nginx)

**Issue:** Nginx shows 502 error

**Solutions:**
1. Check application is running: `pm2 status`
2. Verify port 3000 is correct
3. Check application logs: `pm2 logs yeha`
4. Restart application: `pm2 restart yeha`
5. Check Nginx error logs

#### Out of Memory

**Issue:** Application crashes with OOM error

**Solutions:**
1. Increase Node.js memory: `NODE_OPTIONS="--max-old-space-size=2048"`
2. Optimize database queries
3. Implement pagination
4. Add memory limits to PM2
5. Upgrade server resources

### Debug Mode

Enable detailed logging:

```bash
# Set log level
DEBUG=* npm start

# Or with PM2
pm2 start npm --name yeha -- start --node-args="--trace-warnings"
```

### Health Check Endpoint

Create health check:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  });
}
```

Test:

```bash
curl https://yourdomain.com/api/health
```

---

## Rollback Procedures

### Vercel Rollback

1. Go to Vercel dashboard
2. Click **"Deployments"**
3. Find previous working deployment
4. Click **"..."** → **"Promote to Production"**

### Docker Rollback

```bash
# List images
docker images

# Run previous version
docker run -d -p 3000:3000 yeha:previous-tag
```

### VPS Rollback

```bash
# Use Git to revert
cd /var/www/yeha
git log --oneline
git checkout <previous-commit-hash>

# Rebuild
npm install
npm run build

# Restart
pm2 restart yeha
```

---

## Performance Optimization

### CDN Configuration

Use Vercel Edge Network or configure CDN:

1. CloudFlare
2. AWS CloudFront
3. Fastly

### Caching Strategy

```typescript
// API routes
import { cacheControl } from '@/lib/cache-control';

export async function GET() {
  const data = await fetchData();
  
  return new Response(JSON.stringify(data), {
    headers: {
      ...cacheControl.medium, // 5 minute cache
    },
  });
}
```

### Database Optimization

```sql
-- Check slow queries
SELECT query, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Analyze table
ANALYZE students;

-- Rebuild indexes
REINDEX TABLE students;
```

---

## Support & Resources

### Documentation

- [User Guide](./USER_GUIDE.md)
- [Developer Docs](./DEVELOPER_DOCS.md)
- [API Documentation](./API_ENDPOINTS_DOCUMENTATION.md)

### External Resources

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production](https://www.prisma.io/docs/guides/deployment)

### Getting Help

- GitHub Issues
- Development team
- Community forums

---

## Deployment Checklist

Use this checklist before deploying:

### Pre-Deployment
- [ ] All tests passing
- [ ] Build succeeds locally
- [ ] Environment variables documented
- [ ] Security audit completed
- [ ] Database migrations ready
- [ ] Backup strategy in place

### Deployment
- [ ] Environment variables configured
- [ ] Database deployed and migrated
- [ ] Application deployed
- [ ] DNS configured (if custom domain)
- [ ] SSL certificate installed
- [ ] Health check passing

### Post-Deployment
- [ ] Login works
- [ ] All pages accessible
- [ ] API endpoints responding
- [ ] Database queries working
- [ ] Email sending (if configured)
- [ ] Monitoring setup
- [ ] Error tracking enabled
- [ ] Backups scheduled

---

**Deployment Guide Version:** 1.0  
**Last Updated:** February 17, 2026  
**Maintained by:** Development Team

**Ready to deploy? Choose your platform and follow the instructions above!**
