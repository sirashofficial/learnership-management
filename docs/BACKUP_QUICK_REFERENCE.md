# 🚨 BACKUP & DR - QUICK REFERENCE CARD

**Print this page and keep it accessible for emergencies**

---

## 🎯 Key Targets

- **RTO:** 4 hours (Recovery Time Objective)
- **RPO:** 1 hour (Recovery Point Objective)
- **Backup Schedule:** Daily at 2:00 AM
- **Retention:** 30 days daily, 12 months monthly

---

## 📞 Emergency Contacts

| Role | Contact | When to Call |
|------|---------|--------------|
| Primary DBA | [Your Info] | Database issues |
| Backup Admin | [Backup Admin] | Backup failures |
| System Admin | [Sys Admin] | Infrastructure |
| Supabase Support | support@supabase.com | Host issues |

---

## ⚡ Quick Commands

### Check System Health
```bash
curl http://localhost:3000/api/health
```

### List Available Backups
```bash
npx ts-node scripts/restore-database.ts --list
```

### Create Manual Backup
```bash
npx ts-node scripts/backup-automated.ts
```

### Verify Latest Backup
```bash
npx ts-node scripts/verify-backups.ts --latest
```

### Test Restore (Dry Run)
```bash
npx ts-node scripts/restore-database.ts [filename] --dry-run
```

### Restore Database (LIVE)
```bash
npx ts-node scripts/restore-database.ts [filename]
```

---

## 🚨 Emergency Procedures

### P0: Database Down (15 min response)

1. **Check health:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Verify connection:**
   ```bash
   npx ts-node test-postgresql-db.ts
   ```

3. **If corrupted, restore:**
   ```bash
   npx ts-node scripts/restore-database.ts --list
   npx ts-node scripts/restore-database.ts [latest-backup]
   ```

4. **Restart application:**
   ```bash
   npm run dev
   ```

### P1: Backup Failed (30 min response)

1. **Check logs:**
   ```bash
   cat logs/backups/scheduler-$(date +%Y-%m-%d).log
   ```

2. **Manual backup:**
   ```bash
   npx ts-node scripts/backup-automated.ts
   ```

3. **If fails, check:**
   - Disk space: `df -h`
   - Database connection
   - PostgreSQL client: `pg_dump --version`

### P2: Disk Space Warning (2 hour response)

1. **Check space:**
   ```bash
   du -sh backups/
   ```

2. **Clean old backups:**
   ```bash
   cd backups/postgresql
   ls -lt | tail -10  # Review oldest
   # Delete carefully (keep last 7 days minimum)
   ```

---

## 📊 Monitoring

### Daily Checks
- [ ] Health endpoint returns 200 OK
- [ ] Latest backup < 25 hours old
- [ ] Disk space < 80% full

### Weekly Tasks
- [ ] Verify backup integrity
- [ ] Review error logs
- [ ] Check storage usage

### Monthly Tasks
- [ ] Restore test on staging
- [ ] Review retention policy
- [ ] Update documentation

---

## 🔐 Security

**Encryption Key Location:** `.env` file  
**Key Format:** 64-character hex string  
**Algorithm:** AES-256-CBC  

**⚠️ NEVER commit encryption key to git**

---

## 📁 File Locations

| Item | Path |
|------|------|
| Backups | `backups/postgresql/` |
| Logs | `logs/backups/` |
| Scripts | `scripts/backup-*.ts` |
| Runbook | `docs/DISASTER_RECOVERY.md` |
| Setup Guide | `docs/BACKUP_DISASTER_RECOVERY_SETUP.md` |

---

## 🌐 API Endpoints

**Health Check:**
```
GET /api/health
```

**List Backups (Admin):**
```
GET /api/admin/backup
Authorization: Bearer [admin-token]
```

**Trigger Backup (Admin):**
```
POST /api/admin/backup
Authorization: Bearer [admin-token]
```

**Download Backup (Admin):**
```
GET /api/admin/backup/[filename]
Authorization: Bearer [admin-token]
```

---

## 🧪 Testing Schedule

| Test | Frequency | Command |
|------|-----------|---------|
| Verify backup | Weekly | `npx ts-node scripts/verify-backups.ts --latest` |
| Restore test | Monthly | `npx ts-node scripts/restore-database.ts [file] --dry-run` |
| Full DR drill | Quarterly | Full restore + validation on staging |

---

## ⚠️ Common Issues

### "pg_dump: command not found"
**Fix:** Install PostgreSQL client tools  
**Link:** https://www.postgresql.org/download/

### "Connection refused"
**Fix:** Check `DATABASE_URL` in `.env`  
**Test:** `psql "$DATABASE_URL"`

### "Insufficient disk space"
**Fix:** Clean old backups or increase storage  
**Check:** `df -h` or `du -sh backups/`

### "Checksum mismatch"
**Fix:** Use previous backup  
**List:** `npx ts-node scripts/restore-database.ts --list`

---

## 📝 Decision Tree

```
Database Issue Detected
    │
    ├─► Application can't connect?
    │   ├─► Check .env DATABASE_URL
    │   └─► Restart application
    │
    ├─► Slow queries (> 5s)?
    │   ├─► Check Supabase dashboard
    │   └─► Review query performance
    │
    └─► Data corrupted?
        └─► RESTORE FROM BACKUP
            1. List backups
            2. DRY RUN test
            3. Restore
            4. Verify
            5. Restart app
```

---

## 📱 Quick Status Check

Run this command for instant status:

```bash
echo "=== BACKUP SYSTEM STATUS ===" && \
curl -s http://localhost:3000/api/health | grep -E "status|hoursAgo" && \
npx ts-node scripts/restore-database.ts --list | tail -5
```

---

## 🎯 Pre-Flight Checklist

Before any major operation:

- [ ] Latest backup exists and is valid
- [ ] Health check returns OK
- [ ] Disk space available (> 20%)
- [ ] Team notified of planned maintenance
- [ ] Rollback plan documented

---

## 📞 Escalation Path

1. **Try documented fix** (this card + runbook)
2. **If unsuccessful in 15 min:** Contact Primary DBA
3. **If no response in 15 min:** Contact Backup Admin
4. **If critical and no response:** Contact System Admin
5. **If infrastructure issue:** Contact Supabase Support

---

## 🔗 Documentation Links

- **Full Runbook:** `docs/DISASTER_RECOVERY.md`
- **Setup Guide:** `docs/BACKUP_DISASTER_RECOVERY_SETUP.md`
- **Complete Summary:** `BACKUP_DISASTER_RECOVERY_COMPLETE.md`

---

**Last Updated:** February 25, 2026  
**System Version:** 1.0  
**Status:** ✅ OPERATIONAL

---

*Keep this card accessible at all times*  
*Review quarterly and after any incidents*
