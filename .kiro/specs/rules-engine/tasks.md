# Rules Engine — Implementation Tasks

## Task 1: Refactor biometrics-data.ts to accept any person
- [ ] Extract shared payload parser functions (`getString`, `getNumber`, `getOccurredAt`, `getSeverity`) into reusable utilities
- [ ] Create `recordWatchData(personId: string, personName: string, payload: Record<string, unknown>)` that accepts any person
- [ ] Keep `recordSabawoonWatchAlert()` as a wrapper for backward compatibility
- [ ] Add `signal` field extraction from payload (maps to rule signal keys)

## Task 2: Add createCareAlert to care-alerts.ts
- [ ] Define `CreateCareAlertInput` type matching the `care_alerts` table columns
- [ ] Implement `createCareAlert(input)` that inserts into `care_alerts` and returns the created row
- [ ] Implement `findActiveAlertForPersonSignal(personId, alertKey)` for deduplication checks

## Task 3: Add updatePersonVitals to care-people.ts
- [ ] Implement `updatePersonVitals(personId, vitals)` that updates `heart_rate_bpm`, `watch_battery_percent`, `last_seen_label`, `alert`, `care_group`, `status`, `updated_at`
- [ ] Implement `recalculatePersonStatus(personId)` that queries active alerts and determines the correct `alert` level and `care_group`

## Task 4: Build the rules engine core
- [ ] Create `src/lib/rules-engine.ts`
- [ ] Implement `getSignalValue(signal, dataPoint)` — maps signal keys to data point fields
- [ ] Implement `evaluateCondition(operator, value, threshold)` — handles above/below/equals/detected
- [ ] Implement `buildAlertTitle(rule, value)` and `buildAlertSummary(rule, personName, value)` — human-readable alert text
- [ ] Implement `evaluateRules(dataPoint): Promise<EvaluationResult>` — the main orchestrator:
  - Load active rules for person
  - Filter to matching signal
  - Evaluate each condition
  - Deduplicate against existing active alerts
  - Create new alerts
  - Update person status
- [ ] Handle errors per-rule so one bad rule doesn't block others

## Task 5: Build the ingest endpoint
- [ ] Create `src/app/api/watch/ingest/route.ts`
- [ ] Validate `Authorization: Bearer <WATCH_INGEST_API_KEY>` header
- [ ] Parse and validate JSON payload (require `person_id`)
- [ ] Validate person exists in `care_people`
- [ ] Normalize payload into `IngestDataPoint`
- [ ] Insert into `biometrics_data`
- [ ] Call `evaluateRules(dataPoint)`
- [ ] Return structured response with data point ID and triggered alerts

## Task 6: Build the offline detection endpoint
- [ ] Create `src/app/api/watch/check-offline/route.ts`
- [ ] Validate API key
- [ ] Load all active `watch_offline` rules from `care_rules`
- [ ] For each person with an offline rule, query the most recent `biometrics_data` row
- [ ] If time since last data > threshold, trigger alert using same dedup + creation logic
- [ ] If person has come back online (recent data exists), resolve any active offline alerts
- [ ] Return summary of checked people and triggered alerts

## Task 7: Integration testing with curl
- [ ] Add `WATCH_INGEST_API_KEY` to `.env.local`
- [ ] Test happy path: send heart rate data for a person with an active rule, verify alert created
- [ ] Test deduplication: send same data again, verify no duplicate alert
- [ ] Test no-rule case: send data for a person with no matching rules, verify no alert
- [ ] Test person not found: send data with invalid person_id, verify 404
- [ ] Test auth: send request without API key, verify 401
- [ ] Test offline detection: call check-offline endpoint, verify it processes correctly
