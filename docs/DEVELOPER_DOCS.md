# YEHA Developer Documentation

**Technical Reference for Developers**  
Version 1.0 | February 2026

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Authentication](#authentication)
8. [State Management](#state-management)
9. [UI Components](#ui-components)
10. [Testing](#testing)
11. [Performance](#performance)
12. [Contributing](#contributing)

---

## Architecture Overview

YEHA is a **full-stack Next.js 14** application using the **App Router** architecture.

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client Layer                      │
│  Next.js 14 App Router + React 18 + TypeScript     │
│  SWR for data fetching + Tailwind CSS               │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                  API Layer (Edge)                   │
│  Next.js API Routes + JWT Authentication            │
│  Middleware & Request Validation                    │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                   Data Layer                        │
│  Prisma ORM + SQLite Database                       │
│  Models: Student, Group, Assessment, etc.           │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│              External Services (Optional)            │
│  Google AI (Gemini) • Cohere • Pinecone            │
│  Resend (Email) • Azure Document Intelligence       │
└─────────────────────────────────────────────────────┘
```

### Key Design Patterns

1. **Server Components:** Default for data fetching
2. **Client Components:** Interactive UI with 'use client'
3. **API Routes:** RESTful endpoints in `/app/api`
4. **Custom Hooks:** Reusable data fetching with SWR
5. **Context Providers:** Global state (Auth, Groups, Students)
6. **Utility Functions:** Helper functions in `/lib`

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.0 | React framework with App Router |
| React | 18.3.0 | UI library |
| TypeScript | 5.4.5 | Type safety |
| Tailwind CSS | 3.4.3 | Utility-first styling |
| Prisma | 5.22.0 | ORM and database toolkit |
| SQLite | - | Development database |

### Key Libraries

**Data Fetching:**
- `swr` (2.2.5) - Stale-while-revalidate data fetching
- `date-fns` (3.3.1) - Date manipulation

**Authentication:**
- `jose` (6.1.3) - JWT token handling
- `bcryptjs` (2.4.3) - Password hashing

**UI Components:**
- `lucide-react` (0.445.0) - Icon library
- `recharts` (3.7.0) - Charts and graphs
- `@radix-ui` - Accessible UI primitives

**AI Services:**
- `@google/generative-ai` (0.24.1) - Gemini AI
- `cohere-ai` (7.20.0) - Embeddings
- `@pinecone-database/pinecone` (7.0.0) - Vector search

**Document Processing:**
- `jspdf` (4.1.0) - PDF generation
- `docx` (9.5.1) - Word document generation
- `mammoth` (1.11.0) - Word document parsing
- `pdf-parse` (2.4.5) - PDF parsing

### Development Tools

- `eslint` - Code linting
- `prettier` - Code formatting
- `tsx` - TypeScript execution
- `autoprefixer` - CSS vendor prefixes

---

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Git for version control

### Installation

```bash
# Clone repository
git clone <repository-url>
cd learnership-management

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed database with sample data
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

Create `.env` file in project root:

```bash
# Database
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI Services (Optional)
GEMINI_API_KEY="your-gemini-api-key"
COHERE_API_KEY="your-cohere-api-key"
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_ENVIRONMENT="your-pinecone-environment"
PINECONE_INDEX="your-pinecone-index"

# Email (Optional)
RESEND_API_KEY="your-resend-api-key"
EMAIL_FROM="noreply@yeha.com"

# Document Intelligence (Optional)
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT="your-azure-endpoint"
AZURE_DOCUMENT_INTELLIGENCE_KEY="your-azure-key"
```

### Development Workflow

```bash
# Start dev server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start

# Generate Prisma client after schema changes
npx prisma generate

# Create migration
npx prisma migrate dev --name your_migration_name

# View database in Prisma Studio
npx prisma studio

# Run API tests
npx tsx scripts/test-api.ts
```

---

## Project Structure

```
learnership-management/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── public/                    # Static assets
│   └── og-image.svg          # Social media image
├── scripts/                   # Utility scripts
│   ├── seed-safe.js          # Database seeding
│   ├── test-api.ts           # API testing
│   └── *.js                  # Various utilities
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/             # API routes
│   │   │   ├── auth/        # Authentication
│   │   │   ├── students/    # Student endpoints
│   │   │   ├── groups/      # Group endpoints
│   │   │   ├── attendance/  # Attendance endpoints
│   │   │   ├── assessments/ # Assessment endpoints
│   │   │   └── ...          # Other endpoints
│   │   ├── (pages)/         # Application pages
│   │   │   ├── students/
│   │   │   ├── groups/
│   │   │   ├── attendance/
│   │   │   └── ...
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Dashboard
│   │   └── globals.css      # Global styles
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── modals/         # Modal components
│   │   ├── tables/         # Table components
│   │   └── *.tsx           # Feature components
│   ├── contexts/           # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── GroupsContext.tsx
│   │   └── StudentContextSimple.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useStudents.ts
│   │   ├── useDashboard.ts
│   │   └── *.ts
│   ├── lib/                # Utility functions
│   │   ├── api-tester.ts  # API testing utility
│   │   ├── auth.ts        # Authentication helpers
│   │   ├── cache-control.ts # Caching utilities
│   │   ├── form-validation.ts # Form validation
│   │   ├── groupName.ts   # Group name formatting
│   │   ├── swr-config.ts  # SWR configuration
│   │   └── utils.ts       # General utilities
│   └── middleware.ts       # Next.js middleware
├── docs/                   # Documentation
│   ├── USER_GUIDE.md
│   ├── DEVELOPER_DOCS.md
│   └── DEPLOYMENT_GUIDE.md
├── .env.example           # Environment template
├── .gitignore
├── next.config.mjs        # Next.js configuration
├── package.json
├── tailwind.config.ts     # Tailwind configuration
└── tsconfig.json          # TypeScript configuration
```

---

## Database Schema

### Core Models

```prisma
model Student {
  id           String   @id @default(uuid())
  studentId    String   @unique
  firstName    String
  lastName     String
  email        String?
  phone        String?
  idNumber     String?  @unique
  status       StudentStatus @default(ACTIVE)
  groupId      String?
  facilitatorId String?
  progress     Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relations
  group        Group?   @relation(fields: [groupId], references: [id])
  assessments  Assessment[]
  attendance   Attendance[]
  
  // Indexes for performance
  @@index([groupId])
  @@index([status])
  @@index([facilitatorId])
  @@index([groupId, status])
}

model Group {
  id           String   @id @default(uuid())
  name         String   @unique
  code         String   @unique
  startDate    DateTime
  endDate      DateTime
  status       GroupStatus @default(ACTIVE)
  facilitator  String?
  
  // Relations
  students     Student[]
  sessions     Session[]
  rolloutPlan  RolloutPlan?
  
  // Indexes
  @@index([status])
  @@index([name])
  @@index([startDate, endDate])
}

model Assessment {
  id              String   @id @default(uuid())
  title           String
  description     String?
  moduleId        String
  studentId       String
  result          AssessmentResult?
  submittedAt     DateTime?
  moderationStatus ModerationStatus @default(NOT_REQUIRED)
  dueDate         DateTime?
  credits         Int      @default(0)
  
  // Relations
  student         Student  @relation(fields: [studentId], references: [id])
  
  // Indexes
  @@index([result])
  @@index([moderationStatus])
  @@index([dueDate])
}

model Session {
  id           String   @id @default(uuid())
  groupId      String
  moduleId     String
  date         DateTime
  startTime    String
  duration     Int
  facilitator  String?
  
  // Relations
  group        Group    @relation(fields: [groupId], references: [id])
  attendance   Attendance[]
  
  // Indexes
  @@index([groupId])
  @@index([date])
  @@index([groupId, date])
}
```

### Enums

```prisma
enum StudentStatus {
  ACTIVE
  AT_RISK
  COMPLETED
  WITHDRAWN
}

enum GroupStatus {
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum AssessmentResult {
  COMPETENT
  NOT_YET_COMPETENT
  ABSENT
}

enum ModerationStatus {
  NOT_REQUIRED
  PENDING
  APPROVED
  REJECTED
}
```

### Relationships

- **One-to-Many:** Group → Students, Group → Sessions
- **Many-to-One:** Student → Group, Assessment → Student
- **One-to-One:** Group → RolloutPlan

---

## API Reference

### Authentication

#### POST `/api/auth/login`

Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "admin@yeha.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "1",
    "email": "admin@yeha.com",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

#### POST `/api/auth/register`

Create new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "New User",
  "role": "FACILITATOR"
}
```

### Students

#### GET `/api/students`

Get all students with optional filtering.

**Query Parameters:**
- `groupId` - Filter by group
- `status` - Filter by status
- `search` - Search by name or ID

**Response:**
```json
{
  "students": [
    {
      "id": "uuid",
      "studentId": "AZ-01",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "status": "ACTIVE",
      "progress": 45,
      "group": {
        "id": "uuid",
        "name": "Allandale Group A",
        "code": "AZ"
      }
    }
  ]
}
```

#### POST `/api/students`

Create new student.

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "studentId": "AZ-05",
  "groupId": "group-uuid",
  "email": "jane@example.com",
  "phone": "0821234567",
  "status": "ACTIVE"
}
```

#### GET `/api/students/[id]`

Get student by ID with relations.

**Response:**
```json
{
  "id": "uuid",
  "studentId": "AZ-01",
  "firstName": "John",
  "lastName": "Doe",
  "progress": 45,
  "group": { /* group data */ },
  "assessments": [ /* assessments */ ],
  "_count": {
    "assessments": 12,
    "attendance": 45
  }
}
```

#### PUT `/api/students/[id]`

Update student information.

#### DELETE `/api/students/[id]`

Delete student (soft delete).

### Groups

#### GET `/api/groups`

Get all groups.

**Query Parameters:**
- `status` - Filter by status
- `includeStudents` - Include student details

#### POST `/api/groups`

Create new group.

**Request:**
```json
{
  "name": "Allandale Group B",
  "code": "BZ",
  "startDate": "2026-03-01",
  "endDate": "2026-12-15",
  "facilitator": "John Facilitator"
}
```

#### GET `/api/groups/[id]`

Get group with students and rollout plan.

#### GET `/api/groups/[id]/rollout`

Get or update group rollout plan.

### Attendance

#### GET `/api/attendance`

Get attendance records.

**Query Parameters:**
- `sessionId` - Filter by session
- `studentId` - Filter by student
- `groupId` - Filter by group
- `startDate` - Date range start
- `endDate` - Date range end

#### POST `/api/attendance`

Mark attendance for session.

**Request:**
```json
{
  "sessionId": "session-uuid",
  "records": [
    {
      "studentId": "student-uuid",
      "status": "PRESENT"
    },
    {
      "studentId": "student-uuid-2",
      "status": "ABSENT",
      "notes": "Sick"
    }
  ]
}
```

### Assessments

#### GET `/api/assessments`

Get all assessments with filtering.

**Query Parameters:**
- `studentId` - Filter by student
- `moduleId` - Filter by module
- `status` - Filter by status
- `result` - Filter by result

#### POST `/api/assessments`

Create new assessment.

**Request:**
```json
{
  "title": "Module 1 Assessment",
  "description": "Practical assessment",
  "moduleId": "module-uuid",
  "studentId": "student-uuid",
  "dueDate": "2026-03-15",
  "credits": 10
}
```

#### PUT `/api/assessments/[id]`

Update assessment (mark, moderate).

**Request:**
```json
{
  "result": "COMPETENT",
  "marks": 85,
  "feedback": "Excellent work",
  "moderationStatus": "APPROVED"
}
```

### Dashboard

#### GET `/api/dashboard/stats`

Get dashboard statistics.

**Response:**
```json
{
  "totalStudents": 150,
  "totalGroups": 8,
  "attendanceRate": 87.5,
  "activeCourses": 5,
  "completionRate": 68.3,
  "pendingAssessments": 23
}
```

#### GET `/api/dashboard/activity`

Get recent activity feed.

#### GET `/api/dashboard/schedule`

Get today's schedule.

### Timetable

#### GET `/api/timetable`

Get timetable sessions.

**Query Parameters:**
- `groupId` - Filter by group
- `startDate` - Date range start
- `endDate` - Date range end

#### POST `/api/timetable`

Create new session.

#### PUT `/api/timetable/[id]`

Update session.

#### DELETE `/api/timetable/[id]`

Cancel session.

### Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* optional */ }
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication

### JWT Token Structure

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'COORDINATOR' | 'FACILITATOR';
  iat: number;  // Issued at
  exp: number;  // Expires at
}
```

### Middleware Protection

Routes are protected using Next.js middleware (`middleware.ts`):

```typescript
// Protected routes require authentication
const protectedRoutes = [
  '/dashboard',
  '/students',
  '/groups',
  '/attendance',
  '/assessments',
  // ...
];

// Public routes accessible without auth
const publicRoutes = [
  '/login',
  '/register',
];
```

### Using Authentication in API Routes

```typescript
import { requireAuth, requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  // Require authenticated user
  const user = await requireAuth(request);
  
  // Use user data
  console.log(user.userId, user.role);
  
  // Return response
  return Response.json({ data: '...' });
}

export async function DELETE(request: Request) {
  // Require admin role
  const user = await requireAdmin(request);
  
  // Admin-only operation
  // ...
}
```

### Client-Side Authentication

```typescript
// Using AuthContext
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isLoading, login, logout } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;
  
  return <div>Hello {user.name}</div>;
}
```

---

## State Management

### SWR for Data Fetching

```typescript
import useSWR from 'swr';
import { fetcher } from '@/lib/swr-config';

function StudentList() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/students',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 30000, // 30 seconds
    }
  );
  
  if (isLoading) return <Skeleton />;
  if (error) return <Error />;
  
  return <List students={data.students} />;
}
```

### Context Providers

**AuthContext:**
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user, login, logout, isLoading } = useAuth();
```

