# YEHA Backend Setup

## 🚀 Backend Architecture

Your YEHA system now has a complete Node.js backend with:

- **Database:** SQLite with Prisma ORM (easily switchable to PostgreSQL/MySQL)
- **API Routes:** RESTful endpoints using Next.js App Router
- **Authentication:** JWT-based auth system (ready to implement)
- **Validation:** Zod schemas for request validation
- **Type Safety:** Full TypeScript support

## 📦 Installation

1. **Install New Dependencies**
   ```bash
   npm install
   ```

2. **Initialize Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Seed Sample Data**
   ```bash
   npx prisma db seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema

The database includes:
- **Users** - Facilitators, admins, coordinators
- **Sites** - Training venues
- **Students** - Learner information and progress
- **Sessions** - Training sessions/classes
- **Attendance** - Daily attendance records
- **Assessments** - Student evaluations
- **POE Files** - Portfolio of Evidence documents

## 🛣️ API Endpoints

### Students
- `GET /api/students` - List all students
- `GET /api/students/[id]` - Get student details
- `POST /api/students` - Create new student
- `PATCH /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Delete student

### Sites
- `GET /api/sites` - List all training sites
- `POST /api/sites` - Create new site

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance

### Assessments
- `GET /api/assessments` - List assessments
- `POST /api/assessments` - Create assessment

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🧪 Testing the API

### Using cURL:

**Get all students:**
```bash
curl http://localhost:3000/api/students
```

**Get all sites:**
```bash
curl http://localhost:3000/api/sites
```

**Create a new student:**
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU008",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "siteId": "your-site-id-here"
  }'
```

### Using Browser:
- Visit: `http://localhost:3000/api/students`
- Visit: `http://localhost:3000/api/sites`
- Visit: `http://localhost:3000/api/dashboard/stats`

## 📁 Backend File Structure

```
src/
├── app/api/              # API endpoints
│   ├── students/
│   │   ├── route.ts     # GET, POST students
│   │   └── [id]/
│   │       └── route.ts # GET, PATCH, DELETE single student
│   ├── sites/
│   ├── attendance/
│   ├── assessments/
│   └── dashboard/
└── lib/                  # Backend utilities
    ├── prisma.ts        # Database client
    ├── auth.ts          # JWT authentication
    ├── api-utils.ts     # Response helpers
    └── validations.ts   # Zod schemas

prisma/
├── schema.prisma        # Database schema
└── seed.ts              # Sample data
```

## 🔐 Authentication (Coming Next)

The auth system is set up but not yet connected. To add:

1. **Login endpoint:** `POST /api/auth/login`
2. **Register endpoint:** `POST /api/auth/register`
3. **Protected routes:** Add middleware to verify JWT tokens
4. **Frontend integration:** Store token in localStorage/cookies

## 🔄 Switching to PostgreSQL

To use PostgreSQL instead of SQLite:

1. Update `.env.local`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/yeha_db"
   ```

2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

3. Run migrations:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

## 📊 Prisma Studio

View and edit your database visually:
```bash
npx prisma studio
```
Opens at: `http://localhost:5555`

## 🧰 Useful Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create database and apply schema
npx prisma db push

# Seed database with sample data
npx prisma db seed

# Open Prisma Studio
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
```

## 📝 Next Steps

1. ✅ Backend structure set up
2. ⬜ Connect frontend to API endpoints
3. ⬜ Implement authentication
4. ⬜ Add file upload for POE documents
5. ⬜ Add real-time features (WebSockets)
6. ⬜ Deploy to production

## 🐛 Troubleshooting

**Prisma errors:**
```bash
npx prisma generate
npx prisma db push
```

**Port conflicts:**
```bash
# Kill process on port 3000
npx kill-port 3000
```

**Database locked:**
```bash
# Stop all processes using the database
# Delete prisma/dev.db and run:
npx prisma db push
npx prisma db seed
```
