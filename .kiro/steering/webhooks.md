---
inclusion: fileMatch
fileMatchPattern: "**/api/**/*.ts,**/biometrics-data.ts,**/fall-risk.ts,**/notifications.ts"
---

# Safely Webhooks & API Routes

## Endpoints

### `POST /api/watch/alert` — Watch data ingestion
Receives Apple Watch data from the companion iPhone app. Currently hardcoded to one person (`person-sabawoon-hakimi`).

**Location:** `src/app/api/watch/alert/route.ts`

**Accepts:** Flexible JSON payload. The parser normalizes common field name variants:
- Heart rate: `heart_rate_bpm`, `heartRate`, `heart_rate`, `bpm`
- Steps: `steps`, `step_count`, `stepCount`
- Battery: `watch_battery_percent`, `battery`, `battery_percent`, `batteryPercent`
- Timestamp: `occurred_at`, `timestamp`, `created_at`, `date`
- Severity: `severity`, `level`, `priority` → mapped to `info` / `warning` / `urgent`
- Signal type: `alert_type`, `type`, `event`, `signal`

**Flow:**
1. Parse JSON body
2. Normalize into `BiometricsInsert` shape
3. Insert into `biometrics_data` table
4. Return `{ ok: true, data: { id, person_id, person_name, occurred_at, created_at } }`

**Auth:** None currently. Target: `Authorization: Bearer <WATCH_INGEST_API_KEY>`.

### Fall-Risk Envelope Protocol

The watch alert endpoint also handles a structured fall-risk protocol (`schemaVersion: "fallrisk.v1"`). This is processed by `recordSabawoonFallRiskEnvelope()` in `src/lib/fall-risk.ts`.

**Message types:**
- `profile_snapshot` — Updates the person's demographic/clinical profile (age, sex, height, assistive device, prior falls, impairment tags)
- `healthkit_snapshot` — Periodic HealthKit data dump
- `feature_window` — Computed features over a time window (gait, motion, cardio)
- `instability_event` — Detected instability event with severity
- `session_summary` — End-of-session summary with aggregated scores

**Observation data stored in `fall_risk_observations`:**
- Scores: `rule_risk_score_100`, `rule_instability_score_100`, `rule_risk_level`, `ml_risk_score_01`
- Mobility: `walking_steadiness_score_01`, `walking_speed_mps`, `walking_asymmetry_pct`, `walking_double_support_pct`
- Gait: `cadence_spm`, `cadence_cv_pct`, `stride_time_cv_pct`
- Motion: `accel_peak_g`, `jerk_peak_g_per_s`, `gyro_peak_rad_s`, `attitude_change_deg`, `sway_rms_deg`
- Activity: `step_count`, `altitude_delta_m`, `floors_ascended`, `floors_descended`

**Side effects:** After inserting an observation, the endpoint updates `care_people` with latest scores, heart rate, walking metrics, and recalculates `alert` / `care_group` / `status` based on risk level.

## Notification System

### SMS via Twilio
`src/lib/twilio.ts` — Sends SMS through Twilio REST API.

**Required env vars:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER_SID`

**Functions:**
- `sendSmsNotification(to, body)` — Normalizes phone number, resolves sender from Twilio, sends message
- `sendAlertTextNotification(alertId, suggestedText)` — Loads alert + person + profile, builds SMS copy, sends
- `sendMedicationReminderTextNotification({ dayName, dose, medicationId, time })` — Builds medication reminder SMS, sends

### Notification Copy
`src/lib/notification-copy.ts` — Generates human-readable SMS text based on alert type (fall, heart, watch offline, handoff, general).

## Data Flow Summary

```
Apple Watch
  → iPhone companion app
    → POST /api/watch/alert
      → biometrics_data (raw storage)
      → fall_risk_observations (if fallrisk.v1 envelope)
      → care_people (status update)
      → [future] rules engine evaluation
      → [future] SMS notification via Twilio
```
