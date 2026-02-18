# API Documentation & Testing Guide

## Overview

This document provides comprehensive API documentation for all endpoints and testing guidelines for the Learnership Management System.

## Base URL
```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

Or via cookie:
```
Cookie: auth_token=<your_jwt_token>
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "message": "Success message",
  "timestamp": "2026-02-17T10:30:00Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  },
  "message": "Success message",
  "timestamp": "2026-02-17T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2026-02-17T10:30:00Z"
}
```

### Validation Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "data": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ],
  "code": "VALIDATION_ERROR",
  "timestamp": "2026-02-17T10:30:00Z"
}
```

---

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST creating a resource |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but lacks permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (unique constraint) |
| 413 | Payload Too Large | Request body exceeds size limit |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Rate Limiting

Rate limits are applied per client (IP or authenticated user):

- **General API endpoints**: 30 requests/minute
- **Authentication endpoints**: 5 attempts/15 minutes
- **File uploads**: 20 per hour

When rate limit is exceeded, responses include:
```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 0
```

---

## Authentication Endpoints

### POST /auth/login
Login and obtain JWT token.

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "FACILITATOR"
    }
  }
}
```

**Validation Rules:**
- Email: Valid email format
- Password: At least 8 characters (at runtime)

---

### POST /auth/register
Register new user account.

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "password": "SecurePass123",
    "role": "FACILITATOR"
  }'
```

**Validation Rules:**
- Email: Valid, unique, no .local domains
- Name: 2-100 characters
- Password: 8+ chars, uppercase, lowercase, numbers
- Role: ADMIN, FACILITATOR, or COORDINATOR (optional)

---

## Students Endpoints

### GET /students
List all students with pagination and filtering.

**Query Parameters:**
- `page` (int, default: 1): Page number
- `pageSize` (int, default: 20, max: 100): Items per page
- `groupId` (uuid): Filter by group
- `status` (enum): Filter by status (ACTIVE, AT_RISK, COMPLETED, WITHDRAWN, ARCHIVED)
- `format` (enum): Response format (json, csv)

**Request:**
```bash
curl -X GET "http://localhost:3000/api/students?page=1&pageSize=20&status=ACTIVE" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "studentId": "AZ-01",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "groupId": "uuid",
      "status": "ACTIVE",
      "progress": 75
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  }
}
```

**CSV Export:**
```bash
curl -X GET "http://localhost:3000/api/students?format=csv" \
  -H "Authorization: Bearer <token>"
```

---

### POST /students
Create a new student.

**Request:**
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+27123456789",
    "idNumber": "ID123456789",
    "groupId": "uuid-of-group",
    "status": "ACTIVE"
  }'
```

**Validation Rules:**
- firstName: 1-100 characters (required)
- lastName: 1-100 characters (required)
- email: Valid email format (optional)
- phone: International format (optional)
- groupId: Valid UUID (required)
- status: ACTIVE, AT_RISK, COMPLETED, WITHDRAWN, ARCHIVED (default: ACTIVE)

---

### PUT /students/[id]
Update student information.

**Request:**
```bash
curl -X PUT http://localhost:3000/api/students/uuid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "status": "AT_RISK",
    "progress": 60
  }'
```

---

## Groups Endpoints

### GET /groups
List all groups with pagination.

**Query Parameters:**
- `page` (int): Page number
- `pageSize` (int): Items per page
- `status` (enum): Filter by status

**Request:**
```bash
curl -X GET "http://localhost:3000/api/groups?page=1&pageSize=20" \
  -H "Authorization: Bearer <token>"
```

---

### POST /groups
Create a new group.

**Request:**
```bash
curl -X POST http://localhost:3000/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "NVC L2 - February 2026",
    "description": "Level 2 learnership group",
    "status": "ACTIVE",
    "startDate": "2026-02-01T00:00:00Z",
    "endDate": "2026-08-31T23:59:59Z"
  }'
```

**Validation Rules:**
- name: 1-100 characters (required)
- description: 0-500 characters (optional)
- status: ACTIVE, INACTIVE, COMPLETED, ARCHIVED
- startDate/endDate: Valid ISO 8601 format, endDate > startDate

---

## Assessments Endpoints

### GET /assessments
List assessments with pagination and filtering.

**Query Parameters:**
- `page` (int): Page number
- `pageSize` (int): Items per page
- `studentId` (uuid): Filter by student
- `groupId` (uuid): Filter by group
- `result` (enum): Filter by result (PENDING, COMPETENT, NOT_YET_COMPETENT)
- `type` (enum): Filter by type (FORMATIVE, SUMMATIVE, WORKPLACE, INTEGRATED)
- `method` (enum): Filter by method (KNOWLEDGE, PRACTICAL, OBSERVATION, PORTFOLIO)

**Request:**
```bash
curl -X GET "http://localhost:3000/api/assessments?studentId=uuid&result=PENDING" \
  -H "Authorization: Bearer <token>"
