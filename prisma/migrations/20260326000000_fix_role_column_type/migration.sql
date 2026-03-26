-- Convert role column from PostgreSQL enum type to plain TEXT
-- This fixes the Prisma deserialization error:
--   "Error converting field 'role' of expected non-nullable type 'String', found incompatible value of 'ADMIN'"
-- Root cause: initial migration created role as an enum type,
--             but the Prisma schema declares it as String.
-- This migration preserves all existing values ("ADMIN", "FACILITATOR", etc.).
ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;