**GroupsContext:**
```typescript
import { useGroups } from '@/contexts/GroupsContext';

const { groups, addGroup, updateGroup, deleteGroup } = useGroups();
```

**StudentContext:**
```typescript
import { useStudents } from '@/hooks/useStudents';

const { students, isLoading, mutate } = useStudents();
```

### Custom Hooks

```typescript
// hooks/useDashboard.ts
export function useDashboardStats() {
  const { data, error, isLoading } = useSWR(
    '/api/dashboard/stats',
    fetcher
  );
  
  return {
    stats: data,
    isLoading,
    isError: error,
  };
}
```

---

## UI Components

### Component Library

**Base Components** (`src/components/ui/`):
- `Button` - Styled button with variants
- `FormInput` - Form input with validation
- `Alert` - Alert messages
- `Tooltip` - Hover tooltips
- `EmptyState` - Empty state placeholders
- `LoadingSkeleton` - Loading skeletons

**Feature Components** (`src/components/`):
- `Header` - Application header
- `Sidebar` - Navigation sidebar
- `StudentCard` - Student display card
- `QuickActions` - Dashboard quick actions
- `MiniCalendar` - Calendar widget

### Styling Conventions

**Tailwind Classes:**
```typescript
// Prefer utility classes
<div className="bg-white dark:bg-slate-800 rounded-lg p-4">

// Use cn() for conditional classes
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  variant === 'primary' && "variant-classes"
)}>
```

