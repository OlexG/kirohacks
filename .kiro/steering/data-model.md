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
