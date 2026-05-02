# Rules Engine — Design

## Architecture

```
POST /api/watch/ingest
  → validateApiKey()
  → validateAndNormalizePayload()
  → insertBiometricsData()
  → evaluateRules(dataPoint)
      → loadActiveRulesForPerson()
      → filterMatchingRules(signal)
      → for each rule: evaluateCondition()
      → deduplicateAlerts()
      → createAlerts()
      → updatePersonStatus()
  → return result
```

## New Files

| File | Purpose |
|---|---|
| `src/lib/rules-engine.ts` | Core evaluation logic — pure functions + Supabase queries |
| `src/lib/ingest.ts` | Payload normalization, refactored from `biometrics-data.ts` |
| `src/app/api/watch/ingest/route.ts` | New ingest endpoint |
| `src/app/api/watch/check-offline/route.ts` | Offline detection endpoint |

## Modified Files

| File | Change |
|---|---|
| `src/lib/care-alerts.ts` | Add `createCareAlert()` insert function |
| `src/lib/care-people.ts` | Add `updatePersonVitals()` function |
| `src/lib/biometrics-data.ts` | Refactor to accept any `person_id`, extract shared parser utils |

## Key Types

```typescript
// src/lib/rules-engine.ts

type IngestDataPoint = {
  person_id: string;
  signal: string;                    // e.g. "heart_rate", "fall_detected"
  heart_rate_bpm: number | null;
  steps: number | null;
  watch_battery_percent: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  occurred_at: string;
  source: string;
  payload: Record<string, unknown>;  // raw payload for storage
};

type EvaluationResult = {
  dataPointId: string;               // ID of inserted biometrics_data row
  triggeredAlerts: TriggeredAlert[];  // alerts that were created
  personUpdated: boolean;            // whether care_people was updated
};

type TriggeredAlert = {
  rule_id: string;
  alert_id: string;                  // ID of created care_alerts row
  person_id: string;
  alert_key: string;
  title: string;
  severity: "info" | "warning" | "urgent";
  summary: string;
  metric_label: string;
  metric_value: string;
};
```

## Signal-to-Value Mapping

```typescript
function getSignalValue(signal: string, dataPoint: IngestDataPoint): number | null {
  switch (signal) {
    case "heart_rate":
    case "resting_heart_rate":
    case "walking_heart_rate_average":
      return dataPoint.heart_rate_bpm;
    case "steps":
      return dataPoint.steps;
    case "blood_pressure_systolic":
      return dataPoint.blood_pressure_systolic;
    case "blood_pressure_diastolic":
      return dataPoint.blood_pressure_diastolic;
    default:
      return null; // event-based signals don't have numeric values
  }
}
```

## Operator Evaluation

```typescript
function evaluateCondition(
  operator: RuleOperator,
  value: number | null,
  threshold: number | null,
  signal: string,
): boolean {
  if (operator === "detected") return true; // signal presence is enough
  if (operator === "not_seen_for") return false; // handled by offline checker
  if (value === null || threshold === null) return false;

  switch (operator) {
    case "above": return value > threshold;
    case "below": return value < threshold;
    case "equals": return value === threshold;
    default: return false;
  }
}
```

## Alert Title/Summary Generation

```typescript
function buildAlertTitle(rule: CareRule, value: number | null): string {
  if (rule.operator === "detected") return `${rule.signal_label} detected`;
  if (value === null) return rule.signal_label;
  return `${rule.signal_label} ${rule.operator} ${rule.threshold} ${rule.unit ?? ""}`.trim();
}

function buildAlertSummary(rule: CareRule, personName: string, value: number | null): string {
  if (rule.operator === "detected") {
    return `${personName}'s Apple Watch reported a ${rule.signal_label.toLowerCase()} event.`;
  }
  return `${personName}'s ${rule.signal_label.toLowerCase()} is ${value} ${rule.unit ?? ""}, which is ${rule.operator} the threshold of ${rule.threshold} ${rule.unit ?? ""}.`.trim();
}
```

## Person Status Recalculation

After evaluation, determine the person's new status:

1. Query all active alerts for this person
2. Find the highest severity: urgent > warning > info
3. Map to `care_people` fields:
   - urgent → `alert: "urgent"`, `care_group: "active_alerts"`
   - warning → `alert: "warning"`, `care_group: "watch_list"`
   - info → `alert: "stable"`, `care_group: "stable"`
   - no alerts → `alert: "stable"`, `care_group: "stable"`
4. Update `heart_rate_bpm`, `watch_battery_percent`, `last_seen_label: "Just now"`

## Offline Detection Design

`/api/watch/check-offline` endpoint:

1. Load all active `care_rules` where `signal_key = 'watch_offline'`
2. Group by `person_id`
3. For each person, query the most recent `biometrics_data` row
4. If `now() - last_row.occurred_at > rule.threshold` minutes → trigger alert
5. Same deduplication and alert creation logic as the main engine

## Error Handling

- Invalid payload → 400 with descriptive error
- Missing/invalid API key → 401
- Person not found → 404
- Supabase errors → 500, logged, but partial success is OK (data inserted even if rule eval fails)
- Rule evaluation errors are caught per-rule so one bad rule doesn't block others

## Ingest Endpoint Response

```json
{
  "ok": true,
  "data": {
    "dataPointId": "abc-123",
    "triggeredAlerts": [
      {
        "alert_id": "alert-456",
        "title": "Heart rate above 115 bpm",
        "severity": "urgent"
      }
    ],
    "personUpdated": true
  }
}
```