**Dark Mode:**
```typescript
// Always provide dark mode variants
<div className="bg-white dark:bg-slate-800">
<p className="text-slate-900 dark:text-white">
```

### Accessibility

**ARIA Labels:**
```typescript
<button aria-label="Delete student">
  <Trash className="w-4 h-4" aria-hidden="true" />
</button>
```

**Keyboard Navigation:**
```typescript
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
```

---

## Testing

### API Testing

Run comprehensive API tests:

```bash
# Ensure dev server is running
npm run dev

# In another terminal, run tests
npx tsx scripts/test-api.ts
```

**Test Output:**
```
🧪 Running 23 API tests...

✅ Login - Valid Credentials
   POST /api/auth/login - 200 (145ms)

✅ Get All Students
   GET /api/students - 200 (67ms)

❌ Unauthorized Access
   GET /api/students - 401 (23ms)

📊 Test Summary
═══════════════════════════════════
Total Tests:  23
Passed:       21 ✅
Failed:       2 ❌
Success Rate: 91.3%
Avg Duration: 78ms
```

### Writing New Tests

```typescript
// scripts/test-api.ts
const newTest = {
  name: 'Create New Student',
  endpoint: '/api/students',
  method: 'POST' as const,
  body: {
    firstName: 'Test',
    lastName: 'Student',
    groupId: 'group-uuid',
  },
  expectedStatus: 201,
  requiresAuth: true,
  description: 'Should create new student',
};

criticalTests.push(newTest);
```

