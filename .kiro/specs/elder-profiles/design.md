# Elder Profiles — Design Spec

## Problem

A caretaker needs a single page where they can understand everything about one senior: their current vitals, fall risk, medication schedule, active alerts, and clinical profile. The page must feel alive — when webhook data arrives, values should update without a full page reload.

## Design Concept: "The Room for a Person"

The same spatial language as the alerts page, but focused on one individual. A central focus card with satellite orbit cards, plus a scrollable tray of detailed panels below.

## Layout — Three Zones

### 1. Focus Card (center stage)
The senior's identity and primary metrics, front and center.

**Content:**
- Large photo (154×154), name, age, location, status
- Context line (current situation summary)
- Three primary metrics: heart rate, rule risk score, next medication
- Pulsing border animation (same heartbeat as alerts room)

**Live behavior:**
- Metrics wrapped in `LiveMetricValue` — flash highlight when webhook data changes them
- `LiveDataRefresh` polls every 3.5s, refreshing server data

### 2. Orbit Cards (4 satellites)
Smaller panels arranged around the focus card, each showing one domain:

| Card | Data | Source |
|---|---|---|
| Rule Risk | `rule_risk_score_100`, risk level | `care_people` + `fall_risk_observations` |
| Experimental ML | `ml_risk_score_01`, model version | `care_people` + `fall_risk_observations` |
| Walking Steadiness | steadiness class, speed m/s | `care_people` + `fall_risk_observations` |
| Recent Instability | instability score, event count, high count | `fall_risk_observations` filtered |

Each orbit card has a live pill indicator and uses `LiveMetricValue` for reactive updates.

### 3. Tray (scrollable detail panels)
Below the spatial stage, a scrollable area with full-detail cards:

**Fall-risk profile data:**
- 6-cell grid: sex, height, assistive device, prior falls, injurious fall, unable to rise
- Impairment tags as pills
- "Live from webhook" / "Non live profile" indicator

**Monitoring trends:**
- 4 mini SVG line charts: rule risk, instability, heart rate, walking speed
- Each chart shows up to 16 data points from `fall_risk_observations`
- Latest strip below charts: cadence, asymmetry, double support, HR range

**Weekly medication:**
- Overview row: next dose, medication count, weekly dose count
- 7-day grid showing dose counts per day (S M T W T F S)
- Expandable day-by-day list with medication name, dose, time, delivery method
- "Notify" button per dose → sends SMS reminder via Twilio

**Active alerts:**
- List of current alerts with severity badge, title, summary, signal, metric, trigger time
- Empty state: "No alerts are currently open for this senior"

## Live Data System

### Polling
`LiveDataRefresh` component with `variant="profile"`:
- Calls `router.refresh()` every 3.5s
- Shows a live console: connection orb, status text, progress meter, last update time
- Sets body dataset attributes for CSS hooks during refresh/update

### Reactive values
`LiveMetricValue` component:
- Wraps any displayed metric
- Tracks `compareKey` — when it changes, adds `is-updated` class for 1.8s
- CSS animates a highlight flash

### Live vs Non-Live
- Only `person-sabawoon-hakimi` currently receives webhook data
- Non-live profiles show "Non live profile" pill and skip the live console
- The `isLiveProfile` boolean controls conditional UI

## Component Structure

```
PersonProfilePage (server component)
├── AppSidebar
└── care-board
    ├── care-board-header (back link, eyebrow, name, watch status)
    └── person-profile-view
        ├── person-room-topbar (back link, status pills, LiveDataRefresh)
        ├── person-room-stage
        │   ├── person-focus-card (center stage)
        │   ├── person-orbit-card × 4 (satellites)
        └── person-room-tray
            ├── person-profile-data-card
            ├── person-chart-card (MiniLineChart × 4)
            ├── person-week-card (medications)
            └── person-alert-card
```

**File:** `src/app/app/people/[personId]/page.tsx`
**Supporting:** `src/app/app/live-data-refresh.tsx`, `src/app/app/people/[personId]/medication-reminder-button.tsx`

## Data Dependencies

| Source | Table | Query |
|---|---|---|
| Person record | `care_people` | `getCarePerson(personId)` |
| Active alerts | `care_alerts` | `listActiveCareAlertsForPerson(personId)` |
| Medications | `medications` | `listMedicationsForPerson(personId)` |
| Fall-risk observations | `fall_risk_observations` | `listFallRiskObservationsForPerson(personId)` |

All fetched in parallel via `Promise.all` in the server component.

## Why This Design

- **One page, full picture:** Caretaker doesn't need to navigate between tabs to understand a senior's situation
- **Spatial hierarchy:** Most important info (identity + primary metrics) is center stage, details are in the tray
- **Live feedback:** The polling + flash system gives confidence that data is current without requiring manual refresh
- **Medication integration:** Combining health monitoring with medication schedules in one view reflects real caretaker workflows
