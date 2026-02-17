# AI CODING RULES - PASTE THIS AT START OF EVERY SESSION

## 🚨 CRITICAL: DATA SEEDING RULES

**NEVER:**
- Run multiple seed scripts
- Use `createMany` without checking for duplicates
- Assume data structure from past sessions
- Mix rollout sources (notes JSON vs table)

**ALWAYS:**
1. Run `npm run seed:safe` (the ONLY seeding command)
2. Check `scripts/SEED_SAFELY.md` before any DB changes
3. Verify current data structure with me before coding
4. Use upserts with unique keys (studentId, code, etc.)

## 🛡️ BEFORE WRITING CODE:
- Ask: "Can you show me the current [table/file] structure?"
- Confirm: "Are we using GroupRolloutPlan table or Group.notes?"
- Verify: "What's the current status values for modules?"

## 🔴 RED FLAGS (means you're using old assumptions):
- Mentioning "notes.rolloutPlan" when we moved to GroupRolloutPlan
- Filtering out `ACTIVE` status
- Creating students without checking studentId exists
- Using variable names I haven't shown you today

---

**Start every session by asking:**
"What's the current state of [the thing I'm working on]?"
