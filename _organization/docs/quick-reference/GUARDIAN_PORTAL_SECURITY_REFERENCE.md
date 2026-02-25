# Guardian Portal - Security Quick Reference

## Row-Level Security (RLS) - Critical Controls

### 🔒 Every Guardian API Request Must Check:
1. User is authenticated (JWT token valid)
2. User role is GUARDIAN
3. GuardianStudent relationship exists with `isVerified = true`
4. Return 403 Forbidden if ANY check fails

### 📍 Protected Endpoints Pattern:
```typescript
// All guardian endpoints follow this pattern:
async function handler(request: NextRequest) {
  const user = await getUserFromRequest(request); // 1. Authenticate
  if (user.role !== 'GUARDIAN') return 403;        // 2. Verify role
  
  const studentId = extractStudentId(request);
  const hasAccess = await verifyGuardianAccess(user.userId, studentId); // 3. RLS check
  if (!hasAccess) return 403;                       // 4. Deny if no access
  
  // Safe to return data for this student only
  return getStudentData(studentId);
}
```

---

## Attack Scenarios Prevented

### ❌ URL Parameter Manipulation
```
// Attacker tries to access unlinked student:
GET /api/guardian/students/other-student-uuid

// Result: 403 Forbidden
// Why: GuardianStudent relationship doesn't exist
// Code: Line in [studentId]/route.ts checks verifyGuardianAccess()
```

### ❌ Cross-Family Data Access
```
// Attacker tries to view other family's student:
GET /api/guardian/students
// Expects: Full list including unlinked students

// Result: Only returns guardians' own linked students
// Why: findMany() WHERE guardianId = user.userId AND isVerified = true
// Code: Line 37 in /guardian/students/route.ts
```

### ❌ Missing Relationship Verification
```
// Attacker tries to bypass relationship check:
// (attempt to call endpoint without verifying link)

// Result: 403 Forbidden
// Why: requireGuardian middleware checks relationship before handler
// Code: verifyGuardianAccess() function in requireGuardian.ts line 128
```

### ❌ Role Spoofing
```
// Attacker tries to access with FACILITATOR role:
POST /api/guardian/link-student
Authorization: Bearer {token_for_facilitator}

// Result: 403 Forbidden
// Why: withAuth middleware checks allowedRoles=['GUARDIAN']
// Code: API endpoints specify allowed roles in exports
```

---

## Key Security Files

| File | Purpose | Critical Lines |
|------|---------|-----------------|
| `/src/middleware/requireGuardian.ts` | RLS middleware | 128-135: Relationship verification |
| `/src/app/api/guardian/students/[studentId]/route.ts` | Detail endpoint | 28-30: RLS check |
| `/src/app/api/guardian/students/route.ts` | List endpoint | 37-47: Filtered query |
| `/src/app/guardian/layout.tsx` | Route protection | 12-17: Role check |
| `/prisma/schema.prisma` | Data schema | 246-250: Unique constraint |

---

## Database-Level Security

### ✅ Constraint Prevents Duplicates
```sql
-- Prisma enforces unique relationship per guardian-student pair
@@unique([guardianId, studentId])

-- Only one link per guardian to each student
-- Prevents data multiplication attacks
```

### ✅ Indexes Prevent N+1 Queries
```sql
@@index([guardianId])    -- Fast lookup of guardian's students
@@index([studentId])     -- Fast lookup of student's guardians
@@index([isVerified])    -- Efficient filtering by verification
@@index([createdAt])     -- Audit trails
```

### ✅ Cascade Delete Prevents Orphans
```prisma
guardian User @relation(fields: [guardianId], references: [id], onDelete: Cascade)
student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

-- Deleting user or student automatically removes links
-- No orphaned references possible
```

---

## API Endpoint Security Checklist

### Guardian Endpoints - All MUST require:
- [x] Authentication check
- [x] Role verification (GUARDIAN)
- [x] Guardian-student relationship check
- [x] isVerified = true check
- [x] Return 403 on any failure
- [x] Rate limiting applied

```typescript
// Template for new guardian endpoints:
async function handler(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse('Unauthorized', 401);
    if (user.role !== 'GUARDIAN') return errorResponse('Forbidden', 403);
    
    const studentId = extractStudentId();
    if (!await verifyGuardianAccess(user.userId, studentId)) {
      return errorResponse('Forbidden', 403);
    }
    
    // Now safe to return student data
    return successResponse(data, 'Success');
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(
  withRateLimit(handler, 'moderate'),
  ['GUARDIAN']
);
```

---

## Frontend Route Protection

### ✅ Guardian Layout Enforcement
```typescript
// /src/app/guardian/layout.tsx

export default function GuardianLayout({ children }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not GUARDIAN
    if (!isLoading && (!user || user.role !== 'GUARDIAN')) {
      router.push('/guardian/login');
    }
  }, [user, isLoading]);

  // Block rendering until auth check complete
  if (isLoading || !user || user.role !== 'GUARDIAN') {
    return <LoadingSpinner />;
  }
  
  return <>{children}</>;
}

// All child routes automatically protected
```

### Protected Routes:
- `/guardian/dashboard` - Requires GUARDIAN role
- `/guardian/students/[id]` - Requires GUARDIAN role
- `/guardian/settings` - Requires GUARDIAN role
- `/guardian/login` - Public (redirects GUARDIAN to dashboard)

---

## Sensitive Data Protection

