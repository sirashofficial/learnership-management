# Module Tracking Migration Steps

## Quick Start Guide

Follow these steps to add module tracking to your system:

### Step 1: Stop the Dev Server
In the terminal running `npm run dev`, press **Ctrl+C** to stop it.

### Step 2: Run the Migration
```bash
npx prisma migrate dev --name add_module_curriculum_fields
```

When prompted "Do you want to continue? All data will be lost", type **y** and press Enter.

### Step 3: Seed the Database
```bash
npx tsx prisma/seed-modules.ts
```

You should see:
```
âœ… Created Module 1: Numeracy with 5 unit standards
âœ… Created Module 2: Communication Skills with 5 unit standards
âœ… Created Module 3: Market Requirements with 4 unit standards
âœ… Created Module 4: Sector and Industry with 3 unit standards
âœ… Created Module 5: Financial Requirements with 3 unit standards
âœ… Created Module 6: Business Operations with 6 unit standards

ðŸ“Š Seed Summary:
   Modules: 6
   Unit Standards: 27
   Total Credits: 137
```

### Step 4: Restart Dev Server
```bash
npm run dev
```

### Step 5: Verify
Open your browser to `http://localhost:3001` and the modules should now be available in the database.

---

## What This Does

- Adds new fields to the `Module` table (moduleNumber, fullName, purpose, credits, hours, etc.)
- Adds `type` field to `UnitStandard` table (Fundamental/Core/Elective)
- Adds `totalCreditsEarned` and `currentModuleId` to `Student` table
- Populates database with all 6 NVC Level 2 modules
- Populates database with all 27 unit standards

---

## Troubleshooting

**Error: "EPERM: operation not permitted"**
- Make sure the dev server is completely stopped
- Close any database browser tools (DB Browser for SQLite, etc.)
- Try again

**Error: "Command not found: tsx"**
- Run: `npm install -D tsx`
- Then try the seed command again

**Migration runs but seed fails**
- Check the error message
- Make sure you're in the correct directory
- Verify `prisma/seed-modules.ts` exists

