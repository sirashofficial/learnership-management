# Complete Sitemap - Learnership Management System

*Generated on February 14, 2026*

This document provides a comprehensive overview of all frontend routes and backend API endpoints in the Learnership Management System.

---

## ðŸ“‹ Table of Contents
- [Frontend Routes](#frontend-routes)
- [Backend API Endpoints](#backend-api-endpoints)
- [Architecture Overview](#architecture-overview)

---

## ðŸŽ¨ Frontend Routes

### Public Routes (Unauthenticated)
| Route | File | Description |
|-------|------|-------------|
| `/login` | [src/app/login/page.tsx](src/app/login/page.tsx) | User login page with credentials authentication |
| `/register` | [src/app/register/page.tsx](src/app/register/page.tsx) | New user registration page |

### Core Dashboard
| Route | File | Description |
|-------|------|-------------|
| `/` | [src/app/page.tsx](src/app/page.tsx) | Main dashboard with stats, charts, alerts, and activity feed |

### Quick Access (Primary Navigation)

#### Groups Management
| Route | File | Description |
|-------|------|-------------|
| `/groups` | [src/app/groups/page.tsx](src/app/groups/page.tsx) | List all learnership groups, create new groups, bulk operations |
| `/groups/[id]` | [src/app/groups/[id]/page.tsx](src/app/groups/[id]/page.tsx) | Group details: students, rollout plan, assessments, lessons, progress tracking |

#### Student Management
| Route | File | Description |
|-------|------|-------------|
| `/students` | [src/app/students/page.tsx](src/app/students/page.tsx) | List all students with search/filter, create new students |
| `/students/[id]` | [src/app/students/[id]/page.tsx](src/app/students/[id]/page.tsx) | Student profile: personal details, progress, assessments, attendance, POE |

#### Timetable & Scheduling
| Route | File | Description |
|-------|------|-------------|
| `/timetable` | [src/app/timetable/page.tsx](src/app/timetable/page.tsx) | Calendar view of all scheduled sessions, create/edit lessons, recurring sessions |

#### Attendance Management
| Route | File | Description |
|-------|------|-------------|
| `/attendance` | [src/app/attendance/page.tsx](src/app/attendance/page.tsx) | Mark attendance, view attendance records, generate attendance reports |

#### Reports
| Route | File | Description |
|-------|------|-------------|
| `/reports` | [src/app/reports/page.tsx](src/app/reports/page.tsx) | Generate and view various reports (daily, progress, compliance, custom) |

### Management (Secondary Navigation)

#### Assessment Management
| Route | File | Description |
|-------|------|-------------|
| `/assessments` | [src/app/assessments/page.tsx](src/app/assessments/page.tsx) | List all assessments with filtering, bulk operations, marking workflow |
| `/assessments/generate` | [src/app/assessments/generate/page.tsx](src/app/assessments/generate/page.tsx) | AI-powered assessment generation for unit standards |
| `/assessment-checklist` | [src/app/assessment-checklist/page.tsx](src/app/assessment-checklist/page.tsx) | Assessment tracking checklist view |

#### Progress Tracking
| Route | File | Description |
|-------|------|-------------|
| `/progress` | [src/app/progress/page.tsx](src/app/progress/page.tsx) | Overall progress dashboard, student/group progress tracking |

#### POE (Portfolio of Evidence)
| Route | File | Description |
|-------|------|-------------|
| `/poe` | [src/app/poe/page.tsx](src/app/poe/page.tsx) | POE checklist management, document tracking, submission status |

#### Compliance Monitoring
| Route | File | Description |
|-------|------|-------------|
| `/compliance` | [src/app/compliance/page.tsx](src/app/compliance/page.tsx) | Compliance dashboard, attendance rates, assessment completion, credit tracking |

#### Moderation
| Route | File | Description |
|-------|------|-------------|
| `/moderation` | [src/app/moderation/page.tsx](src/app/moderation/page.tsx) | Assessment moderation workflow, quality assurance |

### Tools

#### Lesson Planning
| Route | File | Description |
|-------|------|-------------|
| `/lessons` | [src/app/lessons/page.tsx](src/app/lessons/page.tsx) | List all lesson plans, create new lessons |
| `/lessons/[id]` | [src/app/lessons/[id]/page.tsx](src/app/lessons/[id]/page.tsx) | Edit individual lesson plan details |

#### Curriculum Management
| Route | File | Description |
|-------|------|-------------|
| `/curriculum` | [src/app/curriculum/page.tsx](src/app/curriculum/page.tsx) | Browse curriculum library, modules, unit standards |
| `/curriculum/builder` | [src/app/curriculum/builder/page.tsx](src/app/curriculum/builder/page.tsx) | Build custom curriculum paths |
| `/curriculum/search` | [src/app/curriculum/search/page.tsx](src/app/curriculum/search/page.tsx) | Advanced curriculum search with filters |

#### AI Assistant
| Route | File | Description |
|-------|------|-------------|
| `/ai` | [src/app/ai/page.tsx](src/app/ai/page.tsx) | AI-powered chat assistant, document Q&A, semantic search, recommendations |

#### Settings
| Route | File | Description |
|-------|------|-------------|
| `/settings` | [src/app/settings/page.tsx](src/app/settings/page.tsx) | User settings: profile, notifications, security, appearance, system preferences |

### Admin

#### Administration
| Route | File | Description |
|-------|------|-------------|
| `/admin` | [src/app/admin/page.tsx](src/app/admin/page.tsx) | Admin dashboard (role: ADMIN only) |
| `/admin/users` | [src/app/admin/users/page.tsx](src/app/admin/users/page.tsx) | User management: create, edit, delete users, role assignment |
| `/admin/documents` | [src/app/admin/documents/page.tsx](src/app/admin/documents/page.tsx) | Document indexing for AI, upload and manage documents |

---

## ðŸ”Œ Backend API Endpoints

### Authentication & Authorization

#### Auth Endpoints
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/api/auth/login` | Sign in and return token/user | Credentials (email, password) | Token + user object |
| POST | `/api/auth/logout` | End session | Token | Success status |
| GET | `/api/auth/me` | Get current authenticated user | Token (header) | User object |
| POST | `/api/auth/register` | Create new account | Profile data + password | Token + user object |

### User Management

#### Users
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/users` | List all users | Optional filters (role, search) | User array |
| POST | `/api/users` | Create new user | User data (name, email, role, password) | Created user |
| GET | `/api/users/[id]` | Get user by ID | User ID | User object |
| PUT | `/api/users/[id]` | Update user | User ID + updates | Updated user |
| DELETE | `/api/users/[id]` | Delete user | User ID | Success status |
| PUT | `/api/users/[id]/password` | Change password | User ID + current/new passwords | Success status |

### Student Management

#### Students
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/students` | List all students | Optional filters (group, search, status) | Student array |
| POST | `/api/students` | Create new student | Student data (name, ID number, contact, group) | Created student |
| GET | `/api/students/[id]` | Get student by ID | Student ID | Student object with relations |
| PUT | `/api/students/[id]` | Update student | Student ID + updates | Updated student |
| DELETE | `/api/students/[id]` | Delete student | Student ID | Success status |
| GET | `/api/students/[id]/progress` | Get student progress | Student ID | Progress metrics, credits, completion % |
| POST | `/api/students/[id]/progress` | Update progress | Student ID + progress data | Updated progress |

### Group Management

#### Groups
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/groups` | List all groups | Optional filters | Group array |
| POST | `/api/groups` | Create new group | Group data (name, code, dates, capacity) | Created group |
| PUT | `/api/groups` | Update group | Group ID + updates | Updated group |
| DELETE | `/api/groups` | Delete group | Group ID | Success status |
| GET | `/api/groups/[id]` | Get group by ID | Group ID | Group object with students, assessments |
| PUT | `/api/groups/[id]` | Update specific group | Group ID + updates | Updated group |
| DELETE | `/api/groups/[id]` | Delete specific group | Group ID | Success status |
| GET | `/api/groups/[id]/assessment-status` | Group assessment summary | Group ID | Completion stats per student |
| POST | `/api/groups/[id]/rollout` | Save rollout plan | Group ID + rollout dates/modules | Success status |
| POST | `/api/groups/[id]/lessons/generate` | Auto-generate lessons | Group ID + parameters | Generated lessons summary |
| POST | `/api/groups/upload` | Bulk group import | CSV/Excel file | Import summary |
| POST | `/api/groups/merge` | Merge groups | Source + target group IDs | Merged group |
| POST | `/api/groups/auto-calculate` | Auto calculate stats | Group criteria | Calculated statistics |
| GET | `/api/groups/auto-rollout` | Preview rollout plan | Group inputs | Rollout plan preview |
| POST | `/api/groups/auto-rollout` | Create rollout plan | Group inputs + dates | Created rollout plan |

### Assessment Management

#### Assessments
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/assessments` | List all assessments | Filters (student, group, status, type) | Assessment array |
| POST | `/api/assessments` | Create assessment | Assessment data (type, unit standard, student) | Created assessment |
| PUT | `/api/assessments` | Update assessment | Assessment ID + updates | Updated assessment |
| DELETE | `/api/assessments` | Delete assessment | Assessment ID | Success status |
| GET | `/api/assessments/[id]/complete` | Read completion status | Assessment ID | Completion details |
| POST | `/api/assessments/[id]/complete` | Mark assessment complete | Assessment ID + result data | Updated assessment |
| GET | `/api/assessments/analytics` | Assessment analytics | Date range, filters | Analytics data |
| POST | `/api/assessments/bulk` | Bulk create assessments | Array of assessment data | Creation summary |
| POST | `/api/assessments/bulk-generate` | Generate by rules | Generation rules (group, modules) | Generated assessments |
| PUT | `/api/assessments/bulk-update` | Bulk update results | Array of IDs + status updates | Update summary |
| GET | `/api/assessments/by-group` | Grouped assessments | Group filters | Grouped assessment list |
| GET | `/api/assessments/export` | Export assessments | Export format + filters | File download/stream |
| GET | `/api/assessments/marking` | Get marking queue | Filters | Assessments pending marking |
| POST | `/api/assessments/marking` | Submit marking | Assessment ID + marks | Updated assessment |
| PUT | `/api/assessments/marking` | Update marking | Assessment ID + mark updates | Updated assessment |
| POST | `/api/assessments/moderate` | Moderate assessment | Assessment ID + moderation data | Moderation record |
| GET | `/api/assessments/stats` | Assessment statistics | Filters | Counts, completion rates |
| GET | `/api/assessments/templates` | List templates | None | Template array |
| POST | `/api/assessments/templates` | Create template | Template data | Created template |

### Attendance Management

#### Attendance
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/attendance` | List attendance records | Filters (date, student, group) | Attendance records |
| POST | `/api/attendance` | Mark attendance | Student ID + date + status | Created record |
| PUT | `/api/attendance` | Update attendance | Record ID + status | Updated record |
| DELETE | `/api/attendance` | Delete attendance | Record ID | Success status |
| GET | `/api/attendance/alerts` | Get attendance alerts | Filters | Alert array |
| POST | `/api/attendance/alerts` | Create alert | Alert criteria | Created alert |
| PUT | `/api/attendance/alerts` | Update alert | Alert ID + updates | Updated alert |
| DELETE | `/api/attendance/alerts` | Delete alert | Alert ID | Success status |
| POST | `/api/attendance/bulk` | Bulk mark attendance | Array of attendance records | Creation summary |
| PUT | `/api/attendance/bulk` | Bulk update attendance | Array of updates | Update summary |
| GET | `/api/attendance/export` | Export attendance data | Format + filters | File download |
| GET | `/api/attendance/history` | Attendance history | Date range + student/group | Historical records |
| GET | `/api/attendance/policies` | Get attendance policies | None | Policy settings |
| POST | `/api/attendance/policies` | Update policies | Policy data | Updated policies |
| GET | `/api/attendance/rates` | Attendance rates | Student/group IDs | Rate percentages |
| GET | `/api/attendance/stats` | Attendance statistics | Filters | Aggregate stats |

### Curriculum & Content

#### Curriculum
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/curriculum` | Get curriculum library | None | Modules and unit standards |

#### Modules
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/modules` | List all modules | Include flags | Module array |
| GET | `/api/modules/[id]` | Get module details | Module ID | Module with unit standards |

#### Unit Standards
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/unit-standards` | List unit standards | Filters | Unit standard array |
| POST | `/api/unit-standards` | Create unit standard | Unit standard data | Created unit standard |
| GET | `/api/unit-standards/[id]` | Get unit standard | Unit standard ID | Unit standard details |
| PUT | `/api/unit-standards/[id]` | Update unit standard | Unit standard ID + updates | Updated unit standard |
| DELETE | `/api/unit-standards/[id]` | Delete unit standard | Unit standard ID | Success status |

#### Formatives
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/formatives` | List formatives | Filters | Formative array |
| POST | `/api/formatives/completion` | Mark formative complete | Formative IDs + completion data | Update summary |

### Timetable & Scheduling

#### Timetable
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/timetable` | List timetable entries | Date range + filters | Timetable entries |
| POST | `/api/timetable` | Create timetable entry | Entry data (date, time, group, topic) | Created entry |
| GET | `/api/timetable/[id]` | Get entry details | Entry ID | Entry details |
| PATCH | `/api/timetable/[id]` | Update entry | Entry ID + updates | Updated entry |
| DELETE | `/api/timetable/[id]` | Delete entry | Entry ID | Success status |
| GET | `/api/timetable/[id]/audit` | Entry audit trail | Entry ID | Audit events |
| PATCH | `/api/timetable/[id]/reschedule` | Reschedule entry | Entry ID + new date/time | Updated entry |
| GET | `/api/timetable/schedule` | Get schedule series | Filters | Schedule entries |
| POST | `/api/timetable/schedule` | Generate schedule | Schedule template + dates | Created entries |
| DELETE | `/api/timetable/schedule` | Delete schedule series | Series ID | Success status |

#### Group Schedules
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/group-schedules` | List group schedules | Group filters | Schedule array |
| POST | `/api/group-schedules` | Create schedule | Schedule data | Created schedule |

#### Schedule Templates
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/schedule-templates` | List templates | None | Template array |
| POST | `/api/schedule-templates` | Create template | Template data | Created template |

#### Sessions
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/sessions/generate` | Preview generated sessions | Session inputs | Session preview |
| POST | `/api/sessions/generate` | Generate sessions | Session parameters | Created sessions |

#### Recurring Sessions
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/recurring-sessions` | List recurring sessions | Filters | Recurring session array |
| POST | `/api/recurring-sessions` | Create recurring session | Recurrence pattern + session data | Created series |
| DELETE | `/api/recurring-sessions` | Delete recurring session | Series ID | Success status |

#### Plans
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/plans` | List calendar plans | Filters | Plan array |
| POST | `/api/plans` | Create plan | Plan data | Created plan |
| PATCH | `/api/plans/[id]` | Update plan | Plan ID + updates | Updated plan |
| DELETE | `/api/plans/[id]` | Delete plan | Plan ID | Success status |

### Lesson Management

#### Lessons
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/lessons` | List lesson plans | Filters | Lesson array |
| POST | `/api/lessons` | Create lesson plan | Lesson data (title, objectives, activities) | Created lesson |
| GET | `/api/lessons/[id]` | Get lesson details | Lesson ID | Lesson with full details |
| PUT | `/api/lessons/[id]` | Update lesson | Lesson ID + updates | Updated lesson |
| DELETE | `/api/lessons/[id]` | Delete lesson | Lesson ID | Success status |

### Reports & Analytics

#### Reports
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/api/reports/daily` | Generate daily report | Groups + date | Report data |
| POST | `/api/reports/daily/generate-ai` | AI-generated report text | Report context | AI-generated text |
| GET | `/api/reports/group-progress` | Group progress report | Group filters | Progress report |
| GET | `/api/reports/unit-standards` | Unit standards report | Filters | Unit standard completion |
| POST | `/api/reports/unit-standards` | Generate custom report | Report parameters | Custom report data |

#### Search
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/search` | Global search | Query string + filters | Search results |

### Dashboard

#### Dashboard Data
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/dashboard/summary` | Dashboard summary stats | None | Key metrics (students, groups, rates) |
| GET | `/api/dashboard/stats` | Legacy stats snapshot | None | Statistical overview |
| GET | `/api/dashboard/charts` | Chart data | Time range | Chart series data |
| GET | `/api/dashboard/recent-activity` | Activity feed | None | Recent activity list |
| GET | `/api/dashboard/alerts` | Dashboard alerts | None | Active alerts |
| GET | `/api/dashboard/schedule` | Today's schedule | None | Today's sessions |
| GET | `/api/dashboard/today-classes` | Today's classes | None | Today's class list |

### AI Services

#### AI Endpoints
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/api/ai/chat` | AI chat completion | Messages array | AI response + sources |
| GET | `/api/ai/semantic-search` | Semantic search (GET) | Query string | Search results |
| POST | `/api/ai/semantic-search` | Semantic search (POST) | Query + filters | Search results |
| GET | `/api/ai/generate-assessment` | Preview assessment generation | Unit standard + params | Assessment preview |
| POST | `/api/ai/generate-assessment` | Generate assessment | Unit standard + params | Generated questions |
| GET | `/api/ai/index-documents` | Get indexing status | None | Index status |
| POST | `/api/ai/index-documents` | Index documents | File uploads | Indexing result |
| GET | `/api/ai/recommendations` | Get recommendations | Context data | AI suggestions |

### POE Management

#### POE
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/poe` | List POE checklists | Filters (student, status) | POE checklist array |
| POST | `/api/poe` | Create POE checklist | Student ID + checklist data | Created checklist |
| PUT | `/api/poe` | Update POE checklist | Checklist ID + updates | Updated checklist |
| DELETE | `/api/poe` | Delete POE checklist | Checklist ID | Success status |

### Progress Tracking

#### Progress
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/progress` | Get progress stats | Filters (student, group) | Progress metrics |
| POST | `/api/progress` | Update progress | Progress data | Updated progress |

### Settings & Configuration

#### Settings
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/settings/profile` | Get profile settings | None | Profile data |
| PUT | `/api/settings/profile` | Update profile | Profile updates | Updated profile |
| GET | `/api/settings/notifications` | Get notification settings | None | Notification preferences |
| PUT | `/api/settings/notifications` | Update notifications | Notification preferences | Updated settings |
| GET | `/api/settings/reminders` | Get reminder settings | None | Reminder configuration |
| POST | `/api/settings/reminders` | Update reminders | Reminder settings | Updated settings |
| GET | `/api/settings/security` | Get security settings | None | Security configuration |
| POST | `/api/settings/security` | Update security | Security updates | Updated settings |
| GET | `/api/settings/system` | Get system settings | None | System configuration |
| PUT | `/api/settings/system` | Update system settings | System updates | Updated settings |
| GET | `/api/settings/appearance` | Get appearance settings | None | Appearance preferences |
| PUT | `/api/settings/appearance` | Update appearance | Appearance updates | Updated settings |

#### Reminders
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/reminders` | List reminders | Filters | Reminder array |
| POST | `/api/reminders` | Create reminder | Reminder data | Created reminder |
| DELETE | `/api/reminders/[id]` | Delete reminder | Reminder ID | Success status |
| PATCH | `/api/reminders/[id]/mark-read` | Mark reminder read | Reminder ID | Updated reminder |
| POST | `/api/reminders/send-pending-emails` | Send queued reminders | None | Send summary |

### Companies

#### Companies
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/companies` | List companies | Filters | Company array |
| POST | `/api/companies` | Create company | Company data | Created company |
| PUT | `/api/companies` | Update company | Company ID + updates | Updated company |
| DELETE | `/api/companies` | Delete company | Company ID | Success status |

### Admin & Debug

#### Admin
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/api/admin/cleanup` | Admin cleanup job | None | Cleanup summary |

#### Debug
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/debug/groups-notes` | Debug group notes | None | Debug information |

### Utilities

#### Test
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/test-endpoint` | Test endpoint (echo) | None | Echo response |
| POST | `/api/test-endpoint` | Test endpoint (echo) | Any payload | Echo response |

---

## ðŸ—ï¸ Architecture Overview

### Technology Stack

**Frontend:**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components + Lucide icons
- **State Management:** React Context API (AuthContext)
- **Data Fetching:** Fetch API with async/await
- **Forms:** HTML5 forms with validation

**Backend:**
- **Framework:** Next.js API Routes (App Router)
- **Database:** Prisma ORM + PostgreSQL
- **Authentication:** JWT tokens + bcrypt
- **AI Integration:** Azure OpenAI + Cohere
- **Document Intelligence:** Azure Document Intelligence
- **File Handling:** Multipart form data

### Key Features

1. **Role-Based Access Control (RBAC)**
   - User roles: ADMIN, FACILITATOR, STUDENT
   - Protected routes and API endpoints
   - Conditional UI rendering based on permissions

2. **Real-Time Data**
   - Dashboard with live statistics
   - Attendance tracking
   - Progress monitoring

3. **AI-Powered Features**
   - Assessment generation
   - Semantic search across documents
   - Chat assistant for curriculum Q&A
   - Document indexing and retrieval

4. **Bulk Operations**
   - Bulk student import
   - Bulk assessment creation
   - Bulk attendance marking
   - Bulk group operations

5. **Reporting & Analytics**
   - Daily reports
   - Progress tracking
   - Compliance monitoring
   - Export functionality (CSV, Excel, PDF)

6. **Timetable Management**
   - Calendar integration
   - Recurring sessions
   - Schedule templates
   - Auto-rollout planning

7. **Assessment Workflow**
   - Create, mark, moderate assessments
   - Multiple assessment types (Formative, Summative, POE)
   - Template system
   - Batch operations

### Navigation Structure

```
Sidebar Navigation
â”‚
â”œâ”€â”€ Quick Access
â”‚   â”œâ”€â”€ Home (Dashboard)
â”‚   â”œâ”€â”€ Groups
â”‚   â”œâ”€â”€ Students
â”‚   â”œâ”€â”€ Timetable
â”‚   â”œâ”€â”€ Attendance
â”‚   â””â”€â”€ Reports
â”‚
â”œâ”€â”€ Management
â”‚   â”œâ”€â”€ Assessments
â”‚   â”œâ”€â”€ Progress
â”‚   â”œâ”€â”€ POE Management
â”‚   â”œâ”€â”€ Compliance
â”‚   â””â”€â”€ Moderation
â”‚
â”œâ”€â”€ Tools
â”‚   â”œâ”€â”€ Lesson Planner
â”‚   â”œâ”€â”€ Curriculum
â”‚   â”œâ”€â”€ AI Assistant
â”‚   â””â”€â”€ Settings
â”‚
â””â”€â”€ Admin (ADMIN role only)
    â””â”€â”€ User Management
```

### Data Flow

```
User â†’ Frontend Route â†’ API Endpoint â†’ Prisma ORM â†’ PostgreSQL Database
                           â†“
                    AI Services (optional)
                           â†“
                    Response â†’ Frontend
```

### Authentication Flow

```
1. User submits credentials â†’ /api/auth/login
2. Backend validates â†’ Generates JWT token
3. Token stored in localStorage
4. Token included in Authorization header for protected requests
5. Backend validates token â†’ Returns user data
6. Frontend updates AuthContext â†’ Renders protected UI
```

### File Organization

```
src/
â”œâ”€â”€ app/                    # Next.js App Router pages
â”‚   â”œâ”€â”€ (auth routes)       # login, register
â”‚   â”œâ”€â”€ (main routes)       # dashboard, groups, students, etc.
â”‚   â”œâ”€â”€ api/                # Backend API routes
â”‚   â””â”€â”€ layout.tsx          # Root layout
â”œâ”€â”€ components/             # Reusable React components
â”œâ”€â”€ contexts/               # React contexts (AuthContext)
â”œâ”€â”€ lib/                    # Utilities, helpers, configs
â”‚   â”œâ”€â”€ db.ts              # Prisma client
â”‚   â”œâ”€â”€ auth.ts            # Auth utilities
â”‚   â””â”€â”€ utils.ts           # General utilities
â””â”€â”€ types/                  # TypeScript type definitions
```

---

## ðŸ“Š Route Statistics

- **Total Frontend Routes:** 27 pages
- **Total API Endpoints:** 150+ endpoints
- **Protected Routes:** 25 (requiring authentication)
- **Public Routes:** 2 (login, register)
- **Admin-Only Routes:** 3 (admin dashboard, users, documents)

---

## ðŸ” Security Features

1. **JWT Authentication:** Token-based authentication for all protected routes
2. **Role-Based Authorization:** Different permissions for ADMIN, FACILITATOR, STUDENT
3. **Password Hashing:** bcrypt for secure password storage
4. **Input Validation:** Server-side validation on all API endpoints
5. **CORS Protection:** Configured for production environment
6. **SQL Injection Prevention:** Parameterized queries via Prisma ORM

---

*This sitemap is auto-generated and reflects the current state of the application as of February 14, 2026.*

