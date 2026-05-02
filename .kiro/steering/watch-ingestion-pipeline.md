---
inclusion: manual
---

# Watch Data Ingestion & Rules Engine

This document describes the architecture for streaming Apple Watch data into Safely and evaluating custom alert rules against that data in real time.

## Overview

```
Apple Watch → iPhone Companion App → POST /api/watch/ingest → biometrics_data
                                                                    ↓
                                                            Rules Engine (evaluate)
                                                                    ↓
                                                    care_alerts (insert if triggered)
                                                            ↓               ↓
                                                  care_people (update)   Notify (future)
```

The pipeline has three stages:
1. **Ingest** — receive raw watch data via webhook, normalize, store
2. **Evaluate** — run the incoming data point against all active rules for that person
3. **Act** — create alerts, update person status, and (future) send notifications

## Stage 1: Ingest

### Current state

`POST /api/watch/alert` already exists. It accepts a flexible JSON payload, normalizes field names, and inserts into `biometrics_data`. Currently hardcoded to one person (`SABAWOON_HAKIMI_PERSON_ID`).

### Target state

`POST /api/watch/ingest` — a new or refactored endpoint that:

1. Accepts a JSON payload with a required `person_id` (or `device_id` that maps to a person)
2. Validates the person exists in `care_people`
3. Normalizes the payload into a `biometrics_data` row (reuse existing parser logic)
4. Inserts into `biometrics_data`
5. Calls the rules engine with the inserted data point
6. Returns the insert result + any triggered alerts

### Payload shape

The endpoint should be flexible about field names (already implemented) but the canonical shape is:

```json
{
  "person_id": "person-eleanor-voss",
  "source": "apple_watch",
  "occurred_at": "2025-05-02T14:32:00Z",
  "signal": "heart_rate",
  "heart_rate_bpm": 142,
  "steps": null,
  "watch_battery_percent": 67,
  "metadata": {}
}
```

The `signal` field tells the rules engine which signal type to evaluate. If omitted, the engine should infer from which numeric fields are present (e.g., if `heart_rate_bpm` is set, evaluate heart rate rules).

### Authentication

For MVP: API key in `Authorization` header, validated against an env var (`WATCH_INGEST_API_KEY`).
Future: per-device tokens tied to a person record.

## Stage 2: Rules Engine

### How it works

When a data point arrives, the engine:

1. Loads all **active** rules for that `person_id` from `care_rules`
2. Filters to rules whose `signal_key` matches the incoming signal
3. For each matching rule, evaluates the condition:
   - `above`: value > threshold
   - `below`: value < threshold
   - `equals`: value === threshold
   - `detected`: signal is present (used for fall events, HR notifications)
   - `not_seen_for`: time since last data point > threshold minutes
