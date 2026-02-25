# AI-Powered At-Risk Student Prediction System

Complete implementation guide for the machine learning-based early warning system that predicts students at risk of dropping out or failing.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Risk Analysis Engine](#risk-analysis-engine)
- [API Endpoints](#api-endpoints)
- [Dashboard Widget](#dashboard-widget)
- [Automated Interventions](#automated-interventions)
- [Background Jobs](#background-jobs)
- [Privacy & Compliance](#privacy--compliance)
- [Model Improvement](#model-improvement)
- [Setup Instructions](#setup-instructions)

---

## Overview

The AI-Powered At-Risk Student Prediction System uses machine learning to identify students at risk of dropping out or failing based on behavioral patterns:

- **Attendance patterns**: Rate < 80%, consecutive absences > 3 days
- **Assessment failures**: > 2 formative failures per module, summative failures
- **Engagement metrics**: Late submissions, low portal activity
- **Progress tracking**: Overall progress vs. time in program

### Key Features

✅ **AI-Enhanced Risk Scoring** using Cohere AI for pattern recognition
✅ **Explainable AI** with detailed breakdowns of risk factors
✅ **Automated Interventions** (task creation, notifications, resource suggestions)
✅ **Weekly Background Analysis** with automatic execution
✅ **Monthly Model Improvement** tracking actual outcomes
✅ **Privacy-First Design** with audit logging for compliance
✅ **Dashboard Widget** with red/yellow/green indicators

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Data Collection Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Attendance  │  │ Assessments  │  │  Engagement  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Risk Analysis Engine (AI)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Calculate risk scores (attendance, assessment,    │  │
│  │    engagement)                                        │  │
│  │  • Cohere AI enhancement for pattern recognition     │  │
│  │  • Generate confidence scores & recommendations      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Risk Profile Storage                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  StudentRiskProfile (riskLevel, factors, scores)     │  │
│  │  StudentRiskAuditLog (all accesses logged)           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐          ┌─────────────────────────────┐
│  Interventions  │          │    Dashboard Widget         │
│  ┌───────────┐  │          │  ┌───────────────────────┐ │
│  │  Tasks    │  │          │  │  Early Warning System │ │
│  │  Notify   │  │          │  │  - Risk indicators    │ │
│  │  Resources│  │          │  │  - Drill-down details │ │
│  └───────────┘  │          │  └───────────────────────┘ │
└─────────────────┘          └─────────────────────────────┘
```

---

## Database Schema

### StudentRiskProfile

Stores AI-generated risk assessments for each student.

```prisma
model StudentRiskProfile {
  id                       String   @id @default(uuid())
  studentId                String
  riskLevel                String   // LOW | MEDIUM | HIGH
  riskFactors              String   // JSON array
  confidenceScore          Float    // AI confidence (0-1)
  calculatedAt             DateTime @default(now())
  recommendedInterventions String   // JSON array
  
  // Individual risk scores
  attendanceRiskScore      Float    @default(0)
  assessmentRiskScore      Float    @default(0)
  engagementRiskScore      Float    @default(0)
  overallRiskScore         Float    @default(0)
  
  // Historical tracking
  previousRiskLevel        String?
  riskLevelChangedAt       DateTime?
  
  // Metadata
  modelVersion             String   @default("1.0")
  metadata                 String?  // JSON
  
  student                  Student  @relation(...)
  auditLogs                StudentRiskAuditLog[]
}
```

### StudentRiskAuditLog

Logs all access to risk profiles for ethical AI compliance.

```prisma
model StudentRiskAuditLog {
  id          String              @id @default(uuid())
  profileId   String
  userId      String
  action      String              // VIEWED | GENERATED | INTERVENTION_CREATED | EXPORTED
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime            @default(now())
  metadata    String?             // JSON
  
  profile     StudentRiskProfile  @relation(...)
}
```

### StudentOutcome

Tracks actual student outcomes for model improvement.

```prisma
model StudentOutcome {
  id                    String    @id @default(uuid())
  studentId             String
  outcomeType           String    // COMPLETED | DROPPED_OUT | ON_HOLD | TRANSFERRED
  outcomeDate           DateTime
  reason                String?
  notes                 String?
  
  // For model training
  riskLevelAtOutcome    String?
  riskScoreAtOutcome    Float?
  predictedCorrectly    Boolean   @default(false)
  feedbackProvided      Boolean   @default(false)
  
  student               Student   @relation(...)
}
```

---

## Risk Analysis Engine

Located in `src/lib/ai/riskAnalysis.ts`

### Risk Thresholds

```typescript
export const RISK_THRESHOLDS = {
  attendance: {
    critical: 60,  // < 60% = high risk
    warning: 80,   // < 80% = medium risk
  },
  consecutiveAbsences: {
    critical: 5,   // >= 5 days = high risk
    warning: 3,    // >= 3 days = medium risk
  },
  formativeFailures: {
    critical: 3,   // >= 3 failures = high risk
    warning: 2,    // >= 2 failures = medium risk
  },
  engagement: {
    critical: 20,  // < 20% activity = high risk
    warning: 50,   // < 50% activity = medium risk
  },
};
```

### Core Functions

#### `generateRiskAssessment(studentId: string)`

Generates complete risk assessment for a student:

1. Collects data (attendance, assessments, engagement)
2. Calculates risk scores (0-100 for each category)
3. Enhances with AI for pattern recognition
4. Returns risk level, factors, confidence, and interventions

```typescript
const assessment = await generateRiskAssessment(studentId);
// Returns: { riskLevel, riskFactors, confidenceScore, scores, interventions }
```

#### `calculateRiskScores(data: StudentRiskData)`

Calculates numeric risk scores:

- **Attendance Score** (40% weight): Based on rate and consecutive absences
- **Assessment Score** (35% weight): Based on failures and late submissions
- **Engagement Score** (25% weight): Based on portal activity

**Overall Score** = (Attendance × 0.4) + (Assessment × 0.35) + (Engagement × 0.25)

#### `enhanceRiskAssessmentWithAI(data, factors)`

Uses Cohere AI to:

- Analyze patterns beyond rule-based logic
- Generate natural language explanations
- Suggest contextualized interventions
- Estimate confidence in assessment

---

## API Endpoints

### GET /api/ai/risk-assessment

Returns risk profiles for students in a group.

**Access**: Facilitators and Admins only

**Query Parameters**:
- `groupId` (required): Group to fetch assessments for
- `refresh` (optional): Force regenerate all assessments

**Response**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalStudents": 25,
      "highRisk": 3,
      "mediumRisk": 8,
      "lowRisk": 14
    },
    "students": [
      {
        "studentId": "uuid",
        "studentName": "John Doe",
        "riskLevel": "HIGH",
        "riskFactors": [...],
        "scores": {
          "attendance": 85,
          "assessment": 100,
          "engagement": 40,
          "overall": 79
        },
        "confidenceScore": 0.87,
        "calculatedAt": "2026-02-25T10:00:00Z"
      }
    ]
  }
}
```

### GET /api/ai/risk-factors

Explains specific behaviors that triggered risk flags.

**Access**: Facilitators and Admins only

**Query Parameters**:
- `studentId` (required): Student to get risk factors for

**Response**:
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "uuid",
      "name": "John Doe",
      "currentModule": "Module 3"
    },
    "riskScores": {
      "attendance": { "score": 85, "severity": "HIGH", "weight": 0.4 },
      "assessment": { "score": 100, "severity": "HIGH", "weight": 0.35 },
      "engagement": { "score": 40, "severity": "MEDIUM", "weight": 0.25 }
    },
    "detailedMetrics": {
      "attendance": {
        "rate": 58.3,
        "consecutiveAbsences": 6,
        "totalAbsences": 15,
        "totalSessions": 36
      },
      "assessments": {
        "formativesPassed": 2,
        "formativeFailures": 4,
        "summativeFailures": 1,
        "lateSubmissions": 5
      }
    },
    "riskFactors": [
      {
        "category": "ATTENDANCE",
        "severity": "HIGH",
        "description": "Attendance rate is 58.3% (critical: 60%)",
        "recommendation": "Immediate intervention required..."
      }
    ]
  }
}
```

### POST /api/ai/risk-assessment

Manually trigger risk assessment generation.

**Request Body**:
```json
{
  "studentIds": ["uuid1", "uuid2"],  // or
  "groupId": "group-uuid"
}
```

---

## Dashboard Widget

Located in `src/components/EarlyWarningSystem.tsx`

### Features

- **Summary Statistics**: Total, High, Medium, Low risk counts
- **Student List**: Sorted by risk level (high first)
- **Risk Indicators**: Red/Yellow/Green dots with animation
- **Expandable Details**: Risk scores, factors, recommendations
- **Trend Indicators**: Improving, Worsening, Stable
- **Auto-Refresh**: Optional periodic updates

### Usage

```tsx
import EarlyWarningSystem from '@/components/EarlyWarningSystem';

<EarlyWarningSystem 
  groupId={groupId}
  groupName="Group A - Company XYZ"
  autoRefresh={true}
  refreshInterval={300000}  // 5 minutes
/>
```

### Privacy

- Only visible to users with `FACILITATOR` or `ADMIN` role
- Returns `null` for students and guardians
- All views are audit logged

---

## Automated Interventions

Located in `src/lib/ai/interventions.ts`

### Intervention Types

#### 1. Facilitator Tasks

**HIGH Risk** → Urgent task (due in 2 days):
```
🚨 Urgent: Check-in with John Doe (High Risk)

Key Risk Factors:
- Attendance rate is 58.3% (critical: 60%)
- 6 consecutive absences detected
- Failed 4 formative assessments

Action Required:
1. Schedule immediate one-on-one check-in call
2. Discuss barriers to success
3. Create personalized support plan
4. Follow up within 7 days
```

**MEDIUM Risk** → Standard task (due in 7 days):
```
⚠️ Check-in with Jane Smith (Medium Risk)

Student showing medium risk indicators. Schedule check-in within 
the next week to discuss progress and offer support.
```

#### 2. Coordinator Notifications

For HIGH risk students, notifications are automatically sent to:
- Group coordinator
- Facilitator
- Admin dashboard

#### 3. Resource Suggestions

Based on risk factors:
- **Assessment Issues**: Study guides, practice tests, peer tutoring
- **Attendance Issues**: Transport options, schedule flexibility
- **Engagement Issues**: Interactive activities, motivation strategies

### Triggering Interventions

```typescript
import { triggerInterventions } from '@/lib/ai/interventions';

const results = await triggerInterventions(studentId, profileId, assessment);

// Returns:
// {
//   taskId: "uuid",
//   notificationSent: true,
//   resources: ["📚 Review Module 3 study materials", ...]
// }
```

---

## Background Jobs

### Weekly Risk Analysis

**Schedule**: Every Sunday at 2:00 AM
**Endpoint**: `/api/cron/weekly-risk-analysis`

**Process**:
1. Get all active students
2. Generate risk assessments in batches (10 at a time)
3. Save profiles to database
4. Trigger interventions for HIGH/MEDIUM risk students
5. Log results to audit log

**Manual Trigger** (Admin only):
```bash
POST /api/admin/run-risk-analysis
Authorization: Bearer <admin-token>
```

### Monthly Model Improvement

**Schedule**: 1st of month at 3:00 AM
**Endpoint**: `/api/cron/monthly-model-improvement`

**Process**:
1. Collect student outcomes from past month
2. Compare predictions vs. actual outcomes
3. Calculate model accuracy
4. Update StudentOutcome records with feedback
5. Log accuracy metrics

---

## Privacy & Compliance

### Access Control

✅ **Who Can View**:
- Facilitators (for their assigned students/groups)
- Admins/Coordinators (for all students)

❌ **Who Cannot View**:
- Students (cannot see their own risk assessments)
- Guardians (protected information)

### Audit Logging

Every access to risk profiles is logged with:
- User ID and role
- Action (VIEWED, GENERATED, INTERVENTION_CREATED, EXPORTED)
- IP address and user agent
- Timestamp
- Additional metadata

```typescript
await logRiskProfileAccess(
  profileId,
  userId,
  'VIEWED',
  {
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  }
);
```

### Ethical AI Principles

1. **Transparency**: All risk factors are explainable
2. **Privacy**: Data is role-restricted and audit logged
3. **Fairness**: Rules-based + AI hybrid approach
4. **Improvement**: Model accuracy tracked monthly
5. **Human Oversight**: Facilitators make final decisions

---

## Model Improvement

### Tracking Accuracy

The system tracks:
- Predictions made (risk level at time T)
- Actual outcomes (completed, dropped out, on hold)
- Prediction accuracy (was HIGH risk → dropout?)

### Feedback Loop

1. **Weekly**: Generate risk assessments
2. **Ongoing**: Track student outcomes
3. **Monthly**: Compare predictions vs. outcomes
4. **Quarterly**: Adjust thresholds based on accuracy

### Accuracy Metrics

```typescript
const report = await generateInterventionReport(startDate, endDate);

// Returns:
// {
//   totalInterventions: 45,
//   highRiskInterventions: 12,
//   studentsImproved: 8,
//   studentsWorsened: 2,
//   averageDaysToImprovement: 14,
//   accuracyRate: 67.5%  // 67.5% of predictions were correct
// }
```

---

## Setup Instructions

### 1. Run Database Migration

```bash
npx prisma migrate dev --name add_risk_prediction_system
```

This creates:
- `StudentRiskProfile`
- `StudentRiskAuditLog`
- `StudentOutcome`

### 2. Environment Variables

Add to `.env.local`:

```bash
# Already configured
COHERE_API_KEY=your-cohere-api-key

# New: For Vercel Cron authentication
CRON_SECRET=your-random-secret-key
```

Generate CRON_SECRET:
```bash
openssl rand -base64 32
```

### 3. Configure Vercel Cron Jobs

The `vercel.json` file is already configured:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-risk-analysis",
      "schedule": "0 2 * * 0"
    },
    {
      "path": "/api/cron/monthly-model-improvement",
      "schedule": "0 3 1 * *"
    }
  ]
}
```

After deployment, add `CRON_SECRET` to Vercel environment variables.

### 4. Add Widget to Dashboard

In `src/app/page.tsx` or group detail pages:

```tsx
import EarlyWarningSystem from '@/components/EarlyWarningSystem';

// Inside your dashboard render:
<EarlyWarningSystem 
  groupId={selectedGroupId}
  groupName={selectedGroup.name}
  autoRefresh={true}
/>
```

### 5. Test the System

#### Run Risk Analysis Manually

```bash
# As admin user
curl -X POST https://your-domain.com/api/admin/run-risk-analysis \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### View Risk Assessments

```bash
curl "https://your-domain.com/api/ai/risk-assessment?groupId=GROUP_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### View Risk Factors for Student

```bash
curl "https://your-domain.com/api/ai/risk-factors?studentId=STUDENT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Usage Examples

### Example 1: Manual Risk Analysis for Group

```typescript
// Admin triggers analysis for specific group
const response = await fetch('/api/ai/risk-assessment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ groupId: 'abc-123' }),
});

const { data } = await response.json();
console.log(`Processed ${data.processed} students`);
console.log(`High risk: ${data.results.filter(r => r.riskLevel === 'HIGH').length}`);
```

### Example 2: View Student Risk Details

```typescript
// Facilitator views detailed risk breakdown
const studentId = 'student-xyz';
const response = await fetch(`/api/ai/risk-factors?studentId=${studentId}`);
const { data } = await response.json();

console.log(`Risk Level: ${data.student.riskLevel}`);
data.riskFactors.forEach((factor: any) => {
  console.log(`[${factor.severity}] ${factor.description}`);
  console.log(`   → ${factor.recommendation}`);
});
```

### Example 3: Check Intervention Effectiveness

```typescript
// Admin reviews intervention report
const report = await generateInterventionReport(
  new Date('2026-01-01'),
  new Date('2026-01-31')
);

console.log(`Interventions: ${report.totalInterventions}`);
console.log(`Students improved: ${report.studentsImproved}`);
console.log(`Average improvement time: ${report.averageDaysToImprovement} days`);
```

---

## Troubleshooting

### Risk assessments not generating

- Check COHERE_API_KEY is set correctly
- Verify students have attendance/assessment data
- Check logs for API errors: `npx prisma studio` → AuditLog

### Cron jobs not running

- Verify CRON_SECRET is set in Vercel
- Check Vercel logs under "Functions" tab
- Test manually: `POST /api/admin/run-risk-analysis`

### Widget not showing

- Verify user role is FACILITATOR or ADMIN
- Check browser console for errors
- Confirm groupId is valid

### Interventions not triggering

- Verify FacilitatorTask table exists
- Check student risk level is HIGH or MEDIUM
- Review audit logs for intervention creation

---

## Performance Considerations

- **Batch Processing**: Weekly job processes 10 students at a time
- **Caching**: Risk profiles cached for 7 days (unless manually refreshed)
- **Rate Limiting**: API endpoints have strict rate limits
- **Indexes**: Optimized queries with database indexes

---

## Next Steps

1. ✅ Run database migration
2. ✅ Deploy to Vercel with cron jobs
3. ✅ Add Early Warning widget to facilitator dashboards
4. ✅ Train facilitators on intervention process
5. ✅ Monitor accuracy metrics monthly
6. 🔄 Adjust risk thresholds based on feedback

---

## Support & Documentation

- **Main Docs**: `/docs/COMPLETE_ARCHITECTURE_REPORT.md`
- **API Reference**: `/docs/API_DOCUMENTATION.md`
- **Privacy Policy**: [Add your policy link]
- **Support Email**: [Add your email]

---

**Implementation Complete** ✅

The AI-Powered At-Risk Student Prediction System is now fully operational and ready for deployment.
