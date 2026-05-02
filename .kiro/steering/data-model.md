---
inclusion: fileMatch
fileMatchPattern: "**/*.ts"
---

# Safely Data Model

All data lives in Supabase (Postgres). The app uses a service-role admin client (`src/lib/supabase/server.ts`) for all server-side queries. No client-side Supabase access.

## Tables

### `care_people` — Monitored seniors

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | e.g. `"person-eleanor-voss"` |
| `name` | text | Display name |
| `age` | integer | |
| `care_group` | text | `"stable"` · `"watch_list"` · `"active_alerts"` · `"offline"` |
| `status` | text | Human-readable status line |
| `heart_rate_bpm` | integer (nullable) | Latest known heart rate |
| `last_seen_label` | text | e.g. `"2 min ago"` |
| `watch_battery_percent` | integer (nullable) | null = offline |
| `initials` | text | Fallback for avatar |
| `avatar` | text | URL or empty string |
| `alert` | text | `"urgent"` · `"warning"` · `"stable"` · `"offline"` |
| `context` | text | Short context line shown on cards |
| `active` | boolean | Soft delete flag |
| `sort_order` | integer | Display ordering |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Queries: `listCarePeople()`, `getCarePerson(personId)`

### `care_alerts` — Active safety alerts

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | |
| `alert_key` | text | Machine key like `"fall_detected"` |
| `person_id` | text (FK → care_people) | |
| `title` | text | e.g. `"Fall detected"` |
| `signal_label` | text | e.g. `"Apple Watch fall sensor"` |
| `severity` | text | `"info"` · `"warning"` · `"urgent"` |
| `status` | text | `"active"` · `"acknowledged"` · `"resolved"` |
| `summary` | text | Longer description |
| `metric_label` | text | e.g. `"Heart rate"` |
| `metric_value` | text | e.g. `"142 bpm"` |
| `triggered_label` | text | e.g. `"4 min ago"` |
| `next_step` | text | Suggested caretaker action |
| `sort_order` | integer | Urgent first |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Queries: `listActiveCareAlerts()`, `listActiveCareAlertsForPerson(personId)`

### `care_rules` — Custom alert rules per senior

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | |
| `person_id` | text (FK → care_people) | |
| `person_name` | text | Denormalized for display |
| `signal_key` | text | Maps to `RULE_SIGNALS` in `rules-options.ts` |
| `signal_label` | text | Human-readable signal name |
| `operator` | text | `"above"` · `"below"` · `"equals"` · `"detected"` · `"not_seen_for"` |
| `threshold` | numeric (nullable) | null for event-based signals |
| `unit` | text (nullable) | `"bpm"`, `"steps/day"`, `"minutes"`, `"mmHg"` |
| `severity` | text | `"info"` · `"review"` · `"urgent"` |
| `active` | boolean | Toggle on/off |
| `notification_channel` | text | e.g. `"care_team"` |
| `notes` | text (nullable) | Caretaker notes |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Queries: `listCareRules()`, `createCareRule(input)`, `setCareRuleActive(ruleId, active)`

### `biometrics_data` — Raw watch data ingestion

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | Auto-generated |
| `person_id` | text (FK → care_people) | |
| `person_name` | text | Denormalized |
| `source` | text | e.g. `"apple_watch"` |
| `alert_type` | text (nullable) | e.g. `"fall_detected"`, `"heart_rate"` |
| `severity` | text (nullable) | `"info"` · `"warning"` · `"urgent"` |
| `occurred_at` | timestamptz | When the event happened on the watch |
| `heart_rate_bpm` | integer (nullable) | |
| `steps` | integer (nullable) | |
| `watch_battery_percent` | integer (nullable) | |
| `payload` | jsonb | Full raw payload from the watch |
| `created_at` | timestamptz | Server insert time |

Insert: `recordSabawoonWatchAlert(payload)` — flexible payload parser

