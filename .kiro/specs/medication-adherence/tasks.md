# Medication Adherence & Unified Notifications — Tasks

## Phase 1: Server-side medication alert helpers

- [ ] 1. Create `src/lib/medication-alerts.ts` with:
  - `createMedicationMissedAlert(personId, personName, scheduleDate, pendingDoses, totalDoses)`
  - `resolveMedicationMissedAlert(personId, scheduleDate)`
  - `checkMissedMedications(personId, personName, medicationWeek)` — scan past days, create alerts where needed

## Phase 2: Expo app — unified alert feed

- [ ] 2. In `loadSabawoonData()`, fetch `care_alerts` for the person (`status=eq.active`) and pass the results into `mapLiveData()` instead of the empty array
- [ ] 3. Verify the Alerts tab now shows real database alerts (falls, heart rate, medication missed, etc.)

## Phase 3: Expo app — medication compliance writes

- [ ] 4. When the last dose for a day is checked off, PATCH the corresponding `medication_missed` alert to `status = 'resolved'`
- [ ] 5. On app load, scan past days with scheduled but unchecked doses and POST a `medication_missed` alert if none exists

## Phase 4: Web dashboard — medication compliance

- [ ] 6. Call `checkMissedMedications()` on the person detail page load to create alerts for past incomplete days
- [ ] 7. Add a server action for resolving `medication_missed` alerts when doses are confirmed on the web
- [ ] 8. Verify `medication_missed` alerts appear in the existing alerts page (no renderer changes needed)
