# Rules Engine — Requirements

## Context

The Safely dashboard has a rules system (`care_rules` table) where caretakers define alert conditions per senior (e.g., "alert if heart rate above 115 bpm"). There's also a webhook (`POST /api/watch/alert`) that receives Apple Watch data and stores it in `biometrics_data`. These two systems are not connected — rules exist but nothing evaluates them against incoming data.

## Goal

Build a rules evaluation engine that runs automatically when watch data arrives, checks it against the senior's active rules, and creates alerts when conditions are met.

## Requirements

### R1: Ingest endpoint accepts any person
The current `/api/watch/alert` endpoint is hardcoded to one person. The new `/api/watch/ingest` endpoint must accept a `person_id` in the payload and validate that the person exists in `care_people`.

### R2: API key authentication
The ingest endpoint must require a `WATCH_INGEST_API_KEY` environment variable and validate the `Authorization: Bearer <key>` header. Reject with 401 if missing or invalid.

### R3: Rules evaluation on every data point
After inserting a `biometrics_data` row, the engine must load all active `care_rules` for that person and evaluate each matching rule against the incoming data.

### R4: Operator evaluation
The engine must correctly evaluate all five operator types:
- `above`: numeric value > threshold
- `below`: numeric value < threshold
- `equals`: numeric value === threshold
- `detected`: signal is present (no threshold needed)
- `not_seen_for`: time since last data point > threshold minutes

### R5: Signal-to-value mapping
The engine must extract the correct numeric value for each signal key from the data point (e.g., `heart_rate` → `heart_rate_bpm`, `steps` → `steps`).

### R6: Alert deduplication
If an active alert already exists for the same person + signal key, do not create a duplicate. One active alert per person per signal at a time.

### R7: Alert creation
When a rule triggers and no duplicate exists, insert a new row into `care_alerts` with severity from the rule, a human-readable title and summary, the triggering metric, and status `"active"`.

### R8: Person status update
After evaluation, update the person's `care_people` row with latest vitals (`heart_rate_bpm`, `watch_battery_percent`), `last_seen_label`, and recalculate their `alert` level and `care_group` based on the highest active alert severity.

### R9: Backward compatibility
Keep the existing `/api/watch/alert` endpoint working as-is. The new `/api/watch/ingest` is additive.

### R10: Watch offline detection
A separate endpoint (`/api/watch/check-offline`) that can be called on a schedule to detect seniors whose watch hasn't reported data within their configured `watch_offline` rule threshold.
