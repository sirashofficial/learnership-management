# Environment Configuration Guide

Complete guide for setting up environment variables for development and production environments.

---

## Quick Start

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in required values (see sections below)

3. Never commit `.env.local` to version control (already in `.gitignore`)

---

## Environment Files

### Development
- **File:** `.env.local`
- **Purpose:** Local development settings
- **Location:** Project root
- **Git:** Ignored (never commit)

### Production
- **File:** Environment variables in hosting platform
- **Platforms:** Vercel, Railway, DigitalOcean, AWS, etc.
- **Security:** Use platform's secret management

---

## Required Variables

### 🔴 CRITICAL (Must Set Before Running)

#### `JWT_SECRET`
**Purpose:** Encrypts authentication tokens  
**Security:** CRITICAL - If compromised, all sessions can be hijacked  
**Requirements:**
- Minimum 32 characters
- Cryptographically random
- Different for dev/staging/production

**Generate:**
```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}))
```

**Example:** `JWT_SECRET="kJ8n3mR9pQ4xZ7wV2bH6sL1cT5yF0aG8mN4dK2pE6qW9rU3tI7oP"`

---

### 🟡 IMPORTANT (Required for Full Functionality)

#### `DATABASE_URL`
**Purpose:** Database connection string  
**Default:** `file:./dev.db` (SQLite for development)  
**Production:** Use PostgreSQL or MySQL

**Examples:**
```bash
# Development (SQLite)
DATABASE_URL="file:./dev.db"

# Production (PostgreSQL on Railway)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Production (MySQL on PlanetScale)
DATABASE_URL="mysql://user:password@host:3306/dbname"
```

#### `NEXT_PUBLIC_APP_URL`
**Purpose:** Base URL for your application  
**Used For:**
- Email links
- OAuth callbacks
- Sitemap generation
- Social media cards

**Examples:**
```bash
# Development
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Production
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

---

### 🟢 OPTIONAL (Feature-Specific)

#### Email Service (Resend)
**Required For:** Email notifications, reminders, password resets

```bash
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

**Setup:**
1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Get API key from dashboard

---

#### AI Services

