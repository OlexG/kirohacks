# Dashboard — Design Spec

## Problem

A caretaker managing multiple seniors needs a single-glance overview of everyone's status. They need to know: who's fine, who needs attention, what's the overall health of the roster, and are devices connected?

## Design Concept: "Operations at a Glance"

The dashboard is the calm home base. Unlike the alerts page (spatial, urgent) or the profile page (deep, individual), the dashboard is tabular and summary-oriented. It answers "how is everyone?" not "what do I do right now?"

## Layout — Two Sections

### 1. Charts Grid (top)
Three summary charts in a horizontal row:

**Status Donut — "Roster health"**
- Conic gradient donut showing the distribution of alert levels across all seniors
- Center shows percentage stable
- Legend below with color swatches and counts per status
- Colors: stable (#4f7f63), review (#c4812b), urgent (#c54a3f), offline (#7f8790)

**Battery Bars — "Watch batteries"**
- Vertical bar chart with 4 buckets: 70-100%, 40-69%, 0-39%, Offline
- Bar height proportional to count in each bucket
- Gives quick device readiness picture

**Alert Trend — "Alert trend"**
- 7-day line chart showing alert counts per day
- SVG polyline with dots at each data point
- Shows "X open now" as the headline number
- Helps spot whether alert volume is increasing or decreasing

### 2. Content Grid (bottom)
Two-column layout: wide table panel + narrow alert summary.

**All Seniors Table:**
- Columns: Senior (photo + name + age), Status, Watch (battery %), Last seen, Alert (badge)
- Each row links to the person's profile page
- Status dot next to photo indicates alert level
- Sorted by `sort_order`

**Alert Summary Panel:**
- Heading: "Needs attention" (or "No active alerts")
- List of active alerts with person photo, name (linked), and summary text
- Severity badge on each alert
- Empty state: "All monitored seniors are currently clear"

## Data Flow

The dashboard uses the same `CarePage` server component as alerts and roster:
1. `listActiveCareAlerts()` — all active alerts
2. `listCarePeople()` — all active seniors
3. `getDemoProfile()` — caregiver profile

These are processed client-side in `RosterClient`:
- `buildGroups()` — assigns people to care groups, merges alert data
- `buildRosterAlerts()` — enriches alerts with person data

## Component Structure

```
RosterClient (initialView="dashboard")
└── CareWorkspace (activeView="dashboard")
    └── DashboardOverview
        ├── dashboard-charts-grid
        │   ├── StatusDonut
        │   ├── BatteryBars
        │   └── AlertTrend
        └── care-dashboard-grid
            ├── senior-overview (table)
            └── alert-overview (summary panel)
```

**File:** `src/app/app/roster-client.tsx` (DashboardOverview function)
**Route:** `/app/dashboard`

## Status Rollup Logic

Each person's displayed status is derived from their alerts:
1. If person has an active alert → use alert severity as their `alert` level
2. If alert is urgent → `care_group: "active_alerts"`
3. If alert is warning → `care_group: "watch_list"` (unless already in active_alerts)
4. No alerts → use the person's stored `alert` and `care_group` values

The donut chart and table both reflect this merged state.

## Roster View (alternate)

The same `RosterClient` also renders a roster view (`/app/roster`) as a 4-column kanban:
- Stable (green) | Watch List (blue) | Active Alerts (amber) | Offline (red)
- Each column shows person cards with photo, name, age, watch battery, and status signal
- Cards link to person profiles

## Why This Design

- **Summary-first:** The charts answer "how are things overall?" before you look at individuals
- **Device awareness:** Battery chart surfaces a common failure mode (dead watch = no data = false sense of safety)
- **Alert trend:** Helps caretakers notice if something systemic is happening (e.g., multiple seniors alerting = possible environmental issue)
- **Table for detail:** When you need specifics, the table gives you every person with their current state in a scannable format
- **Alert panel for action:** The sidebar surfaces what needs response without leaving the overview