### Manual Testing

Use API clients like **Postman**, **Insomnia**, or **curl**:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yeha.com","password":"Admin123!"}'

# Get students (with auth token)
curl http://localhost:3000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Performance

### Optimization Strategies

**1. Database Indexes:**
- Added indexes on frequently queried fields
- Composite indexes for complex queries
- See [schema.prisma](../prisma/schema.prisma)

**2. Code Splitting:**
- Dynamic imports for heavy components
- Lazy loading for charts and documents
- Configured in [next.config.mjs](../next.config.mjs)

**3. Caching:**
- SWR cache configuration
- API response caching headers
- See [cache-control.ts](../src/lib/cache-control.ts)

**4. Component Optimization:**
- React.memo for expensive components
- useMemo for computed values
- useCallback for stable functions

**5. Image Optimization:**
- next/image with lazy loading
- WebP format support
- Responsive images

### Performance Monitoring

```typescript
// Measure component render time
import { Profiler } from 'react';

<Profiler
  id="StudentList"
  onRender={(id, phase, actualDuration) => {
    console.log(`${id} ${phase}: ${actualDuration}ms`);
  }}
>
  <StudentList />
</Profiler>
```

### Bundle Analysis

```bash
# Install analyzer
npm install --save-dev @next/bundle-analyzer

# Add to next.config.mjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

# Build with analysis
ANALYZE=true npm run build
```

---

## Contributing

### Code Style

**TypeScript:**
- Use strict mode
- Provide type annotations
- Avoid `any` type

**React:**
- Functional components only
- Custom hooks for logic
- Props destructuring

**Naming Conventions:**
- Components: PascalCase
- Files: kebab-case or PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature-name

# Create pull request
```

**Commit Message Format:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] No console.log statements
- [ ] TypeScript types defined
- [ ] Dark mode supported
- [ ] Accessibility considered
- [ ] Performance optimized
- [ ] Documentation updated

---

## Useful Resources

### Documentation Links

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [SWR Docs](https://swr.vercel.app)

### Internal Documentation

- [User Guide](./USER_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [API Endpoints](./API_ENDPOINTS_DOCUMENTATION.md)
- [Architecture Report](../COMPLETE_ARCHITECTURE_REPORT.md)

### Community

- GitHub Issues
- Development Team Slack
- Weekly dev meetings

---

**Documentation Version:** 1.0  
**Last Updated:** February 17, 2026  
**Maintained by:** Development Team
