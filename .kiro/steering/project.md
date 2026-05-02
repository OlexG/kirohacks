# Senior Safety Dashboard — Project Steering

## What This Project Is

A real-time safety dashboard for seniors and their caretakers. Seniors wear Apple Watches that collect health and safety signals. Caretakers use a web dashboard to monitor everyone they're responsible for, receive alerts, and configure custom rules per person.

## Tech Stack

- **Framework:** Next.js (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Data:** Mock Apple Watch / HealthKit-style data for MVP (no live HealthKit integration yet)

## Target Users

- Family members caring for aging relatives
- Professional caretakers managing multiple seniors
- Assisted living staff

## MVP Scope (build this first)

- Caretaker dashboard — overview of all monitored seniors
- Add and manage seniors
- Mock health data (heart rate, steps, fall events, SpO2, sleep)
- Fall detection alert
- Heart rate threshold alert (high and low)
- Custom alert rule configuration per senior
- Alert feed and alert detail view
- Status indicators: normal, warning, urgent, offline

## Apple Watch Data Available (via HealthKit)

These are the signals the app can realistically work with. Use these as the basis for mock data shapes and alert logic.

| Signal | HealthKit Identifier | Notes |
|---|---|---|
| Heart rate | `heartRate` | Continuous, passive |
| Resting heart rate | `restingHeartRate` | Daily average |
| Heart rate variability | `heartRateVariabilitySDNN` | Sleep / breathing sessions |
| Steps / movement | `stepCount`, `distanceWalkingRunning` | Passive, all day |
| Active energy | `activeEnergyBurned` | Daily |
| Stand hours | `appleStandHour` | Hourly |
| Blood oxygen (SpO2) | `oxygenSaturation` | Series 6+; periodic |
| Sleep analysis | `sleepAnalysis` | Stages: awake, REM, core, deep |
| Wrist temperature | `appleSleepingWristTemperature` | Series 8+; sleep only; relative deviation |
| Fall events | `appleWatchDailyFallRisk` | Series 4+; wearer-facing first |
| Irregular rhythm (AFib) | `irregularHeartRhythmEvent` | Series 4+ |
| ECG | `HKElectrocardiogram` | Series 4+; sensitive data |
| Respiratory rate | `respiratoryRate` | Sleep only |
| Watch last seen | (inferred) | No direct API; use recency of latest sample |

## Key Constraints to Keep in Mind

- HealthKit requires explicit per-type user authorization — no bypassing it
- Data flows through the senior's iPhone; a companion iOS app is needed to relay to a backend
- No direct server push from Apple Watch — real-time alerting needs background fetch on iPhone
- Fall detection alerts the wearer first; third-party apps read the event after the fact
- ECG and SpO2 are hardware-gated (Series 4+ and Series 6+ respectively)

## Alert Severity Levels

- **Urgent** — fall detected, SpO2 below threshold, heart rate critically out of range
- **Warning** — heart rate approaching threshold, low movement, irregular rhythm flagged
- **Offline** — watch not reporting data for extended period
- **Normal** — all signals within expected ranges

## File References

- Full project vision: `#[[file:PROJECT_OUTLINE.md]]`
- Apple Watch user stories and HealthKit constraints: `#[[file:USER_STORIES.md]]`

## Coding Conventions

- Use TypeScript strictly — no `any` unless absolutely necessary
- Prefer server components in Next.js App Router; use client components only when interactivity requires it
- Keep mock data in a dedicated `src/lib/mock-data` directory
- Define shared types in `src/types`
- Components go in `src/components`, organized by feature (e.g., `dashboard`, `seniors`, `alerts`)
