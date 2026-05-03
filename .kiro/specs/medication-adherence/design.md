# Medication Adherence & Unified Notifications — Design

## Overview

No new tables. Both the Expo app and the Next.js web dashboard use `care_alerts` as the single source of truth for all notifications, including medication compliance. When a caregiver checks off all doses for a day, the app resolves the corresponding alert. When medication is missed, a `medication_missed` alert is inserted. Both apps poll the same table and show the same alerts.

## Core Principle

`care_alerts` is the unified notification system. Every event that a caregiver needs to act on — falls, heart rate spikes, missed medication — is a row in `care_alerts`. Both apps read from it, both apps can write to it.

## How Medication Compliance Works

### 1. Alert creation (missed medication)

When the system detects that a day's medication was not fully administered, it inserts a row into `care_alerts`:

| Column | Value |
|---|---|
| `alert_key` | `"medication_missed"` |
| `person_id` | The senior's ID |
| `title` | `"Medication not administered"` |
| `signal_label` | `"Medication schedule"` |
| `severity` | `"warning"` |
| `status` | `"active"` |
| `summary` | e.g. `"Sabawoon Hakimi has 2 pending doses for May 05."` |
| `metric_label` | `"Schedule date"` |
| `metric_value` | The date as `YYYY-MM-DD` (used for deduplication) |
| `triggered_label` | `"Missed"` |
| `next_step` | `"Review medication log and confirm with care team."` |
| `sort_order` | `10` |

Detection happens in two places:
- **Application-level:** When the web dashboard or Expo app loads, it checks the `medications` schedule against `care_alerts`. For any past day with scheduled doses that has no corresponding `medication_missed` or resolved alert, it inserts one.
- **Optional cron:** A daily job can do the same scan as a safety net.

Deduplication: before inserting, check `care_alerts` for an existing row matching `person_id + alert_key='medication_missed' + status='active' + metric_value=date`.

### 2. Alert resolution (medication given)

When a caregiver checks off the last dose for a day (in either app), the app resolves the alert:

```sql
update care_alerts
   set status = 'resolved', updated_at = now()
 where person_id = $1
   and alert_key = 'medication_missed'
   and status = 'active'
   and metric_value = $2;  -- schedule_date as YYYY-MM-DD
```

### 3. Dose tracking (local state + alert status)

Individual dose check-offs are tracked in local app state (the `checkedDoses` record in Expo, equivalent state in the web app). The `care_alerts` row is the durable record of whether the day is complete or not:
- `status = 'active'` → day is incomplete
- `status = 'resolved'` → all doses given
- No alert row for a date → either no doses scheduled, or day hasn't ended yet

## Expo App: Unified Alert Feed

The Expo app currently has the `CareAlertRow` type and `mapCareAlerts()` but passes an empty array. The change:

1. **Fetch `care_alerts`** for the person alongside the existing biometrics/rules/medications queries
2. **Feed them into `mapLiveData()`** instead of the empty array
3. **Alerts tab** now shows real alerts from the database — falls, heart rate, medication missed, everything
4. **Medication tab** reads active `medication_missed` alerts to determine which days are incomplete

### Fetch query

```
GET /rest/v1/care_alerts
  ?person_id=eq.{PERSON_ID}
  &status=eq.active
  &order=sort_order.asc,created_at.desc
```

### Writing alerts from Expo

When the caregiver checks off the last dose for a day, the Expo app:
1. Resolves any active `medication_missed` alert for that date via PATCH
2. If no alert existed (day wasn't missed yet), no write needed

When the app detects a past day with unchecked doses and no active alert:
1. Inserts a `medication_missed` alert via POST (with deduplication check)

## Web App: No Changes to Alert Display

`medication_missed` alerts are standard `care_alerts` rows. The existing alerts page (`src/app/app/alerts/page.tsx`) already queries `listActiveCareAlerts()` and renders them. They'll appear automatically.

The web app needs:
1. A server action to resolve `medication_missed` alerts when doses are checked off
2. A check on page load to create `medication_missed` alerts for past incomplete days

## New Files

| File | Purpose |
|---|---|
| `src/lib/medication-alerts.ts` | `createMedicationMissedAlert()`, `resolveMedicationMissedAlert()`, `checkMissedMedications()` |

## Modified Files

| File | Change |
|---|---|
| `expo_app/App.tsx` | Fetch `care_alerts`, pass to `mapLiveData()`, write medication alerts on dose check-off |
| `src/app/app/alerts/page.tsx` | No changes needed — `medication_missed` alerts render like any other |
| `src/app/app/people/[personId]/page.tsx` | Call `checkMissedMedications()` on load, add dose check-off action |

## Key Functions

```typescript
// src/lib/medication-alerts.ts

/** Insert a medication_missed alert if one doesn't already exist for this person + date. */
async function createMedicationMissedAlert(
  personId: string,
  personName: string,
  scheduleDate: string,    // YYYY-MM-DD
  pendingDoses: number,
  totalDoses: number,
): Promise<void>

/** Resolve an active medication_missed alert for a person + date. */
async function resolveMedicationMissedAlert(
  personId: string,
  scheduleDate: string,    // YYYY-MM-DD
): Promise<void>

/** Scan past days for a person and create medication_missed alerts where needed. */
async function checkMissedMedications(
  personId: string,
  personName: string,
  medicationWeek: MedicationWeek,
): Promise<void>
```

## Error Handling

- Alert deduplication uses a select-before-insert pattern — safe for concurrent access
- If Supabase is unreachable, the Expo app falls back to local state (existing behavior)
- The web app surfaces errors via server action responses
- Resolving a non-existent alert is a no-op (the update matches zero rows)
