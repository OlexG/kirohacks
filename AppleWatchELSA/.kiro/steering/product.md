---
inclusion: always
---

# Product Overview

ELSA Monitor is a hackathon Apple Watch app for fall-risk awareness and short-term instability monitoring. It targets elderly or mobility-impaired users and gives caregivers or a companion dashboard a near-real-time view of risk signals, alerts, and session summaries.

The app is explicitly not a medical device. It should avoid diagnostic language and should frame results as "fall-risk awareness", "instability indicators", and "monitoring session signals" rather than fall prediction guarantees.

## Primary User Outcomes

- A wearer can start a safety session from the Apple Watch.
- The watch derives motion, gait, cardio, HealthKit, and profile features into transparent risk scores.
- A wearer can send a manual SOS event.
- A companion webapp can ingest watch JSON payloads and display the latest risk state, recent instability events, and location context.
- A teammate can scan a profile QR code and load the watch profile into the companion webapp.

## Key Product Concepts

- `profile_snapshot`: questionnaire context used for baseline fall-risk scoring.
- `healthkit_snapshot`: recent HealthKit mobility/activity/cardio context.
- `feature_window`: derived 3-second motion/gait/cardio features during a session.
- `instability_event`: detected or manual event requiring attention.
- `session_summary`: final session rollup when monitoring stops.

## UX Tone

- Keep watch UI glanceable, calm, and low-friction.
- Use gentle status language for normal states and clear urgency for alerts.
- Prefer readable labels over dense clinical terminology.
- Keep the warm ELSA visual identity: cream/yellow beige background, gray text, muted turquoise primary action, warm amber alert action, translucent logo watermark.

## Product Constraints

- The app must run directly on Apple Watch Series 9 with watchOS 11+.
- Background collection should happen through a user-started monitoring/workout-style session.
- The watch sends derived features, not raw sensor streams.
- HealthKit and location values may be unavailable depending on permissions.
- Companion webapp integration is through public Vercel endpoints.