### ✅ Information Reserved from Guardians:
```typescript
// These fields are NEVER returned to guardians:
- student.idNumber          // ID numbers
- student.email             // Email (not linked)
- student.currentModuleId   // Raw IDs
- facilitator information   // Admin data
- group access details      // Organizational info
- other students' data      // Cross-family data
```

### ✅ Information Safe for Guardians:
```typescript
// These fields are SAFE to return:
- student.firstName / lastName         // Student identity
- module.name / number                 // Public module info
- progress percentages                 // Progress metrics
- attendance rates (aggregated)         // Monthly stats
- assessment dates                      // Schedule info
- grades / scores                       // Academic performance
- status (ACTIVE/INACTIVE)              // Enrollment status
```

---

## Verification Code Security

### Current Implementation:
```typescript
// POST /api/guardian/link-student
if (!verificationCode || verificationCode.length < 6) {
  // Simple format check
  // Enhancement: Compare against stored VerificationCode model
}

// TODO: Production enhancement needed:
// 1. Store code in DB with expiration (24 hours)
// 2. Mark as used after first successful link
// 3. Allow only one active code per student
// 4. Enforce code expiration
// 5. Different codes per guardian
```

---

## Audit & Logging

### ✅ All Access Logged:
```typescript
// Via existing AuditLog model:
// - All GET requests to /api/guardian/* endpoints
// - All POST/PUT/DELETE requests
// - IP address captured
// - User ID recorded
// - Timestamp for audit trail
```

### Query Audit Trail:
```sql
-- Find all guardian access to specific student:
SELECT * FROM "AuditLog"
WHERE "userId" IN (
  SELECT "guardianId" FROM "GuardianStudent"
  WHERE "studentId" = '{studentId}'
)
ORDER BY "timestamp" DESC;

-- Detect suspicious access patterns:
SELECT "userId", COUNT(*) as attempts
FROM "AuditLog"
WHERE "entityType" = 'guardian' 
  AND "timestamp" > now() - interval '1 hour'
GROUP BY "userId" HAVING COUNT(*) > 100;
```

---

## Rate Limiting

### Applied to All Guardian Endpoints:
```typescript
// 'moderate' tier: 100 requests per 15 minutes per IP

export const GET = withAuth(
  withRateLimit(handler, 'moderate'), // ← Rate limiting
  ['GUARDIAN']
);
```

### If Rate Limited:
- Response: 429 Too Many Requests
- Effect: Request rejected
- Prevents: Brute force attacks, enumeration attacks

---

## Common Security Mistakes (AVOID!)

### ❌ WRONG - No RLS Check:
```typescript
// VULNERABLE - Anyone with token can access any student
const students = await prisma.student.findMany();
return successResponse(students);
```

### ✅ CORRECT - With RLS Check:
```typescript
// SAFE - Only returns guardian's linked students
const studentIds = await getGuardianStudentIds(user.userId);
const students = await prisma.student.findMany({
  where: { id: { in: studentIds } }
});
```

---

### ❌ WRONG - Trusting User Input:
```typescript
// VULNERABLE - Attacker sends any studentId
const studentId = request.query.studentId; // Untrusted!
const data = await getStudentData(studentId);
```

### ✅ CORRECT - Validating Access:
```typescript
// SAFE - Verify relationship before returning data
const studentId = request.query.studentId;
if (!await verifyGuardianAccess(user.userId, studentId)) {
  return 403;
}
const data = await getStudentData(studentId);
```

---

### ❌ WRONG - Exposing Sensitive Data:
```typescript
// VULNERABLE - Returns everything including ID numbers
return successResponse(student);
```

### ✅ CORRECT - Returning Only Safe Fields:
```typescript
// SAFE - Only return necessary information
return successResponse({
  id: student.id,
  name: `${student.firstName} ${student.lastName}`,
  progress: student.progress,
  // NO: student.idNumber, facilitator info, etc.
});
```

---

## Testing Security

### Local Testing Checklist:
```bash
# 1. Test unauthorized access
curl -X GET http://localhost:3000/api/guardian/students/unlinked-id
# Expected: 403 Forbidden

# 2. Test without auth
curl -X GET http://localhost:3000/api/guardian/students
# Expected: 401 Unauthorized

# 3. Test with wrong role (FACILITATOR trying GUARDIAN endpoint)
curl -X POST http://localhost:3000/api/guardian/link-student \
  -H "Authorization: Bearer {facilitator-token}"
# Expected: 403 Forbidden

# 4. Test with valid GUARDIAN but no linked student
curl -X GET http://localhost:3000/api/guardian/students/other-student-uuid \
  -H "Authorization: Bearer {guardian-token}"
# Expected: 403 Forbidden
```

---

## Security Review Checklist

Before deploying to production, verify:

- [ ] All `/api/guardian/*` endpoints check guardian-student relationship
- [ ] Role-based access control on all routes (frontend + backend)
- [ ] No sensitive data exposed in API responses
- [ ] Verification code system properly implemented with expiration
- [ ] Rate limiting enabled on all public endpoints
- [ ] Audit logging captures all guardian access
- [ ] Database constraints prevent duplicate relationships
- [ ] Cascade deletes prevent orphaned records
- [ ] Error messages don't leak sensitive information
- [ ] CORS properly configured (if applicable)
- [ ] HTTPS enforced in production
- [ ] Security headers applied (HSTS, X-Content-Type-Options, etc.)

---

**Last Updated**: February 25, 2026  
**Maintained By**: Development Team  
**Review Frequency**: Quarterly
