# Elder Profiles — Implementation Tasks

- [ ] 1. Create person profile page at `src/app/app/people/[personId]/page.tsx` as a server component fetching person, alerts, medications, and fall-risk observations in parallel
- [ ] 2. Implement focus card with large photo, name, age, status, and three primary metrics using `LiveMetricValue`
- [ ] 3. Implement 4 orbit cards (rule risk, ML score, walking steadiness, instability) with live pill indicators
- [ ] 4. Implement fall-risk profile data grid (sex, height, device, falls, impairment tags)
- [ ] 5. Implement `MiniLineChart` component rendering SVG line charts from `fall_risk_observations` data
- [ ] 6. Implement weekly medication schedule with 7-day grid and expandable day-by-day medication list
- [ ] 7. Implement `MedicationReminderButton` client component with `sendMedicationReminderAction` server action
- [ ] 8. Implement `LiveDataRefresh` component with polling, progress meter, and body dataset attributes
- [ ] 9. Implement `LiveMetricValue` component with `compareKey` tracking and `is-updated` class flash
- [ ] 10. Implement active alerts section with severity badges and empty state
- [ ] 11. Add live vs non-live profile distinction with conditional UI elements
- [ ] 12. Add `notFound()` handling for invalid person IDs
- [ ] 13. Add person profile CSS (`.person-*` classes) to `globals.css`
