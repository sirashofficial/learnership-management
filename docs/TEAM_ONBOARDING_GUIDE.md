# Team Onboarding & Quick Start Guide

## Welcome to Learnership LMS!

This guide helps new team members get up to speed quickly.

---

## Table of Contents

1. [First Day Setup](#first-day-setup) - 1-2 hours
2. [Development Environment](#development-environment) - 2-3 hours
3. [System Overview](#system-overview) - 1 hour
4. [Key Files & Code Structure](#key-files--code-structure) - 1 hour
5. [Common Tasks](#common-tasks) - Reference
6. [Working with the API](#working-with-the-api) - Reference
7. [Deployment Process](#deployment-process) - Reference
8. [Getting Help](#getting-help) - Reference

---

## First Day Setup

### 1. Account & Access Setup (30 mins)

**Things You Need:**
- [ ] GitHub account with access to repo
- [ ] Slack account (for team communication)
- [ ] Database password/credentials (from tech lead)
- [ ] Staging/Production access (if applicable)

**Getting Access:**
```bash
# Request from Tech Lead:
# "Please add me to repository, Slack workspace, and database"

# Once added:
# 1. Clone the repository
git clone https://github.com/organization/learnership-lms.git
cd learnership-lms

# 2. Install Node.js (if not already installed)
node --version  # Should be v18+

# 3. Install dependencies
npm install

# You're ready to start development!
```

### 2. Introduction Meeting (30 mins)

**Topics to discuss with Tech Lead:**
- [ ] Project overview and goals
- [ ] Your role and responsibilities
- [ ] Team structure and who to contact for what
- [ ] Current priorities and roadmap
- [ ] Communication channels and meeting schedule

---

## Development Environment

### Setup Instructions (macOS/Linux)

**Prerequisites:**
```bash
# Check Node.js version
node --version  # Should be v18.0.0 or higher

# Check npm version
npm --version   # Should be v8.0.0 or higher

# Install if needed
# macOS: brew install node
# Ubuntu: sudo apt install nodejs npm
# Windows: Download from nodejs.org
```

**Clone & Install:**
```bash
# Clone repository
git clone https://github.com/organization/learnership-lms.git
cd learnership-lms

# Install dependencies
npm install

# Create .env file (request from Tech Lead)
cp .env.example .env
# Then edit .env with correct credentials
```

**Environment Variables (.env):**
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/learnership_dev"

# JWT Secret
JWT_SECRET="your_super_secret_key_here"

# Environment
NODE_ENV="development"
LOG_LEVEL="debug"

# Monitoring (optional in dev)
SENTRY_DSN=""

# Email (optional in dev)
MAIL_PROVIDER="console"  # Logs to console instead of sending
```

**Verify Installation:**
```bash
# Start development server
npm run dev

# Should output:
# ▲ Next.js 14.2.35
# - Local:        http://localhost:3000
# - Environments: .env

# Test in another terminal
curl http://localhost:3000/api/health

# Should return health check response
```

### Setup Database (First Time Only)

```bash
# Check database connection
npm run prisma db push

# If tables don't exist, creates them
# If tables exist, migrates any new changes

# Verify tables created
npx prisma studio

# Opens UI to browse database at http://localhost:5555
```

**For PostgreSQL Users:**

```sql
-- Create development database
CREATE DATABASE learnership_dev;

-- Create user
CREATE USER learnership WITH PASSWORD 'password';
ALTER ROLE learnership SET timezone TO 'UTC';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE learnership_dev TO learnership;
CONNECT learnership_dev;
GRANT ALL PRIVILEGES ON SCHEMA public TO learnership;
```

---

## System Overview

### What Does This System Do?

**Learnership Management System** tracks student progress through learnership programs.

**Key Capabilities:**
- **User Management**: Admins create users and assign roles
- **Student Enrollment**: Students join groups/cohorts
- **Curriculum**: Modules and unit standards define learning
- **Assessments**: Track student progress with tests/projects
- **Attendance**: Record who attended each session
- **Progress Reports**: See how students are doing

### High-Level Architecture

```
┌──────────────────────────────────────────┐
│          Web Browser/Mobile App           │
│     (React Frontend - separate repo)      │
└────────────────────┬─────────────────────┘
                     │ HTTPS
                     ▼
┌──────────────────────────────────────────┐
│         Next.js Application (You)         │
│                                          │
├──────────────────────────────────────────┤
│  Pages & API Routes                      │
│  /api/students, /api/groups, etc.        │
└────────────────┬─────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
  ┌──────────────┐  ┌──────────────┐
  │ PostgreSQL   │  │    Redis     │
  │  Database    │  │   (Cache)    │
  └──────────────┘  └──────────────┘
```

### Technology Stack

```
Frontend:
- React (managed in separate repository)
- TypeScript
- Next.js for API

Backend (Your Code):
- Next.js 14.2 (React + Node.js)
- TypeScript (strict mode)
- Prisma (database ORM)
- Zod (validation)

Database:
- PostgreSQL (production)
- SQLite (development optional)

Testing:
- Vitest (unit/integration tests)
- Jest syntax compatible

Deployment:
- Vercel (recommended for Next.js)
- Or any Node.js hosting (Heroku, AWS, etc.)
```

---

## Key Files & Code Structure

### Directory Structure

```
learnership-lms/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   └── refresh/route.ts
│   │   │   ├── students/
│   │   │   │   ├── route.ts          (list & create)
│   │   │   │   └── [id]/route.ts     (get, update, delete)
│   │   │   ├── groups/
│   │   │   ├── assessments/
│   │   │   ├── attendance/
│   │   │   └── health/               (status check)
│   │   └── page.tsx                  (home page)
│   │
│   ├── lib/
│   │   ├── prisma.ts                 (database client)
│   │   ├── api-utils.ts              (pagination, filtering)
│   │   ├── auth.ts                   (JWT generation/verification)
│   │   ├── security.ts               (rate limiting, headers)
│   │   ├── validations.ts            (Zod schemas)
│   │   └── logger.ts                 (logging)
│   │
│   ├── types/
│   │   └── modal.ts                  (TypeScript interfaces)
│   │
│   ├── middleware.ts                 (global middleware)
│   ├── env.ts                        (environment variables)
│   └── instrumentation.ts            (monitoring hooks)
│
├── tests/
│   ├── setup.ts                      (test utilities & fixtures)
│   ├── api/
│   │   ├── students.test.ts
│   │   └── ... other API tests
│   └── unit/
│
├── prisma/
│   ├── schema.prisma                 (database schema definition)
│   └── migrations/                   (database migration history)
│
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── ARCHITECTURE_DESIGN_DOCUMENTATION.md
│   ├── MONITORING_AND_LOGGING_GUIDE.md
│   ├── TROUBLESHOOTING_GUIDE.md
│   └── ... other documentation
│
├── .env.example                      (template for .env)
├── .env                              (your local config - don't commit!)
├── package.json                      (dependencies)
├── tsconfig.json                     (TypeScript settings)
├── vitest.config.ts                  (test settings)
├── next.config.mjs                   (Next.js settings)
└── README.md
```

### Most Important Files (Read These First)

**1. Understanding the Database**
```
File: prisma/schema.prisma
What: Database structure definition
Read: To understand data models and relationships
Time: 20 minutes
```

**2. API Structure**
```
File: src/app/api/students/route.ts
What: Example API endpoint (list & create students)
Read: To understand how to build API endpoints
Time: 30 minutes
```

**3. Authentication**
```
File: src/lib/auth.ts
What: JWT token generation and verification
Read: To understand how login/authorization works
Time: 20 minutes
```

**4. Validation & Security**
```
File: src/lib/validations.ts & src/lib/security.ts
What: Input validation and security middleware
Read: Before adding new endpoints
Time: 30 minutes
```

**5. Testing**
```
File: tests/api/students.test.ts
What: Example API tests
Read: To understand testing patterns
Time: 30 minutes
```

---

## Common Tasks

### Adding a New API Endpoint

**Step 1: Update Database Schema**
```prisma
// File: prisma/schema.prisma
model NewResource {
  id    String  @id @default(cuid())
  name  String
  // ... fields
}
```

**Step 2: Create Migration**
```bash
npx prisma migrate dev --name add_new_resource
# Creates migration file and updates database
```

**Step 3: Create API Route**
```typescript
// File: src/app/api/new-resource/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createNewResourceSchema } from '@/lib/validations';

// GET list
export async function GET(request: NextRequest) {
  const data = await prisma.newResource.findMany();
  return NextResponse.json({ success: true, data });
}

// POST create
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validate input
  const validated = createNewResourceSchema.parse(body);
  
  // Create record
  const data = await prisma.newResource.create({
    data: validated
  });
  
  return NextResponse.json({ success: true, data }, { status: 201 });
}
```

**Step 4: Add Validation Schema**
```typescript
// File: src/lib/validations.ts
export const createNewResourceSchema = z.object({
  name: z.string().min(1).max(255),
  // ... more fields
});
```

**Step 5: Test Your Endpoint**
```bash
# Start dev server
npm run dev

# In another terminal, test
curl -X POST http://localhost:3000/api/new-resource \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
```

### Modifying an Existing Endpoint

**Example: Add filtering to student list**

```typescript
// File: src/app/api/students/route.ts
import { getFilterParams } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  // Get filter parameters
  const filters = getFilterParams(request);
  // filters will be: { groupId?: string, status?: string, ... }
  
  // Build where clause
  const where: any = {};
  if (filters.groupId) where.groupId = filters.groupId;
  if (filters.status) where.status = filters.status;
  
  // Query with filters
  const data = await prisma.student.findMany({ where });
  
  return NextResponse.json({ success: true, data });
}

// Usage: GET /api/students?groupId=g-123&status=ACTIVE
```

### Adding Tests

**Example: Test new endpoint**

```typescript
// File: tests/api/new-resource.test.ts
import { describe, it, expect } from 'vitest';
import { isSuccessResponse } from '../setup';

describe('/api/new-resource', () => {
  it('should create new resource', async () => {
    const response = await fetch('http://localhost:3000/api/new-resource', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' })
    });
    
    const json = await response.json();
    expect(isSuccessResponse(json)).toBe(true);
    expect(json.data.name).toBe('Test');
  });
});
```

**Run Tests:**
```bash
# Run all tests
npm test

# Run specific test file
npm test students.test.ts

# Run with coverage
npm test:coverage
```

---

## Working with the API

### Authentication (Login)

**Option 1: Using curl**
```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}' \
  | jq -r '.data.token')

echo $TOKEN

# Use token in subsequent requests
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/students
```

**Option 2: Using Postman**
1. Download Postman
2. Import: `Learnership_API_Postman_Collection.json`
3. Set `base_url` and `token` in Environment
4. Use pre-configured requests

### Common API Calls

**Get list of students:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/students?page=1&pageSize=20&sort=email,asc"
```

**Create new student:**
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",  
    "email": "john@example.com",
    "enrollmentDate": "2026-02-15"
  }'
```

**Update student:**
```bash
curl -X PUT http://localhost:3000/api/students/st-123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"groupId": "g-456"}'
```

**Delete student:**
```bash
curl -X DELETE http://localhost:3000/api/students/st-123 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Deployment Process

### Deploying to Staging

**Prerequisites:**
- [ ] Code committed to Git
- [ ] All tests passing: `npm test`
- [ ] Build successful: `npm run build`
- [ ] Code reviewed by team lead

**Steps:**

```bash
# 1. Ensure latest code
git pull origin main

# 2. Build and test
npm run build
npm test

# 3. Push to staging branch
git push origin main:staging

# 4. Staging deployment (automatic via CI/CD)
# Vercel/GitHub Actions will automatically deploy

# 5. Monitor staging
curl https://staging-api.example.com/api/health

# 6. Run testing checklist
# See: PRODUCTION_TESTING_CHECKLIST.md
```

### Deploying to Production

**Prerequisites:**
- [ ] Tested on staging for 24+ hours
- [ ] No critical bugs found
- [ ] Database migrations tested
- [ ] Backup taken
- [ ] Rollback plan reviewed

**Steps:**

```bash
# 1. Create deployment ticket in Jira/GitHub Issues
# Title: "Deploy v2.1.0 to Production"
# Description: List of changes included

# 2. Schedule deployment window
# Notify team: "Deploying at 2pm UTC"

# 3. Begin deployment
npm run build

# 4. Monitor deployment
# Check: Health endpoint, error rate, response times

# 5. Verify data integrity
# Check: Database tables, record counts

# 6. Document deployment
# When: 2026-02-15 2:15pm UTC
# What: v2.1.0 deployed successfully
# Issues: None

# 7. Notify stakeholders
# "Production deployment complete. No issues."
```

---

## Getting Help

### Knowledge Resources

**For Understanding the Code:**
1. [LEARNERSHIP_SYSTEM_ARCHITECTURE.md](./LEARNERSHIP_SYSTEM_ARCHITECTURE.md) - Data model & architecture
2. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API endpoints reference
3. [Comments in src/lib/security.ts](../src/lib/security.ts) - Security implementation

**For Common Tasks:**
1. [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md) - Testing procedures
2. [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md) - Problem solving
3. [MONITORING_AND_LOGGING_GUIDE.md](./MONITORING_AND_LOGGING_GUIDE.md) - Monitoring setup

**For Operations:**
1. [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md) - Deployment steps
2. [PRODUCTION_TESTING_CHECKLIST.md](./PRODUCTION_TESTING_CHECKLIST.md) - Testing checklist

### Getting Help From Team

**For Quick Questions (Slack):**
```
@tech-lead "How do I add a new validation?"
Response: Usually within 15 minutes
```

**For Code Review:**
```
1. Push branch to GitHub
2. Create Pull Request
3. Request review from: @tech-lead
4. Address feedback
5. Merge when approved

Pull Request Template:
- What: Summary of changes
- Why: Problem being solved
- How: Implementation approach
- Testing: What tests were added
- Checklist: ☑ Tests pass, ☑ Build passes
```

**For Bug Reports:**
```
Create GitHub Issue with:
- Title: Clear, specific description
- Steps to reproduce: Exact steps
- Expected: What should happen
- Actual: What actually happened
- Environment: dev/staging/production
- Attachments: Screenshots, error logs
```

### Useful Commands Reference

```bash
# Development
npm run dev                    # Start dev server
npm test                      # Run tests
npm test:coverage            # Test coverage report
npm run build                # Build for production

# Database
npx prisma studio           # Open database UI
npx prisma migrate dev      # Create migration
npx prisma db push          # Apply migrations

# Git
git status                   # See changes
git add .                    # Stage changes
git commit -m "message"      # Commit
git push origin branch-name  # Push to GitHub
git pull origin main         # Get latest

# Debugging
npm run dev --verbose        # Verbose output
LOG_LEVEL=debug npm run dev  # Debug logging
node --inspect :9229 server.js  # V8 inspector
```

### Team Contact List

**Tech Lead:**
- Name: [Name]
- Slack: @tech-lead
- Email: tech-lead@example.com
- Best time: Mornings (10-12pm UTC)

**DevOps/Infrastructure:**
- Name: [Name]
- Slack: @devops
- For: Database issues, deployment help, server access

**QA/Testing:**
- Name: [Name]
- Slack: @qa
- For: Testing procedures, bug verification

**Product Manager:**
- Name: [Name]
- Slack: @product
- For: Feature requirements, prioritization

---

## 30-Day Learning Plan

### Week 1: Foundations
- [ ] Monday: Setup dev environment
- [ ] Tuesday: Read SYSTEM_ARCHITECTURE.md
- [ ] Wednesday: Understand database schema
- [ ] Thursday: Study authentication flow
- [ ] Friday: First code change (small fix)

### Week 2: API Development
- [ ] Read API_DOCUMENTATION.md
- [ ] Complete: Adding a new endpoint tutorial
- [ ] Add tests for new endpoint
- [ ] Deploy to staging
- [ ] Code review with tech lead

### Week 3: Full Feature
- [ ] Implement small feature (coordinator + tech lead)
- [ ] Add validation
- [ ] Add tests (>80% coverage)
- [ ] Deploy to staging
- [ ] Production deployment

### Week 4: Independence
- [ ] Pick own task from backlog
- [ ] Complete independently
- [ ] Submit for review
- [ ] Deploy to production
- [ ] Own on-call support for feature

---

## Success Criteria

**By End of Week 1:**
- [ ] Dev environment running
- [ ] Can run tests and build
- [ ] Understand system architecture
- [ ] Familiar with codebase structure

**By End of Week 2:**
- [ ] Made first code contribution (PR reviewed)
- [ ] Understand API structure
- [ ] Can write basic tests
- [ ] Deployed to staging

**By End of Month:**
- [ ] Completed full feature
- [ ] Deployed to production
- [ ] Comfortable with codebase
- [ ] Can help other developers

---

## Welcome to the Team! 🎉

You're now ready to contribute to the Learnership Management System. Remember:

- **Ask questions** - No question is too simple
- **Read documentation** - Answers are usually documented
- **Test thoroughly** - Automated tests catch bugs early
- **Code review** - Learn from feedback
- **Help others** - Share knowledge as you learn

Welcome aboard! 🚀