4. If a rule triggers, checks for deduplication (don't create duplicate active alerts for the same rule + person)
5. Creates a `care_alerts` row if no active alert exists for this rule
6. Updates `care_people` fields: `alert`, `care_group`, `status`, `heart_rate_bpm`, `last_seen_label`

### Implementation location

`src/lib/rules-engine.ts` — pure function that takes a data point and returns triggered alerts.

```typescript
type IngestDataPoint = {
  person_id: string;
  signal: string;
  heart_rate_bpm: number | null;
  steps: number | null;
  watch_battery_percent: number | null;
  occurred_at: string;
};

type TriggeredAlert = {
  rule_id: string;
  person_id: string;
  alert_key: string;
  title: string;
  severity: "info" | "warning" | "urgent";
  summary: string;
  metric_label: string;
  metric_value: string;
};

async function evaluateRules(dataPoint: IngestDataPoint): Promise<TriggeredAlert[]>;
```

### Signal-to-value mapping

The engine needs to extract the right numeric value for each signal key:

| Signal key | Value source |
|---|---|
| `heart_rate` | `dataPoint.heart_rate_bpm` |
| `resting_heart_rate` | `dataPoint.heart_rate_bpm` (when signal is `resting_heart_rate`) |
| `walking_heart_rate_average` | `dataPoint.heart_rate_bpm` (when signal is `walking_heart_rate_average`) |
| `steps` | `dataPoint.steps` |
| `fall_detected` | presence of signal (no numeric value) |
| `high_heart_rate_event` | presence of signal |
| `low_heart_rate_event` | presence of signal |
| `watch_offline` | computed from time since last `biometrics_data` row for this person |
| `blood_pressure_systolic` | from `payload.systolic` or `payload.blood_pressure_systolic` |
| `blood_pressure_diastolic` | from `payload.diastolic` or `payload.blood_pressure_diastolic` |

### Deduplication

Before creating an alert, check:
```sql
SELECT id FROM care_alerts
WHERE person_id = $1
  AND alert_key = $2
  AND status = 'active'
LIMIT 1;
```

If an active alert already exists for this person + signal, skip creation. This prevents flooding the alerts page when a heart rate stays elevated across multiple data points.

### Person status update

After evaluation, update `care_people` with the latest data:

```sql
UPDATE care_people SET
  heart_rate_bpm = $heart_rate_bpm,  -- if present
  watch_battery_percent = $battery,   -- if present
  last_seen_label = 'Just now',
  alert = $highest_severity,          -- urgent > warning > stable
  care_group = CASE
    WHEN $has_urgent THEN 'active_alerts'
    WHEN $has_warning THEN 'watch_list'
    ELSE 'stable'
  END,
  status = $status_line,
  updated_at = now()
WHERE id = $person_id;
```

## Stage 3: Act

### Alert creation

When a rule triggers, insert into `care_alerts`:

```typescript
{
  alert_key: rule.signal_key,
  person_id: dataPoint.person_id,
  title: buildAlertTitle(rule, dataPoint),      // e.g. "Heart rate above 115 bpm"
  signal_label: rule.signal_label,
  severity: rule.severity,                       // from the rule, not the data
  status: "active",
  summary: buildAlertSummary(rule, dataPoint),
  metric_label: rule.signal_label,
  metric_value: formatMetricValue(rule, dataPoint),
  triggered_label: "Just now",
  next_step: buildNextStep(rule),
  sort_order: severitySortOrder(rule.severity),  // urgent=0, warning=1, info=2
}
```

### Notification (future)

After alert creation, check the caregiver's `notification_number` in `profiles`. If set, queue a notification. This is out of scope for MVP but the pipeline should have a clear hook point:

```typescript
// In the ingest endpoint, after evaluateRules():
if (triggeredAlerts.length > 0) {
  await createAlerts(triggeredAlerts);
  await updatePersonStatus(dataPoint);
  // Future: await notifyCaregiver(triggeredAlerts, profile);
}
```

## Watch Offline Detection

This is a special case — it's not triggered by incoming data but by the *absence* of data.

### Approach

A scheduled job (Supabase cron or Edge Function on a timer) runs every 5 minutes:

1. For each active person in `care_people`, find the most recent `biometrics_data` row
2. For each person, load active `watch_offline` rules
3. If `now() - last_data_point > rule.threshold` minutes, trigger the offline alert
4. If the person comes back online (new data arrives), resolve the offline alert

### Implementation

This could be a Supabase Edge Function triggered by `pg_cron`:

```sql
SELECT cron.schedule(
  'check-watch-offline',
  '*/5 * * * *',
  $$SELECT net.http_post(
    'https://your-app.vercel.app/api/watch/check-offline',
    '{}',
    '{"Authorization": "Bearer YOUR_CRON_KEY"}'
  )$$
);
```

Or a Next.js API route (`/api/watch/check-offline`) called by an external scheduler.

## Testing the Pipeline

### Manual test via curl

```bash
curl -X POST https://your-app.vercel.app/api/watch/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "person_id": "person-eleanor-voss",
    "signal": "heart_rate",
    "heart_rate_bpm": 142,
    "watch_battery_percent": 67
  }'
```

### Expected result

1. New row in `biometrics_data`
2. If Eleanor has an active rule "heart rate above 115 bpm" → new row in `care_alerts`
3. Eleanor's `care_people` row updated: `heart_rate_bpm=142`, `alert="urgent"`, `care_group="active_alerts"`
4. Dashboard and alerts page reflect the change on next load

## File Structure

```
src/
  lib/
    rules-engine.ts          ← Core evaluation logic
    rules-options.ts          ← Signal definitions (exists)
    care-rules.ts             ← Rule CRUD (exists)
    care-alerts.ts            ← Alert queries (exists, needs createAlert)
    biometrics-data.ts        ← Ingestion (exists, needs refactor)
  app/
    api/
      watch/
        ingest/route.ts       ← New unified ingest endpoint
        check-offline/route.ts ← Offline detection endpoint
        alert/route.ts        ← Legacy endpoint (keep for backward compat)
```
