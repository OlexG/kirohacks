---
inclusion: fileMatch
fileMatchPattern: "**/people/**/*.tsx,**/care-people.ts,**/fall-risk.ts,**/medications.ts"
---

# Elder Profile Pages

## Route

`/app/people/[personId]` — Server component that loads a senior's full profile.

## Data Sources

The profile page fetches four data sets in parallel:
1. `getCarePerson(personId)` — Core person record from `care_people`
2. `listActiveCareAlertsForPerson(personId)` — Active alerts for this person
3. `listMedicationsForPerson(personId)` — Medications from `medications` table
4. `listFallRiskObservationsForPerson(personId)` — Fall-risk time series from `fall_risk_observations`

## Page Layout — "The Room" for a Person

The profile uses the same spatial design language as the alerts page:

### Center stage: Focus card
- Large person photo (154×154), name, age, location, status
- Three primary metrics: heart rate, rule risk score, next medication
- Subtle pulsing border animation (same heartbeat pattern as alert room)
- Uses `LiveMetricValue` component — values flash/highlight when they change from webhook data

### Orbit cards (4 satellite panels)
- **Rule Risk** — `rule_risk_score_100` with risk level label, live pill indicator
- **Experimental ML** — `ml_risk_score_01` with model version
- **Walking Steadiness** — `walking_steadiness_class` with speed in m/s
- **Recent Instability** — `rule_instability_score_100` with event count and high-severity count

### Tray (scrollable bottom section)
- **Fall-risk profile data** — Demographics grid: sex, height, assistive device, prior falls, injurious fall, unable to rise. Plus impairment tags.
- **Monitoring trends** — 4 mini line charts: rule risk, instability, heart rate, walking speed. Plus latest strip with cadence, asymmetry, double support, HR range.
- **Weekly medication** — 7-day grid with dose counts per day, expandable medication list with name, dose, time, delivery method, and "Notify" button for SMS reminders.
- **Active alerts** — List of current alerts with severity badge, title, summary, signal, metric, and trigger time.

## Live Data System

### `LiveDataRefresh` component
- Polls `router.refresh()` on an interval (default 3.5s for profiles)
- Shows a live console with connection status, progress meter, and last update time
- Sets `document.body.dataset.profileRefreshState` during refresh (used by CSS for subtle animations)
- Sets `document.body.dataset.profileLiveState = "updated"` when `watchedKey` changes (new webhook data arrived)

### `LiveMetricValue` component
- Wraps any metric value (`<strong>`)
- Tracks a `compareKey` prop — when it changes, adds `is-updated` class for 1.8s
- CSS animates a highlight flash on the value

### Live vs Non-Live Profiles
- Only `person-sabawoon-hakimi` is currently a "live" profile (receives webhook data)
- Non-live profiles show a "Non live profile" pill and "Awaiting webhook" status
- The `isLiveProfile` flag controls which UI elements appear

## Extended `care_people` Columns (for fall-risk profiles)

The person detail page uses additional columns beyond the base `care_people` schema:

| Column | Type | Notes |
|---|---|---|
| `sex` | text (nullable) | female, male, other, unknown |
| `height_cm` | numeric (nullable) | |
| `assistive_device` | text (nullable) | none, cane, walker, wheelchair, unknown |
| `prior_falls_12mo` | integer (nullable) | |
| `injurious_fall_12mo` | boolean (nullable) | |
| `unable_to_rise_after_fall_12mo` | boolean (nullable) | |
| `impairment_tags` | text[] (nullable) | e.g. ["vision", "balance"] |
| `fall_rule_risk_score_100` | integer (nullable) | 0–100 |
| `fall_rule_instability_score_100` | integer (nullable) | 0–100 |
| `fall_rule_risk_level` | text (nullable) | low, moderate, high |
| `fall_ml_risk_score_01` | numeric (nullable) | 0.0–1.0 |
| `fall_ml_model_version` | text (nullable) | |
| `walking_steadiness_class` | text (nullable) | ok, low, very_low, unknown |
| `walking_steadiness_score_01` | numeric (nullable) | |
| `walking_speed_mps` | numeric (nullable) | |
| `walking_step_length_m` | numeric (nullable) | |
| `walking_asymmetry_pct` | numeric (nullable) | |
| `walking_double_support_pct` | numeric (nullable) | |
| `fall_risk_updated_at` | timestamptz (nullable) | Last webhook update |

## Medications Table

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | |
| `elder_id` | text (FK → care_people) | |
| `name` | text | Medication name |
| `weekly_schedule` | jsonb | `{ "monday": [{ "dose": "10mg", "time": "8:00 AM" }], ... }` |
| `description` | text (nullable) | |
| `delivery_method` | text (nullable) | e.g. "oral", "injection" |
| `dosage` | text | Default dose string |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

## Medication Reminders

The "Notify" button on each medication dose triggers `sendMedicationReminderAction` → `sendMedicationReminderTextNotification()` → Twilio SMS to the caregiver's notification number.
