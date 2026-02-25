# File Organization Index

This directory contains an organized archive of documentation, reports, and utility files from the Learnership Management project.

## **Root Level (Active Development)**
- `src/` - Source code (NOT moved)
- `prisma/` - Database schema (NOT moved)
- `public/` - Static assets (NOT moved)
- `node_modules/` - Dependencies (NOT moved)
- `.next/`, `dist/`, `build/` - Build outputs (NOT moved)
- `.git/`, `.github/` - Version control (NOT moved)
- `package.json`, `tsconfig.json` - Config files (NOT moved)
- `README.md`, `CLAUDE.md` - Main documentation (NOT moved)

## **Organization Structure (_organization folder)**

### 📚 `docs/` - All Documentation

#### `docs/architecture/`
- Architecture decisions and system design documents
- Data flow diagrams and architecture audits
- Unified architecture documentation

#### `docs/audit-reports/`
- System audit reports and analysis
- Assessment and verification reports
- Data integrity and compliance audits

**Subfolder: `groups-audit/`**
- Dedicated audit reports for the Groups page feature
- Group card implementation and testing results

#### `docs/implementation/`

**Subfolder: `phases/`**
- Project phase reports (Phase 0-4)
- Phase completion summaries
- Session reports and milestone documentation

**Subfolder: `features/`**
- Feature implementation documentation
- Technical guides for specific features:
  - AI Risk Prediction
  - Guardian Portal
  - Real-time Attendance
  - PWA Offline Mode
  - Event-driven Architecture
  - Database migrations and optimizations
  - Performance improvements
  - E2E testing guides

#### `docs/quick-reference/`
- Quick reference guides for all major systems
- API documentation summaries
- Quick start guides
- Monitoring and compliance references

### 🔧 `debug-utilities/`
- Debug and test scripts
- Utility scripts for database operations
- Sync and verification scripts
- Diagnostic tools (audit-thabani.js, verify-*, etc.)
- JSON configuration files and snapshots
- Debug screenshots and images

### 📊 `build-artifacts/`
- Build logs and output files
- Test results and reports
- Export dumps and verification output

### 🗄️ `archived/`
- Completed project reports
- Old session summaries (now archived)
- Deployment and optimization summaries (final)
- Historical change logs

---

## **Still at Root Level**
- `tasks/` - Task tracking
- `logs/` - Server logs
- `data/` - Data files
- `examples/` - Code examples
- `backups/` - Database backups
- `test-results/` - Test output directory
- `playwright-report/` - Playwright reports
- `Ai-Agent-Skills/`, `Skills Folder/` - Skills/prompt management
- `.claude/`, `.cursor/`, `.vscode/` - IDE configuration
- Environment files (`.env*`)

---

## **Usage Notes**

✅ **No Code Was Changed** - All source code, configuration, and active development files remain untouched

✅ **Documentation Preserved** - All original documents are accessible, just organized

✅ **Development Unaffected** - The site, build process, and API continue to work normally

✅ **Browsable Structure** - Use this index to quickly locate the documentation you need

---

## **To Find Something:**

1. **Architecture or design decisions?** → Check `docs/architecture/`
2. **Feature implementation details?** → Check `docs/implementation/features/`
3. **Phase progress or milestone?** → Check `docs/implementation/phases/`
4. **Quick reference or API info?** → Check `docs/quick-reference/`
5. **Audit or compliance reports?** → Check `docs/audit-reports/`
6. **Test or build logs?** → Check `build-artifacts/`
7. **Debug scripts or utilities?** → Check `debug-utilities/`
8. **Old completed projects?** → Check `archived/`

---

Created: 2026-02-25
Organization Level: Root Directory
