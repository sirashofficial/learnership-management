-- Migration: Site to Group
-- This SQL script carefully migrates data from Site model to Group model

-- Step 1: Create temporary backup
CREATE TABLE IF NOT EXISTS Student_backup AS SELECT * FROM Student;
CREATE TABLE IF NOT EXISTS Session_backup AS SELECT * FROM Session;

-- Step 2: Get all Sites and create corresponding Groups (if not exists)
INSERT OR IGNORE INTO "Group" (id, name, location, address, contactName, contactPhone, startDate, endDate, status, createdAt, updatedAt, companyId, coordinator, notes)
SELECT 
  id,
  name,
  address as location,
  address,
  contactName,
  contactPhone,
  datetime('now') as startDate,
  datetime('now', '+180 days') as endDate,
  status,
  createdAt,
  updatedAt,
  NULL as companyId,
  NULL as coordinator,
  'Migrated from Site' as notes
FROM Site;

-- Step 3: Update Students - set groupId from siteId
UPDATE Student 
SET groupId = siteId
WHERE groupId IS NULL AND siteId IS NOT NULL;

-- Step 4: Update Sessions - set groupId from siteId  
UPDATE Session
SET groupId = siteId
WHERE groupId IS NULL AND siteId IS NOT NULL;

-- Step 5: Update LessonPlan - set groupId from siteId
UPDATE LessonPlan
SET groupId = siteId
WHERE groupId IS NULL AND siteId IS NOT NULL;

-- Verification queries
SELECT 'Students with groupId:' as check, COUNT(*) as count FROM Student WHERE groupId IS NOT NULL;
SELECT 'Sessions with groupId:' as check, COUNT(*) as count FROM Session WHERE groupId IS NOT NULL;
SELECT 'Groups created:' as check, COUNT(*) as count FROM "Group";
