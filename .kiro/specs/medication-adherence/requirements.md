# Medication Adherence & Unified Notifications — Requirements

## User Stories

### Caregiver (Expo app)
1. As a caregiver using the Expo app, I see real-time alerts from `care_alerts` in the Alerts tab — not just locally generated placeholders.
2. As a caregiver, I see a warning alert when a senior's medication for a past day was not fully given.
3. As a caregiver, when I check off the last dose for a day, the medication missed alert resolves automatically.

### Caregiver (Web dashboard)
4. As a caregiver on the web dashboard, I see medication missed alerts in the same feed as fall detection and heart rate alerts.
5. As a caregiver, medication missed alerts resolve when all doses are confirmed given (from either app).

### System
6. Both apps read alerts from the same `care_alerts` table — no platform-specific alert stores.
7. Medication missed alerts use `alert_key = 'medication_missed'` and are deduplicated by `person_id + metric_value` (the schedule date).
8. No new database tables are created. All notification state lives in `care_alerts`.

## Acceptance Criteria

- [ ] The Expo app fetches `care_alerts` for the person and displays them in the Alerts tab
- [ ] A `medication_missed` alert is created in `care_alerts` for any past day with unchecked doses
- [ ] No duplicate `medication_missed` alerts for the same person + date
- [ ] Checking off the last dose for a day resolves the active `medication_missed` alert
- [ ] The web dashboard alerts page shows `medication_missed` alerts without any code changes to the alert renderer
- [ ] Alert resolution from the Expo app is visible on the web dashboard and vice versa