### `fall_risk_observations` — Fall-risk time series data

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | |
| `person_id` | text (FK → care_people) | |
| `schema_version` | text | Always `"fallrisk.v1"` |
| `message_type` | text | `"healthkit_snapshot"` · `"feature_window"` · `"instability_event"` · `"session_summary"` |
| `device_id` | text | Watch device identifier |
| `session_id` | text (nullable) | Groups related observations |
| `generated_at` | timestamptz | When the watch generated this data |
| `sequence` | integer | Ordering within a session |
| `source_app` | text | `"watch"` · `"ios"` |
| `window_start` | timestamptz (nullable) | Feature window start |
| `window_end` | timestamptz (nullable) | Feature window end |
| `detected_at` | timestamptz (nullable) | For instability events |
| `event_type` | text (nullable) | |
| `severity` | text (nullable) | `"info"` · `"moderate"` · `"high"` |
| `activity_class` | text (nullable) | |
| `rule_risk_score_100` | integer (nullable) | 0–100 composite risk score |
| `rule_instability_score_100` | integer (nullable) | 0–100 |
| `rule_risk_level` | text (nullable) | `"low"` · `"moderate"` · `"high"` |
| `ml_risk_score_01` | numeric (nullable) | 0.0–1.0 ML model output |
| `ml_model_version` | text (nullable) | |
| `walking_steadiness_score_01` | numeric (nullable) | |
| `walking_steadiness_class` | text (nullable) | `"ok"` · `"low"` · `"very_low"` · `"unknown"` |
| `walking_speed_mps` | numeric (nullable) | |
| `walking_step_length_m` | numeric (nullable) | |
| `walking_asymmetry_pct` | numeric (nullable) | |
| `walking_double_support_pct` | numeric (nullable) | |
| `heart_rate_bpm` | integer (nullable) | |
| `cadence_spm` | numeric (nullable) | |
| `cadence_cv_pct` | numeric (nullable) | |
| `stride_time_cv_pct` | numeric (nullable) | |
| `accel_peak_g` | numeric (nullable) | |
| `jerk_peak_g_per_s` | numeric (nullable) | |
| `gyro_peak_rad_s` | numeric (nullable) | |
| `attitude_change_deg` | numeric (nullable) | |
| `sway_rms_deg` | numeric (nullable) | |
| `step_count` | integer (nullable) | |
| `altitude_delta_m` | numeric (nullable) | |
| `floors_ascended` | integer (nullable) | |
| `floors_descended` | integer (nullable) | |
| `risk_flags` | jsonb | Array of risk flag objects |
| `payload` | jsonb | Full raw envelope payload |
| `created_at` | timestamptz | |

Queries: `listFallRiskObservationsForPerson(personId, limit)`

### `medications` — Medication schedules

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | |
| `elder_id` | text (FK → care_people) | |
| `name` | text | Medication name |
| `weekly_schedule` | jsonb | `{ "monday": [{ "dose": "10mg", "time": "8:00 AM" }] }` |
| `description` | text (nullable) | |
| `delivery_method` | text (nullable) | e.g. "oral", "injection" |
| `dosage` | text | Default dose string |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Queries: `listMedicationsForPerson(personId)`

### `profiles` — Caregiver profiles

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | e.g. `"demo-caregiver-profile"` |
| `display_name` | text | |
| `role` | text | |
| `notification_number` | text (nullable) | Phone number for alert routing |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Queries: `getDemoProfile()`, `updateDemoProfileNotificationNumber(number)`

## Available Apple Watch Signals

Defined in `src/lib/rules-options.ts`. Each signal has operators, units, thresholds, and a reliability tier.

| Signal key | Label | Operators | Unit | Reliability |
|---|---|---|---|---|
| `fall_detected` | Fall detected | detected | — | healthkit-event |
| `heart_rate` | Heart rate | above, below | bpm | watch-native |
| `resting_heart_rate` | Resting heart rate | above, below | bpm | watch-native |
| `walking_heart_rate_average` | Walking HR average | above, below | bpm | watch-native |
| `high_heart_rate_event` | High HR notification | detected | — | healthkit-event |
| `low_heart_rate_event` | Low HR notification | detected | — | healthkit-event |
| `steps` | Step count | above, below | steps/day | derived |
| `watch_offline` | Watch offline | not_seen_for | minutes | derived |
| `blood_pressure_systolic` | Systolic BP | above, below | mmHg | imported |
| `blood_pressure_diastolic` | Diastolic BP | above, below | mmHg | imported |

## API Routes

### `POST /api/watch/alert`
Webhook endpoint for Apple Watch companion app. Accepts flexible JSON payloads and normalizes into `biometrics_data`. Parses common field name variants (e.g., `heartRate`, `heart_rate_bpm`, `bpm` all map to `heart_rate_bpm`).

## Server Actions

- `updateProfileNotificationNumberAction` — Updates caregiver phone number, revalidates `/app`
- `createRuleAction` — Creates a new care rule, revalidates `/app/rules`
- `toggleRuleAction` — Enables/disables a rule, revalidates `/app/rules`
