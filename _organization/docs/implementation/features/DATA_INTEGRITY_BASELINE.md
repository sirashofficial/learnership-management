# Data Integrity Baseline

## Purpose
Establish a baseline snapshot of data quality metrics after Prompt 1 completion and define acceptable variance thresholds for automated monitoring.

## How to Run the Baseline
Use the admin-only endpoint to execute a full check and log results:

- `GET /api/validation/run-checks`

If you want the baseline to run automatically on server startup, set:

- `DATA_INTEGRITY_RUN_BASELINE=true`

## Thresholds
- Credit mismatches: critical when drift > 5% of expected credits.
- Attendance rate drift: warning when difference > 1%.
- Rounding drift tolerance: +-1% for percentage calculations.
- Integer counts (attendance records, orphaned records): must match exactly.
- Rollout plan date drift: warning when projected dates differ by more than 1 day from unit standard rollouts.

## Alerting
- Critical issues trigger admin email alerts when count >= `DATA_INTEGRITY_CRITICAL_THRESHOLD` (default: 1).

## Notes
- Run the baseline after backups complete to avoid noisy snapshots.
- Use the Data Health dashboard widget for a quick traffic-light status overview.
