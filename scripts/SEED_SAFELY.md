# SEEDING PROTOCOL - READ BEFORE RUNNING ANYTHING

## ⚠️ CRITICAL RULES
1. ONLY run `npm run seed:safe` (we'll create this)
2. NEVER run multiple seed scripts back-to-back
3. ALWAYS backup before seeding: `npm run db:backup`

## The ONE safe seed command
```bash
npm run seed:safe
```

## What it does:
- Backs up dev.db automatically
- Checks for duplicates BEFORE inserting
- Uses upserts (not createMany)
- Logs what it's doing
- Shows counts before/after

## If something breaks:
```bash
npm run db:restore
```

## Deprecated (DO NOT USE):
- ❌ Any script with "import" in the name
- ❌ Multiple seed files run separately
- ❌ Direct Prisma Client scripts without checks
