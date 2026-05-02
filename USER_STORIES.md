# User Stories — Apple Watch Monitorable Data

These user stories are scoped to what Apple Watch hardware and HealthKit APIs can realistically provide to a third-party app. Each story notes the underlying data source and any relevant constraints.

---

## Heart Rate

**As a caretaker, I want to see a senior's current heart rate so I know their cardiovascular status at a glance.**
- Source: `HKQuantityTypeIdentifier.heartRate` (optical heart sensor, continuous background readings)
- Apple Watch measures heart rate passively throughout the day and during workouts.

**As a caretaker, I want to receive an alert when a senior's heart rate goes above a threshold I set (e.g., above 120 bpm at rest) so I can check if something is wrong.**
- Source: `heartRate` samples + custom rule engine on the app side
- Apple Watch itself can notify the wearer of high/low heart rate, but a caretaker dashboard would need to process HealthKit data server-side or via a companion iPhone app.

**As a caretaker, I want to receive an alert when a senior's heart rate drops below a threshold I set (e.g., below 45 bpm) so I can respond to a potential cardiac event.**
- Same source as above.

**As a caretaker, I want to see a senior's resting heart rate trend over the past 7 days so I can spot gradual changes that may indicate a health decline.**
- Source: `HKQuantityTypeIdentifier.restingHeartRate` (calculated daily by watchOS)

**As a caretaker, I want to see heart rate variability (HRV) data so I can understand a senior's stress and recovery levels.**
- Source: `HKQuantityTypeIdentifier.heartRateVariabilitySDNN` (measured during sleep and breathing sessions)

---

## Fall Detection

**As a caretaker, I want to be notified immediately when a senior's Apple Watch detects a fall so I can check on them right away.**
- Source: Apple Watch fall detection hardware (Series 4+). The watch alerts the wearer and can call emergency services. HealthKit exposes fall events via `HKCategoryTypeIdentifier.appleWatchDailyFallRisk` (watchOS 10+) and fall-related data.
- Constraint: The watch must be worn and fall detection must be enabled. The wearer can dismiss the alert themselves.

**As a caretaker, I want to see a history of detected fall events with timestamps so I can identify patterns or recurring incidents.**
- Source: HealthKit fall event records stored after each detection.

---

## Blood Oxygen (SpO2)

**As a caretaker, I want to see a senior's blood oxygen level so I can detect signs of respiratory distress.**
- Source: `HKQuantityTypeIdentifier.oxygenSaturation` (Series 6+, Ultra)
- Constraint: On US Apple Watch models purchased after January 2024, SpO2 analysis runs on iPhone rather than the watch itself. Data is still accessible via HealthKit.

**As a caretaker, I want to receive an alert when a senior's blood oxygen drops below 90% so I can respond to a potential emergency.**
- Source: `oxygenSaturation` samples + threshold rule.

---

## Activity & Movement

**As a caretaker, I want to see whether a senior has been moving today so I can detect unusual inactivity that might indicate a problem.**
- Source: `HKQuantityTypeIdentifier.stepCount`, `HKQuantityTypeIdentifier.distanceWalkingRunning`
- Apple Watch passively tracks steps and movement throughout the day.

**As a caretaker, I want to receive an alert if a senior has had no detected movement for an extended period (e.g., 4 hours during waking hours) so I can check on them.**
- Source: `stepCount` or activity samples with time-window analysis.

**As a caretaker, I want to see a senior's daily activity summary (steps, active calories, stand hours) so I can track their general mobility over time.**
- Source: `HKQuantityTypeIdentifier.activeEnergyBurned`, `HKCategoryTypeIdentifier.appleStandHour`, `stepCount`

---

## Sleep

**As a caretaker, I want to see how many hours a senior slept last night so I can monitor their rest and flag unusual patterns.**
- Source: `HKCategoryTypeIdentifier.sleepAnalysis` (watchOS tracks sleep stages: awake, REM, core, deep)

**As a caretaker, I want to be alerted if a senior's sleep duration drops significantly below their normal range so I can check if something is wrong.**
- Source: `sleepAnalysis` with baseline comparison logic.

---

## Wrist Temperature

**As a caretaker, I want to see nightly wrist temperature deviation data so I can detect potential signs of fever or illness.**
- Source: `HKQuantityTypeIdentifier.appleSleepingWristTemperature` (Series 8+, Ultra, SE 2nd gen+)
- Constraint: Measured during sleep only. Reports relative deviation from baseline, not absolute body temperature.

---

## ECG / Irregular Rhythm

**As a caretaker, I want to know if a senior's Apple Watch has flagged an irregular heart rhythm so I can encourage them to seek medical attention.**
- Source: `HKCategoryTypeIdentifier.irregularHeartRhythmEvent` (AFib detection, Series 4+)
- Constraint: The watch notifies the wearer. HealthKit stores the event and it can be read by authorized apps.

**As a caretaker, I want to see if a senior has taken an ECG reading and what the result was so I can track cardiac events.**
- Source: `HKElectrocardiogram` type (Series 4+)
- Constraint: Requires explicit user permission. ECG data is sensitive and access must be carefully handled.

---

## Respiratory Rate

**As a caretaker, I want to see a senior's respiratory rate during sleep so I can detect abnormal breathing patterns.**
- Source: `HKQuantityTypeIdentifier.respiratoryRate` (measured during sleep, Series 3+)

---

## Watch Connectivity / Offline Status

**As a caretaker, I want to see when a senior's Apple Watch last synced data so I know if they are wearing it and connected.**
- Source: Timestamp of the most recent HealthKit sample from the device. No direct "online/offline" API — inferred from data recency.

**As a caretaker, I want to receive an alert if a senior's watch has not reported any data for more than a set period (e.g., 2 hours) so I can check if they removed it or lost connectivity.**
- Source: Inferred from absence of recent HealthKit samples.

---

## Notes & Constraints

- **HealthKit access requires explicit user authorization.** The senior (or their guardian) must grant permission for each data type. This is per-device and cannot be bypassed.
- **Data flows through iPhone.** Apple Watch syncs health data to the paired iPhone's HealthKit store. A companion iOS app is required to read and relay data to a backend.
- **No direct server push from Apple Watch.** Real-time data delivery to a caretaker dashboard requires a background-capable iOS app on the senior's iPhone that reads HealthKit and pushes to your backend.
- **Fall detection is wearer-facing first.** The watch alerts the wearer and can call emergency services autonomously. Third-party apps can read the event after the fact via HealthKit, but cannot intercept or redirect the watch's own alert flow.
- **Some features are hardware-gated.** ECG requires Series 4+, SpO2 requires Series 6+, wrist temperature requires Series 8+.
- **Background delivery latency.** HealthKit background delivery is not guaranteed to be instant. For truly real-time alerting, the companion app needs to be running or use background fetch aggressively.