```

---

### POST /assessments
Create a new assessment.

**Request:**
```bash
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "studentId": "uuid",
    "unitStandardId": "uuid",
    "type": "FORMATIVE",
    "method": "KNOWLEDGE",
    "dueDate": "2026-03-15T23:59:59Z",
    "notes": "Check understanding of content"
  }'
```

**Validation Rules:**
- studentId: Valid UUID (required)
- unitStandardId: Valid UUID (required)
- type: FORMATIVE, SUMMATIVE, WORKPLACE, INTEGRATED (required)
- method: KNOWLEDGE, PRACTICAL, OBSERVATION, PORTFOLIO (required)
- dueDate: Valid ISO 8601 format (required)
- notes: 0-1000 characters (optional)

---

## Attendance Endpoints

### POST /attendance
Mark attendance for a session.

**Request:**
```bash
curl -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "studentId": "uuid",
    "sessionId": "uuid",
    "status": "PRESENT",
    "notes": "Regular attendance"
  }'
```

**Validation Rules:**
- studentId: Valid UUID (required)
- sessionId: Valid UUID (required)
- status: PRESENT, ABSENT, LATE, EXCUSED (required)
- notes: 0-500 characters (optional)

---

### POST /attendance/bulk
Mark attendance for multiple students.

**Request:**
```bash
curl -X POST http://localhost:3000/api/attendance/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "records": [
      {
        "studentId": "uuid1",
        "sessionId": "uuid",
        "status": "PRESENT"
      },
      {
        "studentId": "uuid2",
        "sessionId": "uuid",
        "status": "ABSENT",
        "notes": "Sick leave"
      }
    ]
  }'
```

**Validation Rules:**
- records: Array with 1-500 items (required)
- Each record must be valid attendance record

---

## Security Headers

All API responses include security headers:

| Header | Value | Purpose |
|--------|-------|---------|
| X-Frame-Options | DENY | Prevent clickjacking |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-XSS-Protection | 1; mode=block | XSS protection |
| Strict-Transport-Security | max-age=31536000 | Force HTTPS |
| Content-Security-Policy | self + whitelist | XSS & injection prevention |
| Referrer-Policy | strict-origin | Control referrer exposure |

---

## Error Handling

### Common Error Codes

| Code | HTTP Status | Meaning |
|------|------------|---------|
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource doesn't exist |
| VALIDATION_ERROR | 422 | Input validation failed |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

### Example Error Response
```json
{
  "success": false,
  "error": "Student with ID xyz not found",
  "code": "NOT_FOUND",
  "timestamp": "2026-02-17T10:30:00Z"
}
```

---

## Testing Guidelines

### Unit Tests
- Validate input schemas for all requests
- Test error handling and edge cases
- Verify response format consistency

### Integration Tests
- Test complete user workflows
- Verify database transactions
- Test concurrent operations

### API Tests
See `TESTING_GUIDE.md` for comprehensive testing procedures.

---

## Best Practices

1. **Always include Authorization header** for protected endpoints
2. **Handle rate limiting** with exponential backoff and retry-after
3. **Validate responses** against expected schema
4. **Use pagination** for list endpoints (don't fetch all data)
5. **Cache responses** where appropriate (check Cache-Control headers)
6. **Report errors** with full context (endpoint, method, payload)
7. **Follow HTTP semantics** (GET for retrieval, POST for creation, etc.)
8. **Use CSV export** for large datasets instead of JSON
9. **Handle timestamps** as ISO 8601 strings with timezone awareness
10. **Keep tokens secure** - never log or expose in URLs

---

## Troubleshooting

### 401 Unauthorized
- Verify token is in Authorization header
- Check token hasn't expired (token issued with 24h expiry)
- Ensure auth_token cookie is set for page requests

### 422 Validation Error
- Check error response's `data` field for field-specific errors
- Verify all required fields are included
- Verify field format matches schema requirements

### 429 Too Many Requests
- Wait for Retry-After seconds before retrying
- Implement exponential backoff for retries
- Consider caching responses to reduce requests

### 500 Internal Server Error
- Check server logs for detailed error message
- Verify request payload is well-formed JSON
- Contact support with request details and timestamp

---

## API Versioning

Current API Version: **v1** (default)

All endpoints are under `/api/v1/` (or just `/api/` for default version).

Future versions will be available at `/api/v2/`, etc. with migration guides provided in advance.