##### Google AI (For Lesson Generation)
```bash
GOOGLE_AI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
GOOGLE_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

**Setup:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Enable Gemini API

##### Cohere (For Embeddings)
```bash
COHERE_API_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Setup:**
1. Sign up at [cohere.com](https://cohere.com)
2. Get API key from dashboard

##### Pinecone (For Vector Database)
```bash
PINECONE_API_KEY="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Setup:**
1. Sign up at [pinecone.io](https://www.pinecone.io)
2. Create an index
3. Get API key

##### ZAI (Custom AI Service)
```bash
ZAI_API_KEY="your-zai-api-key"
```

---

#### Scheduled Jobs
```bash
CRON_SECRET="your-secure-random-string"
```

**Purpose:** Protects cron job endpoints from unauthorized access  
**Used By:** `/api/reminders/send-pending-emails`

**Generate:**
```bash
openssl rand -hex 16
```

---

#### Application Settings

```bash
# Allow search engines to index (set to 'false' for staging)
NEXT_PUBLIC_ALLOW_INDEXING="false"

# Node environment (automatically set by most hosts)
NODE_ENV="production"
```

---

## Complete .env.local Template

```bash
# ===================
# REQUIRED - MUST SET BEFORE RUNNING
# ===================
JWT_SECRET="CHANGE_THIS_TO_RANDOM_32_CHAR_STRING"
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ===================
# EMAIL (Optional - for notifications)
# ===================
# RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
# RESEND_FROM_EMAIL="noreply@yourdomain.com"

# ===================
# AI SERVICES (Optional - for AI features)
# ===================
# GOOGLE_AI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
# GOOGLE_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
# COHERE_API_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
# PINECONE_API_KEY="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
# ZAI_API_KEY="your-zai-api-key"

# ===================
# SCHEDULED JOBS (Optional - for cron endpoints)
# ===================
# CRON_SECRET="your-secure-random-string"

# ===================
# APPLICATION SETTINGS
# ===================
NEXT_PUBLIC_ALLOW_INDEXING="false"
NODE_ENV="development"
```

---

## Platform-Specific Setup

### Vercel

1. Go to Project Settings → Environment Variables
2. Add each variable:
   - Name: `JWT_SECRET`
   - Value: Your secret
   - Environment: Production, Preview, Development
3. Redeploy

**CLI:**
```bash
vercel env add JWT_SECRET
vercel env add DATABASE_URL
```

### Railway

1. Go to Project → Variables
2. Add each variable
3. Railway automatically redeploys

**CLI:**
```bash
railway variables set JWT_SECRET=your-secret
railway variables set DATABASE_URL=your-db-url
```

### DigitalOcean App Platform

1. Go to App → Settings → App-Level Environment Variables  
2. Add variables
3. Click "Save" (triggers redeploy)

### Docker

**Option 1: .env file**
```bash
docker run --env-file .env.production your-image
```

**Option 2: Direct environment variables**
```bash
docker run -e JWT_SECRET=xxx -e DATABASE_URL=xxx your-image
```

---

## Security Best Practices

### ✅ DO
- Use different secrets for dev/staging/production
- Rotate JWT_SECRET periodically (invalidates all sessions)
- Store production secrets in platform's secret manager
- Use strong, random values (not passwords)
- Limit access to production environment variables
- Audit who has access to secrets

### ❌ DON'T
- Commit .env.local to Git
- Share .env files via email/Slack
- Use the same JWT_SECRET across environments
- Use simple/guessable values
- Log environment variables
- Include secrets in error messages

---

## Troubleshooting

### "JWT_SECRET environment variable is required"
**Fix:** Set a strong random string for `JWT_SECRET` in `.env.local`

### "Cannot connect to database"
**Check:**
1. `DATABASE_URL` is set correctly
2. Database server is running (for PostgreSQL/MySQL)
3. For SQLite: Check file permissions and path

### "Invalid token" errors after deployment
**Cause:** JWT_SECRET changed (invalidates all sessions)  
**Fix:** Users need to log in again (normal behavior after secret rotation)

### AI features not working
**Check:**
1. Verify API keys are set
2. Check API key validity in provider dashboards
3. Verify API quotas/limits not exceeded

---

## Migration Guide

### From Development to Production

1. **Generate new secrets:**
   ```bash
   # New JWT secret for production
   openssl rand -base64 32
   
   # New cron secret
   openssl rand -hex 16
   ```

2. **Update database URL:**
   ```bash
   # Change from SQLite
   DATABASE_URL="file:./dev.db"
   
   # To production database
   DATABASE_URL="postgresql://user:password@host:5432/dbname"
   ```

3. **Update app URL:**
   ```bash
   NEXT_PUBLIC_APP_URL="https://yourdomain.com"
   ```

4. **Set indexing:**
   ```bash
   NEXT_PUBLIC_ALLOW_INDEXING="true"  # Only if you want SEO
   ```

5. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

---

## Environment Variable Checklist

Before deploying to production:

- [ ] `JWT_SECRET` set to strong random value (32+ chars)
- [ ] `JWT_SECRET` is different from development
- [ ] `DATABASE_URL` points to production database
- [ ] `NEXT_PUBLIC_APP_URL` is production domain (https)
- [ ] `NODE_ENV` is "production"
- [ ] `NEXT_PUBLIC_ALLOW_INDEXING` set appropriately
- [ ] Email service configured (if using notifications)
- [ ] AI API keys set (if using AI features)
- [ ] Secrets stored in platform's secret manager
- [ ] `.env.local` not committed to Git
- [ ] All team members removed from production secret access
- [ ] Backup of environment variables stored securely

---

## Need Help?

**Common Issues:**
- Authentication errors → Check JWT_SECRET
- Database errors → Verify DATABASE_URL
- Email not sending → Check Resend API key and verified domain
- AI features broken → Verify API keys and quotas

**Security Concerns:**
- Rotate JWT_SECRET if compromised (users will need to re-login)
- Revoke and regenerate API keys if exposed
- Review access logs in your hosting platform

**For More Info:**
- Next.js Environment Variables: https://nextjs.org/docs/basic-features/environment-variables
- Prisma Connection URLs: https://www.prisma.io/docs/reference/database-reference/connection-urls
