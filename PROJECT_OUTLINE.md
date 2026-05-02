# Elsa Project Outline

## Working Concept

Elsa is an Elder-living safety assistant: a real-time safety dashboard for seniors and the people who care for them.

Seniors wear Apple Watches that track health signals, movement, fall events, and other safety-related data. Caretakers use a dashboard to monitor everyone they are responsible for, receive urgent alerts, and customize safety rules for each person.

## Target Users

- Seniors who want to stay independent while giving trusted people visibility into their safety.
- Family members who care for aging parents, grandparents, or relatives.
- Professional caretakers managing multiple seniors at once.
- Assisted living staff who need quick visibility into resident safety events.

## Core Problem

Caretakers often do not know something is wrong until a senior calls, misses a check-in, or someone physically checks on them. Wearables already collect useful safety and health data, but caretakers need a clear, centralized way to turn that data into actionable alerts.

## Core Experience

Caretakers have an overview of everyone they care for. The dashboard highlights each senior's current safety status, recent health signals, and active alerts.

When something concerning happens, such as a fall or unusually high heart rate, the caretaker receives an alert and can quickly see who needs help, what happened, and how urgent it is.

## Key Features

- Real-time caretaker dashboard with all monitored seniors.
- Individual senior profile pages with recent safety and health activity.
- Apple Watch data integration for health data, fall detection, heart rate, movement, and related signals.
- Fall alerts when a senior appears to have fallen.
- Heart rate alerts when readings are too high, too low, or outside a custom range.
- Custom alert rules per senior.
- Alert history for reviewing past incidents.
- Status indicators for normal, warning, urgent, and offline states.
- Caretaker notifications for urgent events.

## Custom Alerts

Caretakers should be able to create personalized rules such as:

- Alert if heart rate goes above a chosen threshold.
- Alert if heart rate drops below a chosen threshold.
- Alert immediately when a fall is detected.
- Alert if no movement is detected for a set amount of time.
- Alert if the watch stops reporting data.
- Alert during specific windows of time, such as overnight or while the senior is usually home alone.

## Dashboard Ideas

- Overview list of all seniors with color-coded safety status.
- Urgent alerts pinned to the top.
- Recent events feed.
- Quick filters for urgent, warning, stable, and offline.
- Per-person cards showing name, last seen time, heart rate, fall status, and alert count.
- Detail view with timeline, current vitals, alert rules, and emergency contacts.

## Early MVP Scope

- Caretaker dashboard.
- Add and manage seniors.
- Mock or imported Apple Watch-style health data.
- Fall detection alert.
- Heart rate threshold alert.
- Custom alert configuration.
- Alert feed and alert detail view.

## Future Ideas

- SMS, push, or phone call notifications.
- Escalation rules if the first caretaker does not respond.
- Shared caretaker teams.
- Emergency contact workflow.
- Location-aware alerts.
- Medication reminders.
- Daily wellness summaries.
- Integration with Apple HealthKit.
- Reports for family members or professional care teams.

## Open Questions

- Will seniors use their own iPhones and Apple Watches, or will the system provide managed devices?
- What data can be accessed directly through Apple HealthKit, and what permissions are required?
- Should the first version use live Apple Watch data or simulated data for the hackathon/demo?
- What notification channels matter most for caretakers?
- How should alert severity be ranked?
- Should seniors have their own app experience, or only caretakers?
