# Rollout Plan Verification & Update Report

## Status Summary

Based on comprehensive analysis of authoritative source documents, here is the current state and required updates:

### Current Database State (from recent check-data.js runs):
1. **FLINT GROUP (LP) - 2025**: 2 unit standards (INCOMPLETE - should be 28)
2. **WAHL CLIPPERS (LP) - 2025**: 6 unit standards (INCOMPLETE - should be 30)
3. **AZELIS (LP) - 2025**: 24 unit standards ✓
4. **AZELIS SA (LP) - 2026**: 11 unit standards (should verify against source - expect 24)
5. **MONTEAGLE (LP) - 2025**: 24 unit standards ✓
6. **MONTEAGLE (LP) - 2026**: 11 unit standards (should verify against source - expect 24)
7. **PACKAGING WORLD (LP) - 2025**: 11 unit standards (should verify against source - expect 24)
8. **BEYOND INSIGHTS (LP) - 2026**: 10 unit standards (should verify against source - expect 24)
9. **CITY LOGISTICS (LP) - 2026**: 11 unit standards (should verify against source - expect 24)

### Authoritative Source Documents:

**From `NVC_Implementation_Plan.md` (2 groups):**
- FLINT GROUP: 01/07/2025 - 30/06/2026, 28 total unit standards across 6 modules
- WAHL CLIPPERS: 01/05/2025 - 30/04/2026, 30 total unit standards across 6 modules

**From `public/rollout-plans/` (7 groups):**
- Azelis_2025_Rollout_Plan.md: AZELIS (LP) - 2025
- Azelis_2026_Rollout_Plan.md: AZELIS SA (LP) - 2026
- Monteagle_2025_Rollout_Plan.md: MONTEAGLE (LP) - 2025
- Monteagle_Group_2026_Rollout_Plan.md: MONTEAGLE (LP) - 2026
- Packaging_World_2026_Rollout_Plan.md: PACKAGING WORLD (LP) - 2025
- Beyond_Insights_2026_Rollout_Plan.md: BEYOND INSIGHTS (LP) - 2026
- City_Logistics_2026_Rollout_Plan.md: CITY LOGISTICS (LP) - 2026

### Script Prepared:

A comprehensive seeding script has been created at:
`scripts/update-flint-wahl.js`

This script contains pre-parsed, manually verified rollout plan data for FLINT and WAHL groups extracted directly from the NVC_Implementation_Plan.md file, including:
- All 6 modules per group
- All unit standards with exact start/end dates in DD/MM/YYYY format
- All summative and assessing dates
- All credit values

### Next Steps:

1. Execute `node scripts/update-flint-wahl.js` to update Flint and Wahl groups
2. Verify other groups' unit standard counts match expected values from source documents
3. Run `node scripts/check-data.js` to confirm all groups have complete rollout plans
4. Push updates to GitHub

